import { useState } from "react";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useNavigationStore } from "../../stores/navigationStore";

function fullyVisibleWithin(node:HTMLElement,container:HTMLElement,padX=0,padY=0){
  const nr=node.getBoundingClientRect(),cr=container.getBoundingClientRect();
  return nr.left>=cr.left+padX&&nr.right<=cr.right-padX&&nr.top>=cr.top+padY&&nr.bottom<=cr.bottom-padY;
}

function lockFocusedNode(node:HTMLElement|null,focusKey:string){
  if(!node)return;

  const horizontal=node.closest(".tv-row-scroll,.hub-related-row,.hub-episode-row") as HTMLElement|null;
  if(horizontal){
    let nr=node.getBoundingClientRect(),hr=horizontal.getBoundingClientRect();
    const pad=Math.min(36,hr.width*.06);
    let dx=0;
    if(nr.left<hr.left+pad)dx=nr.left-(hr.left+pad);
    else if(nr.right>hr.right-pad)dx=nr.right-(hr.right-pad);
    if(Math.abs(dx)>1)horizontal.scrollLeft+=dx;
  }

  const page=node.closest(".tv-page") as HTMLElement|null;
  if(!page)return;

  const isDetails=page.className.includes("details:");
  const isHeroFocus=focusKey.includes(":action:")||focusKey.includes(":overview-tab:");

  if(isDetails&&isHeroFocus){
    page.scrollTop=0;
  }else{
    let nr=node.getBoundingClientRect(),pr=page.getBoundingClientRect();

    if(isDetails){
      const targetTop=pr.top+pr.height*.20;
      page.scrollTop+=nr.top-targetTop;
    }else{
      const top=pr.top+Math.min(64,pr.height*.10);
      const bottom=pr.bottom-Math.min(96,pr.height*.14);
      let dy=0;
      if(nr.top<top)dy=nr.top-top;
      else if(nr.bottom>bottom)dy=nr.bottom-bottom;
      if(Math.abs(dy)>1)page.scrollTop+=dy;
    }
  }

  // One frame later, correct any residual clipping caused by layout/image changes.
  requestAnimationFrame(()=>{
    if(!node.isConnected)return;

    const h=node.closest(".tv-row-scroll,.hub-related-row,.hub-episode-row") as HTMLElement|null;
    if(h&&!fullyVisibleWithin(node,h,12,0)){
      const nr=node.getBoundingClientRect(),hr=h.getBoundingClientRect();
      if(nr.left<hr.left+12)h.scrollLeft+=nr.left-(hr.left+12);
      else if(nr.right>hr.right-12)h.scrollLeft+=nr.right-(hr.right-12);
    }

    const p=node.closest(".tv-page") as HTMLElement|null;
    if(!p)return;
    const nr=node.getBoundingClientRect(),pr=p.getBoundingClientRect();
    if(nr.top<pr.top)p.scrollTop+=nr.top-pr.top-8;
    else if(nr.bottom>pr.bottom)p.scrollTop+=nr.bottom-pr.bottom+8;
  });
}

export function useTVFocusable(opts:{
  focusKey:string;
  route:string;
  rowId?:string;
  onPress?:()=>void;
  onFocus?:(layout?:any,details?:any)=>void;
  onBlur?:()=>void;
  onArrowPress?:(direction:string,details?:any)=>boolean|void;
  followFocus?:boolean;
}){
  const setFocusState=useNavigationStore(s=>s.setFocus);
  const [visibleFocus,setVisibleFocus]=useState(false);

  const focusable=useFocusable({
    focusKey:opts.focusKey,
    onEnterPress:()=>opts.onPress?.(),
    onArrowPress:(direction:any,_props:any,details:any)=>{
      const result=opts.onArrowPress?.(direction,details);
      return result===undefined?true:result;
    },
    onFocus:(layout:any,details:any)=>{
      setVisibleFocus(false);
      const node=(layout?.node||layout?.layout?.node||null) as HTMLElement|null;

      if(opts.followFocus!==false&&opts.rowId!=="sidebar")lockFocusedNode(node,opts.focusKey);

      // Commit the app-level focus and visible highlight after the viewport has
      // been synchronously corrected. This prevents off-screen "ghost" focus.
      requestAnimationFrame(()=>{
        const memoryRoute=opts.rowId==="sidebar"?undefined:opts.route;
        setFocusState(opts.focusKey,memoryRoute,opts.rowId);
        setVisibleFocus(true);
        opts.onFocus?.(layout,details);
      });
    },
    onBlur:()=>{
      setVisibleFocus(false);
      opts.onBlur?.();
    }
  });

  return {...focusable,focused:focusable.focused&&visibleFocus};
}
