const fs = require('node:fs');
const path = require('node:path');

function loadLanguageConfig() {
  try {
    const configPath = path.resolve(
      __dirname,
      '../lib/config/language-config.ts'
    );
    const configContent = fs.readFileSync(configPath, 'utf8');

    const langCodeRegex = /'([a-z]{2}-[A-Z]{2})'/g;
    const matches = [...configContent.matchAll(langCodeRegex)];
    const supportedCodes = [...new Set(matches.map(match => match[1]))].filter(
      code => code !== 'en-US'
    );

    return supportedCodes.map(code => ({
      code,
      bingCode: getBingLanguageCode(code),
    }));
  } catch (error) {
    console.warn(
      '⚠️  Could not load language config, using fallback:',
      error.message
    );
    return [
      { code: 'zh-CN', bingCode: 'zh' },
      { code: 'zh-TW', bingCode: 'zh-Hant' },
      { code: 'ja-JP', bingCode: 'ja' },
      { code: 'de-DE', bingCode: 'de' },
      { code: 'fr-FR', bingCode: 'fr' },
      { code: 'es-ES', bingCode: 'es' },
      { code: 'ru-RU', bingCode: 'ru' },
      { code: 'it-IT', bingCode: 'it' },
      { code: 'pt-PT', bingCode: 'pt' },
    ];
  }
}

function getBingLanguageCode(langCode) {
  const langMap = {
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'ja-JP': 'ja',
    'de-DE': 'de',
    'fr-FR': 'fr',
    'es-ES': 'es',
    'ru-RU': 'ru',
    'it-IT': 'it',
    'pt-PT': 'pt',
  };
  return langMap[langCode] || langCode.split('-')[0];
}

const SUPPORTED_LANGUAGES = loadLanguageConfig();
const SOURCE_LANGUAGE = 'en-US';
const MESSAGES_DIR = path.resolve(__dirname, '../messages');

async function translateText(text, targetLanguage) {
  try {
    if (text.length > 450) {
      console.warn(`⚠️  Text too long for "${text.substring(0, 50)}..."`);
      return text;
    }

    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.append('q', text);
    url.searchParams.append('langpair', `en|${targetLanguage}`);
    url.searchParams.append('de', 'license@iflabx.com');

    const translationResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'AgentifUI/1.0',
      },
    });

    if (!translationResponse.ok) {
      throw new Error(
        `HTTP ${translationResponse.status}: ${translationResponse.statusText}`
      );
    }

    const data = await translationResponse.json();

    if (data.responseStatus === 200 && data.responseData) {
      const translated = data.responseData.translatedText;

      if (translated && translated !== text && translated.length > 0) {
        return translated;
      }
    }

    throw new Error(
      `Translation API error: ${data.responseDetails || 'Unknown error'}`
    );
  } catch (error) {
    console.warn(
      `⚠️  Translation failed for "${text}" to ${targetLanguage}:`,
      error.message
    );
    return text;
  }
}

function isTranslatableText(text) {
  if (typeof text !== 'string') return false;
  if (!text.trim()) return false;

  const skipPatterns = [
    /^\{\{.*\}\}$/,
    /^\$\{.*\}$/,
    /^<[^>]+>$/,
    /function\s*\(/,
    /^\w+\s*=.*$/,
    /^[A-Z_][A-Z0-9_]*$/,
    /^\d+(\.\d+)?$/,
    /^[a-z]+:[a-z0-9-]+$/i,
  ];

  return !skipPatterns.some(pattern => pattern.test(text.trim()));
}

async function translateWithBackoff(text, targetLanguage, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await translateText(text, targetLanguage);
      if (result !== text) {
        return result;
      }
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      console.warn(
        `⚠️  Translation attempt ${attempt + 1} failed, retrying in ${delay}ms...`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return text;
}

async function translateMissingKeys(
  sourceObj,
  targetObj,
  targetLanguage,
  parentKey = ''
) {
  const stats = { translated: 0, skipped: 0, errors: 0 };

  for (const [key, value] of Object.entries(sourceObj)) {
    const currentPath = parentKey ? `${parentKey}.${key}` : key;

    if (typeof value === 'object' && value !== null) {
      if (!targetObj[key]) {
        targetObj[key] = {};
      }
      const subStats = await translateMissingKeys(
        value,
        targetObj[key],
        targetLanguage,
        currentPath
      );
      stats.translated += subStats.translated;
      stats.skipped += subStats.skipped;
      stats.errors += subStats.errors;
    } else if (typeof value === 'string' && !targetObj[key]) {
      if (isTranslatableText(value)) {
        try {
          console.log(
            `🔄 Translating missing key "${currentPath}": "${value}"`
          );
          const translated = await translateWithBackoff(value, targetLanguage);
          targetObj[key] = translated;
          stats.translated++;

          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(
            `❌ Error translating "${currentPath}":`,
            error.message
          );
          targetObj[key] = value;
          stats.errors++;
        }
      } else {
        console.log(
          `⏭️  Skipping non-translatable missing key: "${currentPath}": "${value}"`
        );
        targetObj[key] = value;
        stats.skipped++;
      }
    } else if (!targetObj[key]) {
      targetObj[key] = value;
      stats.skipped++;
    }
  }

  return stats;
}

async function processLanguage(languageConfig) {
  const { code, bingCode } = languageConfig;
  const sourceFilePath = path.join(MESSAGES_DIR, `${SOURCE_LANGUAGE}.json`);
  const targetFilePath = path.join(MESSAGES_DIR, `${code}.json`);

  console.log(`\n🌍 Processing ${code}...`);

  if (!fs.existsSync(sourceFilePath)) {
    console.error(`❌ Source file not found: ${sourceFilePath}`);
    return;
  }

  try {
    const sourceContent = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));
    let targetContent = {};

    if (fs.existsSync(targetFilePath)) {
      targetContent = JSON.parse(fs.readFileSync(targetFilePath, 'utf8'));
    }

    const stats = await translateMissingKeys(
      sourceContent,
      targetContent,
      bingCode
    );

    fs.writeFileSync(targetFilePath, JSON.stringify(targetContent, null, 2));

    console.log(`📊 ${code} Summary:`);
    console.log(`  ✅ Translated: ${stats.translated} keys`);
    console.log(`  ⏭️  Skipped: ${stats.skipped} keys`);
    console.log(`  ❌ Errors: ${stats.errors} keys`);

    return stats;
  } catch (error) {
    console.error(`❌ Error processing ${code}:`, error.message);
    return { translated: 0, skipped: 0, errors: 1 };
  }
}

