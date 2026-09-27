import { useMemo,useState } from "react";
import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "motion/react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVRow } from "../tv/content/TVRow";
import { useAddons,useCatalog } from "../data/queries";
import type { MediaItem } from "../types/tv";
const KEYS="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
export function SearchPage({onOpen}:{onOpen:(m:MediaItem)=>void}){
 const [q,setQ]=useState("");const addons=useAddons();const catalogs=useMemo(()=>addons.flatMap(a=>a.catalogs).filter(c=>c.searchable).slice(0,6),[addons]);
 const {ref,focusKey}=useFocusable({focusKey:"search-keyboard",trackChildren:true});
 return <TVPage route="search"><header className="page-title"><h1>Search</h1><div className="search-value">{q||"Search movies, shows, people…"}</div></header>
 <FocusContext.Provider value={focusKey}><div ref={ref as any} className="tv-keyboard">{KEYS.map(k=><KeyButton key={k} k={k} onPress={()=>setQ(x=>x+k)}/>)}<KeyButton k="⌫" onPress={()=>setQ(x=>x.slice(0,-1))}/><KeyButton k="Clear" onPress={()=>setQ("")}/></div></FocusContext.Provider>
 <div className="search-results">{q&&catalogs.map(c=><SearchRow key={c.baseUrl+c.id} c={c} q={q} onOpen={onOpen}/>)}</div></TVPage>
}
function KeyButton({k,onPress}:any){const {ref,focused}=useFocusable({focusKey:"search-key:"+k,onEnterPress:onPress});return <motion.button ref={ref as any} className="key-button" animate={{scale:focused?1.08:1,backgroundColor:focused?"#fff":"rgba(255,255,255,.08)",color:focused?"#000":"#fff"}}>{k}</motion.button>}
function SearchRow({c,q,onOpen}:any){const r=useCatalog(c,{search:q});return r.data?.length?<TVRow id={"search-"+c.id} title={c.name} items={r.data} route="search" onOpen={onOpen}/>:null}
