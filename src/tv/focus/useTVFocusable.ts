import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useNavigationStore } from "../../stores/navigationStore";

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
      const memoryRoute=opts.rowId==="sidebar"?undefined:opts.route;
      setFocusState(opts.focusKey,memoryRoute,opts.rowId);
      opts.onFocus?.(layout,details);
    },
    onBlur:()=>opts.onBlur?.()
  });
}
