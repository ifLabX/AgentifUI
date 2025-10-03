import { createClient } from '@lib/supabase/server';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const RESERVED_ROUTES_PATH = path.join(
  process.cwd(),
  'lib/config/reserved-routes.json'
);

/**
 * GET /api/admin/dynamic-pages
 * Get all dynamic pages
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all dynamic pages
    const { data: pages, error } = await supabase
      .from('dynamic_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch dynamic pages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('GET /api/admin/dynamic-pages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dynamic-pages
 * Create a new dynamic page
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { slug, isPublished = false } = body;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!slug.startsWith('/')) {
      return NextResponse.json(
        { error: 'Slug must start with /' },
        { status: 400 }
      );
    }

    if (!/^\/[a-zA-Z0-9/_-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug contains invalid characters' },
        { status: 400 }
      );
    }

    // Read reserved routes
    const routesData = await fs.readFile(RESERVED_ROUTES_PATH, 'utf-8');
    const routes = JSON.parse(routesData);

    // Check if slug is in reserved routes
    if (routes.reservedRoutes.includes(slug)) {
      return NextResponse.json(
        { error: 'This route is reserved and cannot be used' },
        { status: 409 }
      );
    }

    // Check if slug is in dynamic routes
    if (routes.dynamicRoutes.includes(slug)) {
      return NextResponse.json(
        { error: 'This route already exists' },
        { status: 409 }
      );
    }

    // Check if slug exists in database
    const { data: existing } = await supabase
      .from('dynamic_pages')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'This route already exists' },
        { status: 409 }
      );
    }

    // Create the page in database
    const { data: newPage, error: createError } = await supabase
      .from('dynamic_pages')
      .insert({
        slug,
        is_published: isPublished,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create dynamic page:', createError);
      return NextResponse.json(
        { error: 'Failed to create page' },
        { status: 500 }
      );
    }

    // Add to dynamicRoutes array in JSON file
    routes.dynamicRoutes.push(slug);
    await fs.writeFile(RESERVED_ROUTES_PATH, JSON.stringify(routes, null, 2));

    // Initialize empty translation sections for all languages
    const messagesDir = path.join(process.cwd(), 'messages');
    const locales = ['en-US', 'zh-CN', 'es-ES', 'zh-TW', 'ja-JP', 'de-DE', 'fr-FR', 'ru-RU', 'it-IT', 'pt-PT'];

    for (const locale of locales) {
      const messagePath = path.join(messagesDir, `${locale}.json`);
      const messageData = JSON.parse(await fs.readFile(messagePath, 'utf-8'));

      // Create empty sections for this dynamic page
      const sectionKey = `pages.dynamic.${slug.replace(/\//g, '_')}`;
      if (!messageData.pages) messageData.pages = {};
      if (!messageData.pages.dynamic) messageData.pages.dynamic = {};

      messageData.pages.dynamic[slug.replace(/\//g, '_')] = {
        sections: [],
        metadata: {
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          author: 'admin',
        },
      };

      await fs.writeFile(messagePath, JSON.stringify(messageData, null, 2));
    }

    return NextResponse.json({ page: newPage }, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/dynamic-pages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
