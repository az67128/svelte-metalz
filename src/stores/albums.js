import { writable, get } from 'svelte/store';
import { getAlbums } from '../api';

export const isLoading = writable(false);
export const hasError = writable(false);

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
