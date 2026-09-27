import { useEffect,useState } from "react";
import { AnimatePresence } from "motion/react";
import { TVSidebar } from "./tv/navigation/TVSidebar";
import { CollectionPage } from "./pages/CollectionPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { SearchPage } from "./pages/SearchPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DetailsPage } from "./pages/DetailsPage";
import { TVVideo } from "./tv/playback/TVVideo";
import { PlayerControls } from "./tv/playback/PlayerControls";
import { BackStack } from "./tv/navigation/BackStack";
import { useNavigationStore } from "./stores/navigationStore";
import { installRemoteAdapter } from "./tv/navigation/remote";
import type { MediaItem } from "./types/tv";
import { playNative } from "./platform/native";

type Route={name:string;item?:MediaItem};
export default function App(){
 const [route,setRoute]=useState<Route>({name:"home"});
 const [player,setPlayer]=useState<{src:string;title:string}|null>(null);
 const [controls,setControls]=useState(true);
 const nav=useNavigationStore();
 const go=(name:string)=>{BackStack.push({route:route.name,focusKey:nav.focusedKey,scrollY:nav.scrollHistory[route.name]?.y||0});setRoute({name})};
 const open=(item:MediaItem)=>{BackStack.push({route:route.name,focusKey:nav.focusedKey,scrollY:nav.scrollHistory[route.name]?.y||0});setRoute({name:"details",item})};
 const back=()=>{if(player){if(controls){setControls(false);return}setPlayer(null);setControls(true);return}const snap=BackStack.pop();if(snap){setRoute({name:snap.route});setTimeout(()=>snap.focusKey&&useNavigationStore.getState().setFocus(snap.focusKey,snap.route),0)}};
 useEffect(()=>installRemoteAdapter((a)=>{if(a==="back")back();if(player&&a!=="back")setControls(true)}),[player,controls,route.name]);
 return <div className="app-shell"><TVSidebar route={route.name} onRoute={go}/><div className="app-content"><AnimatePresence mode="wait">
   {route.name==="home"&&<CollectionPage key="home" route="home" onOpen={open}/>}
   {route.name==="movies"&&<CollectionPage key="movies" route="movies" type="movie" onOpen={open}/>}
   {route.name==="shows"&&<CollectionPage key="shows" route="shows" type="series" onOpen={open}/>}
   {route.name==="discover"&&<DiscoverPage key="discover" onOpen={open}/>}
   {route.name==="search"&&<SearchPage key="search" onOpen={open}/>}
   {route.name==="library"&&<LibraryPage key="library" onOpen={open}/>}
   {route.name==="settings"&&<SettingsPage key="settings"/>}
   {route.name==="details"&&route.item&&<DetailsPage key={route.item.id} seed={route.item} onBack={back} onPlay={(src,title)=>{if(!playNative(src,title))setPlayer({src,title})}}/>}
 </AnimatePresence></div>{player&&<div className="player-layer" onMouseMove={()=>setControls(true)}><TVVideo src={player.src}/>{controls&&<><div className="player-title">{player.title}</div><PlayerControls route="player" playing onToggle={()=>{}} onBack10={()=>{}} onForward10={()=>{}}/></>}</div>}</div>
}
