import { CalendarDays, Compass, Gamepad2, Home, Medal, MessagesSquare, Shield, Trophy, Users, UsersRound, Wallet } from "lucide-react";

export const primaryNavigation = [
  { label: "Feed", href: "/feed", icon: Home },
  { label: "Discover", href: "/users", icon: Compass },
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "Teams", href: "/teams", icon: Shield },
  { label: "Hubs", href: "/hubs", icon: UsersRound },
];

export const secondaryNavigation = [
  { label: "Messages", href: "/messages", icon: MessagesSquare },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Leaderboard", href: "/leaderboard", icon: Medal },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Wallet", href: "/wallet", icon: Wallet },
];

export const mobileNavigation = [
  { label: "Feed", href: "/feed", icon: Home },
  { label: "Gamers", href: "/users", icon: Users },
  { label: "Teams", href: "/teams", icon: Shield },
  { label: "Games", href: "/games", icon: Gamepad2 },
];
