import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation-react";
import type { MediaItem } from "../../types/tv";
import { TVTop10Card } from "./TVTop10Card";

export function TVTop10Row({id,title,items,route,onOpen}:{id:string;title:string;items:MediaItem[];route:string;onOpen:(m:MediaItem)=>void}){
  const {ref,focusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
  return <FocusContext.Provider value={focusKey}>
    <section ref={ref as any} className="tv-row ranked-row"><h2>{title}</h2>
      <div className="top10-scroll">{items.slice(0,10).map((item,i)=><TVTop10Card key={item.id} rank={i+1} item={item} route={route} rowId={id} onOpen={onOpen}/>)}</div>
    </section>
  </FocusContext.Provider>
}
