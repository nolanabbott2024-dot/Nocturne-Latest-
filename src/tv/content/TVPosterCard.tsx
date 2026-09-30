import { memo,useEffect,useState } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { useTVFocusable } from "../focus/useTVFocusable";
import { usePlaybackStore } from "../../stores/playbackStore";
import type { MediaItem } from "../../types/tv";
import { TrailerPreview } from "../playback/TrailerPreview";
import { useSettingsStore } from "../../stores/settingsStore";

export const TVPosterCard=memo(function TVPosterCard({
  item,route,rowId,onOpen,onFocused,onSettled,onSpatialFocus,onArrowPress
}:{
  item:MediaItem;route:string;rowId:string;
  onOpen:(m:MediaItem)=>void;
  onFocused?:(m:MediaItem)=>void;
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
    onFocus:(layout)=>{onFocused?.(item);onSpatialFocus?.(layout)},
    onArrowPress:(direction)=>onArrowPress?.(direction),
    onBlur:()=>{setTrailerReady(false);stopTrailer();}
  });

  useEffect(()=>{
    if(!focused){setTrailerReady(false);return}
    const metaTimer=window.setTimeout(()=>onSettled?.(item),260);
    const trailerTimer=window.setTimeout(()=>setTrailerReady(previews),1150);
    return()=>{window.clearTimeout(metaTimer);window.clearTimeout(trailerTimer)};
  },[focused,item.id,onSettled,previews]);

  const art=item.background||item.poster;
  return <motion.button ref={ref as any} className={"tv-card netflix-card "+(focused?"is-focused":"")}
    animate={{scale:focused&&!reducedMotion?1.085:1,y:focused&&!reducedMotion?-10:0,filter:focused?"brightness(1.05)":"brightness(.88)"}}
    transition={{type:"spring",stiffness:430,damping:33,mass:.68}}>
    <motion.div className="card-media netflix-card-media" layoutId={`media-${item.id}`}>
      {art&&<img src={art} loading="lazy" decoding="async"/>}
      {trailerReady&&focused&&<TrailerPreview item={item}/>}
      <div className="netflix-card-shade"/>
      <div className="netflix-card-badge"><Play size={14} fill="currentColor"/></div>
      <div className="focus-ring"/>
    </motion.div>
    <motion.div className="card-meta netflix-card-meta" animate={{opacity:focused?1:.72,y:focused?0:-2}}>
      <b>{item.name}</b><span>{[item.releaseInfo,item.contentRating].filter(Boolean).join(" · ")||item.type}</span>
    </motion.div>
  </motion.button>
});
