import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {catalog} from '../lib/catalog.ts';
const categories=['Shirts','Essentials','Denim','Outerwear','Footwear'];
assert.equal(catalog.length,100);assert.equal(new Set(catalog.map(p=>p.id)).size,100);assert.equal(new Set(catalog.map(p=>p.name)).size,100);
for(const category of categories)assert.equal(catalog.filter(p=>p.category===category).length,20,category);
for(const product of catalog){assert.ok(existsSync('public/images/'+product.image+'.jpg'),product.id+' image');assert.ok(product.price>0&&product.sizes.length&&product.description.length>20,product.id+' details')}
const base='http://localhost:5173';const response=await fetch(base+'/api/store');assert.equal(response.status,200);const data=await response.json();assert.equal(data.products.length,100);
for(const category of categories)assert.equal(data.products.filter(p=>p.category===category).length,20,'SQL '+category);
const again=await (await fetch(base+'/api/store')).json();assert.equal(again.products.length,100,'Idempotent catalog synchronization');
const sign=await fetch(base+'/signin-with-chatgpt?return_to=/shop',{redirect:'manual'});const cookie=sign.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
for(const category of categories){const p=catalog.filter(p=>p.category===category).at(-1);const page=await fetch(base+'/product/'+p.id);assert.equal(page.status,200);assert.ok((await page.text()).includes(p.name),p.id+' detail page');const payload={action:'bag',productId:p.id,size:p.sizes[0],quantity:1};const headers={'Content-Type':'application/json',origin:base,cookie};const add=await fetch(base+'/api/store',{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(add.status,200);const saved=await (await fetch(base+'/api/store',{headers:{cookie}})).json();assert.ok(saved.bag.some(i=>i.productId===p.id&&i.size===p.sizes[0]));const remove=await fetch(base+'/api/store',{method:'POST',headers,body:JSON.stringify({...payload,quantity:0})});assert.equal(remove.status,200)}
console.log('PASS: 100 unique products; 20 in each category; all images and details present; SQL synchronization idempotent; one new product per category renders and persists in bag.');
