import { create } from "zustand";
import type { AddonDescriptor } from "../types/tv";

const CINEMETA="https://v3-cinemeta.strem.io/manifest.json";
const NETFLIX_CATALOG="https://7a82163c306e-stremio-netflix-catalog-addon.baby-beamup.club/bmZ4LGRucCxhbXAsYXRwLGhibSxwbXAscGNwLGhsdSxzdHosZHBlOjpVUzoxNzkwNTM0OTc0NzI0OjA6MDpVUw%3D%3D/manifest.json";
const configured=import.meta.env.VITE_DEFAULT_STREAM_ADDON as string|undefined;

function loadStored():AddonDescriptor[]{
  try{
    const old=JSON.parse(localStorage.getItem("addonDescriptors")||"[]");
    const urls=(old||[]).map((x:any)=>({transportUrl:x.transportUrl||x.manifestUrl,manifest:x.manifest,enabled:x.enabled!==false})).filter((x:any)=>x.transportUrl);
    if(!urls.some((x:any)=>x.transportUrl===CINEMETA))urls.unshift({transportUrl:CINEMETA,enabled:true});
    if(!urls.some((x:any)=>x.transportUrl===NETFLIX_CATALOG))urls.push({transportUrl:NETFLIX_CATALOG,enabled:true});
    if(configured&&!urls.some((x:any)=>x.transportUrl===configured))urls.push({transportUrl:configured,enabled:true});
    return urls;
  }catch{return [{transportUrl:CINEMETA,enabled:true},{transportUrl:NETFLIX_CATALOG,enabled:true},...(configured?[{transportUrl:configured,enabled:true}]:[])];}
}

type ProviderState={
  addons:AddonDescriptor[];
  setAddons:(a:AddonDescriptor[])=>void;
  install:(url:string,manifest?:any)=>void;
  remove:(url:string)=>void;
  toggle:(url:string)=>void;
};

export const useProviderStore=create<ProviderState>((set,get)=>({
  addons:loadStored(),
  setAddons:(addons)=>{localStorage.setItem("addonDescriptors",JSON.stringify(addons));set({addons});},
  install:(transportUrl,manifest)=>{
    const addons=get().addons;
    const existing=addons.find(a=>a.transportUrl===transportUrl);
    if(existing){
      get().setAddons(addons.map(a=>a.transportUrl===transportUrl?{...a,manifest:manifest||a.manifest,enabled:true}:a));
      return;
    }
    get().setAddons([...addons,{transportUrl,manifest,enabled:true}]);
  },
  remove:(url)=>get().setAddons(get().addons.filter(a=>a.transportUrl!==url)),
  toggle:(url)=>get().setAddons(get().addons.map(a=>a.transportUrl===url?{...a,enabled:a.enabled===false?true:false}:a))
}));
