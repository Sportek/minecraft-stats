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
