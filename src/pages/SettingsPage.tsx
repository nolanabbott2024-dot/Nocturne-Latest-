import { TVPage } from "../tv/navigation/TVPage";
import { useProviderStore } from "../stores/providerStore";
import { motion } from "motion/react";
import { useTVFocusable } from "../tv/focus/useTVFocusable";
export function SettingsPage(){
 const addons=useProviderStore(s=>s.addons);
 return <TVPage route="settings"><header className="page-title"><h1>Settings</h1><p>Providers, playback and TV behavior.</p></header><section className="settings-list"><h2>Add-ons</h2>{addons.map((a,i)=><SettingRow key={a.transportUrl} id={"addon-"+i} label={a.manifest?.name||new URL(a.transportUrl).hostname} value={a.enabled===false?"Disabled":"Enabled"}/>)}
 <h2>TV</h2><SettingRow id="motion" label="Focus motion" value="Spring"/><SettingRow id="trailer" label="Trailer dwell" value="1.5 seconds"/><SettingRow id="safe-zone" label="Focus safe zone" value="20%–80%"/></section></TVPage>
}
function SettingRow({id,label,value}:any){const {ref,focused}=useTVFocusable({focusKey:"settings:"+id,route:"settings",rowId:"settings",onPress:()=>{}});return <motion.button ref={ref as any} className="setting-row" animate={{scale:focused?1.018:1,x:focused?8:0}}><span>{label}</span><b>{value}</b></motion.button>}
