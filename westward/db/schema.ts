import {sqliteTable,text,integer,primaryKey,index} from 'drizzle-orm/sqlite-core';
export const products=sqliteTable('products',{id:text('id').primaryKey(),data:text('data').notNull()});
export const bag=sqliteTable('bag',{userId:text('user_id').notNull(),productId:text('product_id').notNull(),size:text('size').notNull(),quantity:integer('quantity').notNull()},t=>[primaryKey({columns:[t.userId,t.productId,t.size]})]);
export const wishlist=sqliteTable('wishlist',{userId:text('user_id').notNull(),productId:text('product_id').notNull()},t=>[primaryKey({columns:[t.userId,t.productId]})]);
export const orders=sqliteTable('orders',{id:text('id').primaryKey(),userId:text('user_id').notNull(),requestId:text('request_id').notNull().unique(),items:text('items').notNull(),total:integer('total').notNull(),address:text('address').notNull(),status:text('status').notNull(),createdAt:text('created_at').notNull()},t=>[index('idx_orders_user_created').on(t.userId,t.createdAt)]);
