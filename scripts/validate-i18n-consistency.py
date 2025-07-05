#!/usr/bin/env python3
"""
i18n翻译文件一致性验证脚本
用于确保所有语言的翻译文件具有相同的结构和键
"""

import json
import os
import sys
from typing import Dict, Set, List, Any

def get_all_keys(obj: Any, prefix: str = "") -> Set[str]:
    """递归获取JSON对象中的所有键路径"""
    keys = set()
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            current_path = f"{prefix}.{key}" if prefix else key
            keys.add(current_path)
            keys.update(get_all_keys(value, current_path))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            keys.update(get_all_keys(item, f"{prefix}[{i}]"))
    
    return keys

def load_translation_files() -> Dict[str, Dict]:
    """加载所有翻译文件"""
    languages = ['zh-CN', 'en-US', 'es-ES', 'zh-TW', 'ja-JP']
    translations = {}
    
    for lang in languages:
        file_path = f"messages/{lang}.json"
        if not os.path.exists(file_path):
            print(f"❌ 文件不存在: {file_path}")
            sys.exit(1)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                translations[lang] = json.load(f)
            print(f"✅ 成功加载: {file_path}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON格式错误 {file_path}: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ 加载失败 {file_path}: {e}")
            sys.exit(1)
    
    return translations

def validate_structure_consistency(translations: Dict[str, Dict]) -> bool:
    """验证所有翻译文件的结构一致性"""
    print("\n🔍 验证结构一致性...")
    
    # 获取所有语言的键集合
    all_keys = {}
    for lang, data in translations.items():
        all_keys[lang] = get_all_keys(data)
        print(f"  {lang}: {len(all_keys[lang])} 个键")
    
    # 以中文为基准检查其他语言
    base_lang = 'zh-CN'
    base_keys = all_keys[base_lang]
    
    inconsistent = False
    
    for lang in all_keys:
        if lang == base_lang:
            continue
        
        current_keys = all_keys[lang]
        
        # 检查缺失的键
        missing_keys = base_keys - current_keys
        if missing_keys:
            print(f"❌ {lang} 缺失键 ({len(missing_keys)}个):")
            for key in sorted(missing_keys):
                print(f"    - {key}")
            inconsistent = True
        
        # 检查多余的键
        extra_keys = current_keys - base_keys
        if extra_keys:
            print(f"❌ {lang} 多余键 ({len(extra_keys)}个):")
            for key in sorted(extra_keys):
                print(f"    + {key}")
            inconsistent = True
        
        if not missing_keys and not extra_keys:
            print(f"✅ {lang} 结构完全一致")
    
    return not inconsistent

def validate_file_consistency() -> bool:
    """验证文件行数一致性"""
    print("\n📊 验证文件行数一致性...")
    
    languages = ['zh-CN', 'en-US', 'es-ES', 'zh-TW', 'ja-JP']
    line_counts = {}
    
    for lang in languages:
        file_path = f"messages/{lang}.json"
        with open(file_path, 'r', encoding='utf-8') as f:
            line_counts[lang] = len(f.readlines())
        print(f"  {lang}: {line_counts[lang]} 行")
    
    # 检查是否所有文件行数相同
    unique_counts = set(line_counts.values())
    if len(unique_counts) == 1:
        print("✅ 所有文件行数一致")
        return True
    else:
        print("❌ 文件行数不一致")
        return False

def validate_json_format(translations: Dict[str, Dict]) -> bool:
    """验证JSON格式正确性"""
    print("\n🔧 验证JSON格式...")
    
    for lang, data in translations.items():
        try:
            # 尝试重新序列化以验证格式
            json.dumps(data, ensure_ascii=False, indent=2)
            print(f"✅ {lang} JSON格式正确")
        except Exception as e:
            print(f"❌ {lang} JSON格式错误: {e}")
            return False
    
    return True

def main():
    """主函数"""
    print("🚀 开始验证i18n翻译文件一致性...")
    
    # 检查是否在正确的目录
    if not os.path.exists("messages"):
        print("❌ 未找到messages目录，请在项目根目录运行此脚本")
        sys.exit(1)
    
    # 加载翻译文件
    translations = load_translation_files()
    
    # 执行所有验证
    validations = [
        validate_file_consistency(),
        validate_json_format(translations),
        validate_structure_consistency(translations)
    ]
    
    # 输出结果
    print("\n" + "="*50)
    if all(validations):
        print("🎉 所有验证通过！翻译文件结构完全一致")
        return 0
    else:
        print("❌ 验证失败！请修复上述问题")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 