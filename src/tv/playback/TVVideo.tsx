import { forwardRef,useEffect,useImperativeHandle,useRef } from "react";
import Hls from "hls.js";

export type TVVideoHandle={
  toggle:()=>boolean;
  seekBy:(seconds:number)=>void;
  isPlaying:()=>boolean;
};
export const TVVideo=forwardRef<TVVideoHandle,{src:string;headers?:Record<string,string>;onError?:()=>void;onPlayingChange?:(playing:boolean)=>void}>(
function TVVideo({src,headers={},onError,onPlayingChange},handle){
  const ref=useRef<HTMLVideoElement|null>(null);
  useImperativeHandle(handle,()=>({
    toggle:()=>{
      const v=ref.current;if(!v)return false;
      if(v.paused){v.play().catch(()=>onError?.());return true}
      v.pause();return false;
    },
    seekBy:(seconds)=>{
      const v=ref.current;if(!v)return;
      const max=Number.isFinite(v.duration)?v.duration:Number.MAX_SAFE_INTEGER;
      v.currentTime=Math.max(0,Math.min(max,v.currentTime+seconds));
    },
    isPlaying:()=>!!ref.current&&!ref.current.paused
  }),[onError]);
  useEffect(()=>{
    const v=ref.current;if(!v)return;let hls:Hls|null=null;
    const playing=()=>onPlayingChange?.(true),paused=()=>onPlayingChange?.(false);
    v.addEventListener("playing",playing);v.addEventListener("pause",paused);v.addEventListener("ended",paused);
    try{
      if(src.includes(".m3u8")&&Hls.isSupported()){
        hls=new Hls({
          enableWorker:true,
          xhrSetup:(xhr)=>{for(const [k,val] of Object.entries(headers))xhr.setRequestHeader(k,val)}
        });
        hls.loadSource(src);hls.attachMedia(v);
      }else v.src=src;
      v.play().catch(()=>onError?.());
    }catch{onError?.()}
    return()=>{
      v.removeEventListener("playing",playing);v.removeEventListener("pause",paused);v.removeEventListener("ended",paused);
      v.pause();hls?.destroy();v.removeAttribute("src");v.load();
    };
  },[src,JSON.stringify(headers)]);
  return <video ref={ref} className="tv-video" controls={false} autoPlay playsInline/>;
});
