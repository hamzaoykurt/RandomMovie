export interface MediaItem {
  id: string | number;
  t: string; // Title
  y: number; // Year
  r: number; // Rating
  u: string; // Url
  img: string | null; // Image path
  type: 'movie' | 'show' | 'season' | 'episode';
}

export interface Database {
  movies: MediaItem[];
  shows: MediaItem[];
  watched: MediaItem[];
}

export type ViewState = 'welcome' | 'dashboard';
export type ModalState = 'result' | 'settings' | 'add' | null;

export interface ToastMessage {
  msg: string;
  type: 'success' | 'error';
}