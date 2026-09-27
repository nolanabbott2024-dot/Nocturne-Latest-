import { useEffect,useRef } from "react";
import Hls from "hls.js";

export function TVVideo({src,onError}:{src:string;onError?:()=>void}){
  const ref=useRef<HTMLVideoElement|null>(null);
  useEffect(()=>{
    const v=ref.current;if(!v)return;let hls:Hls|null=null;
    try{
      if(src.includes(".m3u8")&&Hls.isSupported()){hls=new Hls({enableWorker:true});hls.loadSource(src);hls.attachMedia(v)}
      else v.src=src;
      v.play().catch(()=>onError?.());
    }catch{onError?.()}
    return()=>{v.pause();hls?.destroy()}
  },[src]);
  return <video ref={ref} className="tv-video" controls={false} autoPlay playsInline/>;
}
