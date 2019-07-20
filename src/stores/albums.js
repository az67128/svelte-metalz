import { writable, get } from 'svelte/store';
import { getAlbums } from '../utils/api';
import { derived } from 'svelte/store';

export const isLoading = writable(false);
export const hasError = writable(false);
export const coverPreviewSrc = writable(null);
export const filterYandex = writable(false);
export const filterGoogle = writable(false);
export const sortByAphabet = writable(false);
export const showGenreDialog = writable(false);

export const selectedGenres = (() => {
  const { subscribe, set, update } = writable([]);
  return {
    subscribe,
    toggle: genre =>
      update(genres => {
        if (genres.some(item => item === genre)) {
          return genres.filter(item => item !== genre);
        } else {
          return [...genres, genre];
        }
      }),
    reset: () => set([]),
  };
})();

export const albums = (() => {
  const { subscribe, set, update } = writable([]);
  return {
    subscribe,
    get: (year, month) => {
      isLoading.set(true);
      getAlbums(year, month)
        .then(data => set(data))
        .catch(err => hasError.set(true))
        .finally(() => isLoading.set(false));
    },
  };
})();

export const currentMonth = (() => {
  const { subscribe, set, update } = writable(new Date());
  return {
    subscribe,
    nextMonth: () =>
      update(date => {
        return new Date(date.setMonth(date.getMonth() + 1));
      }),
    prevMonth: () =>
      update(date => {
        return new Date(date.setMonth(date.getMonth() - 1));
      }),
  };
})();

window.currentMonth = currentMonth;
currentMonth.subscribe(value => {
  albums.get(value.getFullYear(), value.getMonth() + 1);
});

export const sortedAlbums = derived(
  [albums, filterYandex, filterGoogle, sortByAphabet, selectedGenres],
  ([$albums, $filterYandex, $filterGoogle, $sortByAphabet, $selectedGenres]) => {
    return $albums
      .filter(album => {
        const yandex = $filterYandex ? !!album.yandex_link : true;
        const google = $filterGoogle ? !!album.google_link : true;

        const genre =
          $selectedGenres.length > 0
            ? $selectedGenres.some(
                item => album.genre.toLowerCase().indexOf(item.toLowerCase()) > -1
              )
            : true;
        return yandex && google && genre;
      })
      .sort((a, b) => {
        if ($sortByAphabet) {
          return a.title < b.title ? -1 : 1;
        } else {
          return a.listeners < b.listeners ? 1 : -1;
        }
      });
  }
);
