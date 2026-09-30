import { AnimatePresence,motion } from "motion/react";
import { Info,Play } from "lucide-react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import type { MediaItem } from "../../types/tv";
import { useTVFocusable } from "../focus/useTVFocusable";

export function mediaFacts(item:MediaItem){
 return [item.genres?.[0]||(item.type==="series"?"TV Series":"Movie"),item.releaseInfo,
   item.type==="series"?(item.videos?.length?`${item.videos.length} Episodes`:undefined):item.runtime,item.contentRating].filter(Boolean);
}

export function TVHero({item,route,onPlay,onMore}:{item?:MediaItem;route:string;onPlay:()=>void;onMore:()=>void}){
 if(!item)return <div className="tv-hero modern-billboard skeleton" aria-label="Loading featured title"/>;
 return <HeroContent item={item} route={route} onPlay={onPlay} onMore={onMore}/>;
}

function HeroContent({item,route,onPlay,onMore}:{item:MediaItem;route:string;onPlay:()=>void;onMore:()=>void}){
 const scrollTop=(node:HTMLElement|null)=>node?.closest(".tv-page")?.scrollTo({top:0,behavior:"auto"});
 const play=useTVFocusable({
   focusKey:`${route}:hero:play`,route,rowId:"hero",onPress:onPlay,
   onFocus:()=>scrollTop(play.ref.current as HTMLElement|null),
   onArrowPress:direction=>{
     if(direction==="up"||direction==="left"){void setFocus(`sidebar:${route}`);return false}
     if(direction==="right"){void setFocus(`${route}:hero:more`);return false}
     return true;
   }
 });
 const more=useTVFocusable({
   focusKey:`${route}:hero:more`,route,rowId:"hero",onPress:onMore,
   onFocus:()=>scrollTop(more.ref.current as HTMLElement|null),
   onArrowPress:direction=>{
     if(direction==="up"){void setFocus(`sidebar:${route}`);return false}
     if(direction==="left"){void setFocus(`${route}:hero:play`);return false}
     return true;
   }
 });

 return <section className="tv-hero modern-billboard" aria-label={`Featured: ${item.name}`}>
   <AnimatePresence mode="sync">
     <motion.img key={item.id+":"+(item.background||item.poster||"")} className="hero-backdrop"
       src={item.background||item.poster} alt="" initial={{opacity:0,scale:1.015}}
       animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.55,ease:"easeOut"}}/>
   </AnimatePresence>
   <div className="hero-scrim"/>
   <div className="hero-copy">
    <div className="hero-eyebrow"><span>N</span> {item.type==="series"?"SERIES":"FILM"}</div>
    {item.logo?<img className="hero-logo" src={item.logo} alt={item.name}/>:<h1>{item.name}</h1>}
    <div className="hero-meta">{mediaFacts(item).map((fact,i)=><span key={i}>{fact}</span>)}</div>
    <div className="hero-actions">
      <motion.button ref={play.ref as any} className={`hero-action hero-play ${play.focused?"is-focused":""}`}
        onMouseEnter={()=>play.focusSelf()} onClick={onPlay} animate={{scale:play.focused?1.045:1}}>
        <Play fill="currentColor"/> <span>Play</span>
      </motion.button>
      <motion.button ref={more.ref as any} className={`hero-action hero-more ${more.focused?"is-focused":""}`}
        onMouseEnter={()=>more.focusSelf()} onClick={onMore} animate={{scale:more.focused?1.045:1}}>
        <Info/> <span>More Info</span>
      </motion.button>
    </div>
   </div>
   {item.imdbRating&&<div className="hero-fact-chip">★ {item.imdbRating} on IMDb</div>}
 </section>;
}
