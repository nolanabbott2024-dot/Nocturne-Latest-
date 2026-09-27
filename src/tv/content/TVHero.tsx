import { AnimatePresence,motion } from "motion/react";
import { Play,Plus } from "lucide-react";
import type { MediaItem } from "../../types/tv";
import { useTVFocusable } from "../focus/useTVFocusable";

export function TVHero({item,route,onPlay,onMore}:{item?:MediaItem;route:string;onPlay:()=>void;onMore:()=>void}){
  if(!item)return <div className="tv-hero skeleton"/>;
  return <section className="tv-hero">
    <AnimatePresence mode="sync">
      <motion.img key={item.background||item.poster} className="hero-backdrop" src={item.background||item.poster}
        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.35}}/>
    </AnimatePresence>
    <div className="hero-scrim"/>
    <motion.div className="hero-copy" key={item.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.28}}>
      {item.logo?<img className="hero-logo" src={item.logo}/>:<h1>{item.name}</h1>}
      <div className="hero-meta">{[item.releaseInfo,item.contentRating,item.runtime,item.imdbRating&&`★ ${item.imdbRating}`].filter(Boolean).join(" · ")}</div>
      <p>{item.description}</p>
      <div className="hero-actions">
        <HeroButton focusKey={`${route}:hero:play`} route={route} onPress={onPlay}><Play/> Play</HeroButton>
        <HeroButton focusKey={`${route}:hero:more`} route={route} onPress={onMore}><Plus/> More Info</HeroButton>
      </div>
    </motion.div>
  </section>
}
function HeroButton({focusKey,route,onPress,children}:any){
  const {ref,focused}=useTVFocusable({focusKey,route,rowId:"hero",onPress});
  return <motion.button ref={ref as any} className="hero-button" animate={{scale:focused?1.055:1,y:focused?-2:0}} transition={{type:"spring",stiffness:420,damping:32}}>{children}</motion.button>
}
