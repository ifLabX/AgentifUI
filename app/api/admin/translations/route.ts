import {
  getSupportedLocales,
  isValidLocale,
} from '@lib/config/language-config';
import { promises as fs } from 'fs';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

// --- BEGIN COMMENT ---
// 翻译文件路径配置
// --- END COMMENT ---
const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const LOCK_TIMEOUT = 5000; // 5秒锁超时

// --- BEGIN COMMENT ---
// 文件锁管理
// --- END COMMENT ---
const fileLocks = new Map<string, { timestamp: number; processId: string }>();

// --- BEGIN COMMENT ---
// 获取文件锁
// --- END COMMENT ---
async function acquireLock(filePath: string): Promise<void> {
  const lockKey = path.basename(filePath);
  const now = Date.now();
  const processId = `${process.pid}-${now}`;

  // 检查现有锁
  const existingLock = fileLocks.get(lockKey);
  if (existingLock) {
    // 检查锁是否过期
    if (now - existingLock.timestamp < LOCK_TIMEOUT) {
      throw new Error(`File ${lockKey} is locked by another process`);
    }
    // 清除过期锁
    fileLocks.delete(lockKey);
  }

  // 获取新锁
  fileLocks.set(lockKey, { timestamp: now, processId });
}

// --- BEGIN COMMENT ---
// 释放文件锁
// --- END COMMENT ---
function releaseLock(filePath: string): void {
  const lockKey = path.basename(filePath);
  fileLocks.delete(lockKey);
}

// --- BEGIN COMMENT ---
// 读取翻译文件
// --- END COMMENT ---
async function readTranslationFile(locale: string): Promise<any> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to read translation file for locale ${locale}: ${error}`
    );
  }
}

// --- BEGIN COMMENT ---
// 写入翻译文件 (带原子性保证)
// --- END COMMENT ---
async function writeTranslationFile(locale: string, data: any): Promise<void> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const tempPath = `${filePath}.tmp`;

  try {
    // 获取文件锁
    await acquireLock(filePath);

    // 写入临时文件
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');

    // 原子性重命名
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // 清理临时文件
    try {
      await fs.unlink(tempPath);
    } catch {}

    throw new Error(
      `Failed to write translation file for locale ${locale}: ${error}`
    );
  } finally {
    // 释放文件锁
    releaseLock(filePath);
  }
}

// --- BEGIN COMMENT ---
// 深度合并对象
// --- END COMMENT ---
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// --- BEGIN COMMENT ---
// 根据路径获取嵌套对象值
// --- END COMMENT ---
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// --- BEGIN COMMENT ---
// 根据路径设置嵌套对象值
// --- END COMMENT ---
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// --- BEGIN COMMENT ---
// GET: 读取翻译内容
// --- END COMMENT ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    const section = searchParams.get('section');

    // 验证语言代码
    if (locale && !isValidLocale(locale)) {
      return NextResponse.json(
        { error: `Unsupported locale: ${locale}` },
        { status: 400 }
      );
    }

    // 如果指定语言，返回该语言的翻译
    if (locale) {
      const translations = await readTranslationFile(locale);

      if (section) {
        const sectionData = getNestedValue(translations, section);
        if (sectionData === undefined) {
          return NextResponse.json(
            { error: `Section '${section}' not found in locale '${locale}'` },
            { status: 404 }
          );
        }
        return NextResponse.json({ locale, section, data: sectionData });
      }

      return NextResponse.json({ locale, data: translations });
    }

    // 否则返回所有支持的语言列表和元信息
    const supportedLocales = getSupportedLocales();
    const result = {
      supportedLocales,
      availableLanguages: supportedLocales.length,
      lastModified: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to read translations:', error);
    return NextResponse.json(
      { error: 'Failed to read translations' },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// PUT: 更新翻译内容
// --- END COMMENT ---
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale, section, updates, mode = 'merge' } = body;

    // 验证必要参数
    if (!locale || !updates) {
      return NextResponse.json(
        { error: 'Missing required parameters: locale, updates' },
        { status: 400 }
      );
    }

    // 验证语言代码
    if (!isValidLocale(locale)) {
      return NextResponse.json(
        { error: `Unsupported locale: ${locale}` },
        { status: 400 }
      );
    }

    // 读取现有翻译文件
    const currentTranslations = await readTranslationFile(locale);

    let updatedTranslations;

    if (section) {
      // 更新特定部分
      updatedTranslations = { ...currentTranslations };

      if (mode === 'replace') {
        setNestedValue(updatedTranslations, section, updates);
      } else {
        // 默认合并模式
        const currentSection =
          getNestedValue(currentTranslations, section) || {};
        const mergedSection = deepMerge(currentSection, updates);
        setNestedValue(updatedTranslations, section, mergedSection);
      }
    } else {
      // 更新整个文件
      if (mode === 'replace') {
        updatedTranslations = updates;
      } else {
        updatedTranslations = deepMerge(currentTranslations, updates);
      }
    }

    // 写入更新的翻译文件
    await writeTranslationFile(locale, updatedTranslations);

    const result = {
      success: true,
      locale,
      section: section || 'root',
      mode,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update translations:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update translations',
      },
      { status: 500 }
    );
  }
}

// --- BEGIN COMMENT ---
// POST: 批量更新多语言翻译
// --- END COMMENT ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, updates, mode = 'merge' } = body;

    // 验证必要参数
    if (!section || !updates || typeof updates !== 'object') {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: section, updates (object with locale keys)',
        },
        { status: 400 }
      );
    }

    const supportedLocales = getSupportedLocales();
    const results: any[] = [];
    const errors: any[] = [];

    // 批量更新所有语言
    for (const locale of supportedLocales) {
      try {
        if (updates[locale]) {
          // 读取现有翻译
          const currentTranslations = await readTranslationFile(locale);
          const updatedTranslations = { ...currentTranslations };

          if (mode === 'replace') {
            setNestedValue(updatedTranslations, section, updates[locale]);
          } else {
            const currentSection =
              getNestedValue(currentTranslations, section) || {};
            const mergedSection = deepMerge(currentSection, updates[locale]);
            setNestedValue(updatedTranslations, section, mergedSection);
          }

          // 写入更新
          await writeTranslationFile(locale, updatedTranslations);

          results.push({
            locale,
            success: true,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        errors.push({
          locale,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const response = {
      success: errors.length === 0,
      section,
      mode,
      results,
      errors,
      totalProcessed: results.length,
      totalErrors: errors.length,
    };

    return NextResponse.json(response, {
      status: errors.length > 0 ? 207 : 200, // 207 Multi-Status for partial success
    });
  } catch (error) {
    console.error('Failed to batch update translations:', error);
    return NextResponse.json(
      { error: 'Failed to batch update translations' },
      { status: 500 }
    );
  }
}
