import type { Catalog,MediaItem } from "../types/tv";
import { CINEMETA_BASE,loadCatalog,loadMeta } from "./stremio";

export type PlannedRow={
  id:string;
  title:string;
  kind:"top10"|"standard";
  type:"movie"|"series";
  items:MediaItem[];
};

const MCU=[
"tt0371746","tt0800080","tt1228705","tt0800369","tt0458339","tt0848228",
"tt1300854","tt1981115","tt1843866","tt2015381","tt2395427","tt0478970",
"tt3498820","tt1211837","tt3896198","tt2250912","tt3501632","tt1825683",
"tt4154756","tt5095030","tt4154796","tt6320628","tt4154664","tt3480822",
"tt9376612","tt9419884","tt9114286","tt10648342","tt10954600","tt14513804"
];
const STAR_WARS=[
"tt0076759","tt0080684","tt0086190","tt0120915","tt0121765","tt0121766",
"tt2488496","tt3748528","tt2527336","tt3778644","tt2527338"
];
const HARRY_POTTER=[
"tt0241527","tt0295297","tt0304141","tt0330373","tt0373889","tt0417741","tt0926084","tt1201607"
];
const SCREAM=[
"tt0117571","tt0120082","tt0134084","tt0363988","tt11245972","tt17663992"
];
const HALLOWEEN=[
"tt0077651","tt0082495","tt0085636","tt0095271","tt0097474","tt0113253","tt0120694","tt0373883","tt1066535","tt1311067","tt1502407","tt10665338"
];
const MISSION_IMPOSSIBLE=["tt0117060","tt0120755","tt0317919","tt1229238","tt2381249","tt4912910","tt9603212"];
const NOLAN=["tt0154506","tt0209144","tt0278504","tt0372784","tt0482571","tt0468569","tt1375666","tt1345836","tt0816692","tt5013056","tt6723592","tt15398776"];
const TOP_GUN=["tt0092099","tt1745960"];
const ALIEN=["tt0078748","tt0084787","tt0090605","tt0103644","tt2316204","tt1446714","tt18412256"];
const MATRIX=["tt0133093","tt0234215","tt0242653","tt10838180"];

function uniq(items:MediaItem[]){
  const seen=new Set<string>();return items.filter(x=>x.id&&!seen.has(x.id)&&(seen.add(x.id),true));
}
function roundRobin(groups:MediaItem[][],limit=60){
  const out:MediaItem[]=[];let i=0;
  while(out.length<limit&&groups.some(g=>i<g.length)){
    for(const g of groups)if(i<g.length)out.push(g[i]);
    i++;
  }
  return uniq(out).slice(0,limit);
}
function yearOf(x:MediaItem){const m=String(x.releaseInfo||"").match(/(19|20)\d{2}/);return m?Number(m[0]):0}
function ratingOf(x:MediaItem){const n=Number(x.imdbRating);return Number.isFinite(n)?n:0}

async function metas(ids:string[],signal?:AbortSignal){
  const all=await Promise.all(ids.map(id=>loadMeta(CINEMETA_BASE,"movie",id,signal).catch(()=>null)));
  return all.filter(Boolean) as MediaItem[];
}
async function enrich(items:MediaItem[],signal?:AbortSignal,limit=42){
  const base=uniq(items).slice(0,limit);
  const all=await Promise.all(base.map(async x=>{
    if(x.type!=="movie"&&x.type!=="series")return x;
    try{
      const m=await loadMeta(CINEMETA_BASE,x.type,x.id,signal);
      return {...x,...m,sourceBase:x.sourceBase};
    }catch{return x}
  }));
  return all;
}
function pageDedupe(rows:PlannedRow[],perRow=20){
  const curated=new Set(["mcu","star-wars","harry-potter","horror-icons","mission-impossible","nolan","top-gun","alien","matrix"]);
  const priority=(r:PlannedRow)=>curated.has(r.id)?0:r.kind==="top10"?1:2;
  const indexed=rows.map((r,i)=>({r,i})).sort((a,b)=>priority(a.r)-priority(b.r)||a.i-b.i);
  const used=new Set<string>();
  const resolved=new Map<string,MediaItem[]>();
  for(const {r} of indexed){
    const items=r.items.filter(x=>{
      if(used.has(x.id))return false;
      used.add(x.id);return true;
    }).slice(0,perRow);
    resolved.set(r.id,items);
  }
  return rows.map(r=>({...r,items:resolved.get(r.id)||[]})).filter(r=>r.items.length>=3);
}

