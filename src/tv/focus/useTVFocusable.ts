import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useNavigationStore } from "../../stores/navigationStore";

function followFocusedNode(node:HTMLElement|null){
  if(!node)return;
  requestAnimationFrame(()=>{
    const horizontal=node.closest(".tv-row-scroll,.hub-related-row,.hub-episode-row") as HTMLElement|null;
    if(horizontal){
      const nr=node.getBoundingClientRect(),hr=horizontal.getBoundingClientRect();
      const left=hr.left+hr.width*.16,right=hr.left+hr.width*.84;
      let dx=0;
      if(nr.left<left)dx=nr.left-left;
      else if(nr.right>right)dx=nr.right-right;
      if(Math.abs(dx)>1)horizontal.scrollBy({left:dx,behavior:"smooth"});
    }

    const page=node.closest(".tv-page") as HTMLElement|null;
    if(page){
      const nr=node.getBoundingClientRect(),pr=page.getBoundingClientRect();
      const top=pr.top+pr.height*.12,bottom=pr.top+pr.height*.78;
      let dy=0;
      if(nr.top<top)dy=nr.top-top-16;
      else if(nr.bottom>bottom)dy=nr.bottom-bottom+16;
      if(Math.abs(dy)>1)page.scrollBy({top:dy,behavior:"smooth"});
    }
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
  return useFocusable({
    focusKey:opts.focusKey,
    onEnterPress:()=>opts.onPress?.(),
    onArrowPress:(direction:any,_props:any,details:any)=>{
      const result=opts.onArrowPress?.(direction,details);
      return result===undefined?true:result;
    },
    onFocus:(layout:any,details:any)=>{
      const memoryRoute=opts.rowId==="sidebar"?undefined:opts.route;
      setFocusState(opts.focusKey,memoryRoute,opts.rowId);
      if(opts.followFocus!==false&&opts.rowId!=="sidebar"){
        followFocusedNode((layout?.node||layout?.layout?.node||null) as HTMLElement|null);
      }
      opts.onFocus?.(layout,details);
    },
    onBlur:()=>opts.onBlur?.()
  });
}
