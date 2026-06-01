import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PAGE_JS = fs.readFileSync(path.join(process.cwd(), 'app/page.js'), 'utf-8');

describe('page.js JSX integrity', () => {
  it('has balanced curly braces', () => {
    const opens = (PAGE_JS.match(/{/g) || []).length;
    const closes = (PAGE_JS.match(/}/g) || []).length;
    expect(opens).toBe(closes);
  });

  it('has roughly balanced parentheses (within 2)', () => {
    const opens = (PAGE_JS.match(/\(/g) || []).length;
    const closes = (PAGE_JS.match(/\)/g) || []).length;
    expect(Math.abs(opens - closes)).toBeLessThanOrEqual(2);
  });

  it('has roughly balanced square brackets (within 2)', () => {
    const opens = (PAGE_JS.match(/\[/g) || []).length;
    const closes = (PAGE_JS.match(/\]/g) || []).length;
    expect(Math.abs(opens - closes)).toBeLessThanOrEqual(2);
  });

  it('has no orphaned JSX closing tags without openers', () => {
    // Check common patterns that indicate broken JSX from bad edits
    const lines = PAGE_JS.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // A line that is just ")}" or "))" with nothing else is suspicious
      // but valid in callbacks. We check for truly orphaned patterns.
      if (line === ')}' && i > 0) {
        const prevLine = lines[i - 1].trim();
        // If the previous line is also ")}" that's a double-close which is suspicious
        if (prevLine === ')}') {
          // Allow up to 3 consecutive closes (deeply nested JSX is normal)
          const prevPrevLine = i > 1 ? lines[i - 2].trim() : '';
          if (prevPrevLine === ')}') {
            // Three consecutive ")}" - check if the one before has content
            const prevPrevPrevLine = i > 2 ? lines[i - 3].trim() : 'content';
            expect(prevPrevPrevLine).not.toBe(')}');
          }
        }
      }
    }
  });

  it('exports a default function component', () => {
    expect(PAGE_JS).toContain('export default function');
  });

  it('has use client directive', () => {
    expect(PAGE_JS.trimStart().startsWith("'use client'")).toBe(true);
  });

  it('imports React hooks', () => {
    expect(PAGE_JS).toContain('useState');
    expect(PAGE_JS).toContain('useEffect');
    expect(PAGE_JS).toContain('useCallback');
  });

  it('does not have unused useSearchParams import', () => {
    // This import caused issues - should not be present unless actually used
    if (PAGE_JS.includes("import { useSearchParams }")) {
      // If imported, it must be used somewhere in the code
      const usageCount = (PAGE_JS.match(/useSearchParams/g) || []).length;
      expect(usageCount).toBeGreaterThan(1); // more than just the import
    }
  });

  it('has roughly balanced div tags (within 3)', () => {
    const openDivs = (PAGE_JS.match(/<div[\s>]/g) || []).length;
    const closeDivs = (PAGE_JS.match(/<\/div>/g) || []).length;
    const selfClosingDivs = (PAGE_JS.match(/<div[^>]*\/>/g) || []).length;
    expect(Math.abs(openDivs - selfClosingDivs - closeDivs)).toBeLessThanOrEqual(3);
  });
});

describe('globals.css integrity', () => {
  const CSS = fs.readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf-8');

  it('has balanced curly braces', () => {
    const opens = (CSS.match(/{/g) || []).length;
    const closes = (CSS.match(/}/g) || []).length;
    expect(opens).toBe(closes);
  });

  it('has no empty rules (sign of bad sed edits)', () => {
    // Look for rules that open and immediately close: .class { }
    const emptyRules = CSS.match(/\{[\s]*\}/g) || [];
    expect(emptyRules.length).toBe(0);
  });
});

describe('ErrorBoundary', () => {
  const EB = fs.readFileSync(path.join(process.cwd(), 'components/ErrorBoundary.js'), 'utf-8');

  it('has contact email link', () => {
    expect(EB).toContain('haneen@uni.minerva.edu');
    expect(EB).toContain('SSB%20chatbot%20support%20issue');
  });

  it('has reload button', () => {
    expect(EB).toContain('window.location.reload');
    expect(EB).toContain('Reload');
  });
});
