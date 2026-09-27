import { useEffect } from "react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "motion/react";
import { FocusBoundary } from "../focus/FocusBoundary";
import { useTVFocusable } from "../focus/useTVFocusable";
import type { PlayableSource } from "../../data/playback";

export function SourcePicker({sources,route,onPick,onClose,loading=false}:{sources:PlayableSource[];route:string;onPick:(s:PlayableSource)=>void;onClose:()=>void;loading?:boolean}){
  const first=`${route}:source:0`;
  const closeKey=`${route}:source:close`;
  const preferred=sources.length?first:closeKey;
  const close=()=>{onClose();requestAnimationFrame(()=>{void setFocus(`${route}:action:sources`)})};
  useEffect(()=>{
    const id=requestAnimationFrame(()=>{void setFocus(preferred)});
    const back=()=>close();window.addEventListener("nocturne-overlay-back",back);
    return()=>{cancelAnimationFrame(id);window.removeEventListener("nocturne-overlay-back",back)}
  },[preferred,route]);
  return <div data-tv-overlay="true" className="source-overlay">
    <FocusBoundary id={`${route}:sources`} preferredChildFocusKey={preferred} trap>
      <div className="source-sheet"><header><h2>Choose a Source</h2>
        <p>{loading?"Finding playable sources…":sources.length?`${sources.length} playable sources`:"No playable sources found"}</p></header>
        {loading&&!sources.length&&<div className="source-loading"><span/>Checking your streaming providers…</div>}
        <div className="source-list">{sources.map((s,i)=><SourceButton key={s.url+"-"+i} source={s} i={i} route={route} onPick={()=>onPick(s)}/>)}</div>
        <SourceClose route={route} onClose={close}/>
      </div>
    </FocusBoundary>
  </div>
}
function SourceButton({source,i,route,onPick}:any){
 const {ref,focused}=useTVFocusable({focusKey:`${route}:source:${i}`,route,rowId:"sources",onPress:onPick});
 return <motion.button ref={ref as any} className="source-button" animate={{scale:focused?1.018:1,x:focused?8:0}}>
  <b>{source.name||"Source"}</b><span>{source.info?.resolution||""}{source.info?.size?" · "+(source.info.size/1e9).toFixed(1)+" GB":""}</span>
 </motion.button>
}
function SourceClose({route,onClose}:any){
 const {ref,focused}=useTVFocusable({focusKey:`${route}:source:close`,route,rowId:"sources",onPress:onClose});
 return <motion.button ref={ref as any} className="dialog-button" animate={{scale:focused?1.04:1}}>Cancel</motion.button>
}
