#!/usr/bin/env python3
"""
i18n重构助手脚本
集成验证功能，简化翻译重构流程
"""

import json
import os
import sys
import subprocess
from typing import Dict, Set, List, Any, Optional
from pathlib import Path

class I18nRefactorHelper:
    def __init__(self):
        self.languages = ['zh-CN', 'en-US', 'es-ES', 'zh-TW', 'ja-JP']
        self.messages_dir = Path("messages")
        self.backup_dir = Path("messages/.backup")
        
    def create_backup(self) -> bool:
        """创建翻译文件备份"""
        print("📦 创建翻译文件备份...")
        
        try:
            self.backup_dir.mkdir(exist_ok=True)
            
            for lang in self.languages:
                src = self.messages_dir / f"{lang}.json"
                dst = self.backup_dir / f"{lang}.json.backup"
                
                if src.exists():
                    subprocess.run(["cp", str(src), str(dst)], check=True)
                    print(f"  ✅ 备份 {lang}.json")
                else:
                    print(f"  ❌ 文件不存在: {lang}.json")
                    return False
            
            print("✅ 备份完成")
            return True
            
        except Exception as e:
            print(f"❌ 备份失败: {e}")
            return False
    
    def restore_backup(self) -> bool:
        """恢复翻译文件备份"""
        print("🔄 恢复翻译文件备份...")
        
        try:
            for lang in self.languages:
                src = self.backup_dir / f"{lang}.json.backup"
                dst = self.messages_dir / f"{lang}.json"
                
                if src.exists():
                    subprocess.run(["cp", str(src), str(dst)], check=True)
                    print(f"  ✅ 恢复 {lang}.json")
                else:
                    print(f"  ❌ 备份不存在: {lang}.json.backup")
                    return False
            
            print("✅ 恢复完成")
            return True
            
        except Exception as e:
            print(f"❌ 恢复失败: {e}")
            return False
    
    def cleanup_backup(self) -> bool:
        """清理备份文件"""
        print("🧹 清理备份文件...")
        
        try:
            if self.backup_dir.exists():
                subprocess.run(["rm", "-rf", str(self.backup_dir)], check=True)
                print("✅ 备份文件已清理")
            else:
                print("ℹ️ 没有找到备份文件")
            return True
            
        except Exception as e:
            print(f"❌ 清理失败: {e}")
            return False
    
    def get_all_keys(self, obj: Any, prefix: str = "") -> Set[str]:
        """递归获取JSON对象中的所有键路径"""
        keys = set()
        
        if isinstance(obj, dict):
            for key, value in obj.items():
                current_path = f"{prefix}.{key}" if prefix else key
                keys.add(current_path)
                keys.update(self.get_all_keys(value, current_path))
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                keys.update(self.get_all_keys(item, f"{prefix}[{i}]"))
        
        return keys
    
    def load_translation_files(self) -> Optional[Dict[str, Dict]]:
        """加载所有翻译文件"""
        translations = {}
        
        for lang in self.languages:
            file_path = self.messages_dir / f"{lang}.json"
            if not file_path.exists():
                print(f"❌ 文件不存在: {file_path}")
                return None
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    translations[lang] = json.load(f)
            except json.JSONDecodeError as e:
                print(f"❌ JSON格式错误 {file_path}: {e}")
                return None
            except Exception as e:
                print(f"❌ 加载失败 {file_path}: {e}")
                return None
        
        return translations
    
    def validate_consistency(self, silent: bool = False) -> bool:
        """验证翻译文件一致性"""
        if not silent:
            print("🔍 验证翻译文件一致性...")
        
        translations = self.load_translation_files()
        if not translations:
            return False
        
        # 验证行数一致性
        line_counts = {}
        for lang in self.languages:
            file_path = self.messages_dir / f"{lang}.json"
            with open(file_path, 'r', encoding='utf-8') as f:
                line_counts[lang] = len(f.readlines())
        
        if not silent:
            print("📊 文件行数:")
            for lang, count in line_counts.items():
                print(f"  {lang}: {count} 行")
        
        unique_counts = set(line_counts.values())
        if len(unique_counts) != 1:
            print("❌ 文件行数不一致")
            return False
        
        # 验证结构一致性
        all_keys = {}
        for lang, data in translations.items():
            all_keys[lang] = self.get_all_keys(data)
        
        if not silent:
            print("🔧 结构键数:")
            for lang, keys in all_keys.items():
                print(f"  {lang}: {len(keys)} 个键")
        
        # 以中文为基准检查其他语言
        base_lang = 'zh-CN'
        base_keys = all_keys[base_lang]
        
        inconsistent = False
        for lang in all_keys:
            if lang == base_lang:
                continue
            
            current_keys = all_keys[lang]
            missing_keys = base_keys - current_keys
            extra_keys = current_keys - base_keys
            
            if missing_keys or extra_keys:
                if not silent:
                    print(f"❌ {lang} 结构不一致:")
                    if missing_keys:
                        print(f"    缺失 {len(missing_keys)} 个键")
                    if extra_keys:
                        print(f"    多余 {len(extra_keys)} 个键")
                inconsistent = True
            elif not silent:
                print(f"✅ {lang} 结构一致")
        
        return not inconsistent
    
    def add_translation_structure(self, translation_key: str, zh_content: Dict) -> bool:
        """为所有语言添加翻译结构"""
        print(f"🌍 为所有语言添加翻译结构: {translation_key}")
        
        translations = self.load_translation_files()
        if not translations:
            return False
        
        # 为中文添加翻译内容
        keys = translation_key.split('.')
        current = translations['zh-CN']
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        current[keys[-1]] = zh_content
        
        # 为其他语言添加相同结构（需要手动翻译内容）
        for lang in ['en-US', 'es-ES', 'zh-TW', 'ja-JP']:
            current = translations[lang]
            for key in keys[:-1]:
                if key not in current:
                    current[key] = {}
                current = current[key]
            # 这里添加占位符，提醒需要翻译
            current[keys[-1]] = self._create_placeholder_structure(zh_content, lang)
        
        # 保存所有文件
        for lang, data in translations.items():
            file_path = self.messages_dir / f"{lang}.json"
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  ✅ 更新 {lang}.json")
        
        return True
    
    def _create_placeholder_structure(self, zh_content: Any, lang: str) -> Any:
        """创建占位符结构"""
        if isinstance(zh_content, dict):
            return {k: self._create_placeholder_structure(v, lang) for k, v in zh_content.items()}
        elif isinstance(zh_content, list):
            return [self._create_placeholder_structure(item, lang) for item in zh_content]
        else:
            return f"[TODO: Translate to {lang}] {zh_content}"
    
    def run_validation(self) -> bool:
        """运行完整验证"""
        print("🚀 运行i18n一致性验证...")
        
        try:
            result = subprocess.run(
                ["python3", "scripts/validate-i18n-consistency.py"],
                capture_output=True,
                text=True,
                check=False
            )
            
            print(result.stdout)
            if result.stderr:
                print("错误输出:")
                print(result.stderr)
            
            return result.returncode == 0
            
        except Exception as e:
            print(f"❌ 验证脚本运行失败: {e}")
            return False
    
    def quick_check(self) -> bool:
        """快速检查（静默模式）"""
        return self.validate_consistency(silent=True)

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python3 scripts/i18n-refactor-helper.py backup          # 创建备份")
        print("  python3 scripts/i18n-refactor-helper.py restore         # 恢复备份")
        print("  python3 scripts/i18n-refactor-helper.py cleanup         # 清理备份")
        print("  python3 scripts/i18n-refactor-helper.py validate        # 运行验证")
        print("  python3 scripts/i18n-refactor-helper.py quick-check     # 快速检查")
        print("  python3 scripts/i18n-refactor-helper.py check           # 验证后清理")
        return 1
    
    helper = I18nRefactorHelper()
    command = sys.argv[1]
    
    if command == "backup":
        success = helper.create_backup()
        return 0 if success else 1
    
    elif command == "restore":
        success = helper.restore_backup()
        return 0 if success else 1
    
    elif command == "cleanup":
        success = helper.cleanup_backup()
        return 0 if success else 1
    
    elif command == "validate":
        success = helper.run_validation()
        return 0 if success else 1
    
    elif command == "quick-check":
        success = helper.quick_check()
        if success:
            print("✅ 快速检查通过")
        else:
            print("❌ 快速检查失败")
        return 0 if success else 1
    
    elif command == "check":
        # 验证后清理备份
        success = helper.run_validation()
        if success:
            print("✅ 验证通过，正在清理备份...")
            helper.cleanup_backup()
        return 0 if success else 1
    
    else:
        print(f"❌ 未知命令: {command}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 