import type { MediaItem } from "../../types/tv";
import { TVPosterCard } from "./TVPosterCard";
export function TVTop10Card({rank,...props}:{
  rank:number;item:MediaItem;route:string;rowId:string;onOpen:(m:MediaItem)=>void;onFocused?:(m:MediaItem)=>void;onSettled?:(m:MediaItem)=>void;onArrowPress?:(direction:string)=>boolean|void;onSpatialFocus?:(layout:any)=>void
}){
  return <div className="top10-card"><span className="top10-rank">{rank}</span><TVPosterCard {...props}/></div>
}
