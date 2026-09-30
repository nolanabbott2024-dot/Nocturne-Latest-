import { FocusContext,doesFocusableExist,setFocus,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback,useEffect,useLayoutEffect,useRef,useState } from "react";
import type { MediaItem } from "../../types/tv";
import { useNavigationStore } from "../../stores/navigationStore";
import { TVPosterCard } from "./TVPosterCard";
import { mediaFacts } from "./TVHero";
import { loadMetaEnriched } from "../../data/stremio";
import { useHorizontalRail } from "../navigation/useHorizontalRail";

export function TVRow({id,title,items,route,onOpen,onFocused,onSettled,leftExitFocusKey}:{
 id:string;title:string;items:MediaItem[];route:string;onOpen:(m:MediaItem)=>void;onFocused?:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void;leftExitFocusKey?:string
}){
 const {ref,focusKey,hasFocusedChild}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
 const scroller=useRef<HTMLDivElement|null>(null);
 const [selected,setSelected]=useState(()=>{const remembered=useNavigationStore.getState().rowFocusHistory[id];return Math.max(0,items.findIndex(item=>`${route}:${id}:${item.type}:${item.id}`===remembered))});
 const [enriched,setEnriched]=useState<MediaItem|null>(null);
 const [unit,setUnit]=useState(()=>window.innerWidth/1920);
 useEffect(()=>{const resize=()=>setUnit(window.innerWidth/1920);window.addEventListener("resize",resize);return()=>window.removeEventListener("resize",resize)},[]);
 const wide=784*unit,narrow=270*unit,gap=18*unit,height=438*unit;
 const virtual=useVirtualizer({horizontal:true,count:items.length,getScrollElement:()=>scroller.current,
  initialOffset:selected*narrow,estimateSize:index=>(hasFocusedChild&&index===selected?wide:narrow)+gap,overscan:3});
 const keyAt=useCallback((index:number)=>`${route}:${id}:${items[index].type}:${items[index].id}`,[route,id,items]);
 const ensureIndexVisible=useCallback((index:number)=>virtual.scrollToIndex(index,{align:"start",behavior:"smooth"}),[virtual]);
 const rail=useHorizontalRail({scroller,count:items.length,keyAt,leftExitFocusKey:leftExitFocusKey||`sidebar:${route}`,ensureIndexVisible});
 const select=useCallback((item:MediaItem)=>{const index=items.findIndex(x=>x.id===item.id&&x.type===item.type);setSelected(index);onFocused?.(item)},[items,onFocused]);
 useLayoutEffect(()=>{
  virtual.measure();
  if(!hasFocusedChild)return;
  virtual.scrollToIndex(selected,{align:"start",behavior:"smooth"});
  const section=ref.current as HTMLElement|null;
  const page=section?.closest(".tv-page") as HTMLElement|null;
  if(section&&page){
   const desired=section.getBoundingClientRect().top-page.getBoundingClientRect().top+page.scrollTop-8*unit;
   page.scrollTo({top:desired,behavior:"smooth"});
  }
 },[hasFocusedChild,selected,unit,items.length]);
 const item=items[selected];
 useEffect(()=>{
  if(!hasFocusedChild||!item)return;
  const controller=new AbortController();
  const timer=window.setTimeout(()=>loadMetaEnriched(item,controller.signal).then(full=>{if(!controller.signal.aborted)setEnriched(full)}).catch(()=>{}),350);
  return()=>{window.clearTimeout(timer);controller.abort()};
 },[hasFocusedChild,item?.id]);
 const display=enriched?.id===item?.id?enriched:item;
 return <FocusContext.Provider value={focusKey}>
  <section ref={ref as any} className={`tv-row reference-row ${hasFocusedChild?"row-selected":""}`} data-row={id}>
   <h2>{title}</h2>
   <div className="tv-row-scroll" ref={scroller}>
    <div className="tv-row-inner" style={{width:virtual.getTotalSize(),height,position:"relative"}}>
     {virtual.getVirtualItems().map(v=><div className="tv-row-slot" key={keyAt(v.index)} style={{position:"absolute",left:v.start,top:0,width:v.size-gap,height}}>
      <TVPosterCard item={enriched?.id===items[v.index].id?enriched:items[v.index]} route={route} rowId={id} onOpen={onOpen} onFocused={select} onSettled={onSettled} expanded={hasFocusedChild&&v.index===selected}
       onArrowPress={direction=>{
        if(direction==="up"&&!(ref.current as HTMLElement)?.previousElementSibling&&route!=="search"){
         const hero=document.querySelector(".modern-billboard");const nav=`sidebar:${route}`;void setFocus(hero?`${route}:hero:play`:doesFocusableExist(nav)?nav:"sidebar:profile");return false;
        }
        return rail.onArrow(v.index,direction);
       }}/>
     </div>)}
    </div>
   </div>
   {hasFocusedChild&&display&&<div className="row-description" aria-live="polite">
    <div className="row-facts">{mediaFacts(display).map((fact,i)=><span key={i}>{fact}</span>)}</div>
    <p>{display.description||display.name}</p>
   </div>}
  </section>
 </FocusContext.Provider>
}
