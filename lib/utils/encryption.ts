import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

/**
 * Encrypt API key
 * @param apiKey The API key to encrypt
 * @param masterKey The master key
 * @returns Encrypted string in the format "iv:authTag:encryptedData"
 */
export function encryptApiKey(apiKey: string, masterKey: string): string {
  // Generate a fixed-length key using SHA-256
  const hash = createHash('sha256');
  hash.update(masterKey);
  const key = hash.digest(); // 32 bytes key

  // Generate a random initialization vector (IV)
  const iv = randomBytes(16);

  // Create cipher
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  // Encrypt data
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag
  const authTag = cipher.getAuthTag().toString('hex');

  // Return formatted encrypted data
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt API key
 * @param encryptedData Encrypted data in the format "iv:authTag:encryptedData"
 * @param masterKey The master key
 * @returns Decrypted API key
 */
export function decryptApiKey(
  encryptedData: string,
  masterKey: string
): string {
  // Generate a fixed-length key using SHA-256
  const hash = createHash('sha256');
  hash.update(masterKey);
  const key = hash.digest(); // 32 bytes key

  // Parse encrypted data
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted data format');
  }

  // Convert to Buffer
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  // Create decipher
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt data
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a random master key
 * @returns A 32-byte (256-bit) random hexadecimal string
 */
export function generateMasterKey(): string {
  return randomBytes(32).toString('hex');
}
