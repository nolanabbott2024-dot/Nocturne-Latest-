import { PropsWithChildren, useEffect } from "react";
import { init, setFocus } from "@noriginmedia/norigin-spatial-navigation-core";
import { useNavigationStore } from "../../stores/navigationStore";

let ready=false;
if(!ready){
  init({debug:false,visualDebug:false,throttle:0,throttleKeypresses:false,distanceCalculationMethod:"center",shouldFocusDOMNode:true,domNodeFocusOptions:{preventScroll:true}});
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
