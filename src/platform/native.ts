import type { MediaItem } from "../types/tv";
declare global {
  interface Window {
    NocturneNative?: {
      play(url:string,title:string,headersJson?:string,itemJson?:string,videoId?:string):void;
      exit?():void;
    };
  }
}
export function playNative(url:string,title:string,headers:Record<string,string>={},item?:MediaItem,videoId?:string){
  if(window.NocturneNative?.play){
    window.NocturneNative.play(url,title,JSON.stringify(headers),item?JSON.stringify(item):"",videoId||item?.id||"");
    return true;
  }
  return false;
}
export {};
