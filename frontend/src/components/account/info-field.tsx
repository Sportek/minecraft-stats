interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
}

/** Read-only label + value pair used inside the profile information grid. */
const InfoField = ({ label, value }: InfoFieldProps) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground">{value}</span>
  </div>
);

export default InfoField;
