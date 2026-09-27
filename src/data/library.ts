import type { MediaItem } from "../types/tv";

export type LibraryEntry={
  item:MediaItem;
  progress:number;
  videoId?:string;
  position?:number;
  duration?:number;
  lastWatched?:string;
  inWatchlist:boolean;
};

function rawLibrary():Record<string,any>{
  try{return JSON.parse(localStorage.getItem("library")||"{}")}catch{return{}}
}
function save(raw:Record<string,any>){localStorage.setItem("library",JSON.stringify(raw));window.dispatchEvent(new CustomEvent("nocturne-library-sync"))}

export function libraryEntries():LibraryEntry[]{
  return Object.values(rawLibrary()).filter((x:any)=>!x.removed).map((x:any)=>{
    const state=x.state||{};
    const duration=Number(state.duration||0),position=Number(state.timeOffset||0);
    return {
      item:{
        id:String(x._id||x.id||""),type:x.type||"movie",name:x.name||"Untitled",
        poster:x.poster,background:x.background,releaseInfo:x.releaseInfo,
        sourceBase:x.sourceBase
      },
      progress:duration>0?Math.max(0,Math.min(1,position/duration)):0,
      videoId:state.video_id||undefined,position,duration,lastWatched:state.lastWatched,
      inWatchlist:!x.temp
    };
  });
}
export function continueWatching(){
  return libraryEntries().filter(x=>x.position&&x.duration&&x.progress>0&&x.progress<.92)
    .sort((a,b)=>new Date(b.lastWatched||0).getTime()-new Date(a.lastWatched||0).getTime());
}
export function watchlist(){
  return libraryEntries().filter(x=>x.inWatchlist);
}
export function isWatchlisted(id:string){const x=rawLibrary()[id];return !!x&&!x.removed&&!x.temp}
export function toggleWatchlist(item:MediaItem){
  const raw=rawLibrary();const old=raw[item.id];
  if(old&&!old.removed&&!old.temp){
    old.removed=true;old._mtime=new Date().toISOString();
  }else{
    raw[item.id]={
      ...(old||{}),_id:item.id,id:item.id,name:item.name,type:item.type,poster:item.poster,
      background:item.background,releaseInfo:item.releaseInfo,sourceBase:item.sourceBase,
      removed:false,temp:false,_mtime:new Date().toISOString(),
      state:old?.state||{timeOffset:0,duration:0,video_id:null,lastWatched:null}
    };
  }
  save(raw);
  return isWatchlisted(item.id);
}
