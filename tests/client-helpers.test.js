import { describe, it, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// These functions are copied from app/page.js for isolated testing.
// They are pure functions with no side effects.
// IMPORTANT: If you change these in page.js, update them here too.
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/^### (.+)$/gm, '<strong style="font-size:15px;display:block;margin:12px 0 4px">$1</strong>');
  html = html.replace(/^## (.+)$/gm, '<strong style="font-size:16px;display:block;margin:14px 0 4px">$1</strong>');
  html = html.replace(/^# (.+)$/gm, '<strong style="font-size:18px;display:block;margin:16px 0 6px">$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(
    /`(.*?)`/g,
    '<code>$1</code>'
  );
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  html = html.replace(/^\d+\. (.+)$/gm, '<div class="md-list-item">$1</div>');
  html = html.replace(/^- (.+)$/gm, '<div class="md-list-item">$1</div>');
  html = html.replace(
    /^&bull; (.+)$/gm,
    '<div class="md-list-item">$1</div>'
  );
  html = html.replace(/\n/g, '<br>');
  return html;
}

function groupConversationsByDate(convos) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { today: [], yesterday: [], week: [], older: [] };

  convos
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .forEach((c) => {
      const d = new Date(c.updatedAt);
      if (d >= today) groups.today.push(c);
      else if (d >= yesterday) groups.yesterday.push(c);
      else if (d >= weekAgo) groups.week.push(c);
      else groups.older.push(c);
    });

  return groups;
}

const ROLE_BADGES = {
  cd: '#003262',
  am: '#008FA4',
  spa: '#2d8a4e',
  mentor: '#e87722',
  instructor: '#6b46c1',
  other: '#666',
};

const SUGGESTED_QUESTIONS = [
  'What should I do in a medical emergency?',
  'Where can I find the daily schedule?',
  'How do I report an incident?',
  'What are the important campus phone numbers?',
];

function isInAppBrowser() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|WhatsApp|Snapchat|Line|Twitter|LinkedIn|MicroMessenger/i.test(ua);
}

// ─── escapeHtml ──────────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  it('escapes & to &amp;', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('escapes < to &lt;', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes > to &gt;', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes " to &quot;', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it("escapes ' to &#039;", () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('escapes all entities in one string', () => {
    expect(escapeHtml('<b>"hi" & \'bye\'</b>')).toBe(
      '&lt;b&gt;&quot;hi&quot; &amp; &#039;bye&#039;&lt;/b&gt;'
    );
  });

  it('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns empty string for 0 (falsy)', () => {
    expect(escapeHtml(0)).toBe('');
  });
});

// ─── renderMarkdown ──────────────────────────────────────────────────────────

