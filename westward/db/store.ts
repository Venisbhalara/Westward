import {env} from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Store temporarily unavailable');return env.DB}
