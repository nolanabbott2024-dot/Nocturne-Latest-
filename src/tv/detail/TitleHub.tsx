import { useEffect,useMemo,useState,type ReactNode } from "react";
import { ChevronUp,Check } from "lucide-react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import type { Episode,MediaItem } from "../../types/tv";
import { useTVFocusable } from "../focus/useTVFocusable";
import { mediaFacts } from "../content/TVHero";

export type TitlePanel="episodes"|"details"|"related"|"audio"|"extras";
const LABELS:Record<TitlePanel,string>={episodes:"Episodes",details:"Details",related:"More Like This",audio:"Audio & Subtitles",extras:"Previews & Extras"};

function FocusButton({focusKey,route,className="",onPress,onArrowPress,children}:{focusKey:string;route:string;className?:string;onPress:()=>void;onArrowPress?:(direction:string)=>boolean|void;children:ReactNode}){
 const {ref,focused,focusSelf}=useTVFocusable({focusKey,route,rowId:"title-hub",onPress,onArrowPress});
 return <button ref={ref as any} className={className+" "+(focused?"is-focused":"")} onClick={onPress} onMouseEnter={()=>focusSelf()}>{children}</button>;
}

export function TitleHub({item,route,panel,onPanel,onClose,onPlayEpisode,onOpenRelated,onTrailer,related}:{
 item:MediaItem;route:string;panel:TitlePanel;onPanel:(p:TitlePanel)=>void;onClose:()=>void;
 onPlayEpisode:(ep:Episode)=>void;onOpenRelated:(m:MediaItem)=>void;onTrailer:()=>void;related:MediaItem[];
}){
 const tabs=useMemo<TitlePanel[]>(()=>item.type==="series"?["episodes","details","audio","related","extras"]:["details","audio","related"],[item.type]);
 useEffect(()=>{const id=requestAnimationFrame(()=>void setFocus(route+":hub-tab:"+panel));return()=>cancelAnimationFrame(id)},[route,panel]);
 return <section className="title-hub" data-tv-overlay="true">
   <img className="title-hub-bg" src={item.background||item.poster} alt=""/>
   <div className="title-hub-scrim"/>
   <div className="title-hub-shell">
    <div className="title-hub-tabs">
      <FocusButton focusKey={route+":hub-close"} route={route} className="hub-close" onPress={onClose}><ChevronUp/></FocusButton>
      {tabs.map(t=><FocusButton key={t} focusKey={route+":hub-tab:"+t} route={route} className={"hub-tab "+(panel===t?"active":"")} onPress={()=>onPanel(t)}
        onArrowPress={direction=>{
          if(direction==="down"){
            const target=t==="episodes"?(item.videos?.length?route+":season:"+(item.videos[0].season||1):route+":hub-close")
              :t==="audio"?route+":audio:0"
              :t==="related"?(related[0]?route+":related:"+related[0].type+":"+related[0].id+":0":route+":hub-close")
              :t==="extras"?(item.trailerUrl||item.trailerYtId?route+":extra:trailer":route+":hub-close")
              :route+":detail:more";
            requestAnimationFrame(()=>void setFocus(target));return false;
          }
          if(direction==="up"){onClose();return false}
          return true;
        }}>{LABELS[t]}</FocusButton>)}
    </div>
    <div className="title-hub-rule"/>
    <div className="title-hub-content">
      {panel==="episodes"&&<EpisodesPanel item={item} route={route} onPlay={onPlayEpisode}/>}\n      {panel==="details"&&<DetailsPanel item={item}/>}
      {panel==="related"&&<RelatedPanel items={related} item={item} route={route} onOpen={onOpenRelated}/>}
      {panel==="audio"&&<AudioPanel route={route}/>}
      {panel==="extras"&&<ExtrasPanel item={item} route={route} onTrailer={onTrailer}/>}
    </div>
   </div>
 </section>;
}

