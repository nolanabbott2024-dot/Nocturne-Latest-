import { useEffect,useRef,useState } from "react";
import Hls from "hls.js";
import type { MediaItem } from "../../types/tv";
import { usePlaybackStore } from "../../stores/playbackStore";
import { useSettingsStore } from "../../stores/settingsStore";

export function TrailerPreview({item,loop=true,onEnded}:{item:MediaItem;loop?:boolean;onEnded?:()=>void}){
  const ref=useRef<HTMLVideoElement|null>(null);
  const endedRef=useRef(false);
  const [failed,setFailed]=useState(false);
  const setState=usePlaybackStore(s=>s.setTrailerState);
  const previewAudio=useSettingsStore(s=>s.previewAudio);
  const src=item.trailerUrl;

  const finish=()=>{
    if(endedRef.current)return;
    endedRef.current=true;
    setState("idle",null);
    onEnded?.();
  };

  useEffect(()=>{
    endedRef.current=false;
    setFailed(false);
    if(!src)return;
    const video=ref.current;if(!video)return;
    let hls:Hls|null=null;let cancelled=false;
    setState("preloading",item.id);
    const start=async()=>{
      try{
        if(src.includes(".m3u8")&&Hls.isSupported()){
          hls=new Hls({enableWorker:true,lowLatencyMode:true});
          hls.loadSource(src);hls.attachMedia(video);
        }else video.src=src;
        video.muted=!previewAudio;video.loop=loop;video.playsInline=true;
        await video.play();
        if(!cancelled)setState("playing",item.id);
      }catch{
        try{
          video.muted=true;
          await video.play();
          if(!cancelled)setState("playing",item.id);
        }catch{
          if(!cancelled){setFailed(true);setState("idle",null)}
        }
      }
    };
    start();
    return()=>{
      cancelled=true;setState("stopping",item.id);
      video.pause();video.removeAttribute("src");video.load();hls?.destroy();
      setState("idle",null);
    };
  },[item.id,src,previewAudio,loop,setState]);

  if(!src||failed)return null;
  return <video ref={ref} className="trailer-preview" muted={!previewAudio} playsInline
    onEnded={()=>{if(!loop)finish()}} onError={()=>setFailed(true)}/>;
}
