import { doesFocusableExist,setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useCallback, type RefObject } from "react";

const SAFE_LEFT=.20,SAFE_RIGHT=.80;

export function useHorizontalRail(opts:{
  scroller:RefObject<HTMLElement|null>;
  count:number;
  keyAt:(index:number)=>string;
  leftExitFocusKey:string;
  ensureIndexVisible?:(index:number)=>void;
}){
  const {scroller,count,keyAt,leftExitFocusKey,ensureIndexVisible}=opts;

  const onFocus=useCallback((layout:any)=>{
    const s=scroller.current;if(!s)return;
    const el=(layout?.node||layout?.layout?.node) as HTMLElement|undefined;
    if(!el)return;
    const r=el.getBoundingClientRect(),sr=s.getBoundingClientRect();
    const center=r.left+r.width/2;
    const left=sr.left+sr.width*SAFE_LEFT,right=sr.left+sr.width*SAFE_RIGHT;
    if(center<left||center>right){
      s.scrollBy({left:center-(sr.left+sr.width*.5),behavior:"smooth"});
    }
    const page=el.closest(".tv-page") as HTMLElement|null;
    if(page){
      const p=page.getBoundingClientRect();
      const safeTop=p.top+p.height*.18,safeBottom=p.top+p.height*.82;
      if(r.top<safeTop)page.scrollBy({top:r.top-safeTop-24,behavior:"smooth"});
      else if(r.bottom>safeBottom)page.scrollBy({top:r.bottom-safeBottom+24,behavior:"smooth"});
    }
  },[scroller]);

  const onArrow=useCallback((index:number,direction:string)=>{
    if(direction!=="left"&&direction!=="right")return true;

    if(direction==="left"&&index===0){
      requestAnimationFrame(()=>void setFocus(leftExitFocusKey));
      return false;
    }

    const target=index+(direction==="right"?1:-1);
    if(target<0||target>=count)return false;

    const key=keyAt(target);
    // If the adjacent target already exists, let Norigin's geometry move there.
    if(doesFocusableExist(key))return true;

    // Only bridge the focus manually when virtualization has not mounted it yet.
    ensureIndexVisible?.(target);
    let cancelled=false,tries=0;
    const focusWhenMounted=()=>{
      if(cancelled)return;
      if(doesFocusableExist(key)){void setFocus(key);cancelled=true;return}
      if(tries++<30)window.setTimeout(focusWhenMounted,16);
    };
    window.setTimeout(focusWhenMounted,0);
    return false;
  },[count,keyAt,leftExitFocusKey,ensureIndexVisible]);

  return {onFocus,onArrow};
}
