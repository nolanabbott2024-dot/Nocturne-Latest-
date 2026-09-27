import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useNavigationStore } from "../../stores/navigationStore";

function keepVerticalFocusVisible(layout:any){
  if(!layout)return;
  const page=document.querySelector<HTMLElement>(".tv-page");
  if(!page)return;
  const pr=page.getBoundingClientRect();
  const top=layout.top ?? layout.y;
  const height=layout.height ?? 50;
  if(typeof top!=="number")return;
  const center=top+height/2;
  const safeTop=pr.top+pr.height*.18;
  const safeBottom=pr.top+pr.height*.78;
  if(center<safeTop)page.scrollBy({top:center-safeTop,behavior:"smooth"});
  else if(center>safeBottom)page.scrollBy({top:center-safeBottom,behavior:"smooth"});
}

export function useTVFocusable(opts:{
  focusKey:string;
  route:string;
  rowId?:string;
  onPress?:()=>void;
  onFocus?:(layout?:any,details?:any)=>void;
  onBlur?:()=>void;
  onArrowPress?:(direction:string,details?:any)=>boolean|void;
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
      // Sidebar focus belongs to the global navigation group, not to the page's
      // content restoration slot. Otherwise entering a destination restores
      // "sidebar:<route>" instead of the page's logical content target.
      const memoryRoute=opts.rowId==="sidebar"?undefined:opts.route;
      setFocusState(opts.focusKey,memoryRoute,opts.rowId);
      keepVerticalFocusVisible(layout);
      opts.onFocus?.(layout,details);
    },
    onBlur:()=>opts.onBlur?.()
  });
}
