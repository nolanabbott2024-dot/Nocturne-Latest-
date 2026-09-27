import { useEffect,useState } from "react";
import { AnimatePresence } from "motion/react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVDetailsHero } from "../tv/detail/TVDetailsHero";
import { TVEpisodeRail } from "../tv/detail/TVEpisodeRail";
import { SourcePicker } from "../tv/playback/SourcePicker";
import { useProviderStore } from "../stores/providerStore";
import { loadMeta } from "../data/stremio";
import { resolvePlayableStream, resolvePlayableSources, type PlayableSource } from "../data/playback";
import { toggleWatchlist } from "../data/library";
import type { MediaItem,Episode } from "../types/tv";

export function DetailsPage({seed,onBack,onPlay}:{
  seed:MediaItem;onBack:()=>void;onPlay:(url:string,title:string,headers?:Record<string,string>)=>void
}){
 const [item,setItem]=useState(seed);
 const [busy,setBusy]=useState(false);
 const [sources,setSources]=useState<PlayableSource[]|null>(null);
 const addons=useProviderStore(s=>s.addons);
 const route="details:"+item.id;

 useEffect(()=>{
   if(!seed.sourceBase)return;
   const c=new AbortController();
   loadMeta(seed.sourceBase,seed.type,seed.id,c.signal).then(setItem).catch(()=>{});
   return()=>c.abort();
 },[seed.id,seed.sourceBase,seed.type]);

 const playSource=(source:PlayableSource)=>{
   setSources(null);
   onPlay(source.url,item.name,source.headers||{});
 };
 const play=async(id=item.id)=>{
   if(busy)return;setBusy(true);
   const c=new AbortController();
   try{
     const source=await resolvePlayableStream(item,id,addons,c.signal);
     if(source)playSource(source);
   }finally{setBusy(false)}
 };
 const chooseSources=async(id=item.id)=>{
   if(busy)return;setBusy(true);
   const c=new AbortController();
   try{setSources(await resolvePlayableSources(item,id,addons,c.signal))}
   finally{setBusy(false)}
 };

 return <TVPage route={route}>
   <TVDetailsHero item={item} route={route}
     onPlay={()=>play()} onWatchlist={()=>toggleWatchlist(item)}
     onTrailer={()=>{}} onSources={()=>chooseSources()}/>
   <TVEpisodeRail item={item} route={route} onPlay={(ep:Episode)=>play(ep.id)}/>
   <AnimatePresence>{sources&&<SourcePicker sources={sources} route={route} onPick={playSource} onClose={()=>setSources(null)}/>}</AnimatePresence>
 </TVPage>
}
