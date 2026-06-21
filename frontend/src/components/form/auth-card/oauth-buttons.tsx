import { Button } from "@/components/ui/button";

interface OAuthButtonsProps {
  onDiscord: () => void;
  onGoogle: () => void;
}

/** Discord brand glyph (single-color). */
const DiscordGlyph = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
    <path d="M19.27 5.33A16.6 16.6 0 0 0 15.1 4l-.2.4a15.4 15.4 0 0 1 3.71 1.2 13.3 13.3 0 0 0-11.22 0A15.4 15.4 0 0 1 11.1 4.4L10.9 4a16.6 16.6 0 0 0-4.17 1.33C3.4 9.3 2.5 13.16 2.95 16.96a16.7 16.7 0 0 0 5.1 2.58l.4-.56a11 11 0 0 1-1.62-.78l.13-.1a11.9 11.9 0 0 0 10.1 0l.13.1c-.5.3-1.05.56-1.62.78l.4.56a16.7 16.7 0 0 0 5.1-2.58c.5-4.4-.86-8.23-3.13-11.63zM9.3 14.84c-.8 0-1.45-.74-1.45-1.65s.64-1.66 1.45-1.66c.81 0 1.46.75 1.45 1.66 0 .91-.65 1.65-1.45 1.65zm5.4 0c-.8 0-1.45-.74-1.45-1.65s.64-1.66 1.45-1.66c.81 0 1.46.75 1.45 1.66 0 .91-.64 1.65-1.45 1.65z" />
  </svg>
);

/** Google brand glyph (4-color G). */
const GoogleGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
    />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

/** OAuth provider row: two outline buttons in a responsive 2-col grid. */
const OAuthButtons = ({ onDiscord, onGoogle }: OAuthButtonsProps) => {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Button type="button" variant="outline" className="h-11 gap-2 border-input hover:bg-secondary" onClick={onDiscord}>
        <DiscordGlyph />
        Discord
      </Button>
      <Button type="button" variant="outline" className="h-11 gap-2 border-input hover:bg-secondary" onClick={onGoogle}>
        <GoogleGlyph />
        Google
      </Button>
    </div>
  );
};

export default OAuthButtons;
