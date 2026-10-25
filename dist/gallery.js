import { photosForAlbum } from './project-data.js';

const dialog = document.querySelector('#project-dialog');
const image = document.querySelector('#gallery-image');
const thumbnails = document.querySelector('#gallery-thumbs');
let photos = [], position = 0;
function showPhoto(index) {
  position = (index + photos.length) % photos.length;
  const photo = photos[position];
  image.src = photo.src;
  image.alt = photo.alt;
  document.querySelector('#gallery-photo-title').textContent = photo.title;
  document.querySelector('#gallery-photo-caption').textContent = photo.caption;
  document.querySelector('#gallery-counter').textContent = (position + 1) + ' van ' + photos.length;
  thumbnails.querySelectorAll('button').forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === position));
  });
  for (const offset of [-1, 1]) {
    const preload = new Image();
    preload.src = photos[(position + offset + photos.length) % photos.length].src;
  }
}
function openGallery(album, photoId) {
  photos = photosForAlbum(album);
  if (!photos.length) return;
  document.querySelector('#gallery-title').textContent = album === 'dark' ? 'Donkere kozijnen & houtwerk' : album === 'white' ? 'Wit buitenschilderwerk' : 'Onze projectgalerij';
  thumbnails.replaceChildren(...photos.map((photo, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Bekijk foto ' + (index + 1) + ': ' + photo.title);
    const thumbnail = document.createElement('img');
    thumbnail.src = photo.src;
    thumbnail.alt = '';
    button.append(thumbnail);
    button.addEventListener('click', () => showPhoto(index));
    return button;
  }));
  const requested = photos.findIndex(photo => photo.id === photoId);
  showPhoto(requested >= 0 ? requested : album === 'all' ? photos.length - 1 : 0);
  dialog.showModal();
}
document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => openGallery(button.dataset.gallery, button.dataset.photo)));
document.querySelector('#gallery-prev').addEventListener('click', () => showPhoto(position - 1));
document.querySelector('#gallery-next').addEventListener('click', () => showPhoto(position + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); showPhoto(position + (event.key === 'ArrowRight' ? 1 : -1));
  } else if (event.key === 'Home') { event.preventDefault(); showPhoto(0); }
  else if (event.key === 'End') { event.preventDefault(); showPhoto(photos.length - 1); }
});
let startX = null;
image.addEventListener('touchstart', event => { startX = event.touches.length === 1 ? event.touches[0].clientX : null; }, { passive: true });
image.addEventListener('touchend', event => {
  if (startX === null) return;
  const delta = event.changedTouches[0].clientX - startX;
  if (Math.abs(delta) > 65) showPhoto(position + (delta < 0 ? 1 : -1));
  startX = null;
}, { passive: true });
document.querySelector('#gallery-enquiry').addEventListener('click', () => {
  dialog.close();
  window.location.assign('/offerte/?dienst=buiten');
});
