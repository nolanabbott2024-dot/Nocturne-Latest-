import { useMemo,useState } from "react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVHero } from "../tv/content/TVHero";
import { TVRow } from "../tv/content/TVRow";
import { useAddons,useCatalog } from "../data/queries";
import type { Catalog,MediaItem } from "../types/tv";
import { useContentStore } from "../stores/contentStore";

export function CollectionPage({route,type,onOpen}:{route:string;type?:string;onOpen:(m:MediaItem)=>void}){
 const addons=useAddons();
 const catalogs=useMemo(()=>addons.flatMap(a=>a.catalogs).filter(c=>!type||c.type===type).slice(0,7),[addons,type]);
 return <TVPage route={route}><Rows route={route} catalogs={catalogs} onOpen={onOpen}/></TVPage>
}
function Rows({route,catalogs,onOpen}:{route:string;catalogs:Catalog[];onOpen:(m:MediaItem)=>void}){
 const hero=useContentStore(s=>s.heroByRoute[route]); const setHero=useContentStore(s=>s.setHero);
 return <><TVHero item={hero} route={route} onPlay={()=>hero&&onOpen(hero)} onMore={()=>hero&&onOpen(hero)}/><div className="rows">{catalogs.map((c,i)=><CatalogRow key={c.baseUrl+c.id} c={c} route={route} onOpen={onOpen} onSettled={(m:MediaItem)=>setHero(route,m)} first={i===0}/>)}</div></>
}
function CatalogRow({c,route,onOpen,onSettled,first}:any){
 const q=useCatalog(c); const items=q.data||[];
 if(first&&items.length&& !useContentStore.getState().heroByRoute[route])useContentStore.getState().setHero(route,items[0]);
 if(q.isError)return null;
 return items.length?<TVRow id={`${c.addonId}-${c.id}`} title={c.name} items={items} route={route} onOpen={onOpen} onSettled={onSettled}/>:null;
}
