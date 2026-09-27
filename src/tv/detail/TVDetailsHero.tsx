import { AnimatePresence,motion } from "motion/react";
import type { MediaItem } from "../../types/tv";
import { TVMetadata } from "./TVMetadata";
import { TVActionBar } from "./TVActionBar";
export function TVDetailsHero({item,route,onPlay,onWatchlist,onTrailer,onSources,watchlisted=false}:{item:MediaItem;route:string;onPlay:()=>void;onWatchlist:()=>void;onTrailer:()=>void;onSources:()=>void;watchlisted?:boolean}){
 return <section className="details-hero">
   <AnimatePresence mode="sync"><motion.img key={item.background||item.poster} className="details-backdrop" src={item.background||item.poster} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.38}}/></AnimatePresence>
   <div className="details-scrim"/>
   <div className="details-copy">{item.logo?<img className="details-logo" src={item.logo}/>:<h1>{item.name}</h1>}<TVMetadata item={item}/><TVActionBar route={route} onPlay={onPlay} onWatchlist={onWatchlist} onTrailer={onTrailer} onSources={onSources} watchlisted={watchlisted} hasTrailer={!!(item.trailerUrl||item.trailerYtId)}/></div>
 </section>
}
