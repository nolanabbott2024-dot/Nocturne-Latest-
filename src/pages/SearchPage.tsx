import { useEffect,useMemo,useState } from "react";
import { FocusContext,setFocus,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "motion/react";
import { Search as SearchIcon } from "lucide-react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVRow } from "../tv/content/TVRow";
import { useTVFocusable } from "../tv/focus/useTVFocusable";
import { useAddons,useCatalog } from "../data/queries";
import { isCinemetaCatalog } from "../data/stremio";
import type { MediaItem } from "../types/tv";
import { useSearchStore } from "../stores/searchStore";

const KEYS="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
const COLS=9;

export function SearchPage({onOpen}:{onOpen:(m:MediaItem)=>void}){
 const q=useSearchStore(s=>s.query);
 const setQ=useSearchStore(s=>s.setQuery);
 const lastKeyboardKey=useSearchStore(s=>s.lastKeyboardKey);
 const setLastKeyboardKey=useSearchStore(s=>s.setLastKeyboardKey);
 const [firstResultKey,setFirstResultKey]=useState<string|null>(null);
 const addons=useAddons();
 const catalogs=useMemo(()=>addons.flatMap(a=>a.catalogs).filter(c=>!isCinemetaCatalog(c)&&c.searchable).slice(0,6),[addons]);
 const {ref,focusKey}=useFocusable({focusKey:"search-keyboard",trackChildren:true,saveLastFocusedChild:true});
 const allKeys=[...KEYS,"⌫","Clear","Search"];

 return <TVPage route="search" initialFocusKey="search-key:A">
  <div className="netflix-search-shell">
    <aside className="netflix-search-panel">
      <div className="netflix-search-heading"><SearchIcon/><h1>Search</h1></div>
      <div className={"search-value netflix-search-value "+(q?"has-query":"")}>{q||"Titles, people, genres"}</div>
      <FocusContext.Provider value={focusKey}>
       <div ref={ref as any} className="tv-keyboard netflix-keyboard">
        {allKeys.map((k,index)=><KeyButton key={k} k={k}
          autoFocus={("search-key:"+k)===(lastKeyboardKey||"search-key:A")}
          onFocus={()=>setLastKeyboardKey("search-key:"+k)}
          onPress={()=>k==="⌫"?setQ(q.slice(0,-1)):k==="Clear"?setQ(""):k==="Search"?(firstResultKey&&setFocus(firstResultKey)):setQ(q+k)}
          onRight={()=>{if(index%COLS===COLS-1&&firstResultKey){setFocus(firstResultKey);return false}return true}}/>)}
       </div>
      </FocusContext.Provider>
    </aside>
    <section className="search-results netflix-search-results">
      {!q&&<div className="netflix-search-empty"><b>Find something to watch</b><span>Use the remote keyboard, then move right into results.</span></div>}
      {q&&catalogs.map((c,i)=><SearchRow key={c.baseUrl+c.id} c={c} q={q} onOpen={onOpen}
        keyboardFocus={lastKeyboardKey} onFirst={i===0?setFirstResultKey:undefined}/>)}
    </section>
  </div>
 </TVPage>
}
function KeyButton({k,onPress,onFocus,onRight,autoFocus}:any){
 const {ref,focused,focusSelf}=useTVFocusable({
   focusKey:"search-key:"+k,route:"search",rowId:"search-keyboard",onPress,onFocus,
   onArrowPress:(direction:any)=>direction==="right"?onRight():true
 });
 useEffect(()=>{
   if(!autoFocus)return;
   let cancelled=false,tries=0,timer:number|undefined;
   const claim=()=>{
     if(cancelled)return;
     focusSelf();
     if(tries++<5)timer=window.setTimeout(claim,50);
   };
   requestAnimationFrame(claim);
   return()=>{cancelled=true;if(timer)window.clearTimeout(timer)};
 },[autoFocus,focusSelf]);
 return <motion.button ref={ref as any} className={"key-button netflix-key "+(k==="Search"?"search-submit":"")}
  animate={{scale:focused?1.075:1,backgroundColor:focused?"#fff":"rgba(255,255,255,.08)",color:focused?"#111":"#fff"}}
  transition={{type:"spring",stiffness:450,damping:34}}>{k}</motion.button>
}
function SearchRow({c,q,onOpen,keyboardFocus,onFirst}:any){
 const r=useCatalog(c,{search:q});
 const items=r.data||[];
 useEffect(()=>{if(items.length&&onFirst)onFirst(`search:search-${c.id}:${items[0].type}:${items[0].id}`)},[items[0]?.id,onFirst,c.id]);
 return items.length?<TVRow id={"search-"+c.id} title={c.name} items={items} route="search" onOpen={onOpen} leftExitFocusKey={keyboardFocus}/>:null;
}
