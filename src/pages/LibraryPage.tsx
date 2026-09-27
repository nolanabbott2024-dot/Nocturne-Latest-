import { useEffect,useMemo,useState } from "react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVRow } from "../tv/content/TVRow";
import { watchlist } from "../data/library";
import type { MediaItem } from "../types/tv";
export function LibraryPage({onOpen}:{onOpen:(m:MediaItem)=>void}){
 const [revision,setRevision]=useState(0);
 useEffect(()=>{const sync=()=>setRevision(x=>x+1);window.addEventListener("nocturne-library-sync",sync);return()=>window.removeEventListener("nocturne-library-sync",sync)},[]);
 const items=useMemo(()=>watchlist().map(e=>e.item),[revision]);
 return <TVPage route="library"><header className="page-title"><h1>Library</h1></header>
  {items.length?<TVRow id="library" title="Watchlist" items={items} route="library" onOpen={onOpen}/>:<div className="empty-page">Your library is empty.</div>}
 </TVPage>
}
