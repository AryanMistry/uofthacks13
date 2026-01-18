export const ONLINE_FURNITURE_ASSETS: Record<string, string[]> = {
  sofa: [
    'https://modelviewer.dev/shared-assets/models/Sofa.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/sofa.glb',
  ],
  couch: [
    'https://modelviewer.dev/shared-assets/models/Sofa.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/sofa.glb',
  ],
  sectional: [
    'https://modelviewer.dev/shared-assets/models/Sofa.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/sofa.glb',
  ],
  loveseat: [
    'https://modelviewer.dev/shared-assets/models/Chair.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/armchair.glb',
  ],
  chair: [
    'https://modelviewer.dev/shared-assets/models/Chair.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/chair.glb',
  ],
  armchair: [
    'https://modelviewer.dev/shared-assets/models/Chair.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/armchair.glb',
  ],
  'dining chair': [
    'https://modelviewer.dev/shared-assets/models/Chair.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/chair.glb',
  ],
  'office chair': [
    'https://modelviewer.dev/shared-assets/models/Chair.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/chair.glb',
  ],
  table: [
    'https://modelviewer.dev/shared-assets/models/Table.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/table.glb',
  ],
  'coffee table': [
    'https://modelviewer.dev/shared-assets/models/Table.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/coffee_table.glb',
  ],
  'dining table': [
    'https://modelviewer.dev/shared-assets/models/Table.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/table.glb',
  ],
  desk: [
    'https://modelviewer.dev/shared-assets/models/Table.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/desk.glb',
  ],
  bed: [
    'https://modelviewer.dev/shared-assets/models/Bed.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/bed.glb',
  ],
  'queen bed': [
    'https://modelviewer.dev/shared-assets/models/Bed.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/bed.glb',
  ],
  'king bed': [
    'https://modelviewer.dev/shared-assets/models/Bed.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/bed.glb',
  ],
  'twin bed': [
    'https://modelviewer.dev/shared-assets/models/Bed.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/bed.glb',
  ],
  bookshelf: [
    'https://modelviewer.dev/shared-assets/models/Shelf.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/bookshelf.glb',
  ],
  shelf: [
    'https://modelviewer.dev/shared-assets/models/Shelf.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/bookshelf.glb',
  ],
  cabinet: [
    'https://modelviewer.dev/shared-assets/models/Cabinet.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/cabinet.glb',
  ],
  dresser: [
    'https://modelviewer.dev/shared-assets/models/Cabinet.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/dresser.glb',
  ],
  nightstand: [
    'https://modelviewer.dev/shared-assets/models/Cabinet.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/nightstand.glb',
  ],
  'tv stand': [
    'https://modelviewer.dev/shared-assets/models/TV_Stand.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/tv_stand.glb',
  ],
  tv: [
    'https://modelviewer.dev/shared-assets/models/TV.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/tv.glb',
  ],
  lamp: [
    'https://modelviewer.dev/shared-assets/models/Lamp.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/lamp.glb',
  ],
  'floor lamp': [
    'https://modelviewer.dev/shared-assets/models/Lamp.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/lamp.glb',
  ],
  'table lamp': [
    'https://modelviewer.dev/shared-assets/models/Lamp.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/lamp.glb',
  ],
  rug: [
    'https://modelviewer.dev/shared-assets/models/Rug.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/rug.glb',
  ],
  carpet: [
    'https://modelviewer.dev/shared-assets/models/Rug.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/rug.glb',
  ],
  plant: [
    'https://modelviewer.dev/shared-assets/models/Plant.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/plant.glb',
  ],
  mirror: [
    'https://modelviewer.dev/shared-assets/models/Mirror.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/mirror.glb',
  ],
  'tv console': [
    'https://modelviewer.dev/shared-assets/models/TV_Stand.glb',
    'https://raw.githubusercontent.com/pmndrs/drei-assets/master/tv_stand.glb',
  ],
};

export function getOnlineModelUrls(label: string): string[] {
  const lower = label.toLowerCase();
  for (const [key, urls] of Object.entries(ONLINE_FURNITURE_ASSETS)) {
    if (lower.includes(key)) return urls;
  }
  return [];
}

export function getOnlineModelUrl(label: string): string | null {
  const urls = getOnlineModelUrls(label);
  return urls.length > 0 ? urls[0] : null;
}
