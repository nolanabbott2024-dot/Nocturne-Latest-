// Nocturne TV runtime contracts
export type TVRemoteAction =
  | "up" | "down" | "left" | "right"
  | "select" | "back" | "playPause" | "menu";

export type TVNavigationSnapshot = {
  route: string;
  focusKey: string | null;
  scrollX?: number;
  scrollY?: number;
  rowId?: string;
};

export type MediaItem = {
  id: string;
  type: string;
  name: string;
  poster?: string;
  background?: string;
  logo?: string;
  description?: string;
  releaseInfo?: string;
  runtime?: string;
  contentRating?: string;
  imdbRating?: string;
  genres?: string[];
  videos?: Episode[];
  trailerUrl?: string;
  trailerYtId?: string;
  sourceBase?: string;
};

export type Episode = {
  id: string;
  title?: string;
  season?: number;
  episode?: number;
  overview?: string;
  thumbnail?: string;
  runtime?: string;
};

export type Catalog = {
  addonId: string;
  addonName: string;
  baseUrl: string;
  id: string;
  type: string;
  name: string;
  searchable?: boolean;
  genres?: string[];
};

export type AddonDescriptor = {
  transportUrl: string;
  manifest?: any;
  enabled?: boolean;
};
