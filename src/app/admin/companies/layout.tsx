import { SplitViewLayout } from "@/components/shared/split-view-layout";

export default function CompaniesLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return <SplitViewLayout list={children} detail={detail} />;
}
