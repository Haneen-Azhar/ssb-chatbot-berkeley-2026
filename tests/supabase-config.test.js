import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ─── supabase/config.toml ────────────────────────────────────────────────────

describe('supabase/config.toml', () => {
  let config;

  beforeAll(() => {
    config = readFile('supabase/config.toml');
  });

  it('exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'supabase/config.toml'))).toBe(true);
  });

  it('site_url points to Vercel domain (not localhost)', () => {
    // Extract site_url value
    const match = config.match(/site_url\s*=\s*"([^"]+)"/);
    expect(match).not.toBeNull();
    const siteUrl = match[1];
    expect(siteUrl).not.toContain('localhost');
    expect(siteUrl).toContain('vercel.app');
  });

  it('additional_redirect_urls includes localhost for dev', () => {
    expect(config).toContain('additional_redirect_urls');
    expect(config).toContain('localhost');
  });
});

// ─── Email templates ─────────────────────────────────────────────────────────

describe('email templates', () => {
  it('magic_link.html exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'supabase/templates/magic_link.html'))).toBe(true);
  });

  it('invite.html exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'supabase/templates/invite.html'))).toBe(true);
  });

  it('magic link template contains ConfirmationURL variable', () => {
    const content = readFile('supabase/templates/magic_link.html');
    expect(content).toContain('ConfirmationURL');
  });

  it('invite template contains ConfirmationURL variable', () => {
    const content = readFile('supabase/templates/invite.html');
    expect(content).toContain('ConfirmationURL');
  });

  it('magic link template contains "Summer Springboard" branding', () => {
    const content = readFile('supabase/templates/magic_link.html');
    expect(content).toContain('Summer Springboard');
  });

  it('templates do not contain localhost URLs', () => {
    const magicLink = readFile('supabase/templates/magic_link.html');
    const invite = readFile('supabase/templates/invite.html');
    expect(magicLink).not.toMatch(/https?:\/\/localhost/);
    expect(invite).not.toMatch(/https?:\/\/localhost/);
  });
});

// ─── lib/supabase.js ─────────────────────────────────────────────────────────

describe('lib/supabase.js', () => {
  let content;

  beforeAll(() => {
    content = readFile('lib/supabase.js');
  });

  it('createServerClient uses SUPABASE_URL env var (not hardcoded)', () => {
    expect(content).toContain('process.env.SUPABASE_URL');
    // Should not have a hardcoded URL like 'https://xxx.supabase.co'
    expect(content).not.toMatch(/createClient\(\s*['"]https:\/\/[a-z]+\.supabase\.co['"]/);
  });

  it('createBrowserClient uses NEXT_PUBLIC env vars', () => {
    expect(content).toContain('process.env.NEXT_PUBLIC_SUPABASE_URL');
    expect(content).toContain('process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });
});
