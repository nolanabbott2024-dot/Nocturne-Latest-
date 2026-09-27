import { Play,Plus,Film } from "lucide-react";
import { motion } from "motion/react";
import { useTVFocusable } from "../focus/useTVFocusable";
function Action({id,route,label,Icon,onPress,primary=false}:any){
  const {ref,focused}=useTVFocusable({focusKey:`${route}:action:${id}`,route,rowId:"details-actions",onPress});
  return <motion.button ref={ref as any} className={"detail-action "+(primary?"primary":"")}
    animate={{scale:focused?1.055:1,y:focused?-3:0}} transition={{type:"spring",stiffness:400,damping:30}}>
    <Icon size={20}/>{label}
  </motion.button>
}
export function TVActionBar({route,onPlay,onWatchlist,onTrailer}:{route:string;onPlay:()=>void;onWatchlist:()=>void;onTrailer:()=>void}){
  return <div className="detail-actions"><Action id="play" route={route} label="Play" Icon={Play} onPress={onPlay} primary/><Action id="watchlist" route={route} label="Watchlist" Icon={Plus} onPress={onWatchlist}/><Action id="trailer" route={route} label="Trailer" Icon={Film} onPress={onTrailer}/></div>
}
