import { useCallback,useEffect,useRef,useState } from "react";
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
type BrowserPlayer={src:string;title:string;headers?:Record<string,string>};

export default function App(){
 const [route,setRoute]=useState<Route>({name:"home"});
 const [player,setPlayer]=useState<BrowserPlayer|null>(null);
 const [controls,setControls]=useState(true);
 const [browserPlaying,setBrowserPlaying]=useState(true);
 const videoRef=useRef<TVVideoHandle|null>(null);
 const addons=useProviderStore(s=>s.addons);

 const snapshot=useCallback(()=>{
   const nav=useNavigationStore.getState();
   return {route:route.name,focusKey:nav.focusedKey,scrollY:nav.scrollHistory[route.name]?.y||0};
 },[route.name]);

 const go=useCallback((name:string)=>{BackStack.push(snapshot());setRoute({name})},[snapshot]);
 const open=useCallback((item:MediaItem)=>{BackStack.push(snapshot());setRoute({name:"details",item})},[snapshot]);

 const launchSource=useCallback((url:string,title:string,headers:Record<string,string>,item:MediaItem,videoId:string)=>{
   if(!playNative(url,title,headers,item,videoId))setPlayer({src:url,title,headers});
 },[]);

 const playItem=useCallback(async(item:MediaItem,videoId=item.id)=>{
   const source=await resolvePlayableStream(item,videoId,addons);
   if(source?.url)launchSource(source.url,item.name,source.headers||{},item,videoId);
 },[addons,launchSource]);

 const resume=useCallback((entry:LibraryEntry)=>playItem(entry.item,entry.videoId||entry.item.id),[playItem]);

 const back=useCallback(()=>{
   if(document.querySelector("[data-tv-overlay='true']")){
     window.dispatchEvent(new Event("nocturne-overlay-back"));
     return;
   }
   if(player){
     if(controls){setControls(false);requestAnimationFrame(()=>{void setFocus("player:surface")});return}
     const restore=useNavigationStore.getState().pageFocusHistory[route.name];
     setPlayer(null);setControls(true);
     requestAnimationFrame(()=>{if(restore)void setFocus(restore)});
     return;
   }
   const snap=BackStack.pop();
   if(snap){
     setRoute({name:snap.route});
     requestAnimationFrame(()=>{if(snap.focusKey)void setFocus(snap.focusKey)});
   }
 },[player,controls,route.name]);

 useEffect(()=>installRemoteAdapter((a)=>{
   if(a==="back"){back();return}
   if(player)setControls(true);
 }),[back,player]);

 useEffect(()=>{
   if(player&&controls){
     const id=requestAnimationFrame(()=>{void setFocus("player:player:play")});
     return()=>cancelAnimationFrame(id);
   }
 },[player,controls]);

 return <div className="app-shell">
   <TVSidebar route={route.name} onRoute={go}/>
   <div className="app-content">
     <AnimatePresence mode="wait">
       {route.name==="home"&&<CollectionPage key="home" route="home" onOpen={open} onPlay={playItem} onResume={resume}/>}
       {route.name==="movies"&&<CollectionPage key="movies" route="movies" type="movie" onOpen={open} onPlay={playItem}/>}
       {route.name==="shows"&&<CollectionPage key="shows" route="shows" type="series" onOpen={open} onPlay={playItem}/>}
       {route.name==="discover"&&<DiscoverPage key="discover" onOpen={open}/>}
       {route.name==="search"&&<SearchPage key="search" onOpen={open}/>}
       {route.name==="library"&&<LibraryPage key="library" onOpen={open}/>}
       {route.name==="settings"&&<SettingsPage key="settings"/>}
       {route.name==="details"&&route.item&&<DetailsPage key={route.item.id} seed={route.item} onBack={back} onPlay={launchSource}/>}
     </AnimatePresence>
   </div>
   {player&&<div className="player-layer" onMouseMove={()=>setControls(true)}>
     <PlayerSurface onPress={()=>setControls(true)}>
       <TVVideo ref={videoRef} src={player.src} headers={player.headers} onPlayingChange={setBrowserPlaying}/>
     </PlayerSurface>
     {controls&&<><div className="player-title">{player.title}</div><PlayerControls route="player" playing={browserPlaying}
       onToggle={()=>setBrowserPlaying(videoRef.current?.toggle()??browserPlaying)}
       onBack10={()=>videoRef.current?.seekBy(-10)} onForward10={()=>videoRef.current?.seekBy(10)}/></>}
   </div>}
 </div>
}
