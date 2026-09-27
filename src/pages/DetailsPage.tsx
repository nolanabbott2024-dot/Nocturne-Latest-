import { useEffect,useMemo,useState } from "react";
import { TVPage } from "../tv/navigation/TVPage";
import { TVDetailsHero } from "../tv/detail/TVDetailsHero";
import { TVEpisodeRail } from "../tv/detail/TVEpisodeRail";
import { useProviderStore } from "../stores/providerStore";
import { loadAddon,loadMeta,loadStreams } from "../data/stremio";
import type { MediaItem,Episode } from "../types/tv";
export function DetailsPage({seed,onBack,onPlay}:{seed:MediaItem;onBack:()=>void;onPlay:(url:string,title:string)=>void}){
 const [item,setItem]=useState(seed);const [busy,setBusy]=useState(false);const addons=useProviderStore(s=>s.addons);
 useEffect(()=>{if(!seed.sourceBase)return;const c=new AbortController();loadMeta(seed.sourceBase,seed.type,seed.id,c.signal).then(setItem).catch(()=>{});return()=>c.abort()},[seed.id]);
 const play=async(id=item.id)=>{if(busy)return;setBusy(true);try{for(const d of addons){try{const a=await loadAddon(d);if(!(a.manifest.resources||[]).some((r:any)=>(typeof r==="string"?r:r.name)==="stream"))continue;const streams=await loadStreams(a.baseUrl,item.type,id);const direct=streams.find((s:any)=>s.url);if(direct?.url){onPlay(direct.url,item.name);return}}catch{}}}finally{setBusy(false)}};
 return <TVPage route={"details:"+item.id}><TVDetailsHero item={item} route={"details:"+item.id} onPlay={()=>play()} onWatchlist={()=>{}} onTrailer={()=>{}}/><TVEpisodeRail item={item} route={"details:"+item.id} onPlay={(ep:Episode)=>play(ep.id)}/></TVPage>
}
