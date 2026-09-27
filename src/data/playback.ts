import type { AddonDescriptor,MediaItem } from "../types/tv";
import { loadAddon,loadStreams } from "./stremio";

export type PlayableSource={url:string;headers?:Record<string,string>;name?:string};

export async function resolvePlayableStream(
  item:MediaItem,id:string,addons:AddonDescriptor[],signal?:AbortSignal
):Promise<PlayableSource|null>{
  const errors:unknown[]=[];
  for(const d of addons.filter(x=>x.enabled!==false)){
    if(signal?.aborted)throw new DOMException("Aborted","AbortError");
    try{
      const a=await loadAddon(d,signal);
      const resources=a.manifest.resources||[];
      const supports=resources.some((r:any)=>(typeof r==="string"?r:r.name)==="stream");
      if(!supports)continue;
      const streams=await loadStreams(a.baseUrl,item.type,id,signal);
      const direct=streams.find((s:any)=>typeof s.url==="string"&&s.url.length>0);
      if(direct)return {url:direct.url,headers:direct.behaviorHints?.proxyHeaders?.request||{},name:direct.name||direct.title};
    }catch(e){errors.push(e)}
  }
  return null;
}
