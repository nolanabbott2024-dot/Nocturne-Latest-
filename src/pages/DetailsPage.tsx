import { useEffect,useState } from "react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVDetailsHero } from "../tv/detail/TVDetailsHero";
import { TVEpisodeRail } from "../tv/detail/TVEpisodeRail";
import { useProviderStore } from "../stores/providerStore";
import { loadMeta } from "../data/stremio";
import { resolvePlayableStream } from "../data/playback";
import { toggleWatchlist } from "../data/library";
import type { MediaItem,Episode } from "../types/tv";

export function DetailsPage({seed,onBack,onPlay}:{seed:MediaItem;onBack:()=>void;onPlay:(url:string,title:string,headers?:Record<string,string>)=>void}){
 const [item,setItem]=useState(seed);
 const [busy,setBusy]=useState(false);
 const addons=useProviderStore(s=>s.addons);
 useEffect(()=>{
   if(!seed.sourceBase)return;
   const c=new AbortController();
   loadMeta(seed.sourceBase,seed.type,seed.id,c.signal).then(setItem).catch(()=>{});
   return()=>c.abort();
 },[seed.id,seed.sourceBase,seed.type]);
 const play=async(id=item.id)=>{
   if(busy)return;setBusy(true);
   const c=new AbortController();
   try{
     const source=await resolvePlayableStream(item,id,addons,c.signal);
     if(source?.url)onPlay(source.url,item.name,source.headers||{});
   }finally{setBusy(false)}
 };
 return <TVPage route={"details:"+item.id}>
   <TVDetailsHero item={item} route={"details:"+item.id}
     onPlay={()=>play()} onWatchlist={()=>toggleWatchlist(item)} onTrailer={()=>{}}/>
   <TVEpisodeRail item={item} route={"details:"+item.id} onPlay={(ep:Episode)=>play(ep.id)}/>
 </TVPage>
}
