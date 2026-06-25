export interface AnalyticsTotals {
  pageViews: number;
  uniqueVisitors: number;
  loggedInViews: number;
  requests: number;
  errors: number;
}

export interface AnalyticsSeriesPoint {
  time: string;
  pageViews: number;
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
