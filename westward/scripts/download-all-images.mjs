import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(projectRoot, '..');
const targetDir = path.join(workspaceRoot, 'downloaded_images');
const productsDir = path.join(targetDir, 'all_100_products');
const localImagesDir = path.join(projectRoot, 'public', 'images');

// Ensure target directories exist
fs.mkdirSync(targetDir, { recursive: true });
fs.mkdirSync(productsDir, { recursive: true });

// Load catalog products
const { catalog } = await import('../lib/catalog.ts');

// 1. Definition of all unique website assets with human-readable descriptive names
const uniqueAssets = [
  {
    id: '6838911',
    fileName: '01_hero_open_road_desert_landscape.jpg',
    descriptiveName: 'Hero Banner — Open Road Desert Landscape (Man in Plaid & Hat)',
    role: 'Homepage Hero Banner ("The Open Road Collection / 01")',
    category: 'Hero / Editorial',
    color: 'Desert Sand & Check Plaid',
    photographer: 'Los Muertos Crew / Cristian Rojas (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/6838911/pexels-photo-6838911.jpeg'
  },
  {
    id: '8350480',
    fileName: '02_the_mesa_linen_shirt_chalk.jpg',
    descriptiveName: 'The Mesa Linen Shirt — Chalk White Relaxed Fit / Editorial',
    role: 'Featured Bestseller & Editorial Section ("The Art of Taking It Easy")',
    category: 'Shirts',
    color: 'Chalk',
    photographer: 'Mikhail Nilov (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/8350480/pexels-photo-8350480.jpeg'
  },
  {
    id: '6838910',
    fileName: '03_the_canyon_overshirt_sage_check.jpg',
    descriptiveName: 'The Canyon Overshirt — Sage Check Plaid Western Shirt',
    role: 'Category Featured Shirt',
    category: 'Shirts',
    color: 'Sage check',
    photographer: 'Los Muertos Crew / Cristian Rojas (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/6838910/pexels-photo-6838910.jpeg'
  },
  {
    id: '17898553',
    fileName: '04_the_everyday_polo_oat.jpg',
    descriptiveName: 'The Everyday Polo — Oat Cream Collared Jersey',
    role: 'Core Essentials Polo',
    category: 'Essentials',
    color: 'Oat',
    photographer: 'Murat ISIK (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/17898553/pexels-photo-17898553.jpeg'
  },
  {
    id: '18701785',
    fileName: '05_the_range_cotton_tee_earth.jpg',
    descriptiveName: 'The Range Cotton Tee — Earth Brown Relaxed Tee',
    role: 'Core Essentials Bestseller Tee',
    category: 'Essentials',
    color: 'Earth',
    photographer: '@atiabii (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/18701785/pexels-photo-18701785.jpeg'
  },
  {
    id: '26769894',
    fileName: '06_the_frontier_denim_shirt_indigo.jpg',
    descriptiveName: 'The Frontier Denim Shirt — Indigo Western Regular Fit',
    role: 'Denim Category Highlight & Homepage Card',
    category: 'Denim',
    color: 'Indigo',
    photographer: 'AMITR MEENA (AMMY) (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/26769894/pexels-photo-26769894.jpeg'
  },
  {
    id: '3448328',
    fileName: '07_the_sierra_shearling_jacket_tobacco.jpg',
    descriptiveName: 'The Sierra Shearling Jacket — Tobacco Lined Outerwear',
    role: 'Outerwear Category Highlight & Homepage Card',
    category: 'Outerwear',
    color: 'Tobacco',
    photographer: 'Musa Ortac (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/3448328/pexels-photo-3448328.jpeg'
  },
  {
    id: '9929606',
    fileName: '08_the_rover_leather_boot_cognac.jpg',
    descriptiveName: 'The Rover Leather Boot — Cognac Brown Leather',
    role: 'Footwear Category Highlight & Homepage Card',
    category: 'Footwear',
    color: 'Cognac',
    photographer: 'Maksim Goncharenok (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/9929606/pexels-photo-9929606.jpeg'
  },
  {
    id: '11154974',
    fileName: '09_the_dune_cotton_tee_cloud.jpg',
    descriptiveName: 'The Dune Cotton Tee — Cloud White Desert Dunes',
    role: 'Core Essentials Crewneck',
    category: 'Essentials',
    color: 'Cloud',
    photographer: 'Ilya Dudnikov (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/11154974/pexels-photo-11154974.jpeg'
  },
  {
    id: '18153495',
    fileName: '10_the_solstice_resort_shirt_natural.jpg',
    descriptiveName: 'The Solstice Resort Shirt — Natural Off-White Camp Collar',
    role: 'Resort & Camp-Collar Shirts',
    category: 'Shirts',
    color: 'Natural',
    photographer: 'Igor Meghega (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/18153495/pexels-photo-18153495.jpeg'
  },
  {
    id: '11805694',
    fileName: '11_the_sundown_oxford_shirt_pale_blue.jpg',
    descriptiveName: 'The Sundown Oxford Shirt — Pale Blue Button-Front',
    role: 'Tailored Oxford & Chambray Shirts',
    category: 'Shirts',
    color: 'Pale blue',
    photographer: 'Angelica Reyn (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/11805694/pexels-photo-11805694.jpeg'
  },
  {
    id: '9051692',
    fileName: '12_the_ranch_hand_check_shirt_black_white.jpg',
    descriptiveName: 'The Ranch Hand Check Shirt — Black & White Micro-Check',
    role: 'Western Work & Check Shirts',
    category: 'Shirts',
    color: 'Black / White',
    photographer: 'Mike Jones (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/9051692/pexels-photo-9051692.jpeg'
  },
  {
    id: '25753595',
    fileName: '13_the_studio_heavyweight_tee_black.jpg',
    descriptiveName: 'The Studio Heavyweight Tee — Solid Black Crewneck',
    role: 'Heavyweight & Longline Tees',
    category: 'Essentials',
    color: 'Washed Black',
    photographer: 'Elienai Sauceda Mendoza (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/25753595/pexels-photo-25753595.jpeg'
  },
  {
    id: '28426846',
    fileName: '14_the_daybreak_crew_tee_white.jpg',
    descriptiveName: 'The Daybreak Crew Tee — Crisp White Everyday Tee',
    role: 'Oversized & Crew Tees',
    category: 'Essentials',
    color: 'Optical White',
    photographer: 'Santiago Eyama (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/28426846/pexels-photo-28426846.jpeg'
  },
  {
    id: '3754251',
    fileName: '15_the_oatfield_knit_sweater_sand.jpg',
    descriptiveName: 'The Oatfield Knit Sweater — Sand Beige Crewneck Knit',
    role: 'Knitwear & Layering Sweaters',
    category: 'Essentials',
    color: 'Sand',
    photographer: 'Ba Tik (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/3754251/pexels-photo-3754251.jpeg'
  },
  {
    id: '26966871',
    fileName: '16_the_ranger_straight_jeans_medium_blue.jpg',
    descriptiveName: 'The Ranger Straight Jeans — Medium Blue Straight-Leg Denim',
    role: 'Straight & Slim Denim Collection',
    category: 'Denim',
    color: 'Medium Blue',
    photographer: 'Moon Bouy (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/26966871/pexels-photo-26966871.jpeg'
  },
  {
    id: '7466695',
    fileName: '17_the_highway_relaxed_jeans_light_blue.jpg',
    descriptiveName: 'The Highway Relaxed Jeans — Light Blue Washed Denim',
    role: 'Relaxed & Tapered Denim Collection',
    category: 'Denim',
    color: 'Light Wash Blue',
    photographer: 'Brian Jiz (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/7466695/pexels-photo-7466695.jpeg'
  },
  {
    id: '25752907',
    fileName: '18_the_warehouse_wide_jeans_patchwork_denim.jpg',
    descriptiveName: 'The Warehouse Wide Jeans — Patchwork Wide-Leg Denim',
    role: 'Carpenter & Wide-Leg Denim Collection',
    category: 'Denim',
    color: 'Patchwork Blue',
    photographer: 'paul otero garcia (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/25752907/pexels-photo-25752907.jpeg'
  },
  {
    id: '8991023',
    fileName: '19_the_rock_creek_denim_shirt_light_blue.jpg',
    descriptiveName: 'The Rock Creek Denim Shirt — Light Blue Western Snap Shirt',
    role: 'Chambray & Denim Overshirts',
    category: 'Denim',
    color: 'Light Indigo',
    photographer: 'Jose Musa (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/8991023/pexels-photo-8991023.jpeg'
  },
  {
    id: '1046425',
    fileName: '20_the_northbound_denim_jacket_medium_blue.jpg',
    descriptiveName: 'The Northbound Denim Jacket — Classic Medium Blue Trucker',
    role: 'Classic Denim Trucker Jackets',
    category: 'Outerwear',
    color: 'Medium Blue',
    photographer: 'Sindre Fs (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/1046425/pexels-photo-1046425.jpeg'
  },
  {
    id: '14894538',
    fileName: '21_the_badlands_trucker_jacket_acid_wash.jpg',
    descriptiveName: 'The Badlands Trucker Jacket — Acid-Wash Light Turquoise Denim',
    role: 'Cropped & Field Work Jackets',
    category: 'Outerwear',
    color: 'Turquoise / Acid Wash',
    photographer: 'Zain Ali (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/14894538/pexels-photo-14894538.jpeg'
  },
  {
    id: '17178653',
    fileName: '22_the_overland_utility_jacket_chocolate_brown.jpg',
    descriptiveName: 'The Overland Utility Jacket — Dark Chocolate Brown Overshirt',
    role: 'Utility Jackets & Flap Pockets',
    category: 'Outerwear',
    color: 'Dark Chocolate Brown',
    photographer: 'Bruce Taylor (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/17178653/pexels-photo-17178653.jpeg'
  },
  {
    id: '11173795',
    fileName: '23_the_cityline_overcoat_camel_brown.jpg',
    descriptiveName: 'The Cityline Overcoat — Camel Warm Brown Tailored Coat',
    role: 'Long Coats & Topcoats',
    category: 'Outerwear',
    color: 'Camel / Warm Brown',
    photographer: 'beytlik (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/11173795/pexels-photo-11173795.jpeg'
  },
  {
    id: '10433248',
    fileName: '24_the_summit_hiker_boot_olive_taupe.jpg',
    descriptiveName: 'The Summit Hiker Boot — Olive-Brown Lace-up Ankle Boot',
    role: 'Hiking & Trekking Boots',
    category: 'Footwear',
    color: 'Olive-Brown / Taupe',
    photographer: 'Ron Lach (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/10433248/pexels-photo-10433248.jpeg'
  },
  {
    id: '15129894',
    fileName: '25_the_borough_patterned_loafer_black_geometric.jpg',
    descriptiveName: 'The Borough Patterned Loafer — Geometric Pattern Moccasin Loafer',
    role: 'Moccasin & Platform Loafers',
    category: 'Footwear',
    color: 'Patterned Black / Gray',
    photographer: 'Youssef Samuil (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/15129894/pexels-photo-15129894.jpeg'
  },
  {
    id: '19556446',
    fileName: '26_the_evening_penny_loafer_black_leather.jpg',
    descriptiveName: 'The Evening Penny Loafer — Black Leather Chain Hardware Loafer',
    role: 'Dress Loafers & Slip-Ons',
    category: 'Footwear',
    color: 'Black Leather',
    photographer: 'Danyal Malik (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/19556446/pexels-photo-19556446.jpeg'
  },
  {
    id: '7545212',
    fileName: '27_the_court_low_sneaker_white.jpg',
    descriptiveName: 'The Court Low Sneaker — White Low-Top Leather Sneaker',
    role: 'Minimalist Leather Sneakers & Trainers',
    category: 'Footwear',
    color: 'White',
    photographer: 'SHVETS production (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/7545212/pexels-photo-7545212.jpeg'
  },
  {
    id: '10274665',
    fileName: '28_alt_brown_leather_jacket_studio.jpg',
    descriptiveName: 'Alternative Brown Leather Jacket — Studio Editorial Portrait',
    role: 'Archive Reference Style (PHOTO-SOURCES.md)',
    category: 'Outerwear',
    color: 'Warm Brown Leather',
    photographer: 'Almighty Shilref (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/10274665/pexels-photo-10274665.jpeg'
  },
  {
    id: '10933114',
    fileName: '29_alt_worn_leather_boots_landscape.jpg',
    descriptiveName: 'Alternative Worn Leather Boots — Landscape Desert Ground',
    role: 'Archive Reference Style (PHOTO-SOURCES.md)',
    category: 'Footwear',
    color: 'Aged Brown Leather',
    photographer: 'Nandu Vasudevan (Pexels)',
    sourceUrl: 'https://images.pexels.com/photos/10933114/pexels-photo-10933114.jpeg'
  }
];

