import { Pause,Play,RotateCcw,RotateCw,Subtitles,AudioLines,MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useTVFocusable } from "../focus/useTVFocusable";
function Control({id,route,Icon,onPress,primary=false}:any){
 const {ref,focused}=useTVFocusable({focusKey:`${route}:player:${id}`,route,rowId:"player-controls",onPress});
 return <motion.button ref={ref as any} className={"player-control "+(primary?"primary":"")} animate={{scale:focused?1.12:1}}><Icon/></motion.button>
}
export function PlayerControls({route,playing,onToggle,onBack10,onForward10}:any){
 return <div className="player-controls"><Control id="rewind" route={route} Icon={RotateCcw} onPress={onBack10}/><Control id="play" route={route} Icon={playing?Pause:Play} onPress={onToggle} primary/><Control id="forward" route={route} Icon={RotateCw} onPress={onForward10}/><Control id="subs" route={route} Icon={Subtitles} onPress={()=>{}}/><Control id="audio" route={route} Icon={AudioLines} onPress={()=>{}}/><Control id="more" route={route} Icon={MoreHorizontal} onPress={()=>{}}/></div>
}
