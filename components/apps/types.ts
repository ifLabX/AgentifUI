export interface AppInstance {
  instanceId: string;
  displayName: string;
  description?: string;
  appType: 'model' | 'marketplace';
  iconUrl?: string;
  category?: string;
  tags?: string[];
  difyAppType?: string;
  isPopular?: boolean;
  lastUsed?: string;
  config?: {
    app_metadata?: {
      dify_apptype?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}
