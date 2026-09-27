import { create } from "zustand";

export type TVSettings={
  preferredQuality:string;
  maxSizeGB:number;
  dedupe:boolean;
  previews:boolean;
  previewAudio:boolean;
  reducedMotion:boolean;
};
const defaults:TVSettings={preferredQuality:"Auto",maxSizeGB:50,dedupe:true,previews:true,previewAudio:true,reducedMotion:false};
function load():TVSettings{try{return {...defaults,...JSON.parse(localStorage.getItem("settings")||"{}")}}catch{return defaults}}
function persist(next:TVSettings){
  localStorage.setItem("settings",JSON.stringify(next));
  window.dispatchEvent(new Event("nocturne-settings"));
}
type Store=TVSettings&{patch:(p:Partial<TVSettings>)=>void;reload:()=>void};
export const useSettingsStore=create<Store>((set,get)=>({
 ...load(),
 patch:(p)=>{
   const current=get();
   const next:TVSettings={
     preferredQuality:p.preferredQuality??current.preferredQuality,
     maxSizeGB:p.maxSizeGB??current.maxSizeGB,
     dedupe:p.dedupe??current.dedupe,
     previews:p.previews??current.previews,
     previewAudio:p.previewAudio??current.previewAudio,
     reducedMotion:p.reducedMotion??current.reducedMotion
   };
   persist(next);set(next);
 },
 reload:()=>set(load())
}));
