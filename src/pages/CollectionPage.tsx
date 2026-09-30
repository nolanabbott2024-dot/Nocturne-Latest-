import { useEffect,useMemo,useRef,useState } from "react";
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
 const metaAbort=useRef<AbortController|null>(null);
 useEffect(()=>{
   if(!hero){
     const first=rows.find(r=>r.kind==="standard"&&r.items.length)?.items[0]||rows.find(r=>r.items.length)?.items[0];
     if(first){setHero(route,first);const controller=new AbortController();metaAbort.current=controller;loadMetaEnriched(first,controller.signal).then(full=>{if(!controller.signal.aborted)setHero(route,full)}).catch(()=>{});}
   }
 },[rows,route,hero?.id]);
 useEffect(()=>()=>metaAbort.current?.abort(),[]);
 return <>
   <TVHero item={hero} route={route} onPlay={()=>hero&&(onPlay?onPlay(hero):onOpen(hero))} onMore={()=>hero&&onOpen(hero)}/>
   <div className="rows">
     {route==="home"&&onResume&&<TVContinueRow entries={cont} route={route} onResume={onResume}/>}
     {rows.map(row=>row.kind==="top10"
       ?<TVTop10Row key={row.id} id={row.id} title={row.title} items={row.items} route={route} onOpen={onOpen}/>
       :<TVRow key={row.id} id={row.id} title={row.title} items={row.items} route={route} onOpen={onOpen}/>
     )}
   </div>
 </>
}
