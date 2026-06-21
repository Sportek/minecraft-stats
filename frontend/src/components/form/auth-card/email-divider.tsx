/** Horizontal divider with a centered uppercase "OR WITH EMAIL" label. */
const EmailDivider = () => {
  return (
    <div className="flex items-center gap-3.5">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Or with email
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
};

export default EmailDivider;
