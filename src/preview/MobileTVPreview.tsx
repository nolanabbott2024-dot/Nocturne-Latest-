import { useEffect,useMemo,useRef,useState } from "react";
import { ArrowDown,ArrowLeft,ArrowRight,ArrowUp,CornerDownLeft,MousePointer2,Monitor } from "lucide-react";

const TV_WIDTH=1920;
const TV_HEIGHT=1080;

function buildFrameUrl(){
  const url=new URL(window.location.href);
  url.searchParams.set("tvframe","1");
  return url.pathname+url.search+url.hash;
}

export function MobileTVPreview(){
  const frameRef=useRef<HTMLDivElement|null>(null);
  const iframeRef=useRef<HTMLIFrameElement|null>(null);
  const [scale,setScale]=useState(1);
  const frameUrl=useMemo(buildFrameUrl,[]);

  useEffect(()=>{
    const node=frameRef.current;
    if(!node)return;
    const update=()=>setScale(Math.min(1,node.clientWidth/TV_WIDTH));
    update();
    const observer=new ResizeObserver(update);
    observer.observe(node);
    return()=>observer.disconnect();
  },[]);

  const sendKey=(key:string)=>{
    const target=iframeRef.current?.contentWindow;
    if(!target)return;
    target.postMessage({type:"nocturne-preview-key",key},"*");
  };

  return <main className="mobile-preview-shell">
    <header className="mobile-preview-header">
      <div>
        <div className="mobile-preview-kicker"><Monitor size={15}/> TV Preview</div>
        <h1>Nocturne</h1>
      </div>
      <span>1920 × 1080</span>
    </header>

    <section className="mobile-tv-bezel">
      <div ref={frameRef} className="mobile-tv-frame">
        <iframe
          ref={iframeRef}
          className="mobile-tv-iframe"
          src={frameUrl}
          title="Nocturne TV preview"
          style={{width:TV_WIDTH,height:TV_HEIGHT,transform:`scale(${scale})`}}
          allow="autoplay; fullscreen"
        />
      </div>
    </section>

    <section className="mobile-preview-remote" aria-label="TV preview remote">
      <div className="mobile-remote-grid">
        <button aria-label="Up" onClick={()=>sendKey("ArrowUp")}><ArrowUp/></button>
        <button aria-label="Left" onClick={()=>sendKey("ArrowLeft")}><ArrowLeft/></button>
        <button className="mobile-remote-select" aria-label="Select" onClick={()=>sendKey("Enter")}><MousePointer2/></button>
        <button aria-label="Right" onClick={()=>sendKey("ArrowRight")}><ArrowRight/></button>
        <button aria-label="Down" onClick={()=>sendKey("ArrowDown")}><ArrowDown/></button>
      </div>
      <button className="mobile-preview-back" onClick={()=>sendKey("Escape")}><CornerDownLeft size={18}/> Back</button>
      <p>Use the touch remote to navigate exactly like the TV app.</p>
    </section>
  </main>
}
