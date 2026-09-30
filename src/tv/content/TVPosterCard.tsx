import { loadMetaEnriched } from "../../data/stremio";
import { memo,useEffect,useState } from "react";
import { useTVFocusable } from "../focus/useTVFocusable";
import { usePlaybackStore } from "../../stores/playbackStore";
import type { MediaItem } from "../../types/tv";
import { TrailerPreview } from "../playback/TrailerPreview";
import { useSettingsStore } from "../../stores/settingsStore";

export const TVPosterCard=memo(function TVPosterCard({item,route,rowId,onOpen,onFocused,onSettled,onSpatialFocus,onArrowPress,expanded=false}:{
 item:MediaItem;route:string;rowId:string;onOpen:(m:MediaItem)=>void;onFocused?:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void;
 onSpatialFocus?:(layout:any)=>void;onArrowPress?:(direction:string)=>boolean|void;expanded?:boolean;
}){
 const [trailerReady,setTrailerReady]=useState(false);
 const [previewItem,setPreviewItem]=useState(item);
 const stopTrailer=usePlaybackStore(s=>s.stopTrailer);
 const previews=useSettingsStore(s=>s.previews);
 const {ref,focused,focusSelf}=useTVFocusable({focusKey:`${route}:${rowId}:${item.type}:${item.id}`,route,rowId,onPress:()=>onOpen(item),
  onFocus:layout=>{onFocused?.(item);onSpatialFocus?.(layout)},onArrowPress,
  onBlur:()=>{setTrailerReady(false);stopTrailer()}
 });
 useEffect(()=>{
  if(!focused)return;
  const controller=new AbortController();
  const meta=window.setTimeout(()=>{onSettled?.(item);if(!expanded)loadMetaEnriched(item,controller.signal).then(full=>{if(!controller.signal.aborted)setPreviewItem(full)}).catch(()=>{})},300);
  const trailer=window.setTimeout(()=>setTrailerReady(previews),1150);
  return()=>{controller.abort();window.clearTimeout(meta);window.clearTimeout(trailer)};
 },[focused,item.id,onSettled,previews]);
 return <button ref={ref as any} className={`tv-card reference-card ${focused?"is-focused":""} ${expanded?"is-expanded":""}`} aria-label={item.name}
  onMouseEnter={()=>focusSelf()} onClick={()=>onOpen(item)}>
   <div className="card-media">
    {(item.poster||item.background)&&<img className="card-art card-art-portrait" src={item.poster||item.background} loading="lazy" decoding="async" alt=""/>}
    {(item.background||item.poster)&&<img className="card-art card-art-landscape" src={item.background||item.poster} loading="lazy" decoding="async" alt=""/>}
    {trailerReady&&focused&&<TrailerPreview item={expanded?item:previewItem}/>}
    <div className="reference-card-shade"/>
    <span className="card-monogram" aria-hidden="true">N</span>
    {(expanded||!item.poster)&&<div className="reference-card-title">
      {expanded&&item.logo?<img src={item.logo} alt={item.name}/>:<b>{item.name}</b>}
    </div>}
    <div className="focus-ring"/>
   </div>
 </button>
});
