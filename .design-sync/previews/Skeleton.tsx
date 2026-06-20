import { Skeleton, Card, CardHeader, CardContent } from "frontend";

export function ServerCardLoading() {
  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <Card>
        <CardHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ServerListLoading() {
  return (
    <div style={{ padding: 24, maxWidth: 420, display: "flex", flexDirection: "column", gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton className="h-10 w-10 rounded-md" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartLoading() {
  return (
    <div style={{ padding: 24, maxWidth: 420, display: "flex", flexDirection: "column", gap: 12 }}>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-40 w-full rounded-md" />
    </div>
  );
}
