import type { PropsWithChildren } from "react";
import { useTVFocusable } from "../focus/useTVFocusable";

export function PlayerSurface({children,onPress}:{children:React.ReactNode;onPress:()=>void}){
  const {ref}=useTVFocusable({focusKey:"player:surface",route:"player",rowId:"player-surface",onPress});
  return <div ref={ref as any} className="player-surface">{children}</div>;
}
