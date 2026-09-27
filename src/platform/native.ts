declare global {
  interface Window {
    NocturneNative?: {
      play(url:string,title:string):void;
      exit?():void;
    };
  }
}
export function playNative(url:string,title:string){
  if(window.NocturneNative?.play){
    window.NocturneNative.play(url,title);
    return true;
  }
  return false;
}
export {};
