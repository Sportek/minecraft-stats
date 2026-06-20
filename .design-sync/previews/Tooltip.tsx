import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Button } from "frontend";

export function PlayerCount() {
  return (
    <div style={{ padding: 80, display: "flex", justifyContent: "center" }}>
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger asChild>
            <Button variant="outline">Hypixel</Button>
          </TooltipTrigger>
          <TooltipContent>48,302 players online right now</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
