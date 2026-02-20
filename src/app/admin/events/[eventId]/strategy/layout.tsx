import { SplitViewLayout } from "@/components/shared/split-view-layout";

export default function StrategyLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return <SplitViewLayout list={children} detail={detail} />;
}
