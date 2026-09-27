import { useQueries,useQuery } from "@tanstack/react-query";
import { useProviderStore } from "../stores/providerStore";
import { loadAddon,loadCatalog } from "./stremio";
import type { Catalog } from "../types/tv";

export function useAddons(){
  const addons=useProviderStore(s=>s.addons.filter(a=>a.enabled!==false));
  const queries=useQueries({queries:addons.map(d=>({
    queryKey:["addon",d.transportUrl],
    queryFn:({signal}:any)=>loadAddon(d,signal),
    staleTime:15*60_000,retry:1
  }))});
  return queries.flatMap(q=>q.data?[q.data]:[]);
}
export function useCatalog(c:Catalog|undefined,extra:Record<string,string>={}){
  return useQuery({
    queryKey:["catalog",c?.baseUrl,c?.type,c?.id,extra],
    queryFn:({signal})=>loadCatalog(c!,extra,signal),
    enabled:!!c,
    staleTime:10*60_000,gcTime:30*60_000,retry:1
  });
}
