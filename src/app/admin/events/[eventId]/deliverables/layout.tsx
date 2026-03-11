import { SplitViewLayout } from "@/components/shared/split-view-layout";

export default async function DeliverablesLayout({
  children,
  detail,
  params,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return (
    <SplitViewLayout
      list={children}
      detail={detail}
      basePath={`/admin/events/${eventId}/deliverables`}
    />
  );
}
