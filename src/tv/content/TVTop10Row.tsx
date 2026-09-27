import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation-react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation-core";
import type { MediaItem } from "../../types/tv";
import { TVTop10Card } from "./TVTop10Card";

export function TVTop10Row({id,title,items,route,onOpen,onSettled}:{
  id:string;title:string;items:MediaItem[];route:string;onOpen:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void
}){
  const {ref,focusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
  return <FocusContext.Provider value={focusKey}>
    <section ref={ref as any} className="tv-row ranked-row"><h2>{title}</h2>
      <div className="top10-scroll">{items.slice(0,10).map((item,i)=><TVTop10Card key={item.id} rank={i+1} item={item} route={route} rowId={id} onOpen={onOpen} onSettled={onSettled} onArrowPress={(direction)=>{if(direction==="left"&&i===0){void setFocus(`sidebar:${route}`);return false}return true}}/>)}</div>
    </section>
  </FocusContext.Provider>
}
