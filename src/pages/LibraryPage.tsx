import { useMemo } from "react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVRow } from "../tv/content/TVRow";
import type { MediaItem } from "../types/tv";
function loadLibrary():MediaItem[]{try{const raw=JSON.parse(localStorage.getItem("library")||"{}");return Object.values(raw).filter((x:any)=>!x.removed).map((x:any)=>({id:x._id||x.id,type:x.type||"movie",name:x.name,poster:x.poster,background:x.background,releaseInfo:x.releaseInfo})) as MediaItem[]}catch{return[]}}
export function LibraryPage({onOpen}:{onOpen:(m:MediaItem)=>void}){const items=useMemo(loadLibrary,[]);return <TVPage route="library"><header className="page-title"><h1>Library</h1></header>{items.length?<TVRow id="library" title="Saved" items={items} route="library" onOpen={onOpen}/>:<div className="empty-page">Your library is empty.</div>}</TVPage>}
