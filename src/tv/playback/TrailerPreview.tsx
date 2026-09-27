import { useEffect,useRef,useState } from "react";
import Hls from "hls.js";
import type { MediaItem } from "../../types/tv";
import { usePlaybackStore } from "../../stores/playbackStore";
import { useSettingsStore } from "../../stores/settingsStore";

export function TrailerPreview({item}:{item:MediaItem}){
  const ref=useRef<HTMLVideoElement|null>(null);
  const [failed,setFailed]=useState(false);
  const setState=usePlaybackStore(s=>s.setTrailerState);
  const previewAudio=useSettingsStore(s=>s.previewAudio);
  const src=item.trailerUrl;
  const yt=item.trailerYtId;

  useEffect(()=>{
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
        video.muted=!previewAudio;video.loop=true;video.playsInline=true;
        await video.play();
        if(!cancelled)setState("playing",item.id);
      }catch{
        if(!cancelled){setFailed(true);setState("idle",null)}
      }
    };
    start();
    return()=>{
      cancelled=true;setState("stopping",item.id);
      video.pause();video.removeAttribute("src");video.load();hls?.destroy();
      setState("idle",null);
    };
  },[item.id,src,previewAudio]);

  if(failed)return null;
  if(src)return <video ref={ref} className="trailer-preview" muted={!previewAudio} playsInline onError={()=>setFailed(true)}/>;
  if(yt){
    return <img className="trailer-preview trailer-youtube-poster"
      src={`https://i.ytimg.com/vi/${encodeURIComponent(yt)}/hqdefault.jpg`} alt="Trailer artwork"/>;
  }
  return null;
}
