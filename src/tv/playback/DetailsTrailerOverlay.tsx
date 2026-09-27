import { useEffect } from "react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "motion/react";
import type { MediaItem } from "../../types/tv";
import { FocusBoundary } from "../focus/FocusBoundary";
import { useTVFocusable } from "../focus/useTVFocusable";
import { TrailerPreview } from "./TrailerPreview";
import { openExternal } from "../../platform/native";

export function DetailsTrailerOverlay({item,route,onClose}:{item:MediaItem;route:string;onClose:()=>void}){
  const closeKey=`${route}:trailer:close`;
  const watchKey=`${route}:trailer:youtube`;
  const youtubeOnly=!item.trailerUrl&&!!item.trailerYtId;
  const preferred=youtubeOnly?watchKey:closeKey;
  useEffect(()=>{
    const id=requestAnimationFrame(()=>{void setFocus(preferred)});
    const back=()=>onClose();window.addEventListener("nocturne-overlay-back",back);
    return()=>{cancelAnimationFrame(id);window.removeEventListener("nocturne-overlay-back",back);requestAnimationFrame(()=>{void setFocus(`${route}:action:trailer`)})}
  },[preferred,route,onClose]);

  return <motion.div data-tv-overlay="true" className="trailer-overlay"
    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <FocusBoundary id={`${route}:trailer-overlay`} preferredChildFocusKey={preferred} trap>
      <div className="trailer-stage">
        <TrailerPreview item={item}/>
        {youtubeOnly&&item.trailerYtId&&<TrailerYoutube focusKey={watchKey} route={route} yt={item.trailerYtId}/>}
        <TrailerClose focusKey={closeKey} route={route} onClose={onClose}/>
      </div>
    </FocusBoundary>
  </motion.div>
}
function TrailerYoutube({focusKey,route,yt}:any){
  const {ref,focused}=useTVFocusable({focusKey,route,rowId:"trailer-overlay",onPress:()=>openExternal(`https://www.youtube.com/watch?v=${encodeURIComponent(yt)}`)});
  return <motion.button ref={ref as any} className="trailer-youtube-button"
    animate={{scale:focused?1.06:1,backgroundColor:focused?"#fff":"rgba(0,0,0,.68)",color:focused?"#000":"#fff"}}>
    Watch Trailer on YouTube
  </motion.button>
}
function TrailerClose({focusKey,route,onClose}:any){
  const {ref,focused}=useTVFocusable({focusKey,route,rowId:"trailer-overlay",onPress:onClose});
  return <motion.button ref={ref as any} className="trailer-close"
    animate={{scale:focused?1.06:1,backgroundColor:focused?"#fff":"rgba(0,0,0,.62)",color:focused?"#000":"#fff"}}>Close</motion.button>
}
