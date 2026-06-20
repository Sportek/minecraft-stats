import { Avatar, AvatarFallback, AvatarImage } from "frontend";

export function WithImage() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 24 }}>
      <Avatar>
        <AvatarImage
          src="https://api.dicebear.com/7.x/identicon/svg?seed=hypixel"
          alt="Hypixel server icon"
        />
        <AvatarFallback>HX</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://api.dicebear.com/7.x/identicon/svg?seed=mineplex"
          alt="Mineplex server icon"
        />
        <AvatarFallback>MP</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function FallbackOnly() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 24 }}>
      <Avatar>
        <AvatarFallback>HX</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>CB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>2B</AvatarFallback>
      </Avatar>
    </div>
  );
}

export function ServerList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar>
          <AvatarImage
            src="https://api.dicebear.com/7.x/identicon/svg?seed=hypixel"
            alt="Hypixel"
          />
          <AvatarFallback>HX</AvatarFallback>
        </Avatar>
        <span style={{ fontSize: 14, fontWeight: 500 }}>mc.hypixel.net</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar>
          <AvatarFallback>CB</AvatarFallback>
        </Avatar>
        <span style={{ fontSize: 14, fontWeight: 500 }}>play.cubecraft.net</span>
      </div>
    </div>
  );
}
