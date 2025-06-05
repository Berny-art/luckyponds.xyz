import PondInterface from '@/components/PondInterface';

interface HomePageProps {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
	const params = await searchParams;
	const referrerCode = typeof params.ref === 'string' ? params.ref : null;

	return <PondInterface initialReferrerCode={referrerCode} />;
}
