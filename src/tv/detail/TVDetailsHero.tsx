import { AnimatePresence,motion } from "motion/react";
import { Check,ChevronDown,Link2,Play,Plus } from "lucide-react";
import type { MediaItem } from "../../types/tv";
import { TVMetadata } from "./TVMetadata";
import { useTVFocusable } from "../focus/useTVFocusable";

type Panel="episodes"|"details"|"related"|"audio"|"extras";

function HeroButton({focusKey,route,label,onPress,kind="icon",children}:{focusKey:string;route:string;label:string;onPress:()=>void;kind?:"play"|"icon";children:React.ReactNode}){
 const {ref,focused,focusSelf}=useTVFocusable({focusKey,route,rowId:"details-hero",onPress});
 return <motion.button ref={ref as any} className={`title-hero-btn ${kind} ${focused?"is-focused":""}`}
   aria-label={label} onClick={onPress} onMouseEnter={()=>focusSelf()}
   animate={{scale:focused?1.06:1}} transition={{type:"spring",stiffness:430,damping:31}}>{children}</motion.button>
}
function PanelButton({panel,label,route,onPanel}:{panel:Panel;label:string;route:string;onPanel:(p:Panel)=>void}){
 const {ref,focused,focusSelf}=useTVFocusable({focusKey:`${route}:overview-tab:${panel}`,route,rowId:"details-overview-tabs",onPress:()=>onPanel(panel)});
 return <button ref={ref as any} className={`title-overview-tab ${focused?"is-focused":""}`} onClick={()=>onPanel(panel)} onMouseEnter={()=>focusSelf()}>{label}</button>;
}

export function TVDetailsHero({item,route,onPlay,onWatchlist,onSources,watchlisted=false,onPanel}:{
 item:MediaItem;route:string;onPlay:()=>void;onWatchlist:()=>void;onSources:()=>void;watchlisted?:boolean;onPanel:(p:Panel)=>void
}){
 const isSeries=item.type==="series";
 return <section className="details-hero title-overview">
   <AnimatePresence mode="sync"><motion.img key={item.background||item.poster} className="details-backdrop" src={item.background||item.poster} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.38}}/></AnimatePresence>
   <div className="details-scrim"/>
   <div className="details-copy">
    {item.logo?<img className="details-logo" src={item.logo} alt={item.name}/>:<h1>{item.name}</h1>}
    <TVMetadata item={item}/>
    <div className="title-hero-actions">
      <HeroButton focusKey={`${route}:action:play`} route={route} label="Play" onPress={onPlay} kind="play"><Play fill="currentColor"/><span>Play</span></HeroButton>
      <HeroButton focusKey={`${route}:action:watchlist`} route={route} label="My List" onPress={onWatchlist}>{watchlisted?<Check/>:<Plus/>}</HeroButton>
      <HeroButton focusKey={`${route}:action:sources`} route={route} label="Sources" onPress={onSources}><Link2/></HeroButton>
    </div>
    <div className="title-overview-tabs">
      <ChevronDown className="title-tabs-caret"/>
      {isSeries&&<PanelButton panel="episodes" label="Episodes" route={route} onPanel={onPanel}/>}
      <PanelButton panel="details" label="Details" route={route} onPanel={onPanel}/>
      <PanelButton panel="audio" label="Audio & Subtitles" route={route} onPanel={onPanel}/>
      <PanelButton panel="related" label="More Like This" route={route} onPanel={onPanel}/>
      {isSeries&&<PanelButton panel="extras" label="Previews & Extras" route={route} onPanel={onPanel}/>}
    </div>
   </div>
 </section>
}
