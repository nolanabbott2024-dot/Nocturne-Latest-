import { FocusContext,doesFocusableExist,setFocus,useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { Search,ChevronDown,Compass,Settings,UserRound } from "lucide-react";
import { useEffect,useState,type ReactNode } from "react";
import { useNavigationStore } from "../../stores/navigationStore";
import { useTVFocusable } from "../focus/useTVFocusable";

const ITEMS=[["search","Search"],["home","Home"],["shows","Shows"],["movies","Movies"],["library","My Nocturne"]] as const;

// Keep stable focus IDs so saved page and Back-stack focus survive the new layout.
export function TVSidebar({route,onRoute}:{route:string;onRoute:(r:string)=>void}){
 const {ref,focusKey}=useFocusable({focusKey:"sidebar",trackChildren:true,saveLastFocusedChild:true});
 const [menu,setMenu]=useState(false);
 useEffect(()=>{const close=()=>{setMenu(false);void setFocus("sidebar:profile")};window.addEventListener("nocturne-overlay-back",close);return()=>window.removeEventListener("nocturne-overlay-back",close)},[]);
 const down=()=>{
   const state=useNavigationStore.getState();
   const target=state.pageFocusHistory[route]||`${route}:hero:play`;
   if(doesFocusableExist(target))void setFocus(target);
   else void setFocus(`page:${route}`);
 };
 const navigate=(id:string)=>{setMenu(false);onRoute(id)};
 return <FocusContext.Provider value={focusKey}>
  <header ref={ref as any} className="tv-topbar">
   <NavButton id="profile" label="Profile and settings" className="tv-profile" onPress={()=>{setMenu(!menu);if(!menu)requestAnimationFrame(()=>setFocus("sidebar:settings"))}} onDown={down}>
    <span className="profile-avatar"><UserRound/></span><ChevronDown className="profile-chevron"/>
   </NavButton>
   <nav className="tv-topnav" aria-label="Main navigation">
    {ITEMS.map(([id,label])=><NavButton key={id} id={id} label={label} active={route===id} onPress={()=>navigate(id)} onDown={down} className={id==="search"?"nav-search":""}>
      {id==="search"?<Search/>:label}
    </NavButton>)}
   </nav>
   <span className="nocturne-monogram" aria-label="Nocturne">N</span>
   {menu&&<div className="profile-menu" data-tv-overlay="true">
    <NavButton id="settings" label="Settings" onPress={()=>navigate("settings")}><Settings/> Settings</NavButton>
    <NavButton id="discover" label="Discover" onPress={()=>navigate("discover")}><Compass/> Discover</NavButton>
   </div>}
  </header>
 </FocusContext.Provider>
}
function NavButton({id,label,active,onPress,onDown,className="",children}:{id:string;label:string;active?:boolean;onPress:()=>void;onDown?:()=>void;className?:string;children:ReactNode}){
 const {ref,focused,focusSelf}=useTVFocusable({focusKey:`sidebar:${id}`,route:"sidebar",rowId:"sidebar",onPress,
   onArrowPress:direction=>{if(direction==="down"&&onDown){onDown();return false}return true}
 });
 return <button ref={ref as any} aria-label={label} aria-current={active?"page":undefined} className={`topnav-button ${className} ${active?"active":""} ${focused?"is-focused":""}`}
  onMouseEnter={()=>focusSelf()} onClick={onPress}>{children}</button>
}
