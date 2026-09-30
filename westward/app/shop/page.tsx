import Store from '../store';

export default async function Shop({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  return <Store view="shop" initialCategory={params?.category} />;
}
