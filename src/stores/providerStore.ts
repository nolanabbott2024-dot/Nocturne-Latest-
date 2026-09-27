import { create } from "zustand";
import type { AddonDescriptor } from "../types/tv";

const CINEMETA="https://v3-cinemeta.strem.io/manifest.json";
const configured=import.meta.env.VITE_DEFAULT_STREAM_ADDON as string|undefined;

function loadStored():AddonDescriptor[]{
  try{
    const old=JSON.parse(localStorage.getItem("addonDescriptors")||"[]");
    const urls=(old||[]).map((x:any)=>({transportUrl:x.transportUrl||x.manifestUrl,manifest:x.manifest,enabled:x.enabled!==false})).filter((x:any)=>x.transportUrl);
    if(!urls.some((x:any)=>x.transportUrl===CINEMETA))urls.unshift({transportUrl:CINEMETA,enabled:true});
    if(configured&&!urls.some((x:any)=>x.transportUrl===configured))urls.push({transportUrl:configured,enabled:true});
    return urls;
  }catch{return [{transportUrl:CINEMETA,enabled:true},...(configured?[{transportUrl:configured,enabled:true}]:[])];}
}

type ProviderState={
  addons:AddonDescriptor[];
  setAddons:(a:AddonDescriptor[])=>void;
  install:(url:string)=>void;
  remove:(url:string)=>void;
};

export const useProviderStore=create<ProviderState>((set,get)=>({
  addons:loadStored(),
  setAddons:(addons)=>{localStorage.setItem("addonDescriptors",JSON.stringify(addons));set({addons});},
  install:(transportUrl)=>{const addons=get().addons;if(addons.some(a=>a.transportUrl===transportUrl))return;get().setAddons([...addons,{transportUrl,enabled:true}]);},
  remove:(url)=>get().setAddons(get().addons.filter(a=>a.transportUrl!==url))
}));
