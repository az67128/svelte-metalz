import { serverUrl } from "../config";

export function getAlbums(
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1
) {
  return fetch(`${serverUrl}?year=${year}&month=${month}`)
    .then(data => data.json())
    .then(res => res.body);
}