export async function buildPageRows(args:{
  route:string;
  type?:"movie"|"series";
  catalogs:Catalog[];
  netflixBase?:string;
  signal?:AbortSignal;
}):Promise<PlannedRow[]>{
  const {route,type,catalogs,netflixBase,signal}=args;
  const wanted=type;
  const relevant=catalogs.filter(c=>!wanted||c.type===wanted);
  const loaded=await Promise.all(relevant.map(c=>loadCatalog(c,{},signal).catch(()=>[])));
  const merged=roundRobin(loaded,90);
  const enriched=await enrich(merged,signal,56);

  const movieOnly=enriched.filter(x=>x.type==="movie");
  const seriesOnly=enriched.filter(x=>x.type==="series");
  const active=wanted==="series"?seriesOnly:wanted==="movie"?movieOnly:enriched;

  const now=new Date().getFullYear();
  const recent=[...active].filter(x=>yearOf(x)>=now-1).sort((a,b)=>yearOf(b)-yearOf(a));
  const acclaimed=[...active].filter(x=>ratingOf(x)>=7.5).sort((a,b)=>ratingOf(b)-ratingOf(a));
  const popular=[...active].sort((a,b)=>ratingOf(b)-ratingOf(a));
  const trending=active.slice(0,40);

  const rows:PlannedRow[]=[];

  if(netflixBase){
    const topTypes:(("movie"|"series"))[]=wanted?[wanted]:["movie","series"];
    for(const t of topTypes){
      const globalCat:Catalog={addonId:"pw.ers.netflix-catalog",addonName:"Streaming Catalogs",baseUrl:netflixBase,id:"netflix-top10-global",type:t,name:"Netflix Top 10 Global"};
      const usCat:Catalog={...globalCat,id:"netflix-top10-US",name:"Netflix Top 10 U.S."};
      const [g,u]=await Promise.all([loadCatalog(globalCat,{},signal).catch(()=>[]),loadCatalog(usCat,{},signal).catch(()=>[])]);
      rows.push({id:`netflix-global-${t}`,title:t==="movie"?"Netflix Top 10 Movies — Global":"Netflix Top 10 Shows — Global",kind:"top10",type:t,items:g});
      rows.push({id:`netflix-us-${t}`,title:t==="movie"?"Netflix Top 10 Movies — U.S.":"Netflix Top 10 Shows — U.S.",kind:"top10",type:t,items:u});
    }
  }

  const genericType=(wanted||"movie") as "movie"|"series";
  rows.push(
    {id:"trending",title:"Trending Now",kind:"standard",type:genericType,items:trending},
    {id:"new-releases",title:wanted==="series"?"New & Returning Shows":"New Releases",kind:"standard",type:genericType,items:recent},
    {id:"popular-week",title:"Popular This Week",kind:"standard",type:genericType,items:popular},
    {id:"critically-acclaimed",title:wanted==="series"?"Critically Acclaimed TV":"Critically Acclaimed",kind:"standard",type:genericType,items:acclaimed}
  );

  if(wanted!=="series"){
    const [mcu,starwars,hp,scream,halloween,mi,nolan,topgun,alien,matrix]=await Promise.all([
      metas(MCU,signal),metas(STAR_WARS,signal),metas(HARRY_POTTER,signal),metas(SCREAM,signal),metas(HALLOWEEN,signal),
      metas(MISSION_IMPOSSIBLE,signal),metas(NOLAN,signal),metas(TOP_GUN,signal),metas(ALIEN,signal),metas(MATRIX,signal)
    ]);
    rows.push(
      {id:"mcu",title:"Marvel Cinematic Universe — In Order",kind:"standard",type:"movie",items:mcu},
      {id:"star-wars",title:"Star Wars — Saga Order",kind:"standard",type:"movie",items:starwars},
      {id:"harry-potter",title:"Harry Potter — In Order",kind:"standard",type:"movie",items:hp},
      {id:"horror-icons",title:"Critically Acclaimed Horror & Slashers",kind:"standard",type:"movie",items:uniq([...scream,...halloween,...acclaimed.filter(x=>(x.genres||[]).some(g=>/horror/i.test(g)))] )},
      {id:"mission-impossible",title:"Mission: Impossible — In Order",kind:"standard",type:"movie",items:mi},
      {id:"nolan",title:"Christopher Nolan Essentials",kind:"standard",type:"movie",items:nolan},
      {id:"top-gun",title:"High-Flying Action",kind:"standard",type:"movie",items:uniq([...topgun,...active.filter(x=>(x.genres||[]).some(g=>/action/i.test(g))).slice(0,12)])},
      {id:"alien",title:"Alien Universe",kind:"standard",type:"movie",items:alien},
      {id:"matrix",title:"The Matrix Collection",kind:"standard",type:"movie",items:matrix}
    );
  }else{
    rows.push(
      {id:"crime-thrillers",title:"Crime & Thriller Series",kind:"standard",type:"series",items:active.filter(x=>(x.genres||[]).some(g=>/crime|thriller/i.test(g)))},
      {id:"sci-fi-tv",title:"Sci-Fi & Fantasy TV",kind:"standard",type:"series",items:active.filter(x=>(x.genres||[]).some(g=>/sci-fi|fantasy/i.test(g)))},
      {id:"comedy-tv",title:"Comedy Series",kind:"standard",type:"series",items:active.filter(x=>(x.genres||[]).some(g=>/comedy/i.test(g)))},
      {id:"drama-tv",title:"Prestige Drama",kind:"standard",type:"series",items:active.filter(x=>ratingOf(x)>=7.4&&(x.genres||[]).some(g=>/drama/i.test(g)))},
      {id:"mystery-tv",title:"Mystery & Suspense",kind:"standard",type:"series",items:active.filter(x=>(x.genres||[]).some(g=>/mystery|thriller/i.test(g)))}
    );
  }

  if(route==="home"){
    const homeRows=rows.filter(r=>[
      "netflix-global-movie","netflix-global-series","netflix-us-movie","netflix-us-series",
      "trending","new-releases","popular-week","critically-acclaimed"
    ].includes(r.id));
    return pageDedupe(homeRows,18);
  }

  return pageDedupe(rows,20);
}
