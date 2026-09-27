import { useNavigationStore } from "../../stores/navigationStore";
import type { TVNavigationSnapshot } from "../../types/tv";

export const BackStack={
  push(s:TVNavigationSnapshot){useNavigationStore.getState().push(s);},
  pop(){return useNavigationStore.getState().pop();}
};
