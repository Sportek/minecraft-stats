interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card text-card-foreground p-4 shadow-xs transition-all hover:border-accent/40 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
          {icon}
        </div>
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
};

export default StatCard;
