import { PropsWithChildren, useEffect } from "react";
import { initNavigation, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useNavigationStore } from "../../stores/navigationStore";

let ready=false;
if(!ready){
  initNavigation({debug:false,visualDebugger:false,nativeMode:false});
  ready=true;
}

export function TVFocusProvider({children}:PropsWithChildren){
  const remembered=useNavigationStore(s=>s.focusedKey);
  useEffect(()=>{
    if(remembered){
      const id=requestAnimationFrame(()=>{try{setFocus(remembered);}catch{}});
      return()=>cancelAnimationFrame(id);
    }
  },[]);
  return <>{children}</>;
}
