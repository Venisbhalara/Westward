const base = 'http://localhost:5173';

async function testFullJourney() {
  const ts = Date.now();
  const email = `rajesh.patel.${ts}@westward-test.com`;

  console.log('--- Step 1: Registering user ---');
  const regRes = await fetch(base + '/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: base },
    body: JSON.stringify({
      action: 'register',
      name: 'Rajesh Patel',
      email: email,
      password: 'StrongPassword123!',
    }),
  });
  const regData = await regRes.json();
  console.log('Register response:', regData);
  const cookie = regRes.headers.getSetCookie ? regRes.headers.getSetCookie().join('; ') : regRes.headers.get('set-cookie');

  console.log('\n--- Step 2: Adding items to bag ---');
  const bagRes1 = await fetch(base + '/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: base, cookie: cookie || '' },
    body: JSON.stringify({ action: 'bag', productId: 'mesa-shirt', size: 'M', quantity: 2 }),
  });
  console.log('Bag 1 response:', await bagRes1.json());

  console.log('\n--- Step 3: Adding item to wishlist ---');
  const wishRes = await fetch(base + '/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: base, cookie: cookie || '' },
    body: JSON.stringify({ action: 'wishlist', productId: 'frontier-denim', saved: true }),
  });
  console.log('Wishlist response:', await wishRes.json());

  console.log('\n--- Step 4: Placing checkout order ---');
  const orderRes = await fetch(base + '/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: base, cookie: cookie || '' },
    body: JSON.stringify({
      action: 'checkout',
      requestId: crypto.randomUUID(),
      address: {
        name: 'Rajesh Patel',
        email: email,
        street: '88 Ellisbridge Road',
        city: 'Ahmedabad',
        postal: '380006',
      },
    }),
  });
  const orderData = await orderRes.json();
  console.log('Order response:', orderData);

  console.log('\n--- Step 5: Submitting contact inquiry ---');
  const inqRes = await fetch(base + '/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: base, cookie: cookie || '' },
    body: JSON.stringify({
      name: 'Rajesh Patel',
      email: email,
      phone: '+91 98250 99999',
      subject: 'Order Tracking & Delivery',
      orderId: orderData.id,
      message: 'I have placed order ' + orderData.id + '. Please send express tracking details when dispatched.',
    }),
  });
  console.log('Inquiry response:', await inqRes.json());

  console.log('\n--- Full User Journey Finished Successfully ---');
}

testFullJourney().catch(console.error);
