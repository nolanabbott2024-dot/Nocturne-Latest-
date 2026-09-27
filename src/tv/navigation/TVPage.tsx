import { PropsWithChildren,useEffect,useRef } from "react";
import { FocusContext,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { motion } from "motion/react";
import { useNavigationStore } from "../../stores/navigationStore";

export function TVPage({route,initialFocusKey,children}:PropsWithChildren<{route:string;initialFocusKey?:string}>){
  const {ref,focusKey}=useFocusable({focusKey:`page:${route}`,trackChildren:true,saveLastFocusedChild:true});
  const remembered=useNavigationStore(s=>s.pageFocusHistory[route]);
  const scroll=useNavigationStore(s=>s.scrollHistory[route]);
  const saveScroll=useNavigationStore(s=>s.saveScroll);
  const node=useRef<HTMLElement|null>(null);
  useEffect(()=>{
    const el=node.current;if(!el)return;
    if(scroll)requestAnimationFrame(()=>el.scrollTo(scroll.x,scroll.y));
    const wanted=remembered||initialFocusKey||focusKey;
    const id=requestAnimationFrame(()=>{void setFocus(wanted)});
    const onScroll=()=>saveScroll(route,el.scrollLeft,el.scrollTop);
    el.addEventListener("scroll",onScroll,{passive:true});
    return()=>{cancelAnimationFrame(id);el.removeEventListener("scroll",onScroll)};
  },[route,remembered,initialFocusKey,focusKey]);
  return <FocusContext.Provider value={focusKey}>
    <motion.main ref={(n)=>{(ref as any).current=n;node.current=n}} className="tv-page"
      initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
      transition={{duration:.32,ease:[.2,.75,.25,1]}}>
      {children}
    </motion.main>
  </FocusContext.Provider>;
}
