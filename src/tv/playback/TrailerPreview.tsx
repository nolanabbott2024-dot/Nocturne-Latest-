import { useEffect,useRef,useState } from "react";
import Hls from "hls.js";
import type { MediaItem } from "../../types/tv";
import { usePlaybackStore } from "../../stores/playbackStore";
import { useSettingsStore } from "../../stores/settingsStore";

export function TrailerPreview({item,loop=true,onEnded}:{item:MediaItem;loop?:boolean;onEnded?:()=>void}){
  const ref=useRef<HTMLVideoElement|null>(null);
  const frameRef=useRef<HTMLIFrameElement|null>(null);
  const endedRef=useRef(false);
  const [failed,setFailed]=useState(false);
  const [youtubeLoaded,setYoutubeLoaded]=useState(false);
  const setState=usePlaybackStore(s=>s.setTrailerState);
  const previewAudio=useSettingsStore(s=>s.previewAudio);
  const src=item.trailerUrl;
  const yt=item.trailerYtId;

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

  useEffect(()=>{
    if(!yt||src)return;
    endedRef.current=false;
    setYoutubeLoaded(false);
    setState("preloading",item.id);

    const command=(func:string)=>{
      const frame=frameRef.current;
      if(!frame?.contentWindow)return;
      frame.contentWindow.postMessage(JSON.stringify({event:"command",func,args:[]}),"*");
    };
    const play=()=>{
      command("mute");
      command("playVideo");
      setYoutubeLoaded(true);
      setState("playing",item.id);
    };
    const onMessage=(event:MessageEvent)=>{
      if(event.source!==frameRef.current?.contentWindow)return;
      let data:any=event.data;
      if(typeof data==="string"){try{data=JSON.parse(data)}catch{return}}
      const state=data?.info?.playerState ?? (data?.event==="onStateChange"?data?.info:undefined);
      if(state===0&&!loop)finish();
    };
    window.addEventListener("message",onMessage);
    const first=window.setTimeout(play,180);
    const retry=window.setTimeout(play,900);
    return()=>{
      window.removeEventListener("message",onMessage);
      window.clearTimeout(first);window.clearTimeout(retry);
      setState("idle",null);
    };
  },[item.id,yt,src,loop,setState]);

  if(failed)return null;
  if(src)return <video ref={ref} className="trailer-preview" muted={!previewAudio} playsInline onEnded={()=>{if(!loop)finish()}} onError={()=>setFailed(true)}/>;
  if(yt){
    const id=encodeURIComponent(yt);
    const isHttp=/^https?:$/.test(window.location.protocol);
    const origin=isHttp?"&origin="+encodeURIComponent(window.location.origin):"";
    const looping=loop?"&loop=1&playlist="+id:"";
    return <iframe ref={frameRef} key={yt} className={"trailer-preview trailer-youtube "+(youtubeLoaded?"is-playing":"")}
      src={"https://www.youtube.com/embed/"+id+"?autoplay=1&controls=0&rel=0&playsinline=1&mute=1&enablejsapi=1"+looping+origin}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={()=>{
        const frame=frameRef.current;
        if(!frame?.contentWindow)return;
        frame.contentWindow.postMessage(JSON.stringify({event:"command",func:"mute",args:[]}),"*");
        frame.contentWindow.postMessage(JSON.stringify({event:"command",func:"playVideo",args:[]}),"*");
        setYoutubeLoaded(true);
        setState("playing",item.id);
      }}
      title={"Trailer preview for "+item.name}/>;
  }
  return null;
}
