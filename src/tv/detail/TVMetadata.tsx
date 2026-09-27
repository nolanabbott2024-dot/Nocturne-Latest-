import type { MediaItem } from "../../types/tv";
export function TVMetadata({item}:{item:MediaItem}){
  const parts=[item.releaseInfo,item.contentRating,item.runtime,item.imdbRating&&`★ ${item.imdbRating}`].filter(Boolean);
  return <><div className="details-meta">{parts.join(" · ")}</div><p className="details-description">{item.description}</p></>
}
