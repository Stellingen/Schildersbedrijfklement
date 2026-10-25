// Only photographs from the original Klement project gallery are used.
export const projectPhotos = [
  { id: 'dark-detail', src: '/assets/work-0.jpg', album: 'dark', title: 'Donker houtwerk, van dichtbij', caption: 'Kozijnen en het houtwerk rondom de ramen.', alt: 'Detail van donker geschilderde kozijnen en buitenhoutwerk aan een bakstenen woning' },
  { id: 'dark-overview', src: '/assets/work-1.jpg', album: 'dark', title: 'Het geheel maakt het verschil', caption: 'De aansluiting van de donkere kozijnen op de gevel.', alt: 'Overzicht van donker geschilderde kozijnen en een erker aan een woning' },
  { id: 'white-window', src: '/assets/work-2.jpg', album: 'white', title: 'Aandacht voor het kozijn', caption: 'Een kijkje langs het witte raamwerk.', alt: 'Detail van een wit geschilderd raamkozijn' },
  { id: 'white-overhang', src: '/assets/work-3.jpg', album: 'white', title: 'Ook boven uw hoofd', caption: 'De afwerking van het houtwerk onder de overstek.', alt: 'Wit schilderwerk onder een overstek bij de ramen van een woning' },
  { id: 'white-edge', src: '/assets/work-4.jpg', album: 'white', title: 'Tot aan de laatste rand', caption: 'Het witte houtwerk langs de gevel.', alt: 'Detail van wit afgewerkt houtwerk langs een bakstenen gevel' },
  { id: 'white-overview', src: '/assets/work-5.jpg', album: 'white', title: 'Fris wit aan de buitenkant', caption: 'Kozijnen en overstek in één overzicht.', alt: 'Overzicht van witte kozijnen en een overstek aan een woning' }
];
export function photosForAlbum(album) {
  return album === 'all' ? [...projectPhotos] : projectPhotos.filter(photo => photo.album === album);
}
