import { motion } from "motion/react";
import type { MediaItem } from "../../types/tv";
import { useTVFocusable } from "../focus/useTVFocusable";
export function TVLandscapeCard({item,route,rowId,onPress}:{item:MediaItem;route:string;rowId:string;onPress:()=>void}){
 const {ref,focused}=useTVFocusable({focusKey:`${route}:${rowId}:land:${item.id}`,route,rowId,onPress});
 return <motion.button ref={ref as any} className="land-card" animate={{scale:focused?1.055:1,y:focused?-6:0,filter:focused?"brightness(1.08)":"brightness(1)"}} transition={{type:"spring",stiffness:390,damping:31}}>
   <img src={item.background||item.poster}/><div>{item.name}</div>
 </motion.button>
}
