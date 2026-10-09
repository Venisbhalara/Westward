import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/westward_db';
const DB_NAME = 'westward_db';

async function verifyMongoDB() {
  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const collections = await db.listCollections().toArray();
  console.log(`\n🍃 MongoDB Database: "${DB_NAME}"`);
  console.log(`Available Collections (${collections.length}):`);

  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  • ${col.name.padEnd(20)} : ${count} documents`);
  }

  // Sample recent order
  const sampleOrder = await db.collection('orders').findOne({}, { sort: { createdAt: -1 } });
  if (sampleOrder) {
    console.log(`\nMost Recent Order in MongoDB:`);
    console.log(`  ID:        ${sampleOrder.id}`);
    console.log(`  Recipient: ${sampleOrder.address?.name} (${sampleOrder.address?.city})`);
    console.log(`  Total:     ₹${sampleOrder.total}`);
    console.log(`  Status:    ${sampleOrder.status}`);
    console.log(`  Items:     ${sampleOrder.items?.length || 0} garment(s)`);
  }

  // Sample user
  const sampleUser = await db.collection('users').findOne({});
  if (sampleUser) {
    console.log(`\nSample Registered User in MongoDB:`);
    console.log(`  Name:  ${sampleUser.name}`);
    console.log(`  Email: ${sampleUser.email}`);
  }

  await client.close();
  console.log(`\n✔ MongoDB verification complete. All systems nominal.\n`);
}

verifyMongoDB().catch(console.error);
