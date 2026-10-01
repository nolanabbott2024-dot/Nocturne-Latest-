import { useRef,useState } from "react";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useNavigationStore } from "../../stores/navigationStore";

function centerFocusedNode(node:HTMLElement|null,focusKey:string){
  if(!node)return 0;
  let moved=false;

  const horizontal=node.closest(".tv-row-scroll,.top10-scroll,.continue-scroll,.hub-related-row,.hub-episode-row") as HTMLElement|null;
  if(horizontal){
    const nr=node.getBoundingClientRect(),hr=horizontal.getBoundingClientRect();
    const delta=(nr.left+nr.width/2)-(hr.left+hr.width/2);
    if(Math.abs(delta)>6){
      horizontal.scrollTo({left:horizontal.scrollLeft+delta,behavior:"smooth"});
      moved=true;
    }
  }

  const page=node.closest(".tv-page") as HTMLElement|null;
  if(page&&!node.closest(".title-hub")){
    const isDetails=page.className.includes("details:");
    const isHero=focusKey.includes(":action:")||focusKey.includes(":overview-tab:");
    if(isDetails&&isHero){
      if(page.scrollTop!==0){page.scrollTo({top:0,behavior:"smooth"});moved=true}
    }else{
      const row=node.closest(".tv-row") as HTMLElement|null;
      const target=row||node;
      const rr=target.getBoundingClientRect(),pr=page.getBoundingClientRect();
      const delta=(rr.top+rr.height/2)-(pr.top+pr.height/2);
      if(Math.abs(delta)>16){
        page.scrollTo({top:Math.max(0,page.scrollTop+delta),behavior:"smooth"});
        moved=true;
      }
    }
  }
  return moved?140:0;
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
  const token=useRef(0);

  const focusable=useFocusable({
    focusKey:opts.focusKey,
    onEnterPress:()=>opts.onPress?.(),
    onArrowPress:(direction:any,_props:any,details:any)=>{
      const result=opts.onArrowPress?.(direction,details);
      return result===undefined?true:result;
    },
    onFocus:(layout:any,details:any)=>{
      const my=++token.current;
      setVisibleFocus(false);
      const node=(layout?.node||layout?.layout?.node||null) as HTMLElement|null;
      const delay=opts.followFocus!==false&&opts.rowId!=="sidebar"?centerFocusedNode(node,opts.focusKey):0;
      const commit=()=>{
        if(my!==token.current)return;
        const memoryRoute=opts.rowId==="sidebar"?undefined:opts.route;
        setFocusState(opts.focusKey,memoryRoute,opts.rowId);
        setVisibleFocus(true);
        opts.onFocus?.(layout,details);
      };
      delay?window.setTimeout(commit,delay):requestAnimationFrame(commit);
    },
    onBlur:()=>{
      token.current++;
      setVisibleFocus(false);
      opts.onBlur?.();
    }
  });

  return {...focusable,focused:focusable.focused&&visibleFocus};
}
