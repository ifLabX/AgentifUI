-- 修复 API 密钥加密格式
-- 将明文密钥替换为正确的加密格式
-- 格式为 "iv:authTag:encryptedData"

-- 使用一个示例加密格式替换现有的明文密钥
-- 注意：这只是一个示例格式，实际解密时会失败
-- 用户需要通过管理界面重新设置真实的 API 密钥
UPDATE api_keys
SET key_value = '0102030405060708090a0b0c0d0e0f10:0102030405060708090a0b0c0d0e0f10:0102030405060708090a0b0c0d0e0f1011121314'
WHERE key_value = 'app-xxxxxxxxxxxxxxxxxxxx';

-- 添加注释，提醒管理员需要重新设置 API 密钥
COMMENT ON TABLE api_keys IS '存储加密的 API 密钥。管理员需要通过管理界面重新设置 API 密钥。';
