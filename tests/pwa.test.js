import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf-8'));
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ─── manifest.json ───────────────────────────────────────────────────────────

describe('manifest.json', () => {
  let manifest;

  beforeAll(() => {
    manifest = readJSON('public/manifest.json');
  });

  it('exists and is valid JSON', () => {
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe('object');
  });

  it('has name', () => {
    expect(manifest.name).toBeDefined();
    expect(typeof manifest.name).toBe('string');
    expect(manifest.name.length).toBeGreaterThan(0);
  });

  it('has short_name', () => {
    expect(manifest.short_name).toBeDefined();
    expect(typeof manifest.short_name).toBe('string');
  });

  it('has start_url', () => {
    expect(manifest.start_url).toBeDefined();
  });

  it('has display', () => {
    expect(manifest.display).toBeDefined();
  });

  it('has icons', () => {
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
  });

  it('display is "standalone"', () => {
    expect(manifest.display).toBe('standalone');
  });

  it('start_url is "/"', () => {
    expect(manifest.start_url).toBe('/');
  });

  it('has at least one icon', () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
  });

  it('each icon has src and sizes', () => {
    for (const icon of manifest.icons) {
      expect(icon.src).toBeDefined();
      expect(icon.sizes).toBeDefined();
    }
  });
});

// ─── layout.js viewport and metadata ─────────────────────────────────────────

describe('layout.js exports', () => {
  let layoutContent;

  beforeAll(() => {
    layoutContent = readFile('app/layout.js');
  });

  it('exports viewport with width setting', () => {
    expect(layoutContent).toContain("width:");
    expect(layoutContent).toMatch(/width:\s*['"]device-width['"]/);
  });

  it('exports viewport with initialScale', () => {
    expect(layoutContent).toContain('initialScale:');
  });

  it('exports viewport with maximumScale', () => {
    expect(layoutContent).toContain('maximumScale:');
  });

  it('exports viewport with viewportFit', () => {
    expect(layoutContent).toContain('viewportFit:');
    expect(layoutContent).toMatch(/viewportFit:\s*['"]cover['"]/);
  });

  it('exports metadata with manifest link', () => {
    expect(layoutContent).toContain("manifest:");
    expect(layoutContent).toMatch(/manifest:\s*['"]\/manifest\.json['"]/);
  });

  it('exports metadata with apple-mobile-web-app-capable (appleWebApp)', () => {
    expect(layoutContent).toContain('appleWebApp:');
    expect(layoutContent).toContain('capable: true');
  });
});

// ─── Required images ─────────────────────────────────────────────────────────

describe('required public images', () => {
  it('cal bear avatar image exists (public/images/cal-bear-avatar.webp)', () => {
    expect(fs.existsSync(path.join(ROOT, 'public/images/cal-bear-avatar.webp'))).toBe(true);
  });

  it('cal bear full image exists (public/images/cal-bear-full.png)', () => {
    expect(fs.existsSync(path.join(ROOT, 'public/images/cal-bear-full.png'))).toBe(true);
  });
});
