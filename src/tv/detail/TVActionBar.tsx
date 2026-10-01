import { Film,ListVideo,Play,Plus,Check } from "lucide-react";
import { motion } from "motion/react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { useTVFocusable } from "../focus/useTVFocusable";

function Action({id,route,label,Icon,onPress,onDown,primary=false}:any){
  const {ref,focused,focusSelf}=useTVFocusable({
    focusKey:`${route}:action:${id}`,route,rowId:"details-actions",onPress,
    onArrowPress:(direction)=>{
      if(direction==="down"&&onDown){requestAnimationFrame(()=>void setFocus(onDown));return false}
      return true;
    }
  });
  return <motion.button ref={ref as any} className={`detail-action ${primary?"primary":""} ${focused?"is-focused":""}`}
    aria-label={label} onMouseEnter={()=>focusSelf()} onClick={onPress}
    animate={{scale:focused?1.06:1,y:focused?-3:0}}
    transition={{type:"spring",stiffness:430,damping:31}}>
    <Icon fill={primary?"currentColor":"none"}/><span>{label}</span>
  </motion.button>
}
export function TVActionBar({route,onPlay,onWatchlist,onTrailer,onSources,watchlisted=false,hasTrailer=true,episodeFocusKey}:{
  route:string;onPlay:()=>void;onWatchlist:()=>void;onTrailer:()=>void;onSources:()=>void;
  watchlisted?:boolean;hasTrailer?:boolean;episodeFocusKey?:string;
}){
  return <div className="detail-actions">
    <Action id="play" route={route} label="Play" Icon={Play} primary onPress={onPlay} onDown={episodeFocusKey}/>
    <Action id="watchlist" route={route} label={watchlisted?"My List":"My List"} Icon={watchlisted?Check:Plus} onPress={onWatchlist} onDown={episodeFocusKey}/>
    <Action id="sources" route={route} label="Sources" Icon={ListVideo} onPress={onSources} onDown={episodeFocusKey}/>
    {hasTrailer&&<Action id="trailer" route={route} label="Trailer" Icon={Film} onPress={onTrailer} onDown={episodeFocusKey}/>}
  </div>
}
