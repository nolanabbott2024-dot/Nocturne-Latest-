import { memo,useEffect,useMemo,useState } from "react";
import { motion } from "motion/react";
import { useTVFocusable } from "../focus/useTVFocusable";
import { usePlaybackStore } from "../../stores/playbackStore";
import type { MediaItem } from "../../types/tv";
import { TrailerPreview } from "../playback/TrailerPreview";

export const TVPosterCard=memo(function TVPosterCard({item,route,rowId,onOpen,onSettled}:{item:MediaItem;route:string;rowId:string;onOpen:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void}){
  const key=`${route}:${rowId}:${item.type}:${item.id}`;
  const [settled,setSettled]=useState(false);
  const stopTrailer=usePlaybackStore(s=>s.stopTrailer);
  const {ref,focused}=useTVFocusable({
    focusKey:key,route,rowId,onPress:()=>onOpen(item),
    onFocus:()=>{},onBlur:()=>{setSettled(false);stopTrailer();}
  });
  useEffect(()=>{
    if(!focused){setSettled(false);return}
    const t=setTimeout(()=>{setSettled(true);onSettled?.(item)},420);
    return()=>clearTimeout(t);
  },[focused,item.id]);
  const art=item.poster||item.background;
  return <motion.button ref={ref as any} className="tv-card"
    animate={{scale:focused?1.072:1,y:focused?-7:0,filter:focused?"brightness(1.09)":"brightness(1)"}}
    transition={{type:"spring",stiffness:390,damping:31,mass:.7}}>
    <div className="card-media">
      {art&&<img src={art} loading="lazy" decoding="async"/>}
      {settled&&focused&&<TrailerPreview item={item}/>}
      <div className="focus-ring"/>
    </div>
    <motion.div className="card-meta" animate={{opacity:focused?1:.72}}>
      <b>{item.name}</b><span>{item.releaseInfo||item.type}</span>
    </motion.div>
  </motion.button>
});
