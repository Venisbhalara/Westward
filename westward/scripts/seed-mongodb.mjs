import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/westward_db';
const DB_NAME = 'westward_db';

function hashPassword(password, salt = 'westward_secure_salt_2026') {
  const hash = crypto.createHash('sha256').update(`${password}:${salt}`).digest('hex');
  return `${salt}:${hash}`;
}

async function seedMongoDB() {
  console.log(`\n🍃 Connecting to MongoDB at: ${MONGODB_URI}...`);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`✔ Connected to database: "${DB_NAME}"`);

  // 1. Create collections & indexes
  console.log('\n⚙️ Configuring collections & indexes in MongoDB...');
  await Promise.all([
    db.collection('products').createIndex({ id: 1 }, { unique: true }),
    db.collection('users').createIndex({ id: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ id: 1 }, { unique: true }),
    db.collection('orders').createIndex({ id: 1 }, { unique: true }),
    db.collection('orders').createIndex({ requestId: 1 }, { unique: true }),
    db.collection('orders').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('bag').createIndex({ userId: 1, productId: 1, size: 1 }, { unique: true }),
    db.collection('wishlist').createIndex({ userId: 1, productId: 1 }, { unique: true }),
    db.collection('contact_inquiries').createIndex({ id: 1 }, { unique: true }),
  ]);
  console.log('✔ All MongoDB indexes created successfully.');

  // 2. Seed all 100 products
  console.log(`\n📦 Seeding ${allProducts.length} atelier luxury menswear garments...`);
  const productBulkOps = allProducts.map(prod => ({
    updateOne: {
      filter: { id: prod.id },
      update: {
        $set: {
          id: prod.id,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          color: prod.color || '',
          hex: prod.hex || '#ffffff',
          tag: prod.tag || '',
          description: prod.description || '',
          fabric: prod.fabric || '',
          sizes: prod.sizes || ['S', 'M', 'L', 'XL'],
          image: prod.image,
          createdAt: new Date().toISOString(),
        },
      },
      upsert: true,
    },
  }));
  await db.collection('products').bulkWrite(productBulkOps);
  const totalProducts = await db.collection('products').countDocuments();
  console.log(`✔ Total products in MongoDB collection "products": ${totalProducts}`);

  // 3. Seed registered client profiles
  console.log('\n👤 Seeding client accounts...');
  const sampleUsers = [
    {
      id: 'usr_alexander_wright',
      name: 'Alexander Wright',
      email: 'client@westward.atelier',
      passwordHash: hashPassword('password123'),
      createdAt: '2026-03-15T10:30:00.000Z',
    },
    {
      id: 'usr_julian_vance',
      name: 'Lord Julian Vance',
      email: 'sartorial@westward.atelier',
      passwordHash: hashPassword('bespoke2026'),
      createdAt: '2026-03-20T14:15:00.000Z',
    },
  ];

  for (const u of sampleUsers) {
    await db.collection('users').updateOne(
      { email: u.email },
      { $set: u },
      { upsert: true }
    );
  }
  const totalUsers = await db.collection('users').countDocuments();
  console.log(`✔ Total registered users in MongoDB collection "users": ${totalUsers}`);

  // 4. Seed master orders ledger
  console.log('\n📋 Seeding representative orders...');
  const sampleOrders = [
    {
      id: 'WW-84A12B09',
      userId: 'usr_alexander_wright',
      requestId: 'req_atelier_order_1001',
      items: [
        {
          productId: 'sierra-jacket',
          size: 'L',
          quantity: 1,
          name: 'The Sierra Shearling Jacket',
          price: 12990,
          image: '3448328',
        },
        {
          productId: 'rover-boots',
          size: 'UK 9',
          quantity: 1,
          name: 'The Rover Leather Boot',
          price: 8990,
          image: '9929606',
        },
      ],
      total: 21980,
      address: {
        name: 'Alexander Wright',
        email: 'client@westward.atelier',
        street: '84 St. Mark’s Road, Atelier Suites',
        city: 'Bengaluru',
        postal: '560001',
        country: 'India',
      },
      status: 'Atelier Prep',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'WW-91C78D24',
      userId: 'usr_julian_vance',
      requestId: 'req_atelier_order_1002',
      items: [
        {
          productId: 'mesa-shirt',
          size: 'M',
          quantity: 2,
          name: 'The Mesa Linen Shirt',
          price: 4990,
          image: '8350480',
        },
        {
          productId: 'frontier-denim',
          size: '32',
          quantity: 1,
          name: 'The Frontier Denim Shirt',
          price: 5490,
          image: '26769894',
        },
      ],
      total: 15470,
      address: {
        name: 'Lord Julian Vance',
        email: 'sartorial@westward.atelier',
        street: 'Penthouse 4B, Malabar Mansions, Ridge Road',
        city: 'Mumbai',
        postal: '400006',
        country: 'India',
      },
      status: 'Confirmed',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'WW-55E92F11',
      userId: 'usr_alexander_wright',
      requestId: 'req_atelier_order_1003',
      items: [
        {
          productId: 'canyon-overshirt',
          size: 'XL',
          quantity: 1,
          name: 'The Canyon Overshirt',
          price: 5990,
          image: '6838910',
        },
      ],
      total: 5990,
      address: {
        name: 'Alexander Wright',
        email: 'client@westward.atelier',
        street: '84 St. Mark’s Road, Atelier Suites',
        city: 'Bengaluru',
        postal: '560001',
        country: 'India',
      },
      status: 'Dispatched',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];

  for (const o of sampleOrders) {
    await db.collection('orders').updateOne(
      { id: o.id },
      { $set: o },
      { upsert: true }
    );
  }
  const totalOrders = await db.collection('orders').countDocuments();
  console.log(`✔ Total orders in MongoDB collection "orders": ${totalOrders}`);

  // 5. Seed concierge inquiries
  console.log('\n💬 Seeding concierge contact inquiries...');
  const sampleInquiries = [
    {
      id: 'INQ-48B1C902',
      userId: 'usr_alexander_wright',
      name: 'Alexander Wright',
      email: 'client@westward.atelier',
      phone: '+91 98765 43210',
      subject: 'Bespoke Fitting Consultation',
      orderId: 'WW-84A12B09',
      message: 'Kindly advise if sleeve alterations can be tailored at the Bengaluru atelier prior to dispatch.',
      status: 'Received',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'INQ-77F3A519',
      userId: 'usr_julian_vance',
      name: 'Lord Julian Vance',
      email: 'sartorial@westward.atelier',
      phone: '+91 98200 11223',
      subject: 'Private Trunk Show Access',
      orderId: null,
      message: 'Requesting private salon reservation for the Autumn Haute Menswear capsule in Mumbai.',
      status: 'In Review',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
  ];

  for (const inq of sampleInquiries) {
    await db.collection('contact_inquiries').updateOne(
      { id: inq.id },
      { $set: inq },
      { upsert: true }
    );
  }
  const totalInquiries = await db.collection('contact_inquiries').countDocuments();
  console.log(`✔ Total inquiries in MongoDB collection "contact_inquiries": ${totalInquiries}`);

  console.log(`\n======================================================`);
  console.log(`🎉 MONGODB DATABASE "westward_db" FULLY POPULATED & READY!`);
  console.log(`======================================================`);
  console.log(`Collections available to view in MongoDB Compass:`);
  console.log(`  • products          (${totalProducts} items)`);
  console.log(`  • users             (${totalUsers} accounts)`);
  console.log(`  • orders            (${totalOrders} ledger records)`);
  console.log(`  • contact_inquiries (${totalInquiries} tickets)`);
  console.log(`  • bag               (Cart items)`);
  console.log(`  • wishlist          (Saved items)`);
  console.log(`  • sessions          (Active login tokens)`);
  console.log(`======================================================\n`);

  await client.close();
}

seedMongoDB().catch(err => {
  console.error('Fatal MongoDB Seeding Error:', err);
  process.exit(1);
});
