#!/usr/bin/env python3
"""
i18n translation file consistency validation script
Ensures that all language translation files have the same structure and keys.
"""

import json
import os
import sys
import re
from typing import Dict, Set, List, Any
from pathlib import Path

def load_languages_from_ts(verbose: bool = True) -> List[str]:
    """Load supported language list from lib/config/language-config.ts"""
    # Script is in scripts/ directory, TS file path is relative to project root
    project_root = Path(__file__).resolve().parent.parent
    ts_file_path = project_root / "lib/config/language-config.ts"

    if not ts_file_path.exists():
        print(f"❌ Language config file not found at: {ts_file_path}", file=sys.stderr)
        return []

    try:
        content = ts_file_path.read_text(encoding="utf-8")

        # Find SUPPORTED_LANGUAGES object body (non-greedy match)
        match = re.search(
            r"export\s+const\s+SUPPORTED_LANGUAGES\s*=\s*{(.+?)}\s*as\s+const;",
            content,
            re.DOTALL,
        )
        if not match:
            print("❌ Could not find SUPPORTED_LANGUAGES in the config file.", file=sys.stderr)
            return []

        obj_content = match.group(1)

        # Match more general language codes (supporting en, zh-Hans, es-419, sr-Latn-RS, etc.)
        lang_codes = re.findall(
            r"\s*['\"]([a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)['\"]\s*:",
            obj_content,
        )

        if lang_codes:
            if verbose:
                print(f"✅ Loaded {len(lang_codes)} languages: {', '.join(lang_codes)}")
        else:
            print("❌ No languages found in language-config.ts", file=sys.stderr)

        return lang_codes

    except Exception as e:
        print(f"❌ Error reading or parsing {ts_file_path}: {e}", file=sys.stderr)
        return []
         
def get_all_keys(obj: Any, prefix: str = "") -> Set[str]:
    """Recursively get all key paths in a JSON object"""
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
    """Load all translation files"""
    languages = load_languages_from_ts()
    translations = {}
    
    for lang in languages:
        file_path = f"messages/{lang}.json"
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            sys.exit(1)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                translations[lang] = json.load(f)
            print(f"✅ Successfully loaded: {file_path}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON format error in {file_path}: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Failed to load {file_path}: {e}")
            sys.exit(1)
    
    return translations

def validate_structure_consistency(translations: Dict[str, Dict]) -> bool:
    """Validate structure consistency of all translation files"""
    print("\n🔍 Validating structure consistency...")
    
    # Get key sets for all languages
    all_keys = {}
    for lang, data in translations.items():
        all_keys[lang] = get_all_keys(data)
        print(f"  {lang}: {len(all_keys[lang])} keys")
    
    # Use zh-CN as the base language for comparison
    base_lang = 'zh-CN'
    base_keys = all_keys[base_lang]
    
    inconsistent = False
    
    for lang in all_keys:
        if lang == base_lang:
            continue
        
        current_keys = all_keys[lang]
        
        # Check for missing keys
        missing_keys = base_keys - current_keys
        if missing_keys:
            print(f"❌ {lang} missing keys ({len(missing_keys)} keys):")
            for key in sorted(missing_keys):
                print(f"    - {key}")
            inconsistent = True
        
        # Check for extra keys
        extra_keys = current_keys - base_keys
        if extra_keys:
            print(f"❌ {lang} extra keys ({len(extra_keys)} keys):")
            for key in sorted(extra_keys):
                print(f"    + {key}")
            inconsistent = True
        
        if not missing_keys and not extra_keys:
            print(f"✅ {lang} structure is consistent")
    
    return not inconsistent

def validate_file_consistency() -> bool:
    """Validate file line count consistency"""
    print("\n📊 Validating file line consistency...")
    
    languages = load_languages_from_ts()
    line_counts = {}
    
    for lang in languages:
        file_path = f"messages/{lang}.json"
        with open(file_path, 'r', encoding='utf-8') as f:
            line_counts[lang] = len(f.readlines())
        print(f"  {lang}: {line_counts[lang]} lines")
    
    # Check if all files have the same line count
    unique_counts = set(line_counts.values())
    if len(unique_counts) == 1:
        print("✅ All files have consistent line counts")
        return True
    else:
        print("❌ File line counts are inconsistent")
        return False

def validate_json_format(translations: Dict[str, Dict]) -> bool:
    """Validate JSON format correctness"""
    print("\n🔧 Validating JSON format...")
    
    for lang, data in translations.items():
        try:
            # Try to re-serialize to validate format
            json.dumps(data, ensure_ascii=False, indent=2)
            print(f"✅ {lang} JSON format is valid")
        except Exception as e:
            print(f"❌ {lang} JSON format error: {e}")
            return False
    
    return True

def main():
    """Main function"""
    print("🚀 Starting i18n translation file consistency validation...")
    
    # Check if in the correct directory
    if not os.path.exists("messages"):
        print("❌ Messages directory not found, please run this script from project root")
        sys.exit(1)
    
    # Load translation files
    translations = load_translation_files()
    
    # Run all validations
    validations = [
        validate_file_consistency(),
        validate_json_format(translations),
        validate_structure_consistency(translations)
    ]
    
    # Output result
    print("\n" + "="*50)
    if all(validations):
        print("🎉 All validations passed! Translation file structures are fully consistent")
        return 0
    else:
        print("❌ Validation failed! Please fix the issues above")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 