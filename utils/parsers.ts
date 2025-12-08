import { MediaItem } from '../types';

export const parseCSV = (text: string): { movies: MediaItem[], shows: MediaItem[] } => {
  const lines = text.split('\n');
  if (lines.length < 2) return { movies: [], shows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const movies: MediaItem[] = [];
  const shows: MediaItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row: string[] = [];
    let inQuote = false;
    let currentCell = '';
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        row.push(currentCell.trim().replace(/^"|"$/g, ''));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim().replace(/^"|"$/g, ''));

    if (row.length > 1) {
      const obj: Record<string, string> = {};
      headers.forEach((h, index) => {
        obj[h] = row[index];
      });
      
      // Basic support for common CSV exports (Trakt/Letterboxd style logic adapted)
      // Checks for a 'listName' column specifically for 'watchlist' or defaults if not present
      const isWatchlist = obj.listName ? obj.listName === 'watchlist' : true; 

      if (isWatchlist && obj.title) {
        let tmdbId = obj.tmdbId || obj.tmdbShowId;
        if (!tmdbId && obj.url) {
            const match = obj.url.match(/(?:movie|tv)\/(\d+)/);
            if (match) tmdbId = match[1];
        }

        const mediaType = obj.mediaType === 'movie' ? 'movie' : 'show';

        const item: MediaItem = {
          id: tmdbId || `csv-${Math.random().toString(36).substr(2, 9)}`, 
          t: obj.title,
          y: obj.year ? Math.floor(Number(obj.year)) : 0,
          r: obj.tmdbRating ? Number(obj.tmdbRating) : 0,
          u: obj.url || '#',
          img: null,
          type: mediaType as 'movie' | 'show'
        };
        
        if (mediaType === 'movie') movies.push(item);
        else shows.push(item);
      }
    }
  }
  return { movies, shows };
};

export const parseJSON = (text: string): { movies: MediaItem[], shows: MediaItem[] } => {
  try {
    const data = JSON.parse(text);
    const moviesList: MediaItem[] = [];
    const showsList: MediaItem[] = [];
    
    const mediaMap = new Map<string, any>();
    const addToMap = (arr: any[], type: string) => {
      if (!arr) return;
      arr.forEach(item => mediaMap.set(String(item.mediaId), { ...item, _dataType: type }));
    };

    addToMap(data.movies, 'movie');
    addToMap(data.shows, 'show');
    addToMap(data.seasons, 'season');
    addToMap(data.episodes, 'episode');

    // Watchlist specific logic based on provided JSON structure
    const watchlist = data.userLists?.find((l: any) => l.listId === 'watchlist');
    
    // If specific watchlist structure isn't found, try to just dump all media found
    if (!watchlist || !watchlist.items) {
       // Fallback: If it's a generic list of items
       if(Array.isArray(data)) {
          // Handle simple array of objects
          // Not implemented in this specific parser version based on user request logic
          return { movies: [], shows: [] };
       }
       return { movies: [], shows: [] };
    }

    watchlist.items.forEach((watchItem: any) => {
      const media = mediaMap.get(String(watchItem.mediaId));
      
      if (media) {
        let title = media.title || media.name;
        if (media._dataType === 'episode' && media.showTitle) {
           title = `${media.showTitle}: ${media.title || 'Episode ' + media.episodeNumber}`;
        } else if (media._dataType === 'season' && media.showTitle) {
           title = `${media.showTitle}: Season ${media.seasonNumber}`;
        }

        let year = 0;
        const dateStr = media.releaseDate || media.firstAirDate || media.airDate;
        if (dateStr) year = parseInt(dateStr.substring(0, 4));

        const item: MediaItem = {
          id: media.mediaId,
          t: title,
          y: year,
          r: media.rating || 0,
          u: `https://www.themoviedb.org/${media._dataType === 'movie' ? 'movie' : 'tv'}/${media.mediaId}`,
          img: media.posterPath || media.backdropPath || null,
          type: media._dataType === 'movie' ? 'movie' : 'show' // Simplifying types to movie/show for buckets
        };

        if (media._dataType === 'movie') moviesList.push(item);
        else showsList.push(item);
      }
    });

    return { movies: moviesList, shows: showsList };
  } catch (e) {
    console.error("JSON Error:", e);
    return { movies: [], shows: [] };
  }
};