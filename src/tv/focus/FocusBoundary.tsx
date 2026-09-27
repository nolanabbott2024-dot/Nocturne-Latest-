import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import type { PropsWithChildren } from "react";
export function FocusBoundary({id,children,preferredChildFocusKey}:{id:string;preferredChildFocusKey?:string}&PropsWithChildren){
 const {ref,focusKey}=useFocusable({focusKey:id,trackChildren:true,saveLastFocusedChild:true,preferredChildFocusKey});
 return <FocusContext.Provider value={focusKey}><div ref={ref as any} className="focus-boundary">{children}</div></FocusContext.Provider>
}
