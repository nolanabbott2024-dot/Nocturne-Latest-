export type RawStream={
  name?:string;title?:string;description?:string;url?:string;externalUrl?:string;ytId?:string;infoHash?:string;
  behaviorHints?:{filename?:string;videoSize?:number;proxyHeaders?:{request?:Record<string,string>}};
  _addonName?:string;
};
export type StreamInfo={
  stream:RawStream;resolution:string;quality:string;codec:string;audio:string;size:number;score:number;label:string;
};

const RES=/\b(2160p|4k|uhd|1080p|720p|480p|360p)\b/i;
function settings(){
  try{return JSON.parse(localStorage.getItem("settings")||"{}")}catch{return{}}
}
function text(s:RawStream){return [s.name,s.title,s.description,s.behaviorHints?.filename].filter(Boolean).join(" ")}
function parse(s:RawStream):StreamInfo{
  const t=text(s),u=t.toUpperCase();
  const m=t.match(RES);let resolution=m?.[1]?.toLowerCase()||"Unknown";
  if(resolution==="4k"||resolution==="uhd")resolution="2160p";
  const quality=u.includes("REMUX")?"Remux":u.includes("BLURAY")||u.includes("BLU-RAY")?"BluRay":u.includes("WEB-DL")||u.includes("WEBDL")?"WEB-DL":u.includes("WEBRIP")?"WEBRip":u.includes("CAM")?"CAM":"";
  const codec=u.includes("HEVC")||u.includes("H265")||u.includes("X265")?"HEVC":u.includes("AV1")?"AV1":u.includes("H264")||u.includes("X264")?"H.264":"";
  const audio=u.includes("ATMOS")?"Atmos":u.includes("TRUEHD")?"TrueHD":u.includes("5.1")?"5.1":"";
  const size=Number(s.behaviorHints?.videoSize||0);
  const rank=resolution==="2160p"?5:resolution==="1080p"?4:resolution==="720p"?3:1;
  return {stream:s,resolution,quality,codec,audio,size,score:rank,label:[s._addonName||s.name,resolution,quality,codec,audio,size?((size/1e9).toFixed(1)+" GB"):""].filter(Boolean).join(" · ")};
}
export function processStreams(input:RawStream[]):StreamInfo[]{
  const cfg=settings();
  const streamCfg=cfg.streams||{};
  const exclude=String(streamCfg.excludeKeywords??cfg.excludeKeywords??"").toLowerCase().split(",").map((x:string)=>x.trim()).filter(Boolean);
  const preferred=String(cfg.preferredQuality||"Auto").replace("4K","2160p");
  const maxRaw=cfg.maxSizeGB??cfg.maxSize??50;
  const max=typeof maxRaw==="string"?parseFloat(maxRaw):Number(maxRaw);
  const dedupe=streamCfg.dedupe??cfg.dedupe??true;
  const seen=new Set<string>();
  const out:StreamInfo[]=[];
  for(const s of input){
    const info=parse(s),lower=text(s).toLowerCase();
    if(exclude.some((x:string)=>lower.includes(x)))continue;
    if(info.size&&max>0&&info.size/1e9>max)continue;
    const key=s.url||s.externalUrl||s.infoHash||s.ytId||info.label;
    if(dedupe&&seen.has(key))continue;seen.add(key);
    info.score+=(preferred!=="Auto"&&preferred===info.resolution)?20:0;
    if(info.quality==="CAM")info.score-=10;
    out.push(info);
  }
  return out.sort((a,b)=>b.score-a.score||(b.size-a.size));
}
