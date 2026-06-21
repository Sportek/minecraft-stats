import DashboardSidebar from "./dashboard-sidebar";

/**
 * Two-column dashboard shell (sticky sidebar + content) shared by the account
 * pages — Profile, My Servers, Add Server. The sidebar is hidden on mobile,
 * where navigation falls back to the header drawer.
 */
const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="grid w-full gap-8 py-8 lg:grid-cols-[220px_1fr] lg:items-start">
    <DashboardSidebar />
    <div className="flex min-w-0 flex-col gap-5">{children}</div>
  </div>
);

export default DashboardLayout;
