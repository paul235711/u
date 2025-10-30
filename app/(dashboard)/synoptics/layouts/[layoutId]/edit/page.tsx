import { redirect } from 'next/navigation';

// Redirect to main layout page (now has unified view with lock/unlock)
export default async function LayoutEditRedirect({
  params,
}: {
  params: Promise<{ layoutId: string }>;
}) {
  const { layoutId } = await params;
  redirect(`/synoptics/layouts/${layoutId}`);
}
