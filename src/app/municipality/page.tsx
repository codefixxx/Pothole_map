import { redirect } from 'next/navigation';

export default function MunicipalityRootPage({
    searchParams,
}: {
    searchParams?: Promise<{ demo?: string }> | { demo?: string };
}) {
    redirect('/municipality/dashboard');
}
