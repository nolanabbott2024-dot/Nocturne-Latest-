import { useMemo } from "react";
import { useAddons } from "../data/queries";
import { TVPage } from "../tv/navigation/TVPage";
import { TVRow } from "../tv/content/TVRow";
import { useCatalog } from "../data/queries";
import { useContentStore } from "../stores/contentStore";
import type { MediaItem } from "../types/tv";
export function DiscoverPage({onOpen}:{onOpen:(m:MediaItem)=>void}){
 const addons=useAddons();const seed=useContentStore(s=>s.discoverSeed);
 const cats=useMemo(()=>addons.flatMap(a=>a.catalogs).filter(c=>!c.searchable).sort((a,b)=>((a.id.length*31+seed)%97)-((b.id.length*31+seed)%97)).slice(0,6),[addons,seed]);
 return <TVPage route="discover"><header className="page-title"><h1>Discover</h1><p>Fresh combinations from your connected catalogs.</p></header>{cats.map(c=><DRow key={c.baseUrl+c.id} c={c} onOpen={onOpen}/>)}</TVPage>
}
function DRow({c,onOpen}:any){const q=useCatalog(c);return q.data?.length?<TVRow id={"discover-"+c.id} title={c.name} items={q.data} route="discover" onOpen={onOpen}/>:null}