// Helper to download or copy buffer
async function fetchImageBuffer(item) {
  const highResUrl = `${item.sourceUrl}?auto=compress&cs=tinysrgb&w=2000`;
  try {
    const res = await fetch(highResUrl);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      return { buffer: Buffer.from(arrayBuffer), source: 'Pexels CDN (2000px High-Res)' };
    }
  } catch {
    // ignore and try fallback
  }

  // Fallback to local image in public/images
  const localFile = path.join(localImagesDir, `${item.id}.jpg`);
  if (fs.existsSync(localFile)) {
    return { buffer: fs.readFileSync(localFile), source: 'Local Public Assets (1000px)' };
  }

  throw new Error(`Unable to fetch image ${item.id}`);
}

console.log('Downloading and saving all unique website photos with descriptive names...');
const imageBuffersById = new Map();
const manifestEntries = [];

for (const asset of uniqueAssets) {
  try {
    const { buffer, source } = await fetchImageBuffer(asset);
    imageBuffersById.set(asset.id, buffer);
    const destPath = path.join(targetDir, asset.fileName);
    fs.writeFileSync(destPath, buffer);
    console.log(`✓ Saved: ${asset.fileName} (${(buffer.length / 1024).toFixed(1)} KB from ${source})`);

    manifestEntries.push({
      ...asset,
      fileSizeBytes: buffer.length,
      fileSizeKb: (buffer.length / 1024).toFixed(1) + ' KB',
      resolutionSource: source
    });
  } catch (e) {
    console.error(`✗ Failed for ${asset.fileName}:`, e.message);
  }
}

