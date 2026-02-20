import { SplitViewLayout } from "@/components/shared/split-view-layout";

export default function DeliverablesLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return <SplitViewLayout list={children} detail={detail} />;
}
