import { create } from "zustand";

type SearchState={
  query:string;
  lastKeyboardKey:string;
  setQuery:(query:string)=>void;
  setLastKeyboardKey:(key:string)=>void;
  clear:()=>void;
};

export const useSearchStore=create<SearchState>((set)=>({
  query:"",
  lastKeyboardKey:"search-key:A",
  setQuery:(query)=>set({query}),
  setLastKeyboardKey:(lastKeyboardKey)=>set({lastKeyboardKey}),
  clear:()=>set({query:"",lastKeyboardKey:"search-key:A"})
}));