function parseArgs(args) {
  const config = {
    isDryRun: false,
    targetLang: null,
    mode: 'missing',
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
      case '-d':
        config.isDryRun = true;
        break;
      case '--help':
      case '-h':
        config.help = true;
        break;
      case '--lang':
      case '-l':
        if (i + 1 < args.length) {
          config.targetLang = args[++i];
        }
        break;
      default:
        if (arg.startsWith('--lang=')) {
          config.targetLang = arg.split('=')[1];
        }
        break;
    }
  }

  return config;
}

function showHelp() {
  console.log(`
AgentifUI i18n Auto Translation Tool

Usage: node scripts/auto-gen-i18n.js [options]

Options:
  -l, --lang <code>     Target language code (e.g. zh-CN, ja-JP)
  -d, --dry-run        Dry run mode (preview without changes)  
  -h, --help           Show this help message

Examples:
  node scripts/auto-gen-i18n.js                    # Translate missing keys for all languages
  node scripts/auto-gen-i18n.js --lang zh-CN       # Translate missing keys for Chinese only
  node scripts/auto-gen-i18n.js --dry-run          # Preview what would be translated
  
  # Using pnpm scripts:
  pnpm i18n:translate                               # Translate missing keys
  pnpm i18n:translate -- --lang zh-CN              # Target specific language
  pnpm i18n:translate:dry                           # Dry run preview

Supported Languages:
${SUPPORTED_LANGUAGES.map(lang => `  ${lang.code}`).join('\n')}
`);
}

async function main() {
  const args = process.argv.slice(2);
  const config = parseArgs(args);

  if (config.help) {
    showHelp();
    return;
  }

  console.log('🚀 Starting AgentifUI auto-translation...');
  console.log(
    `📋 Mode: ${config.isDryRun ? 'DRY RUN' : 'LIVE'} - Missing keys only`
  );

  const languagesToProcess = config.targetLang
    ? SUPPORTED_LANGUAGES.filter(lang => lang.code === config.targetLang)
    : SUPPORTED_LANGUAGES;

  if (languagesToProcess.length === 0) {
    console.error(`❌ Language "${config.targetLang}" not supported`);
    console.log(
      `Supported languages: ${SUPPORTED_LANGUAGES.map(l => l.code).join(', ')}`
    );
    process.exit(1);
  }

  console.log(
    `🌍 Processing languages: ${languagesToProcess.map(l => l.code).join(', ')}`
  );

  let totalStats = { translated: 0, skipped: 0, errors: 0 };

  for (const language of languagesToProcess) {
    if (!config.isDryRun) {
      const stats = await processLanguage(language);
      if (stats) {
        totalStats.translated += stats.translated;
        totalStats.skipped += stats.skipped;
        totalStats.errors += stats.errors;
      }
    } else {
      console.log(`🔍 [DRY RUN] Would process ${language.code}`);
    }
  }

  console.log('\n🎉 Translation completed!');
  console.log('📊 Total Summary:');
  console.log(`  ✅ Total translated: ${totalStats.translated}`);
  console.log(`  ⏭️  Total skipped: ${totalStats.skipped}`);
  console.log(`  ❌ Total errors: ${totalStats.errors}`);

  if (config.isDryRun) {
    console.log('\n💡 Run without --dry-run to actually translate');
  } else {
    console.log('\n💡 Run pnpm i18n:check to validate the translations');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  translateText,
  translateMissingKeys,
  processLanguage,
};
