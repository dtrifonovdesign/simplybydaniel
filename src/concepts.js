// The designs in the "Concept work" gallery. To add one, put its files in public/concepts/<name>/ and add an item here.
//   type: 'video'  src = an .mp4, optional poster (image shown before play)
//   type: 'image'  src = an image (.webp, .jpg, .png)
//   type: 'page'   src = a page that opens inside the gallery
// Keep paths starting with ./concepts/ . `note` is the small caption under the design, and `href` (optional)
// adds an "Open full page" link.
export const CONCEPTS = [
  {
    title: 'Honda Passport',
    note: 'A bolder homepage with a 3D model of the car. Unofficial concept, not affiliated with Honda. 3D model by BMW’s lost proxy (Sketchfab, CC BY).',
    type: 'video',
    src: './concepts/honda/passport.mp4',
    poster: './concepts/honda/poster.webp',
  },
  {
    title: 'Coca-Cola',
    note: 'A louder, friendlier homepage. Unofficial concept, not affiliated with Coca-Cola.',
    type: 'image',
    src: './concepts/coca-cola/screenshot.webp',
  },
  {
    title: 'craigslist',
    note: 'A warmer craigslist where every listing can say who had the item before. Unofficial concept, not affiliated with craigslist.',
    type: 'page',
    src: './concepts/craigslist/',
    href: './concepts/craigslist/',
  },
];
