import type { Episode,MediaItem } from "../../types/tv";
import { motion } from "motion/react";
import { useTVFocusable } from "../focus/useTVFocusable";

export function TVEpisodeRail({item,route,onPlay}:{item:MediaItem;route:string;onPlay:(ep:Episode)=>void}){
  if(item.type!=="series"||!item.videos?.length)return null;
  return <section className="episodes"><h2>Episodes</h2><div className="episode-list">
    {item.videos.map((ep,i)=><EpisodeCard key={ep.id} ep={ep} i={i} route={route} onPlay={()=>onPlay(ep)}/>)}
  </div></section>
}
function EpisodeCard({ep,i,route,onPlay}:any){
  const {ref,focused}=useTVFocusable({
    focusKey:`${route}:episode:${ep.id}`,route,rowId:"episodes",onPress:onPlay,
    onFocus:()=>{
      const el=(ref as any).current as HTMLElement|null;
      if(el)el.scrollIntoView({block:"center",inline:"nearest",behavior:"auto"});
    }
  });
  return <motion.button ref={ref as any} className="episode-card" animate={{scale:focused?1.025:1,x:focused?10:0}}
    transition={{type:"spring",stiffness:420,damping:34}}>
    <div className="episode-thumb">{ep.thumbnail&&<img src={ep.thumbnail}/>}<span>{ep.episode||i+1}</span></div>
    <div><b>{ep.title||`Episode ${i+1}`}</b><p>{ep.overview||""}</p></div>
  </motion.button>
}
