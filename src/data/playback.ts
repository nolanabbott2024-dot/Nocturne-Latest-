import type { AddonDescriptor,MediaItem } from "../types/tv";
import { loadAddon,loadStreams } from "./stremio";
import { processStreams,type RawStream,type StreamInfo } from "./streamPipeline";

export type PlayableSource={url:string;headers?:Record<string,string>;name?:string;info?:StreamInfo};

export async function resolvePlayableSources(
  item:MediaItem,id:string,addons:AddonDescriptor[],signal?:AbortSignal
):Promise<PlayableSource[]>{
  const results=await Promise.allSettled(addons.filter(x=>x.enabled!==false).map(async d=>{
    const a=await loadAddon(d,signal);
    const resources=a.manifest.resources||[];
    if(!resources.some((r:any)=>(typeof r==="string"?r:r.name)==="stream"))return [] as RawStream[];
    const streams=await loadStreams(a.baseUrl,item.type,id,signal);
    return streams.map((s:any)=>({...s,_addonName:a.manifest.name||"Provider"})) as RawStream[];
  }));
  const raw=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
  return processStreams(raw).filter(x=>x.stream.url).map(info=>({
    url:info.stream.url!,
    headers:info.stream.behaviorHints?.proxyHeaders?.request||{},
    name:info.label,
    info
  }));
}
export async function resolvePlayableStream(item:MediaItem,id:string,addons:AddonDescriptor[],signal?:AbortSignal):Promise<PlayableSource|null>{
  return (await resolvePlayableSources(item,id,addons,signal))[0]||null;
}
