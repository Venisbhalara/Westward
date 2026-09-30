import assert from 'node:assert/strict';

const base = 'http://localhost:5173';

console.log('Testing Real User Authentication & Orders Flow...');

// Step 1: Attempt registration with invalid data
const badReg = await fetch(base + '/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify({ action: 'register', name: 'R', email: 'not-an-email', password: '123' }),
});
assert.equal(badReg.status, 400, 'Rejects invalid registration data');

// Step 2: Register a real user
const testEmail = `testuser_${Date.now()}@westward.test`;
const regRes = await fetch(base + '/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify({
    action: 'register',
    name: 'Rohan Sharma',
    email: testEmail,
    password: 'securePassword456',
  }),
});
assert.equal(regRes.status, 201, 'Registration successful');
const regData = await regRes.json();
assert.equal(regData.ok, true);
assert.equal(regData.user.displayName, 'Rohan Sharma');
assert.equal(regData.user.email, testEmail);

const cookieHeader = regRes.headers.getSetCookie().map(x => x.split(';')[0]).join('; ');
assert.ok(cookieHeader.includes('westward_session='), 'Sets westward_session cookie');

// Step 3: Check store state when authenticated
const storeRes1 = await fetch(base + '/api/store', {
  headers: { cookie: cookieHeader },
});
const storeData1 = await storeRes1.json();
assert.ok(storeData1.user, 'Store recognizes authenticated user');
assert.equal(storeData1.user.name, 'Rohan Sharma');
assert.equal(storeData1.user.email, testEmail);
assert.equal(storeData1.orders.length, 0, 'New user has 0 orders initially');

// Step 4: Add an item to bag and wishlist
const bagRes = await fetch(base + '/api/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base, cookie: cookieHeader },
  body: JSON.stringify({ action: 'bag', productId: 'mesa-shirt', size: 'L', quantity: 2 }),
});
assert.equal(bagRes.status, 200, 'Added to bag');

const wishRes = await fetch(base + '/api/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base, cookie: cookieHeader },
  body: JSON.stringify({ action: 'wishlist', productId: 'mesa-shirt', saved: true }),
});
assert.equal(wishRes.status, 200, 'Saved to wishlist');

// Step 5: Place an order
const orderPayload = {
  action: 'checkout',
  requestId: crypto.randomUUID(),
  address: {
    name: 'Rohan Sharma',
    email: testEmail,
    street: '42 Western Trail Road',
    city: 'Jaipur',
    postal: '302001',
  },
};
const orderRes = await fetch(base + '/api/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base, cookie: cookieHeader },
  body: JSON.stringify(orderPayload),
});
assert.equal(orderRes.status, 200, 'Order placed successfully');
const orderData = await orderRes.json();
assert.ok(orderData.id.startsWith('WW-'), 'Generated valid order ID');

// Step 6: Verify order appears in real time in user account
const storeRes2 = await fetch(base + '/api/store', {
  headers: { cookie: cookieHeader },
});
const storeData2 = await storeRes2.json();
assert.equal(storeData2.orders.length, 1, 'Order immediately visible in account orders');
assert.equal(storeData2.orders[0].id, orderData.id);
assert.equal(storeData2.orders[0].items[0].productId, 'mesa-shirt');
assert.equal(storeData2.bag.length, 0, 'Bag cleared after checkout');

// Step 7: Logout
const logoutRes = await fetch(base + '/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base, cookie: cookieHeader },
  body: JSON.stringify({ action: 'logout' }),
});
assert.equal(logoutRes.status, 200, 'Logged out successfully');

// Step 8: Verify logged-out state
const storeResLoggedOut = await fetch(base + '/api/store');
const storeDataLoggedOut = await storeResLoggedOut.json();
assert.equal(storeDataLoggedOut.user, null, 'No user when logged out');
assert.equal(storeDataLoggedOut.orders.length, 0, 'Orders inaccessible without auth');

// Step 9: Log back in with registered credentials
const loginRes = await fetch(base + '/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify({
    action: 'login',
    email: testEmail,
    password: 'securePassword456',
  }),
});
assert.equal(loginRes.status, 200, 'Login successful');
const newCookieHeader = loginRes.headers.getSetCookie().map(x => x.split(';')[0]).join('; ');

// Step 10: Verify persistent order history upon login
const storeRes3 = await fetch(base + '/api/store', {
  headers: { cookie: newCookieHeader },
});
const storeData3 = await storeRes3.json();
assert.equal(storeData3.user.name, 'Rohan Sharma');
assert.equal(storeData3.orders.length, 1, 'Previous orders persisted and displayed');
assert.equal(storeData3.orders[0].id, orderData.id);
assert.ok(storeData3.wishlist.includes('mesa-shirt'), 'Wishlist persisted');

// Step 11: Duplicate email registration prevention
const dupReg = await fetch(base + '/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify({
    action: 'register',
    name: 'Another User',
    email: testEmail,
    password: 'someOtherPassword',
  }),
});
assert.equal(dupReg.status, 409, 'Duplicate registration prevented with 409 Conflict');

console.log('ALL REAL AUTHENTICATION & ORDER TESTS PASSED PERFECTLY!');
