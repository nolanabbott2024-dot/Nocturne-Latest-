import type { AddonDescriptor,Catalog,MediaItem } from "../types/tv";

export type LoadedAddon={descriptor:AddonDescriptor;manifest:any;baseUrl:string;catalogs:Catalog[]};

export const CINEMETA_BASE="https://v3-cinemeta.strem.io/";
export function isCinemetaCatalog(c:Catalog){return c.baseUrl===CINEMETA_BASE||/cinemeta/i.test(c.addonId)||/cinemeta/i.test(c.addonName);}

function baseOf(url:string){return url.slice(0,url.lastIndexOf("/")+1);}
const jsonCache=new Map<string,{expires:number;value:any}>();
export async function fetchJson<T=any>(url:string,signal?:AbortSignal,ttlMs=0):Promise<T>{
  if(ttlMs>0){
    const hit=jsonCache.get(url);
    if(hit&&hit.expires>Date.now())return hit.value as T;
    if(hit)jsonCache.delete(url);
  }
  const r=await fetch(url,{signal,headers:{Accept:"application/json"}});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const value=await r.json() as T;
  if(ttlMs>0)jsonCache.set(url,{expires:Date.now()+ttlMs,value});
  return value;
}
export function clearStremioCache(){jsonCache.clear()}
export async function loadAddon(d:AddonDescriptor,signal?:AbortSignal):Promise<LoadedAddon>{
  const manifest=d.manifest||await fetchJson(d.transportUrl,signal,15*60_000);
  const baseUrl=baseOf(d.transportUrl);
  const catalogs=(manifest.catalogs||[]).map((c:any)=>({
    addonId:manifest.id,addonName:manifest.name,baseUrl,id:c.id,type:c.type,name:c.name||c.id,
    searchable:(c.extra||[]).some((e:any)=>(typeof e==="string"?e:e.name)==="search"),
    genres:(c.extra||[]).find((e:any)=>typeof e==="object"&&e.name==="genre")?.options||[]
  }));
  return {descriptor:d,manifest,baseUrl,catalogs};
}
export async function loadCatalog(c:Catalog,extra:Record<string,string>={},signal?:AbortSignal):Promise<MediaItem[]>{
  const encoded=Object.entries(extra).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const suffix=encoded?`/${encoded}`:"";
  const o=await fetchJson<any>(`${c.baseUrl}catalog/${encodeURIComponent(c.type)}/${encodeURIComponent(c.id)}${suffix}.json`,signal,10*60_000);
  return (o.metas||[]).map((m:any)=>normalizeItem(m,c.type,c.baseUrl));
}
export async function loadMeta(baseUrl:string,type:string,id:string,signal?:AbortSignal):Promise<MediaItem>{
  const o=await fetchJson<any>(`${baseUrl}meta/${encodeURIComponent(type)}/${encodeURIComponent(id)}.json`,signal,30*60_000);
  return normalizeItem(o.meta||{},type,baseUrl);
}

export async function loadMetaEnriched(seed:MediaItem,signal?:AbortSignal):Promise<MediaItem>{
  let source:MediaItem=seed;
  if(seed.sourceBase){
    try{source=await loadMeta(seed.sourceBase,seed.type,seed.id,signal)}catch{}
  }
  if(seed.type!=="movie"&&seed.type!=="series")return source;
  let meta:MediaItem|null=null;
  try{meta=await loadMeta(CINEMETA_BASE,seed.type,seed.id,signal)}catch{}
  if(!meta)return {...source,sourceBase:seed.sourceBase||source.sourceBase};
  return {
    ...source,
    poster:meta.poster||source.poster,
    background:meta.background||source.background||meta.poster,
    logo:meta.logo||source.logo,
    description:meta.description||source.description,
    releaseInfo:meta.releaseInfo||source.releaseInfo,
    runtime:meta.runtime||source.runtime,
    contentRating:meta.contentRating||source.contentRating,
    imdbRating:meta.imdbRating||source.imdbRating,
    genres:meta.genres?.length?meta.genres:source.genres,
    videos:meta.videos?.length?meta.videos:source.videos,
    trailerUrl:meta.trailerUrl||source.trailerUrl,
    trailerYtId:meta.trailerYtId||source.trailerYtId,
    sourceBase:seed.sourceBase||source.sourceBase
  };
}
export async function loadStreams(baseUrl:string,type:string,id:string,signal?:AbortSignal){
  const o=await fetchJson<any>(`${baseUrl}stream/${encodeURIComponent(type)}/${encodeURIComponent(id)}.json`,signal);
  return o.streams||[];
}
export function normalizeItem(m:any,type:string,sourceBase?:string):MediaItem{
  const trailer=(m.trailerStreams||m.trailers||[])[0]||{};
  return {
    id:String(m.id||""),type:String(m.type||type),name:m.name||"Untitled",
    poster:m.poster,background:m.background||m.poster,logo:m.logo,description:m.description,
    releaseInfo:m.releaseInfo,runtime:m.runtime,contentRating:m.contentRating,imdbRating:m.imdbRating,
    genres:m.genres||[],videos:m.videos||[],trailerUrl:trailer.url,
    trailerYtId:trailer.ytId||trailer.source,sourceBase
  };
}
