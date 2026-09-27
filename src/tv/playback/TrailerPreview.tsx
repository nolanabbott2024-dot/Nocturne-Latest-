import { useEffect,useRef } from "react";
import Hls from "hls.js";
import type { MediaItem } from "../../types/tv";
import { usePlaybackStore } from "../../stores/playbackStore";

export function TrailerPreview({item}:{item:MediaItem}){
  const ref=useRef<HTMLVideoElement|null>(null);
  const setState=usePlaybackStore(s=>s.setTrailerState);
  const stopGlobal=usePlaybackStore(s=>s.stopTrailer);
  useEffect(()=>{
    const src=item.trailerUrl,video=ref.current;
    if(!src||!video)return;
    let hls:Hls|null=null,cancelled=false,playTimer:number|undefined;
    // A newly focused title always wins; any previous pending/active preview is logically cancelled.
    stopGlobal();setState("preloading",item.id);
    try{
      if(src.includes(".m3u8")&&Hls.isSupported()){
        hls=new Hls({enableWorker:true,lowLatencyMode:true,startLevel:-1});
        hls.loadSource(src);hls.attachMedia(video);
      }else{
        video.preload="metadata";video.src=src;
      }
      video.muted=true;video.loop=true;video.playsInline=true;
      playTimer=window.setTimeout(async()=>{
        if(cancelled)return;
        try{await video.play();if(!cancelled)setState("playing",item.id)}
        catch{if(!cancelled)setState("idle",null)}
      },850);
    }catch{setState("idle",null)}
    return()=>{
      cancelled=true;if(playTimer)clearTimeout(playTimer);
      setState("stopping",item.id);
      video.pause();video.removeAttribute("src");video.load();hls?.destroy();
      setState("idle",null);
    };
  },[item.id,item.trailerUrl]);
  if(!item.trailerUrl)return null;
  return <video ref={ref} className="trailer-preview" muted playsInline preload="metadata"/>;
}
