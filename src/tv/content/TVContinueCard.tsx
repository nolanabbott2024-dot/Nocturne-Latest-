import { Play } from "lucide-react";
import { motion } from "motion/react";
import type { MediaItem } from "../../types/tv";
import { useTVFocusable } from "../focus/useTVFocusable";

export function TVContinueCard({
  item,route,rowId,progress=0,onResume,onArrowPress,onSpatialFocus
}:{
  item:MediaItem;route:string;rowId:string;progress?:number;onResume:()=>void;
  onArrowPress?:(direction:string)=>boolean|void;onSpatialFocus?:(layout:any)=>void;
}){
  const {ref,focused}=useTVFocusable({
    focusKey:`${route}:${rowId}:${item.id}`,route,rowId,onPress:onResume,
    onArrowPress,onFocus:(layout)=>onSpatialFocus?.(layout)
  });
  return <motion.button ref={ref as any} className="continue-card" animate={{scale:focused?1.06:1,y:focused?-6:0}}>
    <img src={item.background||item.poster} loading="lazy" decoding="async" alt=""/>
    <div className="continue-progress"><i style={{width:`${Math.max(0,Math.min(100,progress*100))}%`}}/></div>
    {focused&&<div className="continue-overlay"><Play/> Resume</div>}
  </motion.button>
}
