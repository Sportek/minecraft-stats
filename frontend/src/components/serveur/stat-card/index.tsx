interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => {

  return (
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-md shadow-md w-full flex flex-col gap-2">
      <div className="flex flex-row gap-2 items-center">
        <div className="p-2 rounded-md bg-stats-blue-600/10 dark:bg-stats-blue-400/10">
          {icon}
        </div>
        <div className="text-sm">{title}</div>
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

export default StatCard;