// Phone TV preview runs the full 1920x1080 app inside a scaled iframe.
// On iOS Safari that blew past the tab memory limit (dozens of decoded
// 1920x1080 backdrops + composited filter layers), so WebKit killed the
// page and reloaded it in a loop. Lite mode keeps the preview light.
export const PREVIEW_LITE=typeof window!=="undefined"
  &&new URLSearchParams(window.location.search).get("tvframe")==="1";

// metahub "medium"/"large" backgrounds are full 1920x1080 (~780 KB each);
// "small" is 480x270 (~26 KB) which is plenty at preview scale.
export function previewImg<T extends string|undefined>(src:T):T{
  if(!PREVIEW_LITE||!src)return src;
  return src.replace(/(metahub\.space\/background\/)(?:medium|large)\//,"$1small/") as T;
}

export function enablePreviewLite(){
  if(PREVIEW_LITE)document.documentElement.classList.add("tv-preview-lite");
}
