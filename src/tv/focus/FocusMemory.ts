import { useNavigationStore } from "../../stores/navigationStore";

export const FocusMemory={
  page(route:string){return useNavigationStore.getState().pageFocusHistory[route]||null;},
  row(rowId:string){return useNavigationStore.getState().rowFocusHistory[rowId]||null;},
  remember(route:string,rowId:string|undefined,key:string){
    useNavigationStore.getState().setFocus(key,route,rowId);
  },
  snapshot(route:string){
    const s=useNavigationStore.getState();
    const pos=s.scrollHistory[route]||{x:0,y:0};
    return {route,focusKey:s.focusedKey,scrollX:pos.x,scrollY:pos.y};
  }
};
