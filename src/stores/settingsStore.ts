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
type Store=TVSettings&{patch:(p:Partial<TVSettings>)=>void;reload:()=>void};
export const useSettingsStore=create<Store>((set)=>({
 ...load(),
 patch:(p)=>{const next={...load(),...p};localStorage.setItem("settings",JSON.stringify(next));set(next)},
 reload:()=>set(load())
}));
