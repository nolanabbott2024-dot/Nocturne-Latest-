import { FocusContext,setFocus,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "motion/react";
import { Home,Film,Tv,Compass,Search,Library,Settings } from "lucide-react";
import { useNavigationStore } from "../../stores/navigationStore";

const ITEMS=[
  ["home","Home",Home],["movies","Movies",Film],["shows","TV",Tv],["discover","Discover",Compass],
  ["search","Search",Search],["library","Library",Library],["settings","Settings",Settings]
] as const;

export function TVSidebar({route,onRoute}:{route:string;onRoute:(r:string)=>void}){
  const {ref,focusKey,hasFocusedChild}=useFocusable({focusKey:"sidebar",trackChildren:true});
  const saveContent=useNavigationStore(s=>s.saveContentFocus);
  const contentFocus=useNavigationStore(s=>s.contentFocusKey);
  return <FocusContext.Provider value={focusKey}>
    <motion.aside ref={ref as any} className={"tv-sidebar "+(hasFocusedChild?"open":"")}
      animate={{width:hasFocusedChild?250:72}} transition={{type:"spring",stiffness:380,damping:34}}>
      {ITEMS.map(([id,label,Icon])=><SidebarItem key={id} id={id} label={label} active={route===id} Icon={Icon}
        onPress={()=>onRoute(id)}
        onFocus={()=>{const current=useNavigationStore.getState().focusedKey;if(current&&!current.startsWith("sidebar:"))saveContent(current)}}
        onRight={()=>{if(contentFocus)try{setFocus(contentFocus)}catch{}}}/>)}
    </motion.aside>
  </FocusContext.Provider>
}
function SidebarItem({id,label,active,Icon,onPress,onFocus,onRight}:any){
  const {ref,focused}=useFocusable({focusKey:`sidebar:${id}`,onEnterPress:onPress,onFocus,onArrowPress:(dir)=>{
    if(dir==="right"){onRight();return false}return true;
  }});
  return <motion.button ref={ref as any} className={"sidebar-item "+(active?"active":"")}
    onFocus={onFocus} animate={{scale:focused?1.04:1,backgroundColor:focused?"rgba(255,255,255,.96)":"rgba(255,255,255,0)"}}>
    <Icon size={22}/><span>{label}</span>
  </motion.button>
}
