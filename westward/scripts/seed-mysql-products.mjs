import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogJsonPath = path.join(__dirname, '../lib/catalog-expanded.json');
const expandedProducts = JSON.parse(fs.readFileSync(catalogJsonPath, 'utf8'));

const originalCatalog = [
  {id:'mesa-shirt',name:'The Mesa Linen Shirt',category:'Shirts',price:4990,image:'8350480',color:'Chalk',hex:'#eee9dd',tag:'BESTSELLER',description:'An easy, open-collar silhouette for slow mornings and long weekends. Cut with room to move and finished with a beautifully natural texture.',fabric:'Linen blend · Relaxed fit',sizes:['S','M','L','XL','XXL']},
  {id:'canyon-overshirt',name:'The Canyon Overshirt',category:'Shirts',price:5990,image:'6838910',color:'Sage check',hex:'#7e816b',tag:'NEW ARRIVAL',description:'Western roots, an everyday attitude. A classic checked layer that works just as well buttoned up as it does thrown over your favourite tee.',fabric:'Cotton twill · Regular fit',sizes:['S','M','L','XL']},
  {id:'everyday-polo',name:'The Everyday Polo',category:'Essentials',price:3490,image:'17898553',color:'Oat',hex:'#d0c6ad',tag:'THE ESSENTIALS',description:'An understated essential with a soft collar and an easy drape. A little more considered, every day of the week.',fabric:'Cotton jersey · Relaxed fit',sizes:['S','M','L','XL','XXL']},
  {id:'range-tee',name:'The Range Cotton Tee',category:'Essentials',price:1990,image:'18701785',color:'Earth',hex:'#8c7056',tag:'BESTSELLER',description:'The familiar tee, thoughtfully reworked. A substantial feel, a clean neckline and a relaxed shape to wear on repeat.',fabric:'Cotton jersey · Relaxed fit',sizes:['S','M','L','XL','XXL']},
  {id:'frontier-denim',name:'The Frontier Denim Shirt',category:'Denim',price:5490,image:'26769894',color:'Indigo',hex:'#345d76',tag:'NEW ARRIVAL',description:'A rich indigo wash and authentic western details. Wear it with denim, wear it with chinos — make it your own.',fabric:'Cotton denim · Regular fit',sizes:['S','M','L','XL']},
  {id:'sierra-jacket',name:'The Sierra Shearling Jacket',category:'Outerwear',price:12990,image:'3448328',color:'Tobacco',hex:'#815239',tag:'LIMITED EDIT',description:'A substantial cold-weather layer with a warm shearling-style collar. Textured, timeless and ready for the open road.',fabric:'Textured outer · Lined construction',sizes:['M','L','XL']},
  {id:'rover-boots',name:'The Rover Leather Boot',category:'Footwear',price:8990,image:'9929606',color:'Cognac',hex:'#6c432f',tag:'THE ESSENTIALS',description:'A grounded finish to every outfit. Warm brown leather, everyday versatility and a shape with lasting character.',fabric:'Leather upper · Rubber sole',sizes:['UK 7','UK 8','UK 9','UK 10','UK 11']},
  {id:'dune-tee',name:'The Dune Cotton Tee',category:'Essentials',price:1990,image:'11154974',color:'Cloud',hex:'#efede3',tag:'NEW ARRIVAL',description:'A clean white tee made for your everyday rotation. Effortless on its own and easy under an open shirt.',fabric:'Cotton jersey · Regular fit',sizes:['S','M','L','XL']}
];

const allProducts = [...originalCatalog, ...expandedProducts];

async function seed() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'westward_db',
  });

  console.log(`Connecting to westward_db... Found ${allProducts.length} products to sync.`);

  for (const product of allProducts) {
    await connection.execute(
      `INSERT INTO products (id, name, category, price, color, data) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         category = VALUES(category),
         price = VALUES(price),
         color = VALUES(color),
         data = VALUES(data)`,
      [
        product.id,
        product.name,
        product.category,
        product.price,
        product.color || '',
        JSON.stringify(product),
      ]
    );
  }

  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM products');
  console.log(`Products in MySQL westward_db: ${rows[0].count}`);

  await connection.end();
}

seed().catch(console.error);
