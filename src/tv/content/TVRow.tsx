import { FocusContext,setFocus,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback,useRef } from "react";
import type { MediaItem } from "../../types/tv";
import { TVPosterCard } from "./TVPosterCard";

const SAFE_LEFT=.20,SAFE_RIGHT=.80;
function focusKey(route:string,rowId:string,item:MediaItem){return `${route}:${rowId}:${item.type}:${item.id}`}
function keepVerticallyComfortable(el:HTMLElement){
  const page=el.closest(".tv-page") as HTMLElement|null;if(!page)return;
  const r=el.getBoundingClientRect(),p=page.getBoundingClientRect();
  const top=p.top+p.height*.18,bottom=p.top+p.height*.82;
  if(r.top<top)page.scrollBy({top:r.top-top-24,behavior:"smooth"});
  else if(r.bottom>bottom)page.scrollBy({top:r.bottom-bottom+24,behavior:"smooth"});
}

export function TVRow({id,title,items,route,onOpen,onSettled,leftExitFocusKey}:{
  id:string;title:string;items:MediaItem[];route:string;
  onOpen:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void;leftExitFocusKey?:string
}){
  const {ref,focusKey:rowFocusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
  const scroller=useRef<HTMLDivElement|null>(null);
  const virtual=useVirtualizer({
    horizontal:true,count:items.length,getScrollElement:()=>scroller.current,
    estimateSize:()=>190,overscan:7
  });

  const moveHorizontal=useCallback((index:number,direction:string)=>{
    if(direction!=="left"&&direction!=="right")return true;
    if(direction==="left"&&index===0){
      requestAnimationFrame(()=>void setFocus(leftExitFocusKey||`sidebar:${route}`));
      return false;
    }
    const target=index+(direction==="right"?1:-1);
    if(target<0||target>=items.length)return false;
    virtual.scrollToIndex(target,{align:"auto"});
    const key=focusKey(route,id,items[target]);
    let tries=0;
    const focusWhenMounted=()=>{
      void setFocus(key);
      if(tries++<4)requestAnimationFrame(focusWhenMounted);
    };
    requestAnimationFrame(focusWhenMounted);
    return false;
  },[items,route,id,leftExitFocusKey,virtual]);

  const onSpatialFocus=useCallback((layout:any)=>{
    const s=scroller.current;if(!s)return;
    const el=(layout?.node||layout?.layout?.node) as HTMLElement|undefined;
    if(!el)return;
    const r=el.getBoundingClientRect(),sr=s.getBoundingClientRect();
    const center=r.left+r.width/2;
    const left=sr.left+sr.width*SAFE_LEFT,right=sr.left+sr.width*SAFE_RIGHT;
    if(center<left||center>right){
      s.scrollBy({left:center-(sr.left+sr.width*.5),behavior:"smooth"});
    }
    keepVerticallyComfortable(el);
  },[]);

  return <FocusContext.Provider value={rowFocusKey}>
    <section ref={ref as any} className="tv-row" data-row={id}>
      <h2>{title}</h2>
      <div className="tv-row-scroll" ref={scroller}>
        <div className="tv-row-inner" style={{width:virtual.getTotalSize(),height:320,position:"relative"}}>
          {virtual.getVirtualItems().map(v=><div key={items[v.index].id} style={{position:"absolute",left:v.start,top:0,width:v.size,paddingRight:18}}>
            <TVPosterCard item={items[v.index]} route={route} rowId={id} onOpen={onOpen} onSettled={onSettled}
              onSpatialFocus={onSpatialFocus}
              onArrowPress={(direction)=>moveHorizontal(v.index,direction)}/>
          </div>)}
        </div>
      </div>
    </section>
  </FocusContext.Provider>
}
