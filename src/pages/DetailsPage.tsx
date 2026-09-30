import { useCallback,useEffect,useMemo,useState } from "react";
import { AnimatePresence } from "motion/react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { TVPage } from "../tv/navigation/TVPage";
import { TVDetailsHero } from "../tv/detail/TVDetailsHero";
import { AudioPanel,DetailsPanel,EpisodesPanel,ExtrasPanel,RelatedPanel,type TitlePanel } from "../tv/detail/TitleHub";
import { SourcePicker } from "../tv/playback/SourcePicker";
import { DetailsTrailerOverlay } from "../tv/playback/DetailsTrailerOverlay";
import { useProviderStore } from "../stores/providerStore";
import { loadMetaEnriched } from "../data/stremio";
import { useAddons,useCatalog } from "../data/queries";
import { resolvePlayableStream,resolvePlayableSources,type PlayableSource } from "../data/playback";
import { isWatchlisted,toggleWatchlist } from "../data/library";
import type { MediaItem,Episode } from "../types/tv";

export function DetailsPage({seed,onBack:_,onPlay,onOpen}:{
  seed:MediaItem;onBack:()=>void;onOpen:(item:MediaItem)=>void;
  onPlay:(url:string,title:string,headers:Record<string,string>,item:MediaItem,videoId:string)=>void
}){
 const [item,setItem]=useState(seed);
 const [busy,setBusy]=useState(false);
 const [watchlisted,setWatchlisted]=useState(()=>isWatchlisted(seed.id));
 const [sources,setSources]=useState<{items:PlayableSource[];videoId:string;loading:boolean}|null>(null);
 const [trailerOpen,setTrailerOpen]=useState(false);
 const addons=useProviderStore(s=>s.addons);
 const loadedAddons=useAddons();
 const relatedCatalog=useMemo(()=>loadedAddons.flatMap(a=>a.catalogs).find(c=>c.type===item.type),[loadedAddons,item.type]);
 const relatedQuery=useCatalog(relatedCatalog);
 const related=useMemo(()=>{
   const pool=(relatedQuery.data||[]).filter(x=>x.id!==item.id);
   const genres=new Set((item.genres||[]).map(g=>g.toLowerCase()));
   const matched=pool.filter(x=>(x.genres||[]).some(g=>genres.has(g.toLowerCase())));
   return (matched.length>=4?matched:pool).slice(0,12);
 },[relatedQuery.data,item.id,item.genres]);
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

 const scrollSection=useCallback((panel:TitlePanel)=>{
   const firstSeason=item.videos?.[0]?.season||1;
   const target=panel==="episodes"?(item.videos?.length?route+":season:"+firstSeason:null)
     :panel==="details"?route+":detail:more"
     :panel==="audio"?route+":audio:0"
     :panel==="related"?(related[0]?route+":related:"+related[0].type+":"+related[0].id+":0":null)
     :panel==="extras"?(item.trailerUrl||item.trailerYtId?route+":extra:trailer":null)
     :null;
   if(target)void setFocus(target);
 },[route,item.videos,item.trailerUrl,item.trailerYtId,related]);

 return <TVPage route={route} initialFocusKey={route+":action:play"}>
   <TVDetailsHero item={item} route={route}
     onPlay={()=>play()} onWatchlist={toggle} watchlisted={watchlisted}
     onSources={()=>chooseSources()} onPanel={scrollSection}/>

   <div className="continuous-details">
     {item.type==="series"&&(item.videos?.length??0)>0&&
       <section id={route+":section:episodes"} className="continuous-section episodes-section">
         <EpisodesPanel item={item} route={route} inline onPlay={(ep:Episode)=>play(ep.id)}/>
       </section>}

     <section id={route+":section:details"} className="continuous-section">
       <h2 className="continuous-heading">Details</h2>
       <DetailsPanel item={item}/>
     </section>

     <section id={route+":section:audio"} className="continuous-section">
       <h2 className="continuous-heading">Audio & Subtitles</h2>
       <AudioPanel route={route}/>
     </section>

     <section id={route+":section:related"} className="continuous-section">
       <h2 className="continuous-heading">More Like This</h2>
       <RelatedPanel items={related} item={item} route={route} onOpen={onOpen}/>
     </section>

     {item.type==="series"&&(item.trailerUrl||item.trailerYtId)&&
       <section id={route+":section:extras"} className="continuous-section">
         <h2 className="continuous-heading">Previews & Extras</h2>
         <ExtrasPanel item={item} route={route} onTrailer={()=>setTrailerOpen(true)}/>
       </section>}
   </div>

   <AnimatePresence>
     {sources&&<SourcePicker sources={sources.items} loading={sources.loading} route={route} onPick={s=>playSource(s,sources.videoId)} onClose={()=>setSources(null)}/>}
     {trailerOpen&&<DetailsTrailerOverlay item={item} route={route} onClose={()=>setTrailerOpen(false)}/>}
   </AnimatePresence>
 </TVPage>
}
