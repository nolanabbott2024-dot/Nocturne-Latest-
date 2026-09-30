import { FocusContext,doesFocusableExist,setFocus,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useCallback,useEffect,useLayoutEffect,useRef,useState } from "react";
import type { MediaItem } from "../../types/tv";
import { useNavigationStore } from "../../stores/navigationStore";
import { TVPosterCard } from "./TVPosterCard";
import { mediaFacts } from "./TVHero";
import { loadMetaEnriched } from "../../data/stremio";

export function TVRow({id,title,items,route,onOpen,onFocused,onSettled,leftExitFocusKey}:{
 id:string;title:string;items:MediaItem[];route:string;onOpen:(m:MediaItem)=>void;onFocused?:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void;leftExitFocusKey?:string
}){
 const {ref,focusKey,hasFocusedChild}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
 const scroller=useRef<HTMLDivElement|null>(null);
 const remembered=useNavigationStore.getState().rowFocusHistory[id];
 const initial=Math.max(0,items.findIndex(item=>`${route}:${id}:${item.type}:${item.id}`===remembered));
 const [selected,setSelected]=useState(initial);
 const [enriched,setEnriched]=useState<MediaItem|null>(null);
 const item=items[selected];

 const keyAt=useCallback((index:number)=>`${route}:${id}:${items[index].type}:${items[index].id}`,[route,id,items]);

 const bringIntoView=useCallback((index:number)=>{
   const s=scroller.current;
   const card=s?.querySelector<HTMLElement>(`[data-index="${index}"]`);
   if(!s||!card)return;
   const sr=s.getBoundingClientRect(),cr=card.getBoundingClientRect();
   const safeLeft=sr.left+sr.width*.18,safeRight=sr.left+sr.width*.82;
   let delta=0;
   if(cr.left<safeLeft)delta=cr.left-safeLeft;
   else if(cr.right>safeRight)delta=cr.right-safeRight;
   if(Math.abs(delta)>1)s.scrollBy({left:delta,behavior:"smooth"});
 },[]);

 const select=useCallback((media:MediaItem,index:number)=>{
   setSelected(index);
   bringIntoView(index);
   onFocused?.(media);
 },[bringIntoView,onFocused]);

 useLayoutEffect(()=>{
   if(!hasFocusedChild)return;
   bringIntoView(selected);
   const section=ref.current as HTMLElement|null;
   const page=section?.closest(".tv-page") as HTMLElement|null;
   if(!section||!page)return;
   const sr=section.getBoundingClientRect(),pr=page.getBoundingClientRect();
   const safeTop=pr.top+pr.height*.12,safeBottom=pr.top+pr.height*.72;
   let delta=0;
   if(sr.top<safeTop)delta=sr.top-safeTop;
   else if(sr.bottom>safeBottom)delta=sr.bottom-safeBottom;
   if(Math.abs(delta)>1)page.scrollBy({top:delta,behavior:"smooth"});
 },[hasFocusedChild,selected,bringIntoView]);

 useEffect(()=>{
   if(!hasFocusedChild||!item)return;
   const controller=new AbortController();
   const timer=window.setTimeout(()=>loadMetaEnriched(item,controller.signal).then(full=>{
     if(!controller.signal.aborted)setEnriched(full);
   }).catch(()=>{}),300);
   return()=>{window.clearTimeout(timer);controller.abort()};
 },[hasFocusedChild,item?.id]);

 const display=enriched?.id===item?.id?enriched:item;

 return <FocusContext.Provider value={focusKey}>
  <section ref={ref as any} className={`tv-row reference-row ${hasFocusedChild?"row-selected":""}`} data-row={id}>
   <h2>{title}</h2>
   <div className="tv-row-scroll stable-rail" ref={scroller}>
    <div className="tv-row-inner stable-rail-inner">
     {items.map((media,index)=>{
       const expanded=hasFocusedChild&&index===selected;
       return <div className={`tv-row-slot stable-slot ${expanded?"slot-selected":""}`} key={keyAt(index)} data-index={index}>
        <TVPosterCard item={media} route={route} rowId={id} onOpen={onOpen}
         onFocused={()=>select(media,index)} onSettled={onSettled} expanded={expanded}
         onArrowPress={direction=>{
           if(direction==="up"&&!(ref.current as HTMLElement)?.previousElementSibling&&route!=="search"){
             const nav=`sidebar:${route}`;
             void setFocus(document.querySelector(".modern-billboard")?`${route}:hero:play`:doesFocusableExist(nav)?nav:"sidebar:profile");
             return false;
           }
           if(direction==="left"&&index===0){
             void setFocus(doesFocusableExist(leftExitFocusKey||`sidebar:${route}`)?(leftExitFocusKey||`sidebar:${route}`):"sidebar:profile");
             return false;
           }
           if(direction==="right"&&index<items.length-1){
             void setFocus(keyAt(index+1));return false;
           }
           if(direction==="left"&&index>0){
             void setFocus(keyAt(index-1));return false;
           }
           return true;
         }}/>
       </div>
     })}
    </div>
   </div>
   {hasFocusedChild&&display&&<div className="row-description" aria-live="polite">
    <div className="row-facts">{mediaFacts(display).map((fact,i)=><span key={i}>{fact}</span>)}</div>
    <p>{display.description||display.name}</p>
   </div>}
  </section>
 </FocusContext.Provider>;
}
