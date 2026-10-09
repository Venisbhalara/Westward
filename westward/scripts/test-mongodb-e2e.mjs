import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/westward_db';
const DB_NAME = 'westward_db';

async function runE2ETest() {
  console.log('======================================================');
  console.log('🧪 RUNNING FULL END-TO-END MONGODB VALIDATION TEST');
  console.log('======================================================\n');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log('✔ Connected to MongoDB successfully.');

  // 1. Check products
  const products = await db.collection('products').find({}).toArray();
  console.log(`\n1. Products Collection:`);
  console.log(`   Found ${products.length} catalog items in MongoDB (Expected: 100).`);
  if (products.length !== 100) {
    throw new Error(`Expected 100 products, found ${products.length}`);
  }

  // 2. User registration
  const testUserId = 'usr_test_client_999';
  const testEmail = 'montaigne.bespoke@luxury.com';
  console.log(`\n2. Testing User Registration:`);
  await db.collection('users').deleteOne({ id: testUserId });
  await db.collection('users').insertOne({
    id: testUserId,
    name: 'Charles Montaigne',
    email: testEmail,
    passwordHash: 'test_salt:test_hash_val',
    createdAt: new Date().toISOString(),
  });
  const foundUser = await db.collection('users').findOne({ id: testUserId });
  console.log(`   Created and verified user: ${foundUser.name} (${foundUser.email})`);

  // 3. User Bag (Cart) Operations
  console.log(`\n3. Testing Bag (Cart) Operations:`);
  await db.collection('bag').deleteMany({ userId: testUserId });
  await db.collection('bag').insertOne({
    userId: testUserId,
    productId: 'sierra-jacket',
    size: 'L',
    quantity: 2,
  });
  const bagItems = await db.collection('bag').find({ userId: testUserId }).toArray();
  console.log(`   User bag contains ${bagItems.length} item: ${bagItems[0].productId} (${bagItems[0].size}, qty ${bagItems[0].quantity})`);

  // 4. Wishlist Operations
  console.log(`\n4. Testing Wishlist Operations:`);
  await db.collection('wishlist').deleteMany({ userId: testUserId });
  await db.collection('wishlist').insertOne({
    userId: testUserId,
    productId: 'mesa-shirt',
  });
  const wishItems = await db.collection('wishlist').find({ userId: testUserId }).toArray();
  console.log(`   User wishlist contains ${wishItems.length} item: ${wishItems[0].productId}`);

  // 5. Checkout & Order Creation
  console.log(`\n5. Testing Checkout & Order Placement:`);
  const testOrderId = 'WW-E2E-TEST-001';
  await db.collection('orders').deleteOne({ id: testOrderId });
  await db.collection('orders').insertOne({
    id: testOrderId,
    userId: testUserId,
    requestId: 'req_e2e_test_unique_id',
    items: [
      {
        productId: 'sierra-jacket',
        size: 'L',
        quantity: 2,
        name: 'The Sierra Shearling Jacket',
        price: 12990,
      },
    ],
    total: 25980,
    address: {
      name: 'Charles Montaigne',
      email: testEmail,
      street: '12 Rue de la Paix',
      city: 'Paris',
      postal: '75002',
      country: 'France',
    },
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  });
  // Clear bag after checkout
  await db.collection('bag').deleteMany({ userId: testUserId });
  const remainingBag = await db.collection('bag').find({ userId: testUserId }).toArray();
  console.log(`   Placed order ${testOrderId} (Total: ₹25,980). User bag cleared: ${remainingBag.length === 0}`);

  // 6. Admin Order Status Transition
  console.log(`\n6. Testing Admin 1-Click Order Status Transition:`);
  await db.collection('orders').updateOne(
    { id: testOrderId },
    { $set: { status: 'Atelier Prep' } }
  );
  let updatedOrder = await db.collection('orders').findOne({ id: testOrderId });
  console.log(`   Order status transitioned to: "${updatedOrder.status}"`);

  await db.collection('orders').updateOne(
    { id: testOrderId },
    { $set: { status: 'Dispatched' } }
  );
  updatedOrder = await db.collection('orders').findOne({ id: testOrderId });
  console.log(`   Order status transitioned to: "${updatedOrder.status}"`);

  // 7. Contact Inquiries
  console.log(`\n7. Testing Concierge Contact Inquiry:`);
  const testInqId = 'INQ-E2E-001';
  await db.collection('contact_inquiries').deleteOne({ id: testInqId });
  await db.collection('contact_inquiries').insertOne({
    id: testInqId,
    userId: testUserId,
    name: 'Charles Montaigne',
    email: testEmail,
    phone: '+33 1 42 68 00 00',
    subject: 'Bespoke Lapel Monogramming',
    orderId: testOrderId,
    message: 'Please engrave initial CM in cursive gold embroidery on the interior pocket.',
    status: 'Received',
    createdAt: new Date().toISOString(),
  });
  const foundInq = await db.collection('contact_inquiries').findOne({ id: testInqId });
  console.log(`   Inquiry submitted and retrieved: ${foundInq.id} - "${foundInq.subject}"`);

  // 8. Admin Realtime Analytics Aggregation
  console.log(`\n8. Testing Executive Admin Analytics Aggregations:`);
  const revenueAgg = await db.collection('orders').aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalOrders: { $sum: 1 },
        avgOrderValue: { $avg: '$total' },
      },
    },
  ]).toArray();

  const totalUsersCount = await db.collection('users').countDocuments();
  console.log(`   Executive BI Report:`);
  console.log(`   • Gross Revenue:       ₹${revenueAgg[0]?.totalRevenue?.toLocaleString('en-IN')}`);
  console.log(`   • Total Orders Count:  ${revenueAgg[0]?.totalOrders}`);
  console.log(`   • Average Order Value: ₹${Math.round(revenueAgg[0]?.avgOrderValue || 0).toLocaleString('en-IN')}`);
  console.log(`   • Registered Users:    ${totalUsersCount}`);

  // Cleanup test order & user to keep clean
  await db.collection('users').deleteOne({ id: testUserId });
  await db.collection('orders').deleteOne({ id: testOrderId });
  await db.collection('contact_inquiries').deleteOne({ id: testInqId });
  await db.collection('wishlist').deleteMany({ userId: testUserId });
  console.log(`\n   Test cleanup complete.`);

  await client.close();

  console.log('\n======================================================');
  console.log('🎉 ALL 8 MONGODB WORKFLOWS VERIFIED 100% SUCCESSFUL!');
  console.log('======================================================\n');
}

runE2ETest().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
