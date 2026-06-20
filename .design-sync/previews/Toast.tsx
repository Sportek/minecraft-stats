import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from "frontend";

export function Notifications() {
  return (
    <div style={{ padding: 24 }}>
      <ToastProvider duration={1000000}>
        {/* The real ToastViewport is `fixed` (out of flow), which collapses a
            preview card to zero height. Render it in normal flow here so the
            card has real height; the toasts themselves are unchanged. */}
        <ToastViewport
          style={{
            position: "static",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: 420,
            maxWidth: "100%",
            padding: 0,
          }}
        />
        <Toast variant="success" open style={{ animation: "none" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <ToastTitle>Server online</ToastTitle>
            <ToastDescription>Hypixel responded — 48,302 players.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <Toast open style={{ animation: "none" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <ToastTitle>Server added</ToastTitle>
            <ToastDescription>CubeCraft is now being tracked.</ToastDescription>
          </div>
          <ToastAction altText="Undo">Undo</ToastAction>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </div>
  );
}
