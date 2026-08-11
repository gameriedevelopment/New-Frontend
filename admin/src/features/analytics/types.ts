export type AnalyticsRange = "24h" | "7d" | "30d" | "90d";

export interface PostAnalytics {
  totalPosts: number;
  totalInteractions: number;
  activeUsers: number;
  flaggedContent: number;
  postGrowth: number;
  interactionGrowth: number;
  userGrowth: number;
  flaggedContentChange: number;
  postGrowthData: { date: string; posts: number }[];
  engagementData: { name: string; likes: number; comments: number; shares: number }[];
  regionalData: { region: string; value: number }[];
  topHashtags: { tag: string; count: number }[];
  topUsers: {
    id: string;
    username: string;
    profileImage: string | null;
    posts: number;
    interactions: number;
  }[];
}
