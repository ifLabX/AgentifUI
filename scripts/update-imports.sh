#!/bin/bash

# 脚本用于更新组件导入路径，从PascalCase改为kebab-case

# 更新Button组件的导入
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' 's|from '"'"'@components/ui/Button'"'"'|from '"'"'@components/ui/button'"'"'|g'

# 更新Home组件的导入
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' 's|from '"'"'@components/home/Home'"'"'|from '"'"'@components/home/home'"'"'|g'

# 更新LoginForm组件的导入
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' 's|from '"'"'@components/auth/LoginForm'"'"'|from '"'"'@components/auth/login-form'"'"'|g'

# 更新RegisterForm组件的导入
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/.next/*" | xargs sed -i '' 's|from '"'"'@components/auth/RegisterForm'"'"'|from '"'"'@components/auth/register-form'"'"'|g'

echo "组件导入路径更新完成。" 
