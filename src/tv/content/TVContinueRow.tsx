import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import type { LibraryEntry } from "../../data/library";
import { TVContinueCard } from "./TVContinueCard";

export function TVContinueRow({entries,route,onResume}:{entries:LibraryEntry[];route:string;onResume:(e:LibraryEntry)=>void}){
 if(!entries.length)return null;
 const id="continue-watching";
 const {ref,focusKey}=useFocusable({focusKey:`row:${route}:${id}`,trackChildren:true,saveLastFocusedChild:true});
 return <FocusContext.Provider value={focusKey}><section ref={ref as any} className="tv-row"><h2>Continue Watching</h2>
  <div className="continue-scroll">{entries.map(e=><TVContinueCard key={e.item.id} item={e.item} route={route} rowId={id} progress={e.progress} onResume={()=>onResume(e)}/>)}</div>
 </section></FocusContext.Provider>
}
