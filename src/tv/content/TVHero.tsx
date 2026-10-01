import { AnimatePresence,motion } from "motion/react";
import { useEffect,useState } from "react";
import { Info,Play } from "lucide-react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import type { MediaItem } from "../../types/tv";
import { useTVFocusable } from "../focus/useTVFocusable";
import { TrailerPreview } from "../playback/TrailerPreview";

export function mediaFacts(item:MediaItem){
 return [item.genres?.[0]||(item.type==="series"?"TV Series":"Movie"),item.releaseInfo,
   item.type==="series"?(item.videos?.length?`${item.videos.length} Episodes`:undefined):item.runtime,item.contentRating].filter(Boolean);
}

export function TVHero({item,route,onPlay,onMore,onTrailerEnded,spotlight=[],onSpotlight}:{
 item?:MediaItem;route:string;onPlay:()=>void;onMore:()=>void;onTrailerEnded?:()=>void;
 spotlight?:MediaItem[];onSpotlight?:(item:MediaItem)=>void
}){
 if(!item)return <div className="tv-hero modern-billboard skeleton" aria-label="Loading featured title"/>;
 return <HeroContent item={item} route={route} onPlay={onPlay} onMore={onMore} onTrailerEnded={onTrailerEnded}
   spotlight={spotlight.slice(0,5)} onSpotlight={onSpotlight}/>;
}

function HeroContent({item,route,onPlay,onMore,onTrailerEnded,spotlight,onSpotlight}:{
 item:MediaItem;route:string;onPlay:()=>void;onMore:()=>void;onTrailerEnded?:()=>void;
 spotlight:MediaItem[];onSpotlight?:(item:MediaItem)=>void
}){
 const [trailerReady,setTrailerReady]=useState(false);
 const previewFrame=new URLSearchParams(window.location.search).get("tvframe")==="1";
 useEffect(()=>{setTrailerReady(false);if(previewFrame||!item.trailerUrl)return;const timer=window.setTimeout(()=>setTrailerReady(true),5000);return()=>window.clearTimeout(timer)},[item.id,item.trailerUrl,previewFrame]);
 const scrollTop=(node:HTMLElement|null)=>node?.closest(".tv-page")?.scrollTo({top:0,behavior:"smooth"});
 const firstSpot=spotlight.length>1?`${route}:hero:spot:0`:null;
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
     if(direction==="right"&&firstSpot){void setFocus(firstSpot);return false}
     return true;
   }
 });

 return <section className="tv-hero modern-billboard" aria-label={`Featured: ${item.name}`}>
   <AnimatePresence mode="sync">
     <motion.img key={item.id+":"+(item.background||item.poster||"")} className="hero-backdrop"
       src={item.background||item.poster} alt="" initial={{opacity:0,scale:1.012}}
       animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.42,ease:"easeOut"}}/>
   </AnimatePresence>
   {trailerReady&&item.trailerUrl&&<TrailerPreview item={item} loop={false} onEnded={onTrailerEnded}/>}
   <div className="hero-scrim"/>
   <div className="hero-copy">
    <div className="hero-eyebrow">FEATURED {item.type==="series"?"SERIES":"FILM"}</div>
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
   {spotlight.length>1&&<div className="hero-switcher" aria-label="Featured titles">
     {spotlight.map((candidate,i)=><SpotlightButton key={candidate.id+":"+i} item={candidate} index={i} route={route}
       active={candidate.id===item.id&&candidate.type===item.type} count={spotlight.length}
       onPress={()=>onSpotlight?.(candidate)}/>)}
   </div>}
   {item.imdbRating&&<div className="hero-fact-chip">★ {item.imdbRating} on IMDb</div>}
 </section>;
}

function SpotlightButton({item,index,route,active,count,onPress}:{item:MediaItem;index:number;route:string;active:boolean;count:number;onPress:()=>void}){
 const {ref,focused,focusSelf}=useTVFocusable({
   focusKey:`${route}:hero:spot:${index}`,route,rowId:"hero-switcher",onPress,
   onArrowPress:direction=>{
     if(direction==="left"){void setFocus(index===0?`${route}:hero:more`:`${route}:hero:spot:${index-1}`);return false}
     if(direction==="right"&&index<count-1){void setFocus(`${route}:hero:spot:${index+1}`);return false}
     if(direction==="up"){void setFocus(`${route}:hero:more`);return false}
     return true;
   }
 });
 return <motion.button ref={ref as any} className={`hero-spot ${active?"active":""} ${focused?"is-focused":""}`}
   onClick={onPress} onMouseEnter={()=>focusSelf()} animate={{scale:focused?1.08:1}}>
   <img src={item.background||item.poster} alt=""/><span>{index+1}</span>
 </motion.button>;
}
