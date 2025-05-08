import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * 加密 API 密钥
 * @param apiKey 要加密的 API 密钥
 * @param masterKey 主密钥
 * @returns 加密后的字符串，格式为 "iv:authTag:encryptedData"
 */
export function encryptApiKey(apiKey: string, masterKey: string): string {
  // 确保主密钥长度为 32 字节（256 位）
  const key = Buffer.from(masterKey.padEnd(64, '0').slice(0, 64), 'hex');
  
  // 生成随机初始化向量
  const iv = randomBytes(16);
  
  // 创建加密器
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  // 加密数据
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 获取认证标签
  const authTag = cipher.getAuthTag().toString('hex');
  
  // 返回格式化的加密数据
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * 解密 API 密钥
 * @param encryptedData 加密的数据，格式为 "iv:authTag:encryptedData"
 * @param masterKey 主密钥
 * @returns 解密后的 API 密钥
 */
export function decryptApiKey(encryptedData: string, masterKey: string): string {
  // 确保主密钥长度为 32 字节（256 位）
  const key = Buffer.from(masterKey.padEnd(64, '0').slice(0, 64), 'hex');
  
  // 解析加密数据
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
  
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted data format');
  }
  
  // 转换为 Buffer
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // 创建解密器
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  // 解密数据
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 生成随机的主密钥
 * @returns 32 字节（256 位）的随机十六进制字符串
 */
export function generateMasterKey(): string {
  return randomBytes(32).toString('hex');
}
