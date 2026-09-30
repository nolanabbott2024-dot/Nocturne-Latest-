import { AnimatePresence,motion } from "motion/react";
import { Info,Play } from "lucide-react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import type { MediaItem } from "../../types/tv";
import { useTVFocusable } from "../focus/useTVFocusable";

export function TVHero({item,route,onPlay,onMore}:{item?:MediaItem;route:string;onPlay:()=>void;onMore:()=>void}){
  if(!item)return <div className="tv-hero skeleton"/>;
  return <section className="tv-hero netflix-billboard">
    <AnimatePresence mode="sync">
      <motion.img key={item.background||item.poster} className="hero-backdrop" src={item.background||item.poster}
        initial={{opacity:0,scale:1.018}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
        transition={{duration:.42,ease:[.2,.75,.25,1]}}/>
    </AnimatePresence>
    <div className="hero-scrim netflix-billboard-scrim"/>
    <motion.div className="hero-copy netflix-billboard-copy" key={item.id}
      initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.28,ease:[.2,.75,.25,1]}}>
      {item.logo?<img className="hero-logo" src={item.logo}/>:<h1>{item.name}</h1>}
      <div className="hero-meta netflix-hero-meta">
        {item.imdbRating&&<b>{`★ ${item.imdbRating}`}</b>}
        {item.releaseInfo&&<span>{item.releaseInfo}</span>}
        {item.contentRating&&<span>{item.contentRating}</span>}
        {item.runtime&&<span>{item.runtime}</span>}
      </div>
      <p>{item.description}</p>
      <div className="hero-actions">
        <HeroButton focusKey={`${route}:hero:play`} route={route} primary onPress={onPlay}><Play fill="currentColor"/> Play</HeroButton>
        <HeroButton focusKey={`${route}:hero:more`} route={route} onPress={onMore}><Info/> More Info</HeroButton>
      </div>
    </motion.div>
  </section>
}
function HeroButton({focusKey,route,onPress,children,primary}:any){
  const {ref,focused}=useTVFocusable({
    focusKey,route,rowId:"hero",onPress,
    onArrowPress:(direction)=>{if(direction==="left"){requestAnimationFrame(()=>void setFocus(`sidebar:${route}`));return false}return true}
  });
  return <motion.button ref={ref as any} className={"hero-button netflix-hero-button "+(primary?"primary ":"")+(focused?"is-focused":"")}
    animate={{
      scale:focused?1.055:1,
      backgroundColor:focused?"#ffffff":primary?"#ffffff":"rgba(109,109,110,.72)",
      color:focused||primary?"#0b0b0c":"#ffffff"
    }}
    transition={{type:"spring",stiffness:460,damping:36}}>{children}</motion.button>
}
