import { motion } from "motion/react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import type { MediaItem } from "../../types/tv";
import { useTVFocusable } from "../focus/useTVFocusable";

export function mediaFacts(item:MediaItem){
 return [item.genres?.[0]||(item.type==="series"?"TV Series":"Movie"),item.releaseInfo,
   item.type==="series"?(item.videos?.length?`${item.videos.length} Episodes`:undefined):item.runtime,item.contentRating].filter(Boolean);
}
export function TVHero({item,route,onMore}:{item?:MediaItem;route:string;onPlay:()=>void;onMore:()=>void}){
 if(!item)return <div className="tv-hero modern-billboard skeleton" aria-label="Loading featured title"/>;
 return <HeroContent item={item} route={route} onMore={onMore}/>;
}
function HeroContent({item,route,onMore}:{item:MediaItem;route:string;onMore:()=>void}){
 const {ref,focused,focusSelf}=useTVFocusable({focusKey:`${route}:hero:play`,route,rowId:"hero",onPress:onMore,
  onFocus:()=>{const page=(ref.current as HTMLElement|null)?.closest(".tv-page");page?.scrollTo({top:0,behavior:"auto"})},
  onArrowPress:direction=>{if(direction==="up"||direction==="left"){void setFocus(`sidebar:${route}`);return false}return true}
 });
 return <motion.button ref={ref as any} className={`tv-hero modern-billboard ${focused?"is-focused":""}`} aria-label={`More information about ${item.name}`}
   onMouseEnter={()=>focusSelf()} onClick={onMore}>
   <img className="hero-backdrop" src={item.background||item.poster} alt=""/>
   <div className="hero-scrim"/>
   <div className="hero-copy">
    <div className="hero-eyebrow"><span>N</span> {item.type==="series"?"SERIES":"FILM"}</div>
    {item.logo?<img className="hero-logo" src={item.logo} alt={item.name}/>:<h1>{item.name}</h1>}
    <div className="hero-meta">{mediaFacts(item).map((fact,i)=><span key={i}>{fact}</span>)}</div>
   </div>
   {item.imdbRating&&<div className="hero-fact-chip">★ {item.imdbRating} on IMDb</div>}
 </motion.button>
}
