import { FocusContext,useFocusable,setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "motion/react";
import { Home,Film,Tv,Compass,Search,Library,Settings } from "lucide-react";
import { useNavigationStore } from "../../stores/navigationStore";
import { useTVFocusable } from "../focus/useTVFocusable";

const ITEMS=[
  ["home","Home",Home],["movies","Movies",Film],["shows","TV Shows",Tv],["discover","Discover",Compass],
  ["search","Search",Search],["library","My List",Library],["settings","Settings",Settings]
] as const;

export function TVSidebar({route,onRoute}:{route:string;onRoute:(r:string)=>void}){
  const {ref,focusKey,hasFocusedChild}=useFocusable({focusKey:"sidebar",trackChildren:true,saveLastFocusedChild:true});
  const saveContent=useNavigationStore(s=>s.saveContentFocus);
  const contentFocus=useNavigationStore(s=>s.contentFocusKey);
  return <FocusContext.Provider value={focusKey}>
    <motion.aside ref={ref as any} className={"tv-sidebar netflix-sidebar "+(hasFocusedChild?"open":"")}
      animate={{width:hasFocusedChild?278:76}} transition={{type:"spring",stiffness:430,damping:38}}>
      <div className="netflix-sidebar-brand"><span>N</span><b>NOCTURNE</b></div>
      <div className="netflix-sidebar-items">
        {ITEMS.map(([id,label,Icon])=><SidebarItem key={id} id={id} label={label} active={route===id} route={route} Icon={Icon}
          onPress={()=>onRoute(id)}
          onFocus={()=>{const s=useNavigationStore.getState();const prior=s.previousFocusedKey;if(prior&&!prior.startsWith("sidebar:"))saveContent(prior)}}
          onRight={()=>{const target=useNavigationStore.getState().contentFocusKey||contentFocus;if(target)requestAnimationFrame(()=>void setFocus(target))}}/>)}
      </div>
    </motion.aside>
  </FocusContext.Provider>
}
function SidebarItem({id,label,active,route,Icon,onPress,onFocus,onRight}:any){
  const {ref,focused}=useTVFocusable({
    focusKey:`sidebar:${id}`,route:"sidebar",rowId:"sidebar",onPress,onFocus,
    onArrowPress:(dir)=>{if(dir==="right"){onRight();return false}return true}
  });
  return <motion.button ref={ref as any} className={"sidebar-item netflix-sidebar-item "+(active?"active":"")}
    animate={{
      scale:focused?1.025:1,
      backgroundColor:focused?"rgba(255,255,255,.95)":"rgba(255,255,255,0)",
      color:focused?"#111":"#fff"
    }}>
    <i className="netflix-active-marker"/>
    <Icon size={23}/><span>{label}</span>
  </motion.button>
}
