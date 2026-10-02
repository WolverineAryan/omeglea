export interface AdminDashboardStats {
  totalUsers: number;
  activeUsersToday: number;
  newUsersLast7Days: number;
  activeChatSessions: number;
  premiumSubscribers: number;
  totalCreditsSold: number;
  pendingReports: number;
  suspendedAccounts: number;
}

export interface IAdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'report' | 'settings' | 'subscription';
  targetId: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface IPlatformSettings {
  freeDailyMatchLimit: number;
  premiumDailyMatchLimit: number;
  allowGuestMode: boolean;
  maintenanceMode: boolean;
  minAgeRequired: number;
  adPlacementSettings: {
    landingBanner: boolean;
    dashboardBanner: boolean;
    interstitialChat: boolean;
  };
}