describe('renderMarkdown', () => {
  it('renders bold (**text**)', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('renders italic (*text*)', () => {
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
  });

  it('renders inline code (`text`)', () => {
    expect(renderMarkdown('`code`')).toContain('<code>code</code>');
  });

  it('renders links [text](url)', () => {
    const result = renderMarkdown('[Click](https://example.com)');
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
    expect(result).toContain('>Click</a>');
  });

  it('renders h1 headers (# title) as strong tags', () => {
    const result = renderMarkdown('# Title');
    expect(result).toContain('<strong');
    expect(result).toContain('Title');
    expect(result).toContain('font-size:18px');
  });

  it('renders h2 headers (## title) as strong tags', () => {
    const result = renderMarkdown('## Subtitle');
    expect(result).toContain('<strong');
    expect(result).toContain('Subtitle');
    expect(result).toContain('font-size:16px');
  });

  it('renders h3 headers (### title) as strong tags', () => {
    const result = renderMarkdown('### Section');
    expect(result).toContain('<strong');
    expect(result).toContain('Section');
    expect(result).toContain('font-size:15px');
  });

  it('renders numbered lists (1. item) as md-list-item', () => {
    const result = renderMarkdown('1. First item');
    expect(result).toContain('class="md-list-item"');
    expect(result).toContain('First item');
  });

  it('renders bullet lists (- item) as md-list-item', () => {
    const result = renderMarkdown('- Bullet item');
    expect(result).toContain('class="md-list-item"');
    expect(result).toContain('Bullet item');
  });

  it('converts line breaks (\\n becomes <br>)', () => {
    const result = renderMarkdown('line1\nline2');
    expect(result).toContain('line1<br>line2');
  });

  it('XSS prevention: script tags are escaped', () => {
    const result = renderMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('XSS prevention: img onerror is escaped', () => {
    const result = renderMarkdown('<img onerror="alert(1)" src=x>');
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });
});

// ─── groupConversationsByDate ────────────────────────────────────────────────

describe('groupConversationsByDate', () => {
  it('groups conversations correctly into today/yesterday/week/older', () => {
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const threeDaysAgo = new Date(todayDate);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const twoWeeksAgo = new Date(todayDate);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const convos = [
      { id: '1', updatedAt: todayDate.toISOString() },
      { id: '2', updatedAt: yesterdayDate.toISOString() },
      { id: '3', updatedAt: threeDaysAgo.toISOString() },
      { id: '4', updatedAt: twoWeeksAgo.toISOString() },
    ];

    const groups = groupConversationsByDate(convos);

    expect(groups.today).toHaveLength(1);
    expect(groups.today[0].id).toBe('1');
    expect(groups.yesterday).toHaveLength(1);
    expect(groups.yesterday[0].id).toBe('2');
    expect(groups.week).toHaveLength(1);
    expect(groups.week[0].id).toBe('3');
    expect(groups.older).toHaveLength(1);
    expect(groups.older[0].id).toBe('4');
  });

  it('sorts by updatedAt descending within groups', () => {
    const now = new Date();
    const earlyToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8);
    const lateToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16);

    const convos = [
      { id: 'early', updatedAt: earlyToday.toISOString() },
      { id: 'late', updatedAt: lateToday.toISOString() },
    ];

    const groups = groupConversationsByDate(convos);

    expect(groups.today[0].id).toBe('late');
    expect(groups.today[1].id).toBe('early');
  });

  it('handles empty array', () => {
    const groups = groupConversationsByDate([]);

    expect(groups.today).toEqual([]);
    expect(groups.yesterday).toEqual([]);
    expect(groups.week).toEqual([]);
    expect(groups.older).toEqual([]);
  });
});

// ─── ROLE_BADGES ─────────────────────────────────────────────────────────────

describe('ROLE_BADGES', () => {
  it('has all 6 roles', () => {
    const expectedRoles = ['cd', 'am', 'spa', 'mentor', 'instructor', 'other'];
    expect(Object.keys(ROLE_BADGES).sort()).toEqual(expectedRoles.sort());
  });

  it('each role maps to a color string', () => {
    for (const [role, color] of Object.entries(ROLE_BADGES)) {
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9a-fA-F]{3,6}$/);
    }
  });
});

// ─── SUGGESTED_QUESTIONS ─────────────────────────────────────────────────────

describe('SUGGESTED_QUESTIONS', () => {
  it('is an array of 4 items', () => {
    expect(Array.isArray(SUGGESTED_QUESTIONS)).toBe(true);
    expect(SUGGESTED_QUESTIONS).toHaveLength(4);
  });

  it('each item is a non-empty string', () => {
    for (const q of SUGGESTED_QUESTIONS) {
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(0);
    }
  });
});

// ─── isInAppBrowser ──────────────────────────────────────────────────────────

describe('isInAppBrowser', () => {
  it('returns false when window is undefined (server side)', () => {
    // In Node.js test env, window is undefined by default
    expect(isInAppBrowser()).toBe(false);
  });

  // Helper to simulate browser environment with a custom user agent
  function withUserAgent(ua, fn) {
    const origWindow = globalThis.window;
    const origNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    globalThis.window = {};
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: ua },
      writable: true,
      configurable: true,
    });
    try {
      fn();
    } finally {
      if (origWindow === undefined) {
        delete globalThis.window;
      } else {
        globalThis.window = origWindow;
      }
      if (origNavigatorDesc) {
        Object.defineProperty(globalThis, 'navigator', origNavigatorDesc);
      } else {
        delete globalThis.navigator;
      }
    }
  }

  it('detects WhatsApp user agent', () => {
    withUserAgent('Mozilla/5.0 WhatsApp/2.23', () => {
      expect(isInAppBrowser()).toBe(true);
    });
  });

  it('detects Instagram user agent', () => {
    withUserAgent('Mozilla/5.0 Instagram 300.0', () => {
      expect(isInAppBrowser()).toBe(true);
    });
  });

  it('detects Facebook user agent (FBAN)', () => {
    withUserAgent('Mozilla/5.0 [FBAN/FBIOS]', () => {
      expect(isInAppBrowser()).toBe(true);
    });
  });

  it('returns false for normal Chrome user agent', () => {
    withUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36', () => {
      expect(isInAppBrowser()).toBe(false);
    });
  });
});
