import { siteContent } from './content.js';
export const projectPhotos = siteContent.media.filter(m=>m.gallery&&m.published&&!m.deletedAt).map(m=>({...m,id:m.photoId}));
export function photosForAlbum(album) { return album === 'all' ? [...projectPhotos] : projectPhotos.filter(photo=>photo.album===album); }
