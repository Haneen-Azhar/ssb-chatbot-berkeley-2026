import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAllJsFiles(dir, exclude = ['node_modules', '.next', '.git', '_archive']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllJsFiles(fullPath, exclude));
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
      results.push(fullPath);
    }
  }
  return results;
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ─── No real API keys in source files ────────────────────────────────────────

describe('no real API keys in source files', () => {
  const appFiles = getAllJsFiles(path.join(ROOT, 'app'));
  const libFiles = getAllJsFiles(path.join(ROOT, 'lib'));
  const allFiles = [...appFiles, ...libFiles];

  it('no Anthropic API keys (sk-ant-) in app/ or lib/', () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(ROOT, file);
      expect(content, `Found sk-ant- key in ${relativePath}`).not.toMatch(/sk-ant-[a-zA-Z0-9]{20,}/);
    }
  });

  it('no Supabase service role keys in app/ or lib/', () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(ROOT, file);
      // Real Supabase keys are long JWTs starting with eyJ
      const matches = content.match(/['"]eyJ[a-zA-Z0-9_-]{100,}['"]/g);
      expect(matches, `Possible real Supabase key in ${relativePath}`).toBeNull();
    }
  });

  it('no hardcoded Supabase project URLs in lib/ (should use env vars)', () => {
    for (const file of libFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(ROOT, file);
      // Real Supabase URLs look like https://xxxxx.supabase.co
      expect(content, `Hardcoded Supabase URL in ${relativePath}`).not.toMatch(
        /['"]https:\/\/[a-z]{10,}\.supabase\.co['"]/
      );
    }
  });
});

// ─── .gitignore entries ──────────────────────────────────────────────────────

describe('.gitignore security entries', () => {
  let gitignore;
  beforeAll(() => {
    gitignore = readFile('.gitignore');
  });

  it('.env.local is in .gitignore', () => {
    expect(gitignore).toContain('.env.local');
  });

  it('.next is in .gitignore', () => {
    expect(gitignore).toContain('.next');
  });

  it('node_modules is in .gitignore', () => {
    expect(gitignore).toContain('node_modules');
  });
});

// ─── Supabase client guarded with typeof window ──────────────────────────────

describe('Supabase client safety', () => {
  it('page.js guards Supabase client creation with typeof window check', () => {
    const content = readFile('app/page.js');
    expect(content).toContain("typeof window !== 'undefined'");
  });
});

// ─── Auth middleware never exposes error details ─────────────────────────────

describe('auth middleware safety', () => {
  it('admin route returns 403 status, never exposes internal error details to client', () => {
    const content = readFile('app/api/admin/route.js');
    // Check it returns a generic error, not the actual error object/message
    expect(content).toContain("status: 403");
    expect(content).toMatch(/error.*Forbidden/);
    // The catch block should return "Internal server error", not err.message
    expect(content).toContain("Internal server error");
  });

  it('conversations DELETE returns 401 for unauthenticated', () => {
    const content = readFile('app/api/chat/conversations/route.js');
    expect(content).toContain('status: 401');
  });
});

// ─── Chat API validates message ──────────────────────────────────────────────

describe('chat API validates message input', () => {
  it('chat route validates message is a string', () => {
    const content = readFile('app/api/chat/route.js');
    expect(content).toContain("typeof message !== 'string'");
  });

  it('stream route validates message is a string', () => {
    const content = readFile('app/api/chat/stream/route.js');
    expect(content).toContain("typeof message !== 'string'");
  });
});

// ─── Admin routes require admin ──────────────────────────────────────────────

describe('admin routes all require admin', () => {
  const adminRoutes = [
    'app/api/admin/route.js',
    'app/api/admin/queries/route.js',
    'app/api/admin/users/route.js',
    'app/api/admin/analyze/route.js',
    'app/api/admin/topics/route.js',
  ];

  adminRoutes.forEach((route) => {
    it(`${route} imports requireAdmin`, () => {
      const content = readFile(route);
      expect(content).toContain('requireAdmin');
      expect(content).toMatch(/import.*requireAdmin.*from/);
    });
  });
});

// ─── No sensitive data in console.log ────────────────────────────────────────

describe('no sensitive data in console.log', () => {
  const appFiles = getAllJsFiles(path.join(ROOT, 'app'));
  const libFiles = getAllJsFiles(path.join(ROOT, 'lib'));
  const allFiles = [...appFiles, ...libFiles];

  it('no console.log with access_token pattern', () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(ROOT, file);
      expect(content, `console.log with access_token in ${relativePath}`).not.toMatch(
        /console\.log\(.*access_token/
      );
    }
  });

  it('no console.log with service_key pattern', () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(ROOT, file);
      expect(content, `console.log with service_key in ${relativePath}`).not.toMatch(
        /console\.log\(.*service_key/
      );
    }
  });
});

// ─── CORS: no wildcard Access-Control-Allow-Origin ───────────────────────────

describe('CORS safety', () => {
  it('no wildcard Access-Control-Allow-Origin in any route', () => {
    const routeFiles = getAllJsFiles(path.join(ROOT, 'app', 'api'));
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(ROOT, file);
      expect(content, `Wildcard CORS in ${relativePath}`).not.toMatch(
        /Access-Control-Allow-Origin.*\*/
      );
    }
  });
});
