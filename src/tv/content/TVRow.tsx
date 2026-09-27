import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback,useRef } from "react";
import type { MediaItem } from "../../types/tv";
import { TVPosterCard } from "./TVPosterCard";

const SAFE_LEFT=.20,SAFE_RIGHT=.80;
function keepVerticallyComfortable(el:HTMLElement){
  const page=el.closest(".tv-page") as HTMLElement|null;if(!page)return;
  const r=el.getBoundingClientRect(),p=page.getBoundingClientRect();
  const top=p.top+p.height*.18,bottom=p.top+p.height*.82;
  if(r.top<top)page.scrollBy({top:r.top-top-24,behavior:"smooth"});
  else if(r.bottom>bottom)page.scrollBy({top:r.bottom-bottom+24,behavior:"smooth"});
}
export function TVRow({id,title,items,route,onOpen,onSettled,leftExitFocusKey}:{id:string;title:string;items:MediaItem[];route:string;onOpen:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void;leftExitFocusKey?:string}){
  const {ref,focusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
  const scroller=useRef<HTMLDivElement|null>(null);
  const virtual=useVirtualizer({horizontal:true,count:items.length,getScrollElement:()=>scroller.current,estimateSize:()=>190,overscan:8});
  const onSpatialFocus=useCallback((layout:any,index:number)=>{
    const s=scroller.current;if(!s)return;
    const el=(layout?.node||layout?.layout?.node) as HTMLElement|undefined;
    if(el){
      const r=el.getBoundingClientRect(),sr=s.getBoundingClientRect();
      const center=r.left+r.width/2;
      const left=sr.left+sr.width*SAFE_LEFT,right=sr.left+sr.width*SAFE_RIGHT;
      if(center<left||center>right){
        const desired=sr.left+sr.width*.5;
        s.scrollBy({left:center-desired,behavior:"smooth"});
      }
      keepVerticallyComfortable(el);
    }else if(typeof layout?.x==="number"){
      const center=layout.x+(layout.width||190)/2;
      const left=s.scrollLeft+s.clientWidth*SAFE_LEFT,right=s.scrollLeft+s.clientWidth*SAFE_RIGHT;
      if(center<left||center>right)s.scrollTo({left:Math.max(0,center-s.clientWidth*.5),behavior:"smooth"});
    }
    // Keep only the current neighborhood hot; overscan handles adjacent cards.
    virtual.scrollToIndex(index,{align:"auto"});
  },[virtual]);
  return <FocusContext.Provider value={focusKey}>
    <section ref={ref as any} className="tv-row" data-row={id}>
      <h2>{title}</h2>
      <div className="tv-row-scroll" ref={scroller}>
        <div className="tv-row-inner" style={{width:virtual.getTotalSize(),height:320,position:"relative"}}>
          {virtual.getVirtualItems().map(v=><div key={items[v.index].id} style={{position:"absolute",left:v.start,top:0,width:v.size,paddingRight:18}}>
            <TVPosterCard item={items[v.index]} route={route} rowId={id} onOpen={onOpen} onSettled={onSettled} onSpatialFocus={(layout)=>onSpatialFocus(layout,v.index)}
              onArrowPress={(direction)=>{if(direction==="left"&&v.index===0){void setFocus(leftExitFocusKey||`sidebar:${route}`);return false}return true}}/>
          </div>)}
        </div>
      </div>
    </section>
  </FocusContext.Provider>
}
