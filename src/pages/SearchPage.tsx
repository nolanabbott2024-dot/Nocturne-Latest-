import { useEffect,useMemo,useState } from "react";
import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation-react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation-core";
import { motion } from "motion/react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVRow } from "../tv/content/TVRow";
import { useAddons,useCatalog } from "../data/queries";
import type { MediaItem } from "../types/tv";

const KEYS="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
const COLS=9;

export function SearchPage({onOpen}:{onOpen:(m:MediaItem)=>void}){
 const [q,setQ]=useState("");
 const [firstResultKey,setFirstResultKey]=useState<string|null>(null);
 const [lastKeyboardKey,setLastKeyboardKey]=useState("search-key:A");
 const addons=useAddons();
 const catalogs=useMemo(()=>addons.flatMap(a=>a.catalogs).filter(c=>c.searchable).slice(0,6),[addons]);
 const {ref,focusKey}=useFocusable({focusKey:"search-keyboard",trackChildren:true,saveLastFocusedChild:true});
 const allKeys=[...KEYS,"⌫","Clear"];
 return <TVPage route="search">
  <header className="page-title"><h1>Search</h1><div className="search-value">{q||"Search movies, shows, people…"}</div></header>
  <FocusContext.Provider value={focusKey}>
   <div ref={ref as any} className="tv-keyboard">
    {allKeys.map((k,index)=><KeyButton key={k} k={k} index={index}
      onFocus={()=>setLastKeyboardKey("search-key:"+k)}
      onPress={()=>k==="⌫"?setQ(x=>x.slice(0,-1)):k==="Clear"?setQ(""):setQ(x=>x+k)}
      onRight={()=>{if(index%COLS===COLS-1&&firstResultKey){setFocus(firstResultKey);return false}return true}}/>)}
   </div>
  </FocusContext.Provider>
  <div className="search-results">{q&&catalogs.map((c,i)=><SearchRow key={c.baseUrl+c.id} c={c} q={q} onOpen={onOpen}
    keyboardFocus={lastKeyboardKey} onFirst={i===0?setFirstResultKey:undefined}/>)}</div>
 </TVPage>
}
function KeyButton({k,index,onPress,onFocus,onRight}:any){
 const {ref,focused}=useFocusable({
   focusKey:"search-key:"+k,onEnterPress:onPress,onFocus,
   onArrowPress:(direction:any)=>direction==="right"?onRight():true
 });
 return <motion.button ref={ref as any} className="key-button"
  animate={{scale:focused?1.08:1,backgroundColor:focused?"#fff":"rgba(255,255,255,.08)",color:focused?"#000":"#fff"}}>{k}</motion.button>
}
function SearchRow({c,q,onOpen,keyboardFocus,onFirst}:any){
 const r=useCatalog(c,{search:q});
 const items=r.data||[];
 useEffect(()=>{if(items.length&&onFirst)onFirst(`search:search-${c.id}:${items[0].type}:${items[0].id}`)},[items[0]?.id,onFirst,c.id]);
 return items.length?<TVRow id={"search-"+c.id} title={c.name} items={items} route="search" onOpen={onOpen} leftExitFocusKey={keyboardFocus}/>:null;
}
