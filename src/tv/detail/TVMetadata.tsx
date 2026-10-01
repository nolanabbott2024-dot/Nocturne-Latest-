import type { MediaItem } from "../../types/tv";
export function TVMetadata({item}:{item:MediaItem}){
  const parts=[item.type==="series"?"Show":"Movie",item.genres?.[0],item.releaseInfo,item.runtime,item.contentRating].filter(Boolean);
  return <><div className="details-meta">{parts.map((part,i)=><span key={i}>{part}</span>)}</div><p className="details-description">{item.description}</p></>
}
