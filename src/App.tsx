import { useEffect,useRef,useState } from "react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { AnimatePresence } from "motion/react";
import { TVSidebar } from "./tv/navigation/TVSidebar";
import { CollectionPage } from "./pages/CollectionPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { SearchPage } from "./pages/SearchPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DetailsPage } from "./pages/DetailsPage";
import { TVVideo,type TVVideoHandle } from "./tv/playback/TVVideo";
import { PlayerControls } from "./tv/playback/PlayerControls";
import { PlayerSurface } from "./tv/playback/PlayerSurface";
import { BackStack } from "./tv/navigation/BackStack";
import { useNavigationStore } from "./stores/navigationStore";
import { installRemoteAdapter } from "./tv/navigation/remote";
import type { MediaItem } from "./types/tv";
import type { LibraryEntry } from "./data/library";
import { resolvePlayableStream } from "./data/playback";
import { useProviderStore } from "./stores/providerStore";
import { playNative } from "./platform/native";

type Route={name:string;item?:MediaItem};
export default function App(){
 const [route,setRoute]=useState<Route>({name:"home"});
 const [player,setPlayer]=useState<{src:string;title:string;headers?:Record<string,string>}|null>(null);
 const [controls,setControls]=useState(true);
 const [browserPlaying,setBrowserPlaying]=useState(true);
 const videoRef=useRef<TVVideoHandle|null>(null);
  const addons=useProviderStore(s=>s.addons);
 const snapshot=()=>{const nav=useNavigationStore.getState();return {route:route.name,focusKey:nav.focusedKey,scrollY:nav.scrollHistory[route.name]?.y||0}};
 const go=(name:string)=>{BackStack.push(snapshot());setRoute({name})};
 const open=(item:MediaItem)=>{BackStack.push(snapshot());setRoute({name:"details",item})};
 const resume=async(e:LibraryEntry)=>{
   const source=await resolvePlayableStream(e.item,e.videoId||e.item.id,addons);
   if(source?.url){if(!playNative(source.url,e.item.name,source.headers||{},e.item,e.videoId||e.item.id))setPlayer({src:source.url,title:e.item.name,headers:source.headers})}
 };
 const back=()=>{if(player){if(controls){setControls(false);requestAnimationFrame(()=>{void setFocus("player:surface")});return}const restore=useNavigationStore.getState().pageFocusHistory[route.name];setPlayer(null);setControls(true);requestAnimationFrame(()=>{if(restore)void setFocus(restore)});return}const snap=BackStack.pop();if(snap){setRoute({name:snap.route});setTimeout(()=>snap.focusKey&&void setFocus(snap.focusKey),0)}};
 useEffect(()=>installRemoteAdapter((a)=>{if(a==="back")back();if(player&&a!=="back")setControls(true)}),[player,controls,route.name]);
 useEffect(()=>{if(player&&controls){const id=requestAnimationFrame(()=>{void setFocus("player:player:play")});return()=>cancelAnimationFrame(id)}},[player,controls]);
 return <div className="app-shell"><TVSidebar route={route.name} onRoute={go}/><div className="app-content"><AnimatePresence mode="wait">
   {route.name==="home"&&<CollectionPage key="home" route="home" onOpen={open} onResume={resume}/>}
   {route.name==="movies"&&<CollectionPage key="movies" route="movies" type="movie" onOpen={open}/>}
   {route.name==="shows"&&<CollectionPage key="shows" route="shows" type="series" onOpen={open}/>}
   {route.name==="discover"&&<DiscoverPage key="discover" onOpen={open}/>}
   {route.name==="search"&&<SearchPage key="search" onOpen={open}/>}
   {route.name==="library"&&<LibraryPage key="library" onOpen={open}/>}
   {route.name==="settings"&&<SettingsPage key="settings"/>}
   {route.name==="details"&&route.item&&<DetailsPage key={route.item.id} seed={route.item} onBack={back} onPlay={(src,title,headers,item,videoId)=>{if(!playNative(src,title,headers||{},item,videoId))setPlayer({src,title,headers})}}/>}
 </AnimatePresence></div>{player&&<div className="player-layer" onMouseMove={()=>setControls(true)}><PlayerSurface onPress={()=>setControls(true)}><TVVideo ref={videoRef} src={player.src} headers={player.headers} onPlayingChange={setBrowserPlaying}/></PlayerSurface>{controls&&<><div className="player-title">{player.title}</div><PlayerControls route="player" playing={browserPlaying} onToggle={()=>setBrowserPlaying(videoRef.current?.toggle()??browserPlaying)} onBack10={()=>videoRef.current?.seekBy(-10)} onForward10={()=>videoRef.current?.seekBy(10)}/></>}</div>}</div>
}
