declare global {
  interface Window {
    NocturneNative?: {
      play(url:string,title:string,headersJson?:string):void;
      exit?():void;
    };
  }
}
export function playNative(url:string,title:string,headers:Record<string,string>={}){
  if(window.NocturneNative?.play){
    window.NocturneNative.play(url,title,JSON.stringify(headers));
    return true;
  }
  return false;
}
export {};
