import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback,useRef } from "react";
import type { MediaItem } from "../../types/tv";
import { TVPosterCard } from "./TVPosterCard";
import { useHorizontalRail } from "../navigation/useHorizontalRail";

function focusKey(route:string,rowId:string,item:MediaItem){return `${route}:${rowId}:${item.type}:${item.id}`}

export function TVRow({id,title,items,route,onOpen,onFocused,onSettled,leftExitFocusKey}:{
  id:string;title:string;items:MediaItem[];route:string;
  onOpen:(m:MediaItem)=>void;onFocused?:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void;leftExitFocusKey?:string
}){
  const {ref,focusKey:rowFocusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
  const scroller=useRef<HTMLDivElement|null>(null);
  const virtual=useVirtualizer({
    horizontal:true,count:items.length,getScrollElement:()=>scroller.current,
    estimateSize:()=>316,overscan:5
  });
  const keyAt=useCallback((index:number)=>focusKey(route,id,items[index]),[route,id,items]);
  const ensureIndexVisible=useCallback((index:number)=>virtual.scrollToIndex(index,{align:"auto"}),[virtual]);
  const rail=useHorizontalRail({
    scroller,count:items.length,keyAt,
    leftExitFocusKey:leftExitFocusKey||`sidebar:${route}`,
    ensureIndexVisible
  });

  return <FocusContext.Provider value={rowFocusKey}>
    <section ref={ref as any} className="tv-row" data-row={id}>
      <h2>{title}</h2>
      <div className="tv-row-scroll" ref={scroller}>
        <div className="tv-row-inner" style={{width:virtual.getTotalSize(),height:232,position:"relative"}}>
          {virtual.getVirtualItems().map(v=><div key={items[v.index].id} style={{position:"absolute",left:v.start,top:0,width:v.size,paddingRight:16}}>
            <TVPosterCard item={items[v.index]} route={route} rowId={id} onOpen={onOpen} onFocused={onFocused} onSettled={onSettled}
              onSpatialFocus={rail.onFocus}
              onArrowPress={(direction)=>rail.onArrow(v.index,direction)}/>
          </div>)}
        </div>
      </div>
    </section>
  </FocusContext.Provider>
}
