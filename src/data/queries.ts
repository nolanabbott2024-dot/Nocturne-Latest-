import { useMemo } from "react";
import { useQueries,useQuery } from "@tanstack/react-query";
import { useProviderStore } from "../stores/providerStore";
import { loadAddon,loadCatalog } from "./stremio";
import { buildPrimaryRows,buildCuratedRows,buildProviderRows } from "./catalogPlans";
import type { Catalog } from "../types/tv";

export function useAddons(){
  const allAddons=useProviderStore(s=>s.addons);
  const addons=useMemo(()=>allAddons.filter(a=>a.enabled!==false),[allAddons]);
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

export function usePrimaryRows(args:{route:string;type?:"movie"|"series";catalogs:Catalog[];netflixBase?:string}){
  const signature=useMemo(()=>args.catalogs.map(c=>`${c.baseUrl}|${c.type}|${c.id}`).join("::"),[args.catalogs]);
  return useQuery({
    queryKey:["primary-rows",args.route,args.type||"mixed",args.netflixBase||"",signature],
    queryFn:({signal})=>buildPrimaryRows({...args,signal}),
    enabled:args.catalogs.length>0,
    staleTime:20*60_000,gcTime:60*60_000,retry:1
  });
}


export function useProviderRows(args:{route:string;type?:"movie"|"series";catalogs:Catalog[];enabled?:boolean}){
  const signature=useMemo(()=>args.catalogs.map(c=>`${c.baseUrl}|${c.type}|${c.id}`).join("::"),[args.catalogs]);
  return useQuery({
    queryKey:["provider-rows",args.route,args.type||"mixed",signature],
    queryFn:({signal})=>buildProviderRows({...args,signal}),
    enabled:args.enabled!==false&&args.route!=="home"&&args.catalogs.length>0,
    staleTime:20*60_000,gcTime:60*60_000,retry:0
  });
}

export function useCuratedRows(args:{route:string;type?:"movie"|"series";catalogs:Catalog[];enabled?:boolean}){
  const signature=useMemo(()=>args.catalogs.map(c=>`${c.baseUrl}|${c.type}|${c.id}`).join("::"),[args.catalogs]);
  return useQuery({
    queryKey:["curated-rows",args.route,args.type||"mixed",signature],
    queryFn:({signal})=>buildCuratedRows({...args,signal}),
    enabled:args.enabled!==false&&args.route!=="home"&&args.catalogs.length>0,
    staleTime:60*60_000,gcTime:2*60*60_000,retry:0
  });
}
