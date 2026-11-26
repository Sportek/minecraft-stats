export type ReportReason =
  'scam' | 'inappropriate_content' | 'offline' | 'fake_playercount' | 'other'

export const REPORT_REASONS: ReportReason[] = [
  'scam',
  'inappropriate_content',
  'offline',
  'fake_playercount',
  'other',
]

export type ReportStatus = 'open' | 'resolved'
