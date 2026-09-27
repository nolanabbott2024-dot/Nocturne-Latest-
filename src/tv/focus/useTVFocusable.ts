import { useFocusable } from "@noriginmedia/norigin-spatial-navigation-react";
import { useNavigationStore } from "../../stores/navigationStore";

export function useTVFocusable(opts:{
  focusKey:string;
  route:string;
  rowId?:string;
  onPress?:()=>void;
  onFocus?:(layout?:any,details?:any)=>void;
  onBlur?:()=>void;
}){
  const setFocusState=useNavigationStore(s=>s.setFocus);
  return useFocusable({
    focusKey:opts.focusKey,
    onEnterPress:()=>opts.onPress?.(),
    onFocus:(layout:any,details:any)=>{
      setFocusState(opts.focusKey,opts.route,opts.rowId);
      opts.onFocus?.(layout,details);
    },
    onBlur:()=>opts.onBlur?.()
  });
}
