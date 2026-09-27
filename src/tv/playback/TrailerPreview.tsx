import { useEffect,useRef } from "react";
import Hls from "hls.js";
import type { MediaItem } from "../../types/tv";
import { usePlaybackStore } from "../../stores/playbackStore";

export function TrailerPreview({item}:{item:MediaItem}){
  const ref=useRef<HTMLVideoElement|null>(null);
  const setState=usePlaybackStore(s=>s.setTrailerState);
  useEffect(()=>{
    const src=item.trailerUrl;
    if(!src)return;
    const video=ref.current;if(!video)return;
    let hls:Hls|null=null;let cancelled=false;
    setState("preloading",item.id);
    const start=async()=>{
      try{
        if(src.includes(".m3u8")&&Hls.isSupported()){hls=new Hls({enableWorker:true,lowLatencyMode:true});hls.loadSource(src);hls.attachMedia(video);}
        else video.src=src;
        video.muted=true;video.loop=true;video.playsInline=true;
        await video.play();if(!cancelled)setState("playing",item.id);
      }catch{setState("idle",null)}
    };
    start();
    return()=>{cancelled=true;setState("stopping",item.id);video.pause();video.removeAttribute("src");video.load();hls?.destroy();setState("idle",null)};
  },[item.id,item.trailerUrl]);
  if(!item.trailerUrl)return null;
  return <video ref={ref} className="trailer-preview" muted playsInline/>;
}
