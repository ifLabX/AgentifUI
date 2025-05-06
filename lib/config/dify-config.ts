export interface DifyAppConfig {
  apiKey: string;
  apiUrl: string;
}

export const getDifyAppConfig = async (
  appId: string,
): Promise<DifyAppConfig | null> => {
  const apiKeyEnvVar = `DIFY_APP_${appId.toUpperCase()}_KEY`;
  const apiUrlEnvVar = `DIFY_APP_${appId.toUpperCase()}_URL`;


  const apiKey = process.env[apiKeyEnvVar];
  const apiUrl = process.env[apiUrlEnvVar];

  if (!apiKey || !apiUrl) {
    console.error(
      `Configuration missing for Dify app "${appId}". 
Please ensure ${apiKeyEnvVar} and ${apiUrlEnvVar} are set in your environment variables.`,
    );
    return null;
  }

  return { apiKey, apiUrl };
};

// 这个函数就是我们为未来接入数据库留的抽象层。
// 将来引入 Supabase 后，我们只需要修改这个函数的内部实现，
// 让它从数据库查询，而调用它的 API 路由代码基本不用变。