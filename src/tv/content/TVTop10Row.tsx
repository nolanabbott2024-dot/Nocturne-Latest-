import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useCallback,useRef } from "react";
import type { MediaItem } from "../../types/tv";
import { TVTop10Card } from "./TVTop10Card";
import { useHorizontalRail } from "../navigation/useHorizontalRail";

export function TVTop10Row({id,title,items,route,onOpen,onFocused,onSettled}:{
  id:string;title:string;items:MediaItem[];route:string;onOpen:(m:MediaItem)=>void;onFocused?:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void
}){
  const top=items.slice(0,10);
  const {ref,focusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
  const scroller=useRef<HTMLDivElement|null>(null);
  const keyAt=useCallback((index:number)=>`${route}:${id}:${top[index].type}:${top[index].id}`,[route,id,top]);
  const rail=useHorizontalRail({scroller,count:top.length,keyAt,leftExitFocusKey:`sidebar:${route}`});
  return <FocusContext.Provider value={focusKey}>
    <section ref={ref as any} className="tv-row ranked-row"><h2>{title}</h2>
      <div className="top10-scroll" ref={scroller}>{top.map((item,i)=><TVTop10Card key={item.id} rank={i+1} item={item} route={route} rowId={id}
        onOpen={onOpen} onFocused={onFocused} onSettled={onSettled} onSpatialFocus={rail.onFocus} onArrowPress={direction=>rail.onArrow(i,direction)}/>)}</div>
    </section>
  </FocusContext.Provider>
}
