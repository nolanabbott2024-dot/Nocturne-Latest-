import { memo,useEffect,useState } from "react";
import { motion } from "motion/react";
import { useTVFocusable } from "../focus/useTVFocusable";
import { usePlaybackStore } from "../../stores/playbackStore";
import type { MediaItem } from "../../types/tv";
import { TrailerPreview } from "../playback/TrailerPreview";
import { useSettingsStore } from "../../stores/settingsStore";

export const TVPosterCard=memo(function TVPosterCard({
  item,route,rowId,onOpen,onSettled,onSpatialFocus,onArrowPress
}:{
  item:MediaItem;route:string;rowId:string;
  onOpen:(m:MediaItem)=>void;
  onSettled?:(m:MediaItem)=>void;
  onSpatialFocus?:(layout:any)=>void;
  onArrowPress?:(direction:string)=>boolean|void;
}){
  const key=`${route}:${rowId}:${item.type}:${item.id}`;
  const [trailerReady,setTrailerReady]=useState(false);
  const stopTrailer=usePlaybackStore(s=>s.stopTrailer);
  const previews=useSettingsStore(s=>s.previews);
  const reducedMotion=useSettingsStore(s=>s.reducedMotion);
  const {ref,focused}=useTVFocusable({
    focusKey:key,route,rowId,onPress:()=>onOpen(item),
    onFocus:(layout)=>onSpatialFocus?.(layout),
    onArrowPress:(direction)=>onArrowPress?.(direction),
    onBlur:()=>{setTrailerReady(false);stopTrailer();}
  });

  useEffect(()=>{
    if(!focused){setTrailerReady(false);return}
    const metaTimer=window.setTimeout(()=>onSettled?.(item),420);
    const trailerTimer=window.setTimeout(()=>setTrailerReady(previews),1500);
    return()=>{window.clearTimeout(metaTimer);window.clearTimeout(trailerTimer)};
  },[focused,item.id]);

  const art=item.poster||item.background;
  return <motion.button ref={ref as any} className="tv-card"
    animate={{scale:focused&&!reducedMotion?1.072:1,y:focused&&!reducedMotion?-7:0,filter:focused?"brightness(1.09)":"brightness(1)"}}
    transition={{type:"spring",stiffness:390,damping:31,mass:.7}}>
    <motion.div className="card-media" layoutId={`media-${item.id}`}>
      {art&&<img src={art} loading="lazy" decoding="async"/>}
      {trailerReady&&focused&&<TrailerPreview item={item}/>}
      <div className="focus-ring"/>
    </motion.div>
    <motion.div className="card-meta" animate={{opacity:focused?1:.72}}>
      <b>{item.name}</b><span>{item.releaseInfo||item.type}</span>
    </motion.div>
  </motion.button>
});
