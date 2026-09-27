import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation-react";
import type { PropsWithChildren } from "react";
export function FocusBoundary({id,children,preferredChildFocusKey,trap=false}:{
  id:string;preferredChildFocusKey?:string;trap?:boolean
}&PropsWithChildren){
 const {ref,focusKey}=useFocusable({
   focusKey:id,trackChildren:true,saveLastFocusedChild:true,preferredChildFocusKey,
   isFocusBoundary:trap,
   focusBoundaryDirections:trap?["left","right","up","down"]:undefined
 });
 return <FocusContext.Provider value={focusKey}><div ref={ref as any} className="focus-boundary">{children}</div></FocusContext.Provider>
}