export function EpisodesPanel({item,route,onPlay,inline=false}:{item:MediaItem;route:string;onPlay:(ep:Episode)=>void;inline?:boolean}){
 const seasons=useMemo(()=>{
  const values=Array.from(new Set((item.videos||[]).map(v=>v.season??1)));
  return values.sort((a,b)=>a===0?1:b===0?-1:a-b);
 },[item.videos]);
 const [season,setSeason]=useState(seasons.find(x=>x>0)??seasons[0]??1);
 const episodes=(item.videos||[]).filter(v=>(v.season??1)===season);
 const [selected,setSelected]=useState<Episode|undefined>(episodes[0]);
 useEffect(()=>setSelected(episodes[0]),[season,item.id]);
 const avgRuntime=episodes.find(e=>e.runtime)?.runtime||item.runtime;
 return <section className={"hub-episodes "+(inline?"inline-episodes":"")}>
   <div className="hub-series-heading">
    {item.logo?<img src={item.logo} alt={item.name}/>:<h1>{item.name}</h1>}
    <div>{seasons.length} Season{seasons.length===1?"":"s"} <span>•</span> {(item.videos||[]).length} Episodes {avgRuntime&&<><span>•</span> {avgRuntime} Avg Ep</>}</div>
   </div>
   <div className="hub-season-tabs">
    {seasons.map(s=><FocusButton key={s} focusKey={route+":season:"+s} route={route} className={"hub-season "+(season===s?"active":"")} onPress={()=>setSeason(s)}
      onArrowPress={direction=>{
        if(direction==="up"){void setFocus(route+":action:play");return false}
        if(direction==="down"){
          const first=(item.videos||[]).find(v=>(v.season??1)===s);
          if(first){void setFocus(route+":hub-episode:"+first.id);return false}
        }
        return true;
      }}>
      {s===0?"Specials":("Season "+s)}<small>{(item.videos||[]).filter(v=>(v.season??1)===s).length} Episodes</small>
    </FocusButton>)}
   </div>
   <div className="hub-episode-row">
    {episodes.map((ep,i)=><EpisodeTile key={ep.id} ep={ep} i={i} route={route} onPlay={()=>onPlay(ep)} onFocus={()=>setSelected(ep)}/>)}
   </div>
   {selected&&<div className="hub-episode-copy">
     <h3>{selected.title||("Episode "+(selected.episode||1))}</h3>
     <p>{selected.overview||""}</p>
     <div className="hub-episode-facts">{selected.runtime&&<span><b>Duration</b>{selected.runtime}</span>}{item.contentRating&&<span><b>Maturity Rating</b>{item.contentRating}</span>}</div>
   </div>}
 </section>;
}
function EpisodeTile({ep,i,route,onPlay,onFocus}:{ep:Episode;i:number;route:string;onPlay:()=>void;onFocus:()=>void}){
 const {ref,focused,focusSelf}=useTVFocusable({focusKey:route+":hub-episode:"+ep.id,route,rowId:"hub-episodes",onPress:onPlay,onFocus,
   onArrowPress:direction=>{
     if(direction==="up"){void setFocus(route+":season:"+(ep.season??1));return false}
     return true;
   }
 });
 return <button ref={ref as any} className={"hub-episode-tile "+(focused?"is-focused":"")} onClick={onPlay} onMouseEnter={()=>focusSelf()}>
   <div>{ep.thumbnail?<img src={ep.thumbnail} alt=""/>:<span className="hub-thumb-placeholder"/>}<b>{ep.season?("S"+ep.season+" "):""}E{ep.episode||i+1}</b></div>
 </button>;
}

export function DetailsPanel({item}:{item:MediaItem}){
 const facts=[item.type==="series"?"Show":"Movie",item.genres?.[0],item.releaseInfo,item.type==="series"&&item.videos?.length?(new Set(item.videos.map(v=>v.season??1)).size+" Seasons"):item.runtime].filter(Boolean);
 return <div className="hub-details">
   {item.logo?<img className="hub-detail-logo" src={item.logo} alt={item.name}/>:<h1>{item.name}</h1>}
   <div className="hub-detail-switch">
     <FocusButton focusKey={"details:"+item.id+":detail:more"} route={"details:"+item.id} className="hub-detail-switch-btn active" onPress={()=>{}}>More Info</FocusButton>
     <FocusButton focusKey={"details:"+item.id+":detail:cast"} route={"details:"+item.id} className="hub-detail-switch-btn" onPress={()=>{}}>Cast & Credits</FocusButton>
   </div>
   <div className="hub-detail-facts">{facts.map((x,i)=><span key={i}>{x}</span>)}</div>
   <p className="hub-detail-description">{item.description}</p>
   {item.imdbRating&&<p className="hub-detail-note">⭐ Rated {item.imdbRating}/10 on IMDb</p>}
   {item.contentRating&&<div className="hub-rating"><b>{item.contentRating}</b><span>Viewer discretion advised.</span></div>}
   <div className="hub-format-badges"><span>HD</span><span>5.1</span></div>
 </div>;
}

