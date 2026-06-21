interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground p-4 shadow-xs transition-all hover:border-accent/40 hover:shadow-md">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="shrink-0 text-muted-foreground">{icon}</span>
        {title}
      </div>
      <div className="mt-2.5 text-2xl font-bold tracking-tight text-foreground">{value}</div>
    </div>
  );
};

export default StatCard;
