import { useEffect } from "react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "motion/react";
import { FocusBoundary } from "../focus/FocusBoundary";

export function TVDialog({id,initialFocusKey,children,onClose}:{
  id:string;initialFocusKey:string;children:React.ReactNode;onClose:()=>void
}){
  useEffect(()=>{
    const t=requestAnimationFrame(()=>setFocus(initialFocusKey));
    const close=()=>onClose();window.addEventListener("nocturne-overlay-back",close);
    return()=>{cancelAnimationFrame(t);window.removeEventListener("nocturne-overlay-back",close)}
  },[initialFocusKey,onClose]);
  return <motion.div data-tv-overlay="true" className="tv-dialog-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose()}}>
    <motion.div className="tv-dialog" initial={{opacity:0,scale:.96,y:14}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.98}} transition={{type:"spring",stiffness:360,damping:32}}>
      <FocusBoundary id={id} preferredChildFocusKey={initialFocusKey} trap>{children}</FocusBoundary>
    </motion.div>
  </motion.div>
}
