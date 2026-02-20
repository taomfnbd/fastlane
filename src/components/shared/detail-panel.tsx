interface DetailPanelProps {
  children: React.ReactNode;
}

export function DetailPanel({ children }: DetailPanelProps) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {children}
    </div>
  );
}
