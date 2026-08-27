export interface AnalyticsTotals {
  httpRequests: number;
  httpErrors: number;
  uniqueVisitors: number;
  uniqueVisitorsThisMonth: number;
  pageViews: number;
  loggedInViews: number;
}

export interface AnalyticsSeriesPoint {
  time: string;
  requests: number;
  uniqueVisitors: number;
}

export interface AnalyticsTopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
}

export interface AnalyticsTopReferrer {
  referrer: string;
  views: number;
}

export interface AnalyticsCountry {
  country: string;
  views: number;
}

export interface AnalyticsDashboard {
  totals: AnalyticsTotals;
  series: AnalyticsSeriesPoint[];
  topPages: AnalyticsTopPage[];
  topReferrers: AnalyticsTopReferrer[];
  countries: AnalyticsCountry[];
}

/** Activité d'un compte sur une fenêtre : une « connexion » est une visite, pas un login. */
export interface UserActivityMetrics {
  connections: number;
  pageViews: number;
  devices: number;
  activeDays: number;
  timeSpentMs: number;
  viewsPerConnection: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
}

export interface ActiveUser extends UserActivityMetrics {
  id: number;
  username: string;
  email: string;
  role: "admin" | "writer" | "user";
  avatarUrl: string | null;
  createdAt: string;
}

export type ActiveUsersSort = "connections" | "pageViews" | "timeSpent" | "lastSeen";

export interface ActiveUsersResponse {
  data: ActiveUser[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
  totals: {
    activeUsers: number;
    connections: number;
    pageViews: number;
    connectionsPerUser: number;
  };
}

export interface UserActivity extends UserActivityMetrics {
  series: { day: string; connections: number; pageViews: number }[];
  topPages: { path: string; views: number }[];
}
