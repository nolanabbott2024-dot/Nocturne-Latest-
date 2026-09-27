import { Play,Plus,Film,ListVideo } from "lucide-react";
import { motion } from "motion/react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useTVFocusable } from "../focus/useTVFocusable";

function Action({id,route,label,Icon,onPress,onDown}:any){
  const {ref,focused}=useTVFocusable({
    focusKey:`${route}:action:${id}`,route,rowId:"details-actions",onPress,
    onArrowPress:(direction)=>{
      if(direction==="down"&&onDown){requestAnimationFrame(()=>void setFocus(onDown));return false}
      return true;
    }
  });
  return <motion.button ref={ref as any} className={"detail-action "+(focused?"is-focused":"")}
    animate={{
      scale:focused?1.055:1,
      y:focused?-3:0,
      backgroundColor:focused?"#ffffff":"rgba(255,255,255,.16)",
      color:focused?"#08080a":"#ffffff"
    }} transition={{type:"spring",stiffness:400,damping:30}}>
    <Icon size={20}/>{label}
  </motion.button>
}
export function TVActionBar({route,onPlay,onWatchlist,onTrailer,onSources,watchlisted=false,hasTrailer=true,episodeFocusKey}:{
  route:string;onPlay:()=>void;onWatchlist:()=>void;onTrailer:()=>void;onSources:()=>void;
  watchlisted?:boolean;hasTrailer?:boolean;episodeFocusKey?:string;
}){
  return <div className="detail-actions">
    <Action id="play" route={route} label="Play" Icon={Play} onPress={onPlay} onDown={episodeFocusKey}/>
    <Action id="watchlist" route={route} label={watchlisted?"In Watchlist":"Watchlist"} Icon={Plus} onPress={onWatchlist} onDown={episodeFocusKey}/>
    <Action id="sources" route={route} label="Sources" Icon={ListVideo} onPress={onSources} onDown={episodeFocusKey}/>
    {hasTrailer&&<Action id="trailer" route={route} label="Trailer" Icon={Film} onPress={onTrailer} onDown={episodeFocusKey}/>}
  </div>
}
