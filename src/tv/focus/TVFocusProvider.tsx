import { PropsWithChildren, useEffect } from "react";
import { init, setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useNavigationStore } from "../../stores/navigationStore";
import { usePlaybackStore } from "../../stores/playbackStore";

declare global {
  interface Window { __NOCTURNE_TV__?: { focus:()=>string|null; trailer:()=>string; }; }
}

let ready=false;
if(!ready){
  init({debug:false,visualDebug:false,throttle:0,throttleKeypresses:false,distanceCalculationMethod:"center",shouldFocusDOMNode:false,focusOnPresetKey:true});
  ready=true;
}

export function TVFocusProvider({children}:PropsWithChildren){
  const remembered=useNavigationStore(s=>s.focusedKey);
  useEffect(()=>{
    window.__NOCTURNE_TV__={
      focus:()=>useNavigationStore.getState().focusedKey,
      trailer:()=>usePlaybackStore.getState().trailerState
    };
    if(remembered){
      const id=requestAnimationFrame(()=>{try{void setFocus(remembered);}catch{}});
      return()=>{cancelAnimationFrame(id);delete window.__NOCTURNE_TV__};
    }
    return()=>{delete window.__NOCTURNE_TV__};
  },[]);
  return <>{children}</>;
}