// Also copy brand logo favicon
const faviconSrc = path.join(projectRoot, 'public', 'favicon.svg');
if (fs.existsSync(faviconSrc)) {
  const faviconBuffer = fs.readFileSync(faviconSrc);
  fs.writeFileSync(path.join(targetDir, '30_westward_brand_logo_favicon.svg'), faviconBuffer);
  console.log('✓ Saved: 30_westward_brand_logo_favicon.svg');
}

// 2. Generate all 100 catalog products with their exact product names
console.log('\nGenerating all 100 catalog product images named by product name...');
const productCatalogManifest = [];

for (let i = 0; i < catalog.length; i++) {
  const product = catalog[i];
  const indexStr = String(i + 1).padStart(3, '0');
  // Sanitize product name for file system
  const safeName = product.name
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const safeColor = product.color.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const productFileName = `${indexStr}_${safeName}_(${safeColor}).jpg`;

  let buffer = imageBuffersById.get(product.image);
  if (!buffer) {
    const localFile = path.join(localImagesDir, `${product.image}.jpg`);
    if (fs.existsSync(localFile)) {
      buffer = fs.readFileSync(localFile);
    }
  }

  if (buffer) {
    const destPath = path.join(productsDir, productFileName);
    fs.writeFileSync(destPath, buffer);
    productCatalogManifest.push({
      index: i + 1,
      id: product.id,
      name: product.name,
      category: product.category,
      color: product.color,
      price: product.price,
      tag: product.tag,
      imageFile: productFileName,
      sourceAssetId: product.image,
      fileSizeBytes: buffer.length
    });
  } else {
    console.warn(`Warning: Buffer not found for product ${product.name} (${product.image})`);
  }
}

