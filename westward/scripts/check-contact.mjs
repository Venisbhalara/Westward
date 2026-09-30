import assert from 'node:assert/strict';

const base = 'http://localhost:5173';

console.log('--- Starting Contact & Garment Care Automated Verification ---');

// 1. Verify /contact page renders HTML
console.log('1. Checking GET /contact HTTP response...');
const pageRes = await fetch(base + '/contact');
assert.equal(pageRes.status, 200, 'Page /contact must return 200 OK');
const pageHtml = await pageRes.text();
assert.ok(pageHtml.includes('Contact &amp; Garment Care') || pageHtml.includes('Contact & Garment Care'), 'Page must contain Contact & Garment Care title');
assert.ok(pageHtml.includes('Send an Inquiry') || pageHtml.includes('WESTWARD CONCIERGE'), 'Page must contain Concierge section');
assert.ok(pageHtml.includes('Garment Care') || pageHtml.includes('Selvedge Denim'), 'Page must include Care Hub');
console.log('PASS: /contact page renders cleanly with SSR/HTML content.');

// 2. Test Input Validation on POST /api/contact
console.log('2. Testing validation on POST /api/contact...');

// 2a. Missing name
const invalidRes1 = await fetch(base + '/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify({
    name: 'A', // too short
    email: 'test@example.com',
    message: 'Hello, this is a test message that is long enough.',
  }),
});
assert.equal(invalidRes1.status, 400, 'Name < 2 chars should fail');
const err1 = await invalidRes1.json();
assert.ok(err1.error, 'Error message returned for invalid name');

// 2b. Invalid email
const invalidRes2 = await fetch(base + '/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify({
    name: 'Valid Name',
    email: 'invalid-email',
    message: 'Hello, this is a test message that is long enough.',
  }),
});
assert.equal(invalidRes2.status, 400, 'Invalid email format should fail');

// 2c. Short message
const invalidRes3 = await fetch(base + '/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify({
    name: 'Valid Name',
    email: 'valid@example.com',
    message: 'Short',
  }),
});
assert.equal(invalidRes3.status, 400, 'Message < 10 chars should fail');
console.log('PASS: All edge-case validation checks rejected improper inputs.');

// 3. Test Guest Inquiry Submission & Database Entry
console.log('3. Submitting valid guest contact inquiry...');
const guestInquiry = {
  name: 'Aarav Mehta',
  email: 'aarav.mehta@westward-test.com',
  phone: '+91 98201 12345',
  subject: 'Garment Care & Fabric Advice',
  message: 'Could you advise how to properly wash and preserve the Raw Selvedge Denim Jeans in Indian monsoon humidity?',
};

const postGuestRes = await fetch(base + '/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify(guestInquiry),
});

assert.equal(postGuestRes.status, 201, 'Guest inquiry submission should return 201 Created');
const guestData = await postGuestRes.json();
assert.ok(guestData.ok, 'Response must have ok: true');
assert.ok(guestData.id && guestData.id.startsWith('INQ-'), 'Inquiry ID must start with INQ-');
assert.ok(guestData.createdAt, 'Response must include createdAt');
console.log(`PASS: Guest inquiry saved in database with ticket ID: ${guestData.id}`);

// 4. Test Authenticated User Inquiry & Past Inquiries Retrieval
console.log('4. Registering/logging in a test user to verify user-linked inquiry...');
const testEmail = `concierge_test_${Date.now()}@example.com`;
const authRes = await fetch(base + '/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: base },
  body: JSON.stringify({
    action: 'register',
    name: 'Vikram Singhania',
    email: testEmail,
    password: 'Password123!',
  }),
});
assert.ok(authRes.status === 200 || authRes.status === 201, 'User registration should succeed (200 or 201)');
const authCookie = authRes.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

// 4a. Submit inquiry as authenticated user
const authInquiry = {
  name: 'Vikram Singhania',
  email: testEmail,
  phone: '+91 99300 54321',
  subject: 'Sizing & Fit Consultation',
  orderId: 'DEMO-ORD-8821',
  message: 'I am between sizes M and L for the Field Overshirt. My chest measures 102cm. Which fit would look best?',
};

const postAuthRes = await fetch(base + '/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    origin: base,
    cookie: authCookie,
  },
  body: JSON.stringify(authInquiry),
});

assert.equal(postAuthRes.status, 201, 'Authenticated inquiry submission should return 201');
const authTicket = await postAuthRes.json();
assert.ok(authTicket.ok, 'Auth ticket response must have ok: true');
assert.ok(authTicket.id && authTicket.id.startsWith('INQ-'), 'Auth ticket ID format');
console.log(`PASS: Authenticated inquiry saved with ticket ID: ${authTicket.id}`);

// 4b. Fetch user's inquiry history via GET /api/contact
console.log('5. Querying GET /api/contact to verify database retrieval...');
const getHistoryRes = await fetch(base + '/api/contact', {
  headers: {
    cookie: authCookie,
  },
});
assert.equal(getHistoryRes.status, 200, 'GET /api/contact should return 200');
const historyData = await getHistoryRes.json();
assert.ok(Array.isArray(historyData.inquiries), 'inquiries must be an array');
assert.ok(historyData.inquiries.length >= 1, 'Should have at least 1 inquiry in history');

const latest = historyData.inquiries.find((i) => i.id === authTicket.id);
assert.ok(latest, 'Database must contain the newly created ticket record');
assert.equal(latest.subject, 'Sizing & Fit Consultation', 'Subject must match database entry');
assert.equal(latest.status, 'Received', 'Initial status must be Received');
assert.equal(latest.orderId, 'DEMO-ORD-8821', 'Linked orderId must match database entry');
assert.ok(latest.createdAt, 'Timestamp must exist in database record');
console.log('PASS: Database entry verified with complete fields and user association!');

console.log('\n======================================================');
console.log('ALL CONTACT & GARMENT CARE TESTS PASSED CLEANLY (100%)');
console.log('======================================================\n');
