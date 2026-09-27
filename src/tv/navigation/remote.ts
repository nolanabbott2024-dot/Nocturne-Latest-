import type { TVRemoteAction } from "../../types/tv";

const KEYMAP:Record<string,TVRemoteAction>={
  ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",
  Enter:"select",Escape:"back",Backspace:"back","MediaPlayPause":"playPause"
};

export function remoteActionFromKeyboard(e:KeyboardEvent):TVRemoteAction|null{
  return KEYMAP[e.key]||null;
}

export function installRemoteAdapter(handler:(action:TVRemoteAction,e:KeyboardEvent)=>void){
  const fn=(e:KeyboardEvent)=>{
    const action=remoteActionFromKeyboard(e);
    if(!action)return;
    handler(action,e);
  };
  window.addEventListener("keydown",fn,{capture:true});
  return()=>window.removeEventListener("keydown",fn,{capture:true});
}
