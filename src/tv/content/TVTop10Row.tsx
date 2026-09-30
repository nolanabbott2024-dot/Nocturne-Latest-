import { FocusContext,setFocus,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useCallback,useRef } from "react";
import type { MediaItem } from "../../types/tv";
import { TVTop10Card } from "./TVTop10Card";

export function TVTop10Row({id,title,items,route,onOpen,onFocused,onSettled}:{
  id:string;title:string;items:MediaItem[];route:string;onOpen:(m:MediaItem)=>void;onFocused?:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void
}){
  const top=items.slice(0,10);
  const {ref,focusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
  const scroller=useRef<HTMLDivElement|null>(null);
  const keyAt=useCallback((index:number)=>`${route}:${id}:${top[index].type}:${top[index].id}`,[route,id,top]);

  const reveal=useCallback((index:number)=>{
    const s=scroller.current;
    const card=s?.querySelector<HTMLElement>(`[data-top10-index="${index}"]`);
    if(!s||!card)return;

    const target=card.offsetLeft-(s.clientWidth-card.offsetWidth)/2;
    const max=Math.max(0,s.scrollWidth-s.clientWidth);
    s.scrollLeft=Math.max(0,Math.min(max,target));

    // Only correct vertical position when entering the row, never during sideways travel.
    const page=s.closest(".tv-page") as HTMLElement|null;
    if(page){
      const rr=s.getBoundingClientRect(),pr=page.getBoundingClientRect();
      const safeTop=pr.top+pr.height*.14;
      const safeBottom=pr.bottom-pr.height*.12;
      if(rr.top<safeTop)page.scrollTop+=rr.top-safeTop;
      else if(rr.bottom>safeBottom)page.scrollTop+=rr.bottom-safeBottom;
    }
  },[]);

  const focusIndex=useCallback((index:number)=>{
    if(index<0||index>=top.length)return false;
    reveal(index);
    void setFocus(keyAt(index));
    return false;
  },[top.length,keyAt,reveal]);

  return <FocusContext.Provider value={focusKey}>
    <section ref={ref as any} className="tv-row ranked-row"><h2>{title}</h2>
      <div className="top10-scroll" ref={scroller}>
        {top.map((item,i)=><div key={item.id} className="top10-nav-slot" data-top10-index={i}>
          <TVTop10Card rank={i+1} item={item} route={route} rowId={id}
            onOpen={onOpen}
            onFocused={media=>{reveal(i);onFocused?.(media)}}
            onSettled={onSettled}
            followFocus={false}
            onArrowPress={direction=>{
              if(direction==="right")return focusIndex(i+1);
              if(direction==="left"){
                if(i===0){void setFocus(`sidebar:${route}`);return false}
                return focusIndex(i-1);
              }
              return true;
            }}/>
        </div>)}
      </div>
    </section>
  </FocusContext.Provider>;
}
