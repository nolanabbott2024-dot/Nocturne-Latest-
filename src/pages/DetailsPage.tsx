import { useCallback,useEffect,useState } from "react";
import { AnimatePresence } from "motion/react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVDetailsHero } from "../tv/detail/TVDetailsHero";
import { TVEpisodeRail } from "../tv/detail/TVEpisodeRail";
import { SourcePicker } from "../tv/playback/SourcePicker";
import { DetailsTrailerOverlay } from "../tv/playback/DetailsTrailerOverlay";
import { useProviderStore } from "../stores/providerStore";
import { loadMetaEnriched } from "../data/stremio";
import { resolvePlayableStream, resolvePlayableSources, type PlayableSource } from "../data/playback";
import { isWatchlisted,toggleWatchlist } from "../data/library";
import type { MediaItem,Episode } from "../types/tv";

export function DetailsPage({seed,onBack,onPlay}:{
  seed:MediaItem;onBack:()=>void;
  onPlay:(url:string,title:string,headers:Record<string,string>,item:MediaItem,videoId:string)=>void
}){
 const [item,setItem]=useState(seed);
 const [busy,setBusy]=useState(false);
 const [watchlisted,setWatchlisted]=useState(()=>isWatchlisted(seed.id));
 const [sources,setSources]=useState<{items:PlayableSource[];videoId:string;loading:boolean}|null>(null);
 const [trailerOpen,setTrailerOpen]=useState(false);
 const addons=useProviderStore(s=>s.addons);
 const route="details:"+item.id;

 useEffect(()=>{
   const controller=new AbortController();
   loadMetaEnriched(seed,controller.signal).then(full=>setItem(full)).catch(()=>{});
   return()=>controller.abort();
 },[seed.id,seed.sourceBase,seed.type]);

 useEffect(()=>setWatchlisted(isWatchlisted(item.id)),[item.id]);

 const playSource=useCallback((source:PlayableSource,videoId:string)=>{
   setSources(null);
   onPlay(source.url,item.name,source.headers||{},item,videoId);
 },[item,onPlay]);

 const play=useCallback(async(id=item.id)=>{
   if(busy)return;setBusy(true);
   const controller=new AbortController();
   try{
     const source=await resolvePlayableStream(item,id,addons,controller.signal);
     if(source)playSource(source,id);
   }finally{setBusy(false)}
 },[busy,item,addons,playSource]);

 const chooseSources=useCallback(async(id=item.id)=>{
   if(busy)return;
   setSources({items:[],videoId:id,loading:true});
   const controller=new AbortController();
   try{
     const playable=await resolvePlayableSources(item,id,addons,controller.signal);
     setSources({items:playable,videoId:id,loading:false});
   }catch{
     setSources({items:[],videoId:id,loading:false});
   }
 },[busy,item,addons]);

 const toggle=useCallback(()=>setWatchlisted(toggleWatchlist(item)),[item]);
 const firstEpisodeFocusKey=item.type==="series"&&item.videos?.length?`${route}:episode:${item.videos[0].id}`:undefined;

 return <TVPage route={route} initialFocusKey={`${route}:action:play`}>
   <TVDetailsHero item={item} route={route}
     onPlay={()=>play()} onWatchlist={toggle} watchlisted={watchlisted}
     onTrailer={()=>setTrailerOpen(true)} onSources={()=>chooseSources()} episodeFocusKey={firstEpisodeFocusKey}/>
   <TVEpisodeRail item={item} route={route} onPlay={(ep:Episode)=>play(ep.id)}/>
   <AnimatePresence>
     {sources&&<SourcePicker sources={sources.items} loading={sources.loading} route={route} onPick={s=>playSource(s,sources.videoId)} onClose={()=>setSources(null)}/>} 
     {trailerOpen&&<DetailsTrailerOverlay item={item} route={route} onClose={()=>setTrailerOpen(false)}/>}
   </AnimatePresence>
 </TVPage>
}
