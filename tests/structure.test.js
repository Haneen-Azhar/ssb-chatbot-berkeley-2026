import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readJSON(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf-8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ─── Required directories ────────────────────────────────────────────────────

describe('required directories', () => {
  const dirs = ['app', 'lib', 'knowledge_base', 'public/images'];

  dirs.forEach((dir) => {
    it(`${dir}/ exists`, () => {
      expect(exists(dir)).toBe(true);
      expect(fs.statSync(path.join(ROOT, dir)).isDirectory()).toBe(true);
    });
  });
});

// ─── API route files ─────────────────────────────────────────────────────────

describe('API route files exist', () => {
  const routes = [
    'app/api/health/route.js',
    'app/api/chat/route.js',
    'app/api/chat/stream/route.js',
    'app/api/chat/profile/route.js',
    'app/api/chat/feedback/route.js',
    'app/api/admin/route.js',
    'app/api/admin/queries/route.js',
    'app/api/admin/users/route.js',
    'app/api/admin/topics/route.js',
    'app/api/admin/analyze/route.js',
  ];

  routes.forEach((route) => {
    it(route, () => {
      expect(exists(route)).toBe(true);
    });
  });
});

// ─── Lib files ───────────────────────────────────────────────────────────────

describe('lib files exist', () => {
  const libs = ['auth', 'claude', 'database', 'knowledgeBase', 'prompts', 'search', 'supabase'];

  libs.forEach((lib) => {
    it(`lib/${lib}.js`, () => {
      expect(exists(`lib/${lib}.js`)).toBe(true);
    });
  });
});

// ─── Key images ──────────────────────────────────────────────────────────────

describe('key images exist', () => {
  it('cal-bear-avatar.webp', () => {
    expect(exists('public/images/cal-bear-avatar.webp')).toBe(true);
  });

  it('cal-bear-full.png', () => {
    expect(exists('public/images/cal-bear-full.png')).toBe(true);
  });
});

// ─── Knowledge base files ────────────────────────────────────────────────────

describe('knowledge base has expected files', () => {
  const expectedFiles = [
    '01_emergency_procedures.md',
    '02_student_arrival_procedures.md',
    '03_first_aid_medical.md',
    '04_staff_schedules_policies.md',
    '05_instructors_courses.md',
    '06_program_overview.md',
    '06_student_code_of_conduct.md',
    '07_daily_schedule_operations.md',
    '08_staff_roles_responsibilities.md',
    '09_check_in_check_out_procedures.md',
    '09_incident_reporting_oncall_protocols.md',
    '10_meal_activity_logistics.md',
    '10_medical_protocols_safety.md',
    '11_parent_communication_protocols.md',
    '13_transportation_responsibilities.md',
  ];

  expectedFiles.forEach((file) => {
    it(`knowledge_base/${file}`, () => {
      expect(exists(`knowledge_base/${file}`)).toBe(true);
    });
  });

  it('knowledge_base/scenarios/ directory exists', () => {
    expect(exists('knowledge_base/scenarios')).toBe(true);
    expect(fs.statSync(path.join(ROOT, 'knowledge_base/scenarios')).isDirectory()).toBe(true);
  });

  it('knowledge_base/training/ directory exists', () => {
    expect(exists('knowledge_base/training')).toBe(true);
    expect(fs.statSync(path.join(ROOT, 'knowledge_base/training')).isDirectory()).toBe(true);
  });
});

// ─── package.json dependencies ───────────────────────────────────────────────

describe('package.json has required dependencies', () => {
  let pkg;

  beforeAll(() => {
    pkg = readJSON('package.json');
  });

  const requiredDeps = ['next', 'react', '@supabase/supabase-js', '@anthropic-ai/sdk'];

  requiredDeps.forEach((dep) => {
    it(`depends on ${dep}`, () => {
      expect(pkg.dependencies).toHaveProperty(dep);
    });
  });
});

// ─── .gitignore ──────────────────────────────────────────────────────────────

describe('.gitignore', () => {
  let gitignore;

  beforeAll(() => {
    gitignore = readText('.gitignore');
  });

  it('contains node_modules', () => {
    expect(gitignore).toContain('node_modules');
  });

  it('contains .env.local', () => {
    expect(gitignore).toContain('.env.local');
  });

  it('contains .next', () => {
    expect(gitignore).toContain('.next');
  });
});

// ─── No secrets in committed files ───────────────────────────────────────────

describe('no secrets in committed JS files', () => {
  function getAllJsFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      if (entry.isDirectory()) {
        results.push(...getAllJsFiles(fullPath));
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it('no real API keys (sk-ant-, eyJ) in any JS file', () => {
    const jsFiles = getAllJsFiles(ROOT);
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Check for Anthropic API keys
      expect(content).not.toMatch(/sk-ant-[a-zA-Z0-9]{20,}/);
      // Check for Supabase JWTs that look like real keys (long base64 starting with eyJ)
      // Only flag if it looks like a real key (not a test placeholder)
      const jwtMatches = content.match(/eyJ[a-zA-Z0-9_-]{50,}/g);
      if (jwtMatches) {
        // Allow test placeholders like "test-anon-key"
        for (const match of jwtMatches) {
          const relativePath = path.relative(ROOT, file);
          // Fail if found in non-test, non-setup files
          if (!relativePath.startsWith('tests/')) {
            throw new Error(`Possible real JWT found in ${relativePath}`);
          }
        }
      }
    }
  });
});

// ─── manifest.json ───────────────────────────────────────────────────────────

describe('manifest.json', () => {
  let manifest;

  beforeAll(() => {
    manifest = readJSON('public/manifest.json');
  });

  it('exists', () => {
    expect(exists('public/manifest.json')).toBe(true);
  });

  it('has correct app name', () => {
    expect(manifest.name).toContain('Summer');
    expect(manifest.name).toContain('SSB');
  });

  it('has a short_name', () => {
    expect(manifest.short_name).toBeDefined();
  });

  it('has icons configured', () => {
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});
