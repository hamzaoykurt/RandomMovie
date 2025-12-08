import { MediaItem } from '../types';

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";

export const fetchPoster = async (item: MediaItem, apiKey: string): Promise<MediaItem> => {
  if (!item.id || item.img || !apiKey) return item;
  
  // Basic check to see if ID is numeric (TMDB ID) or generated
  if (typeof item.id === 'string' && item.id.startsWith('csv-')) return item;

  try {
    const apiType = (item.type === 'movie') ? 'movie' : 'tv';
    const res = await fetch(`${TMDB_BASE_URL}/${apiType}/${item.id}?api_key=${apiKey}&language=tr-TR`);
    
    if (!res.ok) throw new Error("API Error");

    const data = await res.json();
    const imgPath = data.poster_path || data.still_path;

    if (imgPath) {
      return { ...item, img: imgPath };
    }
  } catch (e) {
    console.warn("Could not fetch poster for", item.t);
  }
  return item;
};