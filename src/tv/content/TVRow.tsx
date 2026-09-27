import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback,useRef } from "react";
import type { MediaItem } from "../../types/tv";
import { TVPosterCard } from "./TVPosterCard";

export function TVRow({id,title,items,route,onOpen,onSettled}:{
  id:string;title:string;items:MediaItem[];route:string;
  onOpen:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void
}){
  const {ref,focusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
  const scroller=useRef<HTMLDivElement|null>(null);
  const virtual=useVirtualizer({
    horizontal:true,count:items.length,getScrollElement:()=>scroller.current,
    estimateSize:()=>190,overscan:7
  });

  const keepInSafeZone=useCallback((layout:any)=>{
    const s=scroller.current;if(!s||!layout)return;
    const sr=s.getBoundingClientRect();
    const left=sr.left+sr.width*.20;
    const right=sr.left+sr.width*.80;
    const cardLeft=layout.left ?? layout.x ?? 0;
    const width=layout.width ?? 180;
    const center=cardLeft+width/2;
    if(center<left){
      s.scrollBy({left:center-left,behavior:"smooth"});
    }else if(center>right){
      s.scrollBy({left:center-right,behavior:"smooth"});
    }
  },[]);

  return <FocusContext.Provider value={focusKey}>
    <section ref={ref as any} className="tv-row" data-row={id}>
      <h2>{title}</h2>
      <div className="tv-row-scroll" ref={scroller}>
        <div className="tv-row-inner" style={{width:virtual.getTotalSize(),height:320,position:"relative"}}>
          {virtual.getVirtualItems().map(v=><div key={items[v.index].id} style={{position:"absolute",left:v.start,top:0,width:v.size,paddingRight:18}}>
            <TVPosterCard item={items[v.index]} route={route} rowId={id} onOpen={onOpen}
              onSettled={onSettled} onSpatialFocus={keepInSafeZone}/>
          </div>)}
        </div>
      </div>
    </section>
  </FocusContext.Provider>
}