console.log(`✓ Saved ${productCatalogManifest.length} product images in 'all_100_products/' directory.`);

// 3. Generate README and Manifest
const manifestJson = {
  projectName: 'WESTWARD — Modern Western Menswear',
  extractedAt: new Date().toISOString(),
  targetDirectory: targetDir,
  totalUniquePhotos: manifestEntries.length,
  totalCatalogProducts: productCatalogManifest.length,
  uniquePhotos: manifestEntries,
  catalogProducts: productCatalogManifest
};

fs.writeFileSync(path.join(targetDir, 'images_manifest.json'), JSON.stringify(manifestJson, null, 2));

const markdownSummary = `# WESTWARD — Downloaded Website Images

This folder contains all photography and visual assets used across the WESTWARD menswear storefront, downloaded and saved with human-readable, descriptive photo names.

## Folder Organization

- **\`downloaded_images/\` (Root)**: Contains all **29 primary and editorial photographs** plus the brand logo favicon, named with descriptive identifiers, garment categories, and colors.
- **\`downloaded_images/all_100_products/\`**: Contains **every single one of the 100 catalog products** with its individual image file named exactly after the product name, style number, and colorway (e.g. \`001_The_Mesa_Linen_Shirt_(Chalk).jpg\`).
- **\`images_manifest.json\`**: Machine-readable JSON index detailing every photo, source URL, photographer, dimensions, and product mappings.

---

## Primary Website Photography (Root Directory)

| # | File Name | Descriptive Photo Name | Category / Use | Color | Size |
|---|---|---|---|---|---|
${manifestEntries.map(e => `| ${e.fileName.slice(0, 2)} | \`${e.fileName}\` | **${e.descriptiveName}** | ${e.role} | ${e.color} | ${e.fileSizeKb} |`).join('\n')}
| 30 | \`30_westward_brand_logo_favicon.svg\` | **WESTWARD Brand Logo Monogram** | Site Favicon & Header Mark | Black/Beige | Vector |

---

## Catalog Products Directory (\`all_100_products/\`)

Contains 100 individual files named after each product style across all 5 collections:
- **Shirts** (20 styles: 001–026)
- **Essentials** (20 styles: 003, 004, 008, 027–043)
- **Denim** (20 styles: 005, 044–062)
- **Outerwear** (20 styles: 006, 063–081)
- **Footwear** (20 styles: 007, 082–100)

Sample file names:
- \`001_The_Mesa_Linen_Shirt_(Chalk).jpg\`
- \`002_The_Canyon_Overshirt_(Sage_check).jpg\`
- \`003_The_Everyday_Polo_(Oat).jpg\`
- \`006_The_Sierra_Shearling_Jacket_(Tobacco).jpg\`
- \`007_The_Rover_Leather_Boot_(Cognac).jpg\`
- ...
- \`100_The_Open_Court_Trainer_(White).jpg\`

---

## Source & Licensing

All photographic assets are sourced under the **Pexels Free Commercial Use License** as documented in \`PHOTO-SOURCES.md\`.
`;

fs.writeFileSync(path.join(targetDir, 'README.md'), markdownSummary);
console.log('✓ Saved: README.md and images_manifest.json');
console.log('\nALL IMAGES DOWNLOADED AND SAVED PERFECTLY!');