export function RelatedPanel({items,item,route,onOpen}:{items:MediaItem[];item:MediaItem;route:string;onOpen:(m:MediaItem)=>void}){
 const [selected,setSelected]=useState<MediaItem|undefined>(items[0]);
 useEffect(()=>setSelected(items[0]),[items]);
 return <div className="hub-related">
   <h2>If you liked {item.name}, you’ll love these</h2>
   <div className="hub-related-row">
    {items.slice(0,12).map((m,i)=><RelatedTile key={m.id} item={m} route={route} i={i} onOpen={()=>onOpen(m)} onFocus={()=>setSelected(m)}/>)}
   </div>
   {selected&&<div className="hub-related-copy"><div className="hub-detail-facts">{mediaFacts(selected).map((x,i)=><span key={i}>{x}</span>)}</div><p>{selected.description||selected.name}</p></div>}
   {items.length===0&&<p className="hub-empty">More recommendations will appear as your connected catalogs load.</p>}
 </div>;
}
function RelatedTile({item,route,i,onOpen,onFocus}:{item:MediaItem;route:string;i:number;onOpen:()=>void;onFocus:()=>void}){
 const {ref,focused,focusSelf}=useTVFocusable({
   focusKey:route+":related:"+item.type+":"+item.id+":"+i,route,rowId:"hub-related",onPress:onOpen,onFocus,
   onArrowPress:direction=>{
     if(direction==="up"){void setFocus(route+":overview-tab:related");return false}
     return true;
   }
 });
 return <button ref={ref as any} className={"hub-related-tile "+(focused?"is-focused":"")} onClick={onOpen} onMouseEnter={()=>focusSelf()}>
   <img src={i===0?(item.background||item.poster):(item.poster||item.background)} alt=""/>
 </button>;
}

export function AudioPanel({route}:{route:string}){
 const [audio,setAudio]=useState("English [Original] (5.1)");
 const [sub,setSub]=useState("English (CC)");
 const audios=["English [Original] (5.1)","English [Original]","English - Audio Description (5.1)","English - Audio Description"];
 const subs=["Off","English","English (CC)"];
 return <div className="hub-audio-grid">
   <div><h2>Audio</h2>{audios.map((x,i)=><Choice key={x} id={route+":audio:"+i} route={route} active={audio===x} label={x} onPress={()=>setAudio(x)}/>)}</div>
   <div><h2>Subtitles</h2>{subs.map((x,i)=><Choice key={x} id={route+":sub:"+i} route={route} active={sub===x} label={x} onPress={()=>setSub(x)}/>)}</div>
 </div>;
}
function Choice({id,route,active,label,onPress}:{id:string;route:string;active:boolean;label:string;onPress:()=>void}){
 return <FocusButton focusKey={id} route={route} className="hub-choice" onPress={onPress}>{active?<Check/>:<span className="choice-spacer"/>}{label}</FocusButton>;
}

export function ExtrasPanel({item,route,onTrailer}:{item:MediaItem;route:string;onTrailer:()=>void}){
 const available=!!item.trailerUrl;
 return <div className="hub-extras">
   {available?<FocusButton focusKey={route+":extra:trailer"} route={route} className="hub-extra-card" onPress={onTrailer}>
      <img src={item.background||item.poster} alt=""/><div><h3>{item.type==="series"?"Official Preview":"Official Trailer"}: {item.name}</h3><span>Play preview</span></div>
   </FocusButton>:<p className="hub-empty">No previews or extras are available for this title yet.</p>}
 </div>;
}
