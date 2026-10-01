import React,{useEffect,useState} from "react";
import { enablePreviewLite } from "./preview/lite";
import ReactDOM from "react-dom/client";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
import { TVFocusProvider } from "./tv/focus/TVFocusProvider";
import { MobileTVPreview } from "./preview/MobileTVPreview";
import App from "./App";
import "./styles.css";
import "./reference-tv.css";

const client=new QueryClient({defaultOptions:{queries:{refetchOnWindowFocus:false,staleTime:300000}}});

function useNarrowPreview(){
  const [narrow,setNarrow]=useState(()=>window.matchMedia("(max-width: 900px)").matches);
  useEffect(()=>{
    const mq=window.matchMedia("(max-width: 900px)");
    const update=()=>setNarrow(mq.matches);
    mq.addEventListener("change",update);
    return()=>mq.removeEventListener("change",update);
  },[]);
  return narrow;
}

function RealTVApp(){
  useEffect(()=>{
    const onMessage=(event:MessageEvent)=>{
      if(event.data?.type!=="nocturne-preview-key"||typeof event.data.key!=="string")return;
      const key=event.data.key;
      window.dispatchEvent(new KeyboardEvent("keydown",{key,code:key,bubbles:true,cancelable:true}));
      window.dispatchEvent(new KeyboardEvent("keyup",{key,code:key,bubbles:true,cancelable:true}));
    };
    window.addEventListener("message",onMessage);
    return()=>window.removeEventListener("message",onMessage);
  },[]);
  return <QueryClientProvider client={client}><TVFocusProvider><App/></TVFocusProvider></QueryClientProvider>;
}

function Root(){
  const narrow=useNarrowPreview();
  const params=new URLSearchParams(window.location.search);
  const framed=params.get("tvframe")==="1";
  const native=typeof window.NocturneNative!=="undefined";
  if(narrow&&!framed&&!native)return <MobileTVPreview/>;
  return <RealTVApp/>;
}

enablePreviewLite();
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root/></React.StrictMode>);
