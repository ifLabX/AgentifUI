#!/usr/bin/env python3
"""
i18n consistency check script
Focuses on checking the structural consistency of translation files
"""

import json
import os
import sys
import re
from typing import Dict, Set, List, Any, Optional
from pathlib import Path

class I18nConsistencyChecker:
    def __init__(self):
        self.languages = self.load_languages_from_ts(verbose=True)
        if not self.languages:
            print("❌ Error: Could not load languages from config file. Aborting.", file=sys.stderr)
            sys.exit(1)
            
        self.messages_dir = Path("messages")
            

    def load_languages_from_ts(self, verbose: bool = True) -> List[str]:
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

            # Match general language codes (supporting en, zh-Hans, es-419, sr-Latn-RS, etc.)
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

    def get_all_keys(self, obj: Any, prefix: str = "") -> Set[str]:
        """Recursively get all key paths"""
        keys = set()
        if isinstance(obj, dict):
            for key, value in obj.items():
                current_path = f"{prefix}.{key}" if prefix else key
                keys.add(current_path)
                if isinstance(value, dict):
                    keys.update(self.get_all_keys(value, current_path))
        return keys
    
    def find_key_line_number(self, file_path: Path, key_path: str) -> Optional[int]:
        """Find the line number of a key in the file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Extract the last level key name
            key_parts = key_path.split('.')
            target_key = key_parts[-1]
            
            # Search for the line containing the key
            for i, line in enumerate(lines, 1):
                if f'"{target_key}":' in line:
                    return i
            
            return None
        except Exception:
            return None
    
    def load_translation_files(self) -> Optional[Dict[str, Dict]]:
        """Load all translation files"""
        translations = {}
        
        for lang in self.languages:
            file_path = self.messages_dir / f"{lang}.json"
            
            if not file_path.exists():
                print(f"❌ Translation file not found: {file_path}")
                return None
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    translations[lang] = json.load(f)
            except json.JSONDecodeError as e:
                print(f"❌ Invalid JSON in {file_path}: {e}")
                return None
            except Exception as e:
                print(f"❌ Error loading {file_path}: {e}")
                return None
        
        return translations

    def detect_missing_keys(self) -> Optional[Dict[str, List[Dict[str, Any]]]]:
        """Detect missing keys, return details including line number"""
        print("🔍 Detecting missing keys...")
        
        translations = self.load_translation_files()
        if not translations:
            return None
        
        # Get all keys
        all_keys = {}
        for lang, data in translations.items():
            all_keys[lang] = self.get_all_keys(data)
        
        # Use Chinese as the base to check other languages
        base_lang = 'zh-CN'
        base_keys = all_keys[base_lang]
        base_file = self.messages_dir / f"{base_lang}.json"
        
        missing_info = {}
        has_missing = False
        
        for lang in all_keys:
            if lang == base_lang:
                continue
            
            current_keys = all_keys[lang]
            missing_keys = base_keys - current_keys
            extra_keys = current_keys - base_keys
            
            if missing_keys:
                has_missing = True
                missing_info[lang] = []
                
                print(f"\n❌ {lang} missing {len(missing_keys)} keys:")
                
                for key in sorted(missing_keys):
                    # Get line number
                    line_num = self.find_key_line_number(base_file, key)
                    
                    print(f"    📍 {key} (line ~{line_num if line_num else 'unknown'})")
            
            if extra_keys:
                has_missing = True
                print(f"\n❌ {lang} has {len(extra_keys)} extra keys:")
                for key in sorted(extra_keys):
                    print(f"    ➕ {key}")
            
            if not missing_keys and not extra_keys:
                print(f"✅ {lang} has consistent keys")
        
        return missing_info if has_missing else None

    def validate_consistency(self, silent: bool = False) -> bool:
        """Validate translation file consistency"""
        if not silent:
            print("🔍 Validating translation file consistency...")
        
        translations = self.load_translation_files()
        if not translations:
            return False
        
        # Validate line count consistency
        line_counts = {}
        for lang in self.languages:
            file_path = self.messages_dir / f"{lang}.json"
            with open(file_path, 'r', encoding='utf-8') as f:
                line_counts[lang] = len(f.readlines())
        
        if not silent:
            print("📊 File line counts:")
            for lang, count in line_counts.items():
                print(f"  {lang}: {count} lines")
        
        unique_counts = set(line_counts.values())
        if len(unique_counts) != 1:
            print("❌ File line counts are inconsistent")
            return False
        
        # Validate structure consistency
        all_keys = {}
        for lang, data in translations.items():
            all_keys[lang] = self.get_all_keys(data)
        
        if not silent:
            print("🔧 Structure key counts:")
            for lang, keys in all_keys.items():
                print(f"  {lang}: {len(keys)} keys")
        
        # Use Chinese as the base to check other languages
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
                    print(f"❌ {lang} structure is inconsistent:")
                    if missing_keys:
                        print(f"    Missing {len(missing_keys)} keys")
                    if extra_keys:
                        print(f"    Extra {len(extra_keys)} keys")
                inconsistent = True
            elif not silent:
                print(f"✅ {lang} structure is consistent")
        
        return not inconsistent

    def quick_check(self) -> bool:
        """Quick check (silent mode)"""
        return self.validate_consistency(silent=True)
    
    def compare_keys(self, show_details: bool = False) -> bool:
        """Compare key counts against English baseline with numerical differences"""
        print("🔍 Comparing translation key counts against English baseline...")
        
        translations = self.load_translation_files()
        if not translations:
            return False
            
        # Get all keys for each language
        all_keys = {}
        for lang, data in translations.items():
            all_keys[lang] = self.get_all_keys(data)
        
        # Use English as baseline
        baseline_lang = 'en-US'
        if baseline_lang not in all_keys:
            print(f"❌ Baseline language '{baseline_lang}' not found")
            return False
            
        baseline_count = len(all_keys[baseline_lang])
        baseline_keys = all_keys[baseline_lang]
        
        print(f"📊 Key count comparison (baseline: {baseline_lang} with {baseline_count} keys):")
        print()
        
        has_inconsistencies = False
        results = []
        
        for lang in sorted(all_keys.keys()):
            current_keys = all_keys[lang]
            current_count = len(current_keys)
            difference = current_count - baseline_count
            
            # Calculate missing and extra keys
            if lang != baseline_lang:
                missing_keys = baseline_keys - current_keys
                extra_keys = current_keys - baseline_keys
                missing_count = len(missing_keys)
                extra_count = len(extra_keys)
                
                if missing_count > 0 or extra_count > 0:
                    has_inconsistencies = True
            else:
                missing_count = 0
                extra_count = 0
            
            # Format the difference display
            if difference == 0:
                diff_display = "0"
                status_emoji = "✅"
            elif difference > 0:
                diff_display = f"+{difference}"
                status_emoji = "⚠️ "
            else:
                diff_display = str(difference)
                status_emoji = "❌"
            
            results.append({
                'lang': lang,
                'count': current_count,
                'diff': difference,
                'diff_display': diff_display,
                'status_emoji': status_emoji,
                'missing_count': missing_count,
                'extra_count': extra_count
            })
            
            print(f"  {status_emoji} {lang:<8} {current_count:>4} keys ({diff_display})")
        
        if show_details and has_inconsistencies:
            print("\n📝 Detailed breakdown:")
            for result in results:
                if result['lang'] == baseline_lang:
                    continue
                    
                if result['missing_count'] > 0 or result['extra_count'] > 0:
                    print(f"\n  {result['lang']}:")
                    if result['missing_count'] > 0:
                        print(f"    ❌ Missing: {result['missing_count']} keys")
                    if result['extra_count'] > 0:
                        print(f"    ➕ Extra: {result['extra_count']} keys")
        
        return not has_inconsistencies
    
    def remove_extra_keys(self, dry_run: bool = False) -> bool:
        """Remove extra keys that don't exist in English baseline"""
        print("🧹 Removing extra keys not present in English baseline...")
        
        translations = self.load_translation_files()
        if not translations:
            return False
            
        # Get baseline keys (English)
        baseline_lang = 'en-US'
        if baseline_lang not in translations:
            print(f"❌ Baseline language '{baseline_lang}' not found")
            return False
            
        baseline_keys = self.get_all_keys(translations[baseline_lang])
        
        removed_count = 0
        processed_files = []
        
        for lang in translations.keys():
            if lang == baseline_lang:
                continue
                
            current_keys = self.get_all_keys(translations[lang])
            extra_keys = current_keys - baseline_keys
            
            if not extra_keys:
                print(f"✅ {lang}: No extra keys to remove")
                continue
            
            print(f"🔍 {lang}: Found {len(extra_keys)} extra keys")
            if not dry_run:
                # Load the original file
                file_path = self.messages_dir / f"{lang}.json"
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Remove extra keys
                    for key_path in sorted(extra_keys):
                        keys = key_path.split('.')
                        current_obj = data
                        
                        # Navigate to parent object
                        for key in keys[:-1]:
                            if isinstance(current_obj, dict) and key in current_obj:
                                current_obj = current_obj[key]
                            else:
                                break
                        else:
                            # Remove the key if parent exists
                            if isinstance(current_obj, dict) and keys[-1] in current_obj:
                                del current_obj[keys[-1]]
                                removed_count += 1
                                print(f"    ❌ Removed: {key_path}")
                    
                    # Write back the file
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                        f.write('\n')  # Add trailing newline
                    
                    processed_files.append(lang)
                    
                except Exception as e:
                    print(f"❌ Error processing {lang}: {e}")
                    return False
            else:
                print(f"    🔍 Would remove {len(extra_keys)} keys:")
                for key_path in sorted(extra_keys):
                    print(f"      - {key_path}")
        
        if dry_run:
            print(f"\n🔍 Dry run completed. Would process {len([l for l in translations.keys() if l != baseline_lang])} files")
        else:
            if processed_files:
                print(f"\n✅ Successfully processed {len(processed_files)} files, removed {removed_count} extra keys")
                print("📝 Processed files:", ", ".join(processed_files))
            else:
                print("\n✅ No files needed processing")
        
        return True

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python3 i18n-refactor-helper.py <command>")
        print("Commands:")
        print("  detect-missing       - detect missing keys")
        print("  validate             - validate consistency")
        print("  quick-check          - quick check")
        print("  compare              - compare key counts against English baseline")
        print("  compare --details    - compare with detailed breakdown")
        print("  remove-extra         - remove extra keys not in English baseline")
        print("  remove-extra --dry   - preview extra keys to be removed")
        return 1
    
    command = sys.argv[1]
    checker = I18nConsistencyChecker()
    
    # Parse additional arguments
    show_details = "--details" in sys.argv
    dry_run = "--dry" in sys.argv or "--dry-run" in sys.argv
    
    try:
        if command == "detect-missing":
            missing = checker.detect_missing_keys()
            return 1 if missing else 0
        
        elif command == "validate":
            success = checker.validate_consistency()
            return 0 if success else 1
        
        elif command == "quick-check":
            success = checker.quick_check()
            if success:
                print("✅ Quick check passed")
            else:
                print("❌ Quick check failed")
            return 0 if success else 1
        
        elif command == "compare":
            success = checker.compare_keys(show_details=show_details)
            return 0 if success else 1
        
        elif command == "remove-extra":
            success = checker.remove_extra_keys(dry_run=dry_run)
            return 0 if success else 1
        
        else:
            print(f"❌ Unknown command: {command}")
            return 1
    
    except KeyboardInterrupt:
        print("\n⚠️  Operation cancelled by user")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 