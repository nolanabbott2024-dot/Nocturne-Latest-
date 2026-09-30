import { useEffect,useMemo,useState } from "react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVRow } from "../tv/content/TVRow";
import { TVContinueRow } from "../tv/content/TVContinueRow";
import { watchlist,continueWatching,type LibraryEntry } from "../data/library";
import type { MediaItem } from "../types/tv";
export function LibraryPage({onOpen,onResume}:{onOpen:(m:MediaItem)=>void;onResume:(e:LibraryEntry)=>void}){
 const [revision,setRevision]=useState(0);
 useEffect(()=>{const sync=()=>setRevision(x=>x+1);window.addEventListener("nocturne-library-sync",sync);return()=>window.removeEventListener("nocturne-library-sync",sync)},[]);
 const items=useMemo(()=>watchlist().map(e=>e.item),[revision]);
 const cont=useMemo(()=>continueWatching(),[revision]);
 return <TVPage route="library">
  {items.length?<TVRow id="library" title="My List" items={items} route="library" onOpen={onOpen}/>:<div className="empty-page"><h1>My List</h1><p>Save movies and shows from their details page to see them here.</p></div>}
  <TVContinueRow entries={cont} route="library" onResume={onResume}/>
 </TVPage>
}
