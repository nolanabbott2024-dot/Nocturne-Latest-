import { useCallback,useEffect,useMemo,useRef,useState } from "react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVHero } from "../tv/content/TVHero";
import { TVRow } from "../tv/content/TVRow";
import { TVTop10Row } from "../tv/content/TVTop10Row";
import { TVContinueRow } from "../tv/content/TVContinueRow";
import { useAddons,usePrimaryRows,useProviderRows,useCuratedRows } from "../data/queries";
import { isCinemetaCatalog,loadMetaEnriched } from "../data/stremio";
import { continueWatching,type LibraryEntry } from "../data/library";
import type { MediaItem } from "../types/tv";
import { useContentStore } from "../stores/contentStore";
import { useNavigationStore } from "../stores/navigationStore";
import { dedupePlannedRows,type PlannedRow } from "../data/catalogPlans";

export function CollectionPage({
  route,type,onOpen,onPlay,onResume
}:{
  route:string;type?:"movie"|"series";onOpen:(m:MediaItem)=>void;onPlay?:(m:MediaItem)=>void;onResume?:(e:LibraryEntry)=>void
}){
 const addons=useAddons();
 const [libraryRevision,setLibraryRevision]=useState(0);
 const [providerReady,setProviderReady]=useState(route==="home");
 const [curatedReady,setCuratedReady]=useState(route==="home");
 useEffect(()=>{const sync=()=>setLibraryRevision(x=>x+1);window.addEventListener("nocturne-library-sync",sync);return()=>window.removeEventListener("nocturne-library-sync",sync)},[]);
 useEffect(()=>{
   if(route==="home"){setProviderReady(true);setCuratedReady(true);return}
   setProviderReady(false);setCuratedReady(false);
   const p=window.setTimeout(()=>setProviderReady(true),700);
   const c=window.setTimeout(()=>setCuratedReady(true),2200);
   return()=>{window.clearTimeout(p);window.clearTimeout(c)};
 },[route]);
 const catalogs=useMemo(()=>addons.flatMap(a=>a.catalogs).filter(c=>!isCinemetaCatalog(c)&&(!type||c.type===type)),[addons,type]);
 const netflixBase=useMemo(()=>addons.find(a=>a.manifest?.id==="pw.ers.netflix-catalog")?.baseUrl,[addons]);
 const primary=usePrimaryRows({route,type,catalogs,netflixBase});
 const providers=useProviderRows({route,type,catalogs,enabled:providerReady});
 const curated=useCuratedRows({route,type,catalogs,enabled:curatedReady});
 const rows=useMemo(()=>dedupePlannedRows([...(primary.data||[]),...(providers.data||[]),...(curated.data||[])],20).sort((a,b)=>Number(b.id==="trending")-Number(a.id==="trending")),[primary.data,providers.data,curated.data]);
 const cont=useMemo(()=>route==="home"?continueWatching():[],[route,libraryRevision]);
 return <TVPage route={route} initialFocusKey={`${route}:hero:play`}>
   <Rows route={route} rows={rows} onOpen={onOpen} onPlay={onPlay} cont={cont} onResume={onResume}/>
 </TVPage>
}

function Rows({route,rows,onOpen,onPlay,cont,onResume}:{
 route:string;rows:PlannedRow[];onOpen:(m:MediaItem)=>void;onPlay?:((m:MediaItem)=>void);
 cont:LibraryEntry[];onResume?:((e:LibraryEntry)=>void)
}){
 const hero=useContentStore(s=>s.heroByRoute[route]); const setHero=useContentStore(s=>s.setHero);
 const focusedKey=useNavigationStore(s=>s.focusedKey);
 const metaAbort=useRef<AbortController|null>(null);
 const spotlightIndex=useRef(0);
 const newest=useMemo(()=>{
   const releaseRow=rows.find(r=>r.id==="new-releases"&&r.items.length);
   const source=releaseRow?.items.length?releaseRow.items:rows.flatMap(r=>r.items);
   const seen=new Set<string>();
   const year=(m:MediaItem)=>{const hit=String(m.releaseInfo||"").match(/(19|20)\d{2}/);return hit?Number(hit[0]):0};
   return source.filter(m=>{
     const key=m.type+":"+m.id;
     if(seen.has(key))return false;
     seen.add(key);return true;
   }).sort((a,b)=>year(b)-year(a)).slice(0,10);
 },[rows]);

 const showSpotlight=useCallback((seed:MediaItem)=>{
   metaAbort.current?.abort();
   setHero(route,seed);
   const controller=new AbortController();
   metaAbort.current=controller;
   loadMetaEnriched(seed,controller.signal).then(full=>{
     if(!controller.signal.aborted)setHero(route,full);
   }).catch(()=>{});
 },[route,setHero]);

 useEffect(()=>{
   if(!newest.length)return;
   const currentIndex=newest.findIndex(m=>m.id===hero?.id&&m.type===hero?.type);
   if(currentIndex>=0){spotlightIndex.current=currentIndex;return}
   spotlightIndex.current=0;
   showSpotlight(newest[0]);
 },[newest,route]);

 const advanceSpotlight=useCallback(()=>{
   if(newest.length<2||document.hidden||focusedKey?.startsWith(route+":hero:"))return;
   spotlightIndex.current=(spotlightIndex.current+1)%newest.length;
   showSpotlight(newest[spotlightIndex.current]);
 },[newest,route,focusedKey,showSpotlight]);

 useEffect(()=>{
   if(!hero||hero.trailerUrl||hero.trailerYtId||newest.length<2)return;
   const fallback=window.setTimeout(()=>advanceSpotlight(),12000);
   return()=>window.clearTimeout(fallback);
 },[hero?.id,hero?.trailerUrl,hero?.trailerYtId,newest.length,advanceSpotlight]);

 useEffect(()=>()=>metaAbort.current?.abort(),[]);
 return <>
   <TVHero item={hero} route={route} onPlay={()=>hero&&(onPlay?onPlay(hero):onOpen(hero))} onMore={()=>hero&&onOpen(hero)} onTrailerEnded={advanceSpotlight}/>
   <div className="rows">
     {route==="home"&&onResume&&<TVContinueRow entries={cont} route={route} onResume={onResume}/>}
     {rows.map(row=>row.kind==="top10"
       ?<TVTop10Row key={row.id} id={row.id} title={row.title} items={row.items} route={route} onOpen={onOpen}/>
       :<TVRow key={row.id} id={row.id} title={row.title} items={row.items} route={route} onOpen={onOpen}/>
     )}
   </div>
 </>
}
