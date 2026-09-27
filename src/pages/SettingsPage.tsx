import { useEffect,useState } from "react";
import { AnimatePresence,motion } from "motion/react";
import { setFocus } from "@noriginmedia/norigin-spatial-navigation";
import { TVPage } from "../tv/navigation/TVPage";
import { TVDialog } from "../tv/feedback/TVDialog";
import { useProviderStore } from "../stores/providerStore";
import { useTVFocusable } from "../tv/focus/useTVFocusable";
import { loadAddon } from "../data/stremio";
import { useSettingsStore } from "../stores/settingsStore";

function readSettings(){try{return JSON.parse(localStorage.getItem("settings")||"{}")}catch{return{}}}
function writeSettings(next:any){localStorage.setItem("settings",JSON.stringify(next));window.dispatchEvent(new Event("nocturne-settings"))}

export function SettingsPage(){
 const addons=useProviderStore(s=>s.addons);
 const install=useProviderStore(s=>s.install);
 const remove=useProviderStore(s=>s.remove);
 const toggle=useProviderStore(s=>s.toggle);
 const [installOpen,setInstallOpen]=useState(false);
 const [url,setUrl]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const settings=useSettingsStore();
 const patchSettings=useSettingsStore(s=>s.patch);
 const update=(patch:any)=>{patchSettings(patch);writeSettings({...readSettings(),...patch})};
 const closeInstall=()=>{setInstallOpen(false);requestAnimationFrame(()=>{void setFocus("settings:install-addon")})};
 const verifyInstall=async()=>{
   let target=url.trim().replace(/^stremio:\/\//i,"https://");
   if(!/^https?:\/\//i.test(target)){setError("Enter a complete addon URL.");return}
   if(!target.endsWith("/manifest.json"))target=target.replace(/\/+$/,"")+"/manifest.json";
   setBusy(true);setError("");
   try{
     const addon=await loadAddon({transportUrl:target,enabled:true});
     install(target,addon.manifest);closeInstall();setUrl("");
     requestAnimationFrame(()=>setFocus("settings:install-addon"));
   }catch(e:any){setError(e?.message||"Could not install this addon.")}
   finally{setBusy(false)}
 };
 return <TVPage route="settings">
  <header className="page-title"><h1>Settings</h1><p>Providers, playback and TV behavior.</p></header>
  <section className="settings-list">
   <h2>Add-ons</h2>
   <SettingRow id="install-addon" label="Install Add-on" value="＋" onPress={()=>setInstallOpen(true)}/>
   {addons.map((a,i)=><ProviderRow key={a.transportUrl} addon={a} i={i} onToggle={()=>toggle(a.transportUrl)} onRemove={()=>remove(a.transportUrl)}/>)}

   <h2>Playback</h2>
   <ChoiceSetting id="quality" label="Preferred Quality" value={settings.preferredQuality||"Auto"} choices={["Auto","2160p","1080p","720p"]} onChange={(v:string)=>update({preferredQuality:v})}/>
   <ChoiceSetting id="size" label="Maximum File Size" value={String(settings.maxSizeGB??50)+" GB"} choices={["10","25","50","100","0"]} format={(v:string)=>v==="0"?"Unlimited":v+" GB"} onChange={(v:string)=>update({maxSizeGB:Number(v)})}/>
   <ToggleSetting id="dedupe" label="Merge Duplicate Sources" value={settings.dedupe!==false} onChange={(v:boolean)=>update({dedupe:v})}/>
   <ToggleSetting id="previews" label="Trailer Previews" value={settings.previews!==false} onChange={(v:boolean)=>update({previews:v})}/>
   <ToggleSetting id="preview-audio" label="Trailer Audio" value={settings.previewAudio!==false} onChange={(v:boolean)=>update({previewAudio:v})}/>
   <ToggleSetting id="motion" label="Reduced Motion" value={!!settings.reducedMotion} onChange={(v:boolean)=>update({reducedMotion:v})}/>
  </section>
  <AnimatePresence>{installOpen&&<TVDialog id="install-addon-dialog" initialFocusKey="settings:addon-url" onClose={closeInstall}>
    <h2>Install Add-on</h2><p className="dialog-copy">Paste a Stremio manifest URL. Nocturne will verify it before saving.</p>
    <FocusableInput focusKey="settings:addon-url" value={url} onChange={setUrl}/>
    {error&&<div className="dialog-error">{error}</div>}
    <div className="dialog-actions"><DialogButton focusKey="settings:addon-install" label={busy?"Checking…":"Install"} onPress={verifyInstall}/><DialogButton focusKey="settings:addon-cancel" label="Cancel" onPress={closeInstall}/></div>
  </TVDialog>}</AnimatePresence>
 </TVPage>
}

function ProviderRow({addon,i,onToggle,onRemove}:any){
 const [removeMode,setRemoveMode]=useState(false);
 return <div className="provider-setting">
  <SettingRow id={"provider-"+i} label={addon.manifest?.name||safeHost(addon.transportUrl)} value={addon.enabled===false?"Disabled":"Enabled"} onPress={onToggle}/>
  {removeMode?<SettingRow id={"provider-remove-confirm-"+i} label="Press Select to confirm removal" value="Remove" onPress={onRemove}/>:<SettingRow id={"provider-remove-"+i} label="Remove provider" value="×" onPress={()=>setRemoveMode(true)}/>}
 </div>
}
function safeHost(url:string){try{return new URL(url).hostname}catch{return "Add-on"}}
function SettingRow({id,label,value,onPress}:any){
 const {ref,focused}=useTVFocusable({focusKey:"settings:"+id,route:"settings",rowId:"settings",onPress});
 return <motion.button ref={ref as any} className="setting-row" animate={{scale:focused?1.018:1,x:focused?8:0}}><span>{label}</span><b>{value}</b></motion.button>
}
function ToggleSetting({id,label,value,onChange}:any){return <SettingRow id={id} label={label} value={value?"On":"Off"} onPress={()=>onChange(!value)}/>}
function ChoiceSetting({id,label,value,choices,onChange,format=(x:any)=>x}:any){
 const current=choices.findIndex((x:any)=>format(x)===value||x===value);
 return <SettingRow id={id} label={label} value={value} onPress={()=>onChange(choices[(current+1+choices.length)%choices.length])}/>
}
function FocusableInput({focusKey,value,onChange}:any){
 const {ref,focused}=useTVFocusable({focusKey,route:"settings",rowId:"dialog",onPress:()=>{(ref.current as HTMLInputElement)?.focus()}});
 return <motion.input ref={ref as any} className="tv-input" value={value} onChange={(e:any)=>onChange(e.target.value)}
  placeholder="https://…/manifest.json" animate={{scale:focused?1.01:1,borderColor:focused?"#fff":"rgba(255,255,255,.18)"}}/>;
}
function DialogButton({focusKey,label,onPress}:any){
 const {ref,focused}=useTVFocusable({focusKey,route:"settings",rowId:"dialog",onPress});
 return <motion.button ref={ref as any} className="dialog-button" animate={{scale:focused?1.04:1,backgroundColor:focused?"#fff":"rgba(255,255,255,.12)",color:focused?"#000":"#fff"}}>{label}</motion.button>
}
