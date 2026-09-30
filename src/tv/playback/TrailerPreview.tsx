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
  const nativeAndroid=typeof window.NocturneNative!=="undefined";

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
  },[item.id,src,previewAudio,setState]);

  useEffect(()=>{
    if(!yt||src||nativeAndroid)return;
    setState("playing",item.id);
    return()=>setState("idle",null);
  },[item.id,yt,src,nativeAndroid,setState]);

  if(failed)return null;
  if(src)return <video ref={ref} className="trailer-preview" muted={!previewAudio} playsInline onError={()=>setFailed(true)}/>;
  if(yt&&!nativeAndroid){
    const origin=encodeURIComponent(window.location.origin);
    const mute=previewAudio?0:1;
    return <iframe className="trailer-preview trailer-youtube"
      src={`https://www.youtube.com/embed/${encodeURIComponent(yt)}?autoplay=1&controls=0&rel=0&playsinline=1&mute=${mute}&origin=${origin}`}
      allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin"
      title="Trailer preview"/>;
  }
  if(yt){
    return <img className="trailer-preview trailer-youtube-poster"
      src={`https://i.ytimg.com/vi/${encodeURIComponent(yt)}/hqdefault.jpg`} alt="Trailer artwork"/>;
  }
  return null;
}
