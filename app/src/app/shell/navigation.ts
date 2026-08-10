import { CalendarDays, Compass, Gamepad2, Home, Medal, MessagesSquare, RadioTower, Shield, Swords, Trophy, Wallet } from "lucide-react";

export const primaryNavigation = [
  { label: "Feed", href: "/feed", icon: Home },
  { label: "Discover", href: "/users", icon: Compass },
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "Teams", href: "/teams", icon: Shield },
  { label: "Hubs", href: "/hubs", icon: RadioTower },
];

export const secondaryNavigation = [
  { label: "Messages", href: "/messages", icon: MessagesSquare },
  { label: "Challenges", href: "/challenges", icon: Swords },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Leaderboard", href: "/leaderboard", icon: Medal },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Wallet", href: "/wallet", icon: Wallet },
];

export const mobileNavigation = [
  { label: "Home", href: "/feed", icon: Home },
  { label: "Discover", href: "/users", icon: Compass },
  { label: "Teams", href: "/teams", icon: Shield },
  { label: "Messages", href: "/messages", icon: MessagesSquare },
];

export const mobileMoreNavigation = [
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "Hubs", href: "/hubs", icon: RadioTower },
  ...secondaryNavigation.filter((item) => item.href !== "/messages"),
];
