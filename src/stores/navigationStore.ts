import { create } from "zustand";
import type { TVNavigationSnapshot } from "../types/tv";

type NavigationState = {
  focusedKey: string | null;
  previousFocusedKey: string | null;
  contentFocusKey: string | null;
  pageFocusHistory: Record<string,string>;
  rowFocusHistory: Record<string,string>;
  scrollHistory: Record<string,{x:number;y:number}>;
  navigationStack: TVNavigationSnapshot[];
  setFocus: (key:string|null, route?:string, rowId?:string) => void;
  saveContentFocus: (key:string|null) => void;
  saveScroll: (route:string,x:number,y:number) => void;
  push: (snap:TVNavigationSnapshot) => void;
  pop: () => TVNavigationSnapshot | undefined;
};

export const useNavigationStore = create<NavigationState>((set,get)=>({
  focusedKey:null,
  previousFocusedKey:null,
  contentFocusKey:null,
  pageFocusHistory:{},
  rowFocusHistory:{},
  scrollHistory:{},
  navigationStack:[],
  setFocus:(key,route,rowId)=>set(s=>({
    previousFocusedKey:s.focusedKey,
    focusedKey:key,
    pageFocusHistory: route&&key ? {...s.pageFocusHistory,[route]:key}:s.pageFocusHistory,
    rowFocusHistory: rowId&&key ? {...s.rowFocusHistory,[rowId]:key}:s.rowFocusHistory
  })),
  saveContentFocus:(key)=>set({contentFocusKey:key}),
  saveScroll:(route,x,y)=>set(s=>({scrollHistory:{...s.scrollHistory,[route]:{x,y}}})),
  push:(snap)=>set(s=>({navigationStack:[...s.navigationStack,snap]})),
  pop:()=>{
    const stack=get().navigationStack;
    const last=stack[stack.length-1];
    if(last)set({navigationStack:stack.slice(0,-1)});
    return last;
  }
}));
