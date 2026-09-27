import { create } from "zustand";

export type TrailerState = "idle"|"pending"|"preloading"|"playing"|"stopping";

type PlaybackState = {
  activeTrailerId:string|null;
  pendingTrailerId:string|null;
  trailerState:TrailerState;
  playingTitleId:string|null;
  playbackPosition:number;
  duration:number;
  isPlaying:boolean;
  requestTrailer:(id:string)=>void;
  setTrailerState:(state:TrailerState,id?:string|null)=>void;
  stopTrailer:()=>void;
};

export const usePlaybackStore=create<PlaybackState>((set)=>({
  activeTrailerId:null,pendingTrailerId:null,trailerState:"idle",
  playingTitleId:null,playbackPosition:0,duration:0,isPlaying:false,
  requestTrailer:(id)=>set({pendingTrailerId:id,trailerState:"pending"}),
  setTrailerState:(state,id=null)=>set({
    trailerState:state,
    activeTrailerId:state==="playing"?id:null,
    pendingTrailerId:state==="idle"?null:id
  }),
  stopTrailer:()=>set({activeTrailerId:null,pendingTrailerId:null,trailerState:"idle"})
}));
