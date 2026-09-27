import { create } from "zustand";
import type { MediaItem } from "../types/tv";
type ContentState={
  heroByRoute:Record<string,MediaItem|undefined>;
  setHero:(route:string,item:MediaItem)=>void;
  discoverSeed:number;
  rotateDiscover:()=>void;
};
export const useContentStore=create<ContentState>((set)=>({
  heroByRoute:{},discoverSeed:Date.now()%100000,
  setHero:(route,item)=>set(s=>({heroByRoute:{...s.heroByRoute,[route]:item}})),
  rotateDiscover:()=>set({discoverSeed:Date.now()%100000})
}));
