import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useNavigationStore } from "../../stores/navigationStore";

export function useTVFocusable(opts:{
  focusKey:string;
  route:string;
  rowId?:string;
  onPress?:()=>void;
  onFocus?:()=>void;
  onBlur?:()=>void;
}){
  const setFocusState=useNavigationStore(s=>s.setFocus);
  return useFocusable({
    focusKey:opts.focusKey,
    onEnterPress:()=>opts.onPress?.(),
    onFocus:()=>{
      setFocusState(opts.focusKey,opts.route,opts.rowId);
      opts.onFocus?.();
    },
    onBlur:()=>opts.onBlur?.()
  });
}
