export type ReportCategory =
  | 'inappropriate_behavior'
  | 'harassment'
  | 'suspected_underage'
  | 'spam'
  | 'scam'
  | 'impersonation'
  | 'explicit_content'
  | 'other';

export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'rejected';

export interface IReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  reportedUserId: string;
  reportedUserName?: string;
  sessionId?: string;
  category: ReportCategory;
  description?: string;
  status: ReportStatus;
  moderatorId?: string;
  moderatorNotes?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface IBlockedUser {
  id: string;
  blockerId: string;
  blockedUserId: string;
  blockedUserName?: string;
  blockedUserAvatar?: string;
  createdAt: string;
}
