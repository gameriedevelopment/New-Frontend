export interface DashboardMetric {
  total: number;
  thisMonth: number;
  percentageThisMonth: string;
}

export interface DashboardMetrics {
  users: DashboardMetric;
  teams: DashboardMetric;
  tournaments: DashboardMetric;
  games: DashboardMetric;
}

export interface Envelope<T> {
  data: T;
  message?: string;
}
