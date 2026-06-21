import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from "frontend";

export function ServerCard() {
  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <Card>
        <CardHeader>
          <CardTitle>Hypixel</CardTitle>
          <CardDescription>mc.hypixel.net — Minigames &amp; SkyBlock</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge variant="success">Online</Badge>
            <span style={{ fontSize: 14 }}>48,302 players online</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button size="sm">View stats</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function StatCard() {
  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <Card>
        <CardHeader>
          <CardTitle>Weekly growth</CardTitle>
          <CardDescription>Average concurrent players over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ fontSize: 30, fontWeight: 600, margin: 0 }}>+12.4%</p>
        </CardContent>
      </Card>
    </div>
  );
}
