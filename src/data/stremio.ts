import type { AddonDescriptor,Catalog,MediaItem } from "../types/tv";

export type LoadedAddon={descriptor:AddonDescriptor;manifest:any;baseUrl:string;catalogs:Catalog[]};

function baseOf(url:string){return url.slice(0,url.lastIndexOf("/")+1);}
export async function fetchJson<T=any>(url:string,signal?:AbortSignal):Promise<T>{
  const r=await fetch(url,{signal,headers:{Accept:"application/json"}});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export async function loadAddon(d:AddonDescriptor,signal?:AbortSignal):Promise<LoadedAddon>{
  const manifest=d.manifest||await fetchJson(d.transportUrl,signal);
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
  const o=await fetchJson<any>(`${c.baseUrl}catalog/${encodeURIComponent(c.type)}/${encodeURIComponent(c.id)}${suffix}.json`,signal);
  return (o.metas||[]).map((m:any)=>normalizeItem(m,c.type,c.baseUrl));
}
export async function loadMeta(baseUrl:string,type:string,id:string,signal?:AbortSignal):Promise<MediaItem>{
  const o=await fetchJson<any>(`${baseUrl}meta/${encodeURIComponent(type)}/${encodeURIComponent(id)}.json`,signal);
  return normalizeItem(o.meta||{},type,baseUrl);
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
