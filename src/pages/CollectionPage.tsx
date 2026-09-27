import { useMemo } from "react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVHero } from "../tv/content/TVHero";
import { TVRow } from "../tv/content/TVRow";
import { TVTop10Row } from "../tv/content/TVTop10Row";
import { TVContinueRow } from "../tv/content/TVContinueRow";
import { useAddons,useCatalog } from "../data/queries";
import { continueWatching,type LibraryEntry } from "../data/library";
import type { Catalog,MediaItem } from "../types/tv";
import { useContentStore } from "../stores/contentStore";

export function CollectionPage({
  route,type,onOpen,onResume
}:{
  route:string;type?:string;onOpen:(m:MediaItem)=>void;onResume?:(e:LibraryEntry)=>void
}){
 const addons=useAddons();
 const catalogs=useMemo(()=>addons.flatMap(a=>a.catalogs).filter(c=>!type||c.type===type).slice(0,7),[addons,type]);
 const cont=useMemo(()=>route==="home"?continueWatching():[],[route]);
 return <TVPage route={route}>
   <Rows route={route} catalogs={catalogs} onOpen={onOpen} cont={cont} onResume={onResume}/>
 </TVPage>
}

function Rows({route,catalogs,onOpen,cont,onResume}:{
 route:string;catalogs:Catalog[];onOpen:(m:MediaItem)=>void;
 cont:LibraryEntry[];onResume?:((e:LibraryEntry)=>void)
}){
 const hero=useContentStore(s=>s.heroByRoute[route]); const setHero=useContentStore(s=>s.setHero);
 return <>
   <TVHero item={hero} route={route} onPlay={()=>hero&&onOpen(hero)} onMore={()=>hero&&onOpen(hero)}/>
   <div className="rows">
     {route==="home"&&onResume&&<TVContinueRow entries={cont} route={route} onResume={onResume}/>}
     {catalogs.map((c,i)=><CatalogRow key={c.baseUrl+c.id} c={c} route={route} onOpen={onOpen} onSettled={(m:MediaItem)=>setHero(route,m)} first={i===0}/>)}
   </div>
 </>
}
function CatalogRow({c,route,onOpen,onSettled,first}:any){
 const q=useCatalog(c); const items=q.data||[];
 if(first&&items.length&&!useContentStore.getState().heroByRoute[route])useContentStore.getState().setHero(route,items[0]);
 if(q.isError)return null;
 if(!items.length)return null;
 if(first)return <TVTop10Row id={`top10-${c.addonId}-${c.id}`} title={route==="movies"?"Top 10 Movies":route==="shows"?"Top 10 Shows":"Top 10 Now"} items={items} route={route} onOpen={onOpen}/>;
 return <TVRow id={`${c.addonId}-${c.id}`} title={c.name} items={items} route={route} onOpen={onOpen} onSettled={onSettled}/>;
}
