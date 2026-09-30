import Store from '../../store';
import {catalog} from '@/lib/catalog';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=catalog.find(p=>p.id===slug);return {title:p?p.name+' — WESTWARD':'Piece not found — WESTWARD',description:p?.description}}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <Store view="product" slug={slug}/>}
