import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useCallback,useRef } from "react";
import type { LibraryEntry } from "../../data/library";
import { TVContinueCard } from "./TVContinueCard";
import { useHorizontalRail } from "../navigation/useHorizontalRail";

export function TVContinueRow({entries,route,onResume}:{entries:LibraryEntry[];route:string;onResume:(e:LibraryEntry)=>void}){
 if(!entries.length)return null;
 const id="continue-watching";
 const {ref,focusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
 const scroller=useRef<HTMLDivElement|null>(null);
 const keyAt=useCallback((index:number)=>`${route}:${id}:${entries[index].item.id}`,[route,entries]);
 const rail=useHorizontalRail({scroller,count:entries.length,keyAt,leftExitFocusKey:`sidebar:${route}`});
 return <FocusContext.Provider value={focusKey}><section ref={ref as any} className="tv-row"><h2>Continue Watching</h2>
  <div className="continue-scroll" ref={scroller}>{entries.map((e,i)=><TVContinueCard key={e.item.id} item={e.item} route={route} rowId={id} progress={e.progress}
    onResume={()=>onResume(e)} onArrowPress={direction=>rail.onArrow(i,direction)}/>)}</div>
 </section></FocusContext.Provider>
}
