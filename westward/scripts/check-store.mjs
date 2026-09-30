import assert from 'node:assert/strict';
const base='http://localhost:5173';
const sign=await fetch(base+'/signin-with-chatgpt?return_to=/account',{redirect:'manual'});
const cookie=sign.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
assert.ok(cookie,'Local sign-in cookie');
async function call(body,authenticated=true){const res=await fetch(base+'/api/store',{method:body?'POST':'GET',headers:{...(authenticated?{cookie}:{}),...(body?{'Content-Type':'application/json',origin:base}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json()}}
assert.equal((await call({action:'bag',productId:'mesa-shirt',size:'M',quantity:1},false)).status,401);
assert.equal((await call({action:'bag',productId:'mesa-shirt',size:'invalid',quantity:1})).status,400);
assert.equal((await call({action:'bag',productId:'mesa-shirt',size:'M',quantity:1})).status,200);
assert.equal((await call({action:'wishlist',productId:'mesa-shirt',saved:true})).status,200);
let state=(await call()).data;assert.ok(state.bag.some(x=>x.productId==='mesa-shirt'));assert.ok(state.wishlist.includes('mesa-shirt'));
const payload={action:'checkout',requestId:crypto.randomUUID(),address:{name:'Preview Test',email:'preview@example.test',street:'1 Sample Street',city:'Mumbai',postal:'400001'},total:1};
const first=await call(payload);assert.equal(first.status,200);assert.equal(first.data.total,5189,'Server computes product price and shipping');
const replay=await call(payload);assert.equal(replay.data.id,first.data.id,'Idempotent order retry');
state=(await call()).data;assert.equal(state.bag.length,0);assert.ok(state.orders.some(o=>o.id===first.data.id));
assert.equal((await call(null,false)).data.orders.length,0);
await call({action:'wishlist',productId:'mesa-shirt',saved:false});
console.log('PASS: SQL catalog, authentication, size validation, persistent bag and wishlist, server pricing, demo checkout, idempotency, order history and anonymous isolation.');
