import type { AddonDescriptor,MediaItem } from "../types/tv";
import { loadAddon,loadStreams } from "./stremio";
import { processStreams,type RawStream,type StreamInfo } from "./streamPipeline";

export type PlayableSource={url:string;headers?:Record<string,string>;name?:string;info?:StreamInfo};

const sourceCache=new Map<string,{expires:number;items:PlayableSource[]}>();
const CACHE_MS=90_000;
function cacheKey(item:MediaItem,id:string,addons:AddonDescriptor[]){
  return `${item.type}|${id}|${addons.filter(a=>a.enabled!==false).map(a=>a.transportUrl).join(",")}`;
}
function withTimeout<T>(promise:Promise<T>,ms:number):Promise<T>{
  return new Promise((resolve,reject)=>{
    const timer=window.setTimeout(()=>reject(new Error("timeout")),ms);
    promise.then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)});
  });
}
async function rawFromAddon(d:AddonDescriptor,item:MediaItem,id:string,signal?:AbortSignal):Promise<RawStream[]>{
  if(/cinemeta|netflix-catalog/i.test(d.transportUrl))return [];
  const a=await loadAddon(d,signal);
  const resources=a.manifest.resources||[];
  if(!resources.some((r:any)=>(typeof r==="string"?r:r.name)==="stream"))return [];
  const streams=await withTimeout(loadStreams(a.baseUrl,item.type,id,signal),5000);
  return streams.map((s:any)=>({...s,_addonName:a.manifest.name||"Provider"})) as RawStream[];
}
function playable(raw:RawStream[]):PlayableSource[]{
  return processStreams(raw).filter(x=>x.stream.url).map(info=>({
    url:info.stream.url!,headers:info.stream.behaviorHints?.proxyHeaders?.request||{},name:info.label,info
  }));
}

export async function resolvePlayableSources(
  item:MediaItem,id:string,addons:AddonDescriptor[],signal?:AbortSignal
):Promise<PlayableSource[]>{
  const key=cacheKey(item,id,addons),hit=sourceCache.get(key);
  if(hit&&hit.expires>Date.now())return hit.items;
  const enabled=addons.filter(x=>x.enabled!==false);
  const results=await Promise.allSettled(enabled.map(d=>rawFromAddon(d,item,id,signal)));
  const items=playable(results.flatMap(r=>r.status==="fulfilled"?r.value:[]));
  sourceCache.set(key,{expires:Date.now()+CACHE_MS,items});
  return items;
}
export async function resolvePlayableStream(item:MediaItem,id:string,addons:AddonDescriptor[],signal?:AbortSignal):Promise<PlayableSource|null>{
  const key=cacheKey(item,id,addons),hit=sourceCache.get(key);
  if(hit&&hit.expires>Date.now())return hit.items[0]||null;

  const enabled=addons.filter(x=>x.enabled!==false&&!/cinemeta|netflix-catalog/i.test(x.transportUrl));
  return new Promise(resolve=>{
    if(!enabled.length){resolve(null);return}
    let remaining=enabled.length,settled=false;
    const finish=(value:PlayableSource|null)=>{
      if(settled)return;
      if(value){settled=true;resolve(value);return}
      remaining--;if(remaining<=0){settled=true;resolve(null)}
    };
    for(const d of enabled){
      rawFromAddon(d,item,id,signal).then(raw=>finish(playable(raw)[0]||null)).catch(()=>finish(null));
    }
  });
}
