import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "frontend";

export function AddServer() {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a server</DialogTitle>
          <DialogDescription>
            Submit a Minecraft server to start tracking its player count.
          </DialogDescription>
        </DialogHeader>
        <p style={{ fontSize: 14, margin: 0 }}>
          We&apos;ll ping it every 10 minutes and chart how its community grows over time.
        </p>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Add server</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
