import { SYSTEM_PROMPT, buildUserPrompt, shouldTriggerSearch, buildRoleContext } from '../lib/prompts.js';

// ─── SYSTEM_PROMPT ───────────────────────────────────────────────────────────

describe('SYSTEM_PROMPT', () => {
  it('exists and is a non-empty string', () => {
    expect(typeof SYSTEM_PROMPT).toBe('string');
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it('does NOT contain hardcoded "You are Summer"', () => {
    // We removed the hardcoded name; it should say "assistant" or similar
    expect(SYSTEM_PROMPT).not.toMatch(/You are Summer\b/);
  });

  it('contains key SSB operational terms', () => {
    expect(SYSTEM_PROMPT).toContain('SSB');
    expect(SYSTEM_PROMPT).toContain('Berkeley');
    expect(SYSTEM_PROMPT).toContain('incident');
    expect(SYSTEM_PROMPT).toContain('emergency');
  });

  it('contains the banned phrases list', () => {
    expect(SYSTEM_PROMPT).toContain('BANNED PHRASES');
    expect(SYSTEM_PROMPT).toContain('"Here\'s the thing"');
    expect(SYSTEM_PROMPT).toContain('"Let me be clear"');
  });

  it('contains role terminology (CD, AM, SPA, PD)', () => {
    expect(SYSTEM_PROMPT).toContain('CD');
    expect(SYSTEM_PROMPT).toContain('Campus Director');
    expect(SYSTEM_PROMPT).toContain('AM');
    expect(SYSTEM_PROMPT).toContain('Academic Manager');
    expect(SYSTEM_PROMPT).toContain('SPA');
    expect(SYSTEM_PROMPT).toContain('Summer Program Assistant');
    expect(SYSTEM_PROMPT).toContain('PD');
    expect(SYSTEM_PROMPT).toContain('Program Director');
  });

  it('contains contact numbers (helpline, UCPD)', () => {
    expect(SYSTEM_PROMPT).toContain('+1.858.779.0555');
    expect(SYSTEM_PROMPT).toContain('510-642-3333');
    expect(SYSTEM_PROMPT).toContain('510-642-6760');
    expect(SYSTEM_PROMPT).toContain('760-579-1822');
  });

  it('contains incident report form URL', () => {
    expect(SYSTEM_PROMPT).toContain('https://docs.google.com/forms/d/e/1FAIpQLSdvScv2Kfcxbkh2N81ukoJLocuTXmVt1d1xrjpqX5q_Rk-IKg/viewform');
  });

  it('contains current date injection', () => {
    // The prompt template embeds ${new Date()...} so the rendered string has a date
    expect(SYSTEM_PROMPT).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

// ─── buildUserPrompt ─────────────────────────────────────────────────────────

describe('buildUserPrompt', () => {
  it('returns a string containing the query', () => {
    const result = buildUserPrompt('What is the staff ratio?');
    expect(typeof result).toBe('string');
    expect(result).toContain('What is the staff ratio?');
  });

  it('includes KB context when provided with file/header/sourceLabel/sourceUrl', () => {
    const kbContext = [
      {
        file: '04_staff_schedules_policies.md',
        header: 'Supervision Ratios',
        content: '10:1 ratio required for high school',
        sourceLabel: 'SSB Manual - Supervision',
        sourceUrl: 'https://sites.google.com/example/supervision',
      },
    ];
    const result = buildUserPrompt('ratio question', kbContext);
    expect(result).toContain('RELEVANT KNOWLEDGE BASE CONTEXT');
    expect(result).toContain('04_staff_schedules_policies.md');
    expect(result).toContain('Supervision Ratios');
    expect(result).toContain('10:1 ratio required for high school');
    expect(result).toContain('SSB Manual - Supervision');
    expect(result).toContain('https://sites.google.com/example/supervision');
  });

  it('includes web search results when provided', () => {
    const searchResults = [
      { title: 'Berkeley News', snippet: 'Latest campus update', url: 'https://news.berkeley.edu' },
    ];
    const result = buildUserPrompt('campus news', [], searchResults);
    expect(result).toContain('WEB SEARCH RESULTS');
    expect(result).toContain('Berkeley News');
    expect(result).toContain('Latest campus update');
    expect(result).toContain('https://news.berkeley.edu');
  });

  it('includes conversation history when provided and truncates to recent', () => {
    // buildUserPrompt only includes history when length > 2, and slices to last 6
    const history = [
      { role: 'user', content: 'msg 1' },
      { role: 'assistant', content: 'reply 1' },
      { role: 'user', content: 'msg 2' },
      { role: 'assistant', content: 'reply 2' },
      { role: 'user', content: 'msg 3' },
      { role: 'assistant', content: 'reply 3' },
      { role: 'user', content: 'msg 4' },
      { role: 'assistant', content: 'reply 4' },
    ];
    const result = buildUserPrompt('follow up', [], null, history);
    expect(result).toContain('CONVERSATION CONTEXT');
    // Should contain recent messages (last 6), not all 8
    expect(result).toContain('msg 3');
    expect(result).toContain('msg 4');
    // Should NOT contain very old messages outside the 6-message window
    expect(result).not.toContain('msg 1');
  });

  it('does not include conversation context when history has 2 or fewer messages', () => {
    const shortHistory = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];
    const result = buildUserPrompt('question', [], null, shortHistory);
    expect(result).not.toContain('CONVERSATION CONTEXT');
  });

  it('returns just the query when no context/search/history', () => {
    const result = buildUserPrompt('simple question');
    expect(result).toBe('**CURRENT USER QUERY:**\nsimple question');
  });

  it('returns just the query with empty arrays', () => {
    const result = buildUserPrompt('simple question', [], null, []);
    expect(result).toBe('**CURRENT USER QUERY:**\nsimple question');
  });

  it('truncates long conversation messages to 150 chars with ellipsis', () => {
    const longContent = 'A'.repeat(200);
    const history = [
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
      { role: 'user', content: longContent },
    ];
    const result = buildUserPrompt('next', [], null, history);
    expect(result).toContain('...');
    // The preview should be 150 chars of 'A'
    expect(result).toContain('A'.repeat(150));
    expect(result).not.toContain('A'.repeat(200));
  });
});

// ─── shouldTriggerSearch ─────────────────────────────────────────────────────

describe('shouldTriggerSearch', () => {
  describe('returns true for trigger words', () => {
    const triggerQueries = [
      ['latest campus news', 'latest'],
      ['current weather in Berkeley', 'current'],
      ['what events are happening on campus', 'campus + event'],
      ['berkeley dining options', 'berkeley'],
      ['any news about the program', 'news'],
      ['what happened today', 'today'],
      ['search for emergency procedures', 'search for'],
      ['find me the schedule', 'find'],
      ['look up the contact info', 'look up'],
      ["what's new this week", "what's new"],
      ['any updates from SSB', 'update'],
      ['2026 program details', '2026'],
      ['what is happening now', 'now + happening'],
    ];

    triggerQueries.forEach(([query, reason]) => {
      it(`"${query}" (contains: ${reason})`, () => {
        expect(shouldTriggerSearch(query)).toBe(true);
      });
    });
  });

  describe('returns false for generic policy questions', () => {
    const nonTriggerQueries = [
      'what is the staff ratio',
      'how to file incident report',
      'tell me about the code of conduct',
      'who is the program director',
      'what are the bed check procedures',
    ];

    nonTriggerQueries.forEach((query) => {
      it(`"${query}"`, () => {
        expect(shouldTriggerSearch(query)).toBe(false);
      });
    });
  });

  it('is case-insensitive', () => {
    expect(shouldTriggerSearch('LATEST NEWS')).toBe(true);
    expect(shouldTriggerSearch('Berkeley Events')).toBe(true);
  });
});

// ─── buildRoleContext ────────────────────────────────────────────────────────

describe('buildRoleContext', () => {
  it('returns empty string for null user', () => {
    expect(buildRoleContext(null)).toBe('');
  });

  it('returns empty string for undefined user', () => {
    expect(buildRoleContext(undefined)).toBe('');
  });

  it('returns context with bot_name when provided (snake_case)', () => {
    const user = { name: 'Alex', role: 'Mentor', bot_name: 'Goldie' };
    const result = buildRoleContext(user);
    expect(result).toContain('Goldie');
    expect(result).toContain('Always refer to yourself as Goldie');
  });

  it('returns context with botName when provided (camelCase)', () => {
    const user = { name: 'Alex', role: 'Mentor', botName: 'Oski' };
    const result = buildRoleContext(user);
    expect(result).toContain('Oski');
    expect(result).toContain('Always refer to yourself as Oski');
  });

  it('prefers bot_name over botName when both are present', () => {
    const user = { name: 'Alex', role: 'Mentor', bot_name: 'Goldie', botName: 'Oski' };
    const result = buildRoleContext(user);
    expect(result).toContain('Goldie');
  });

  it('defaults to "Summer" when no bot name', () => {
    const user = { name: 'Alex', role: 'Mentor' };
    const result = buildRoleContext(user);
    expect(result).toContain('Your name is Summer');
    expect(result).toContain('Always refer to yourself as Summer');
  });

  it('contains "Always refer to yourself as" instruction', () => {
    const user = { name: 'Alex', bot_name: 'Bear' };
    const result = buildRoleContext(user);
    expect(result).toContain('Always refer to yourself as Bear');
  });

  describe('CD role', () => {
    it('contains "Campus Director"', () => {
      const result = buildRoleContext({ name: 'Liz', role: 'CD' });
      expect(result).toContain('Campus Director');
    });

    it('does NOT tell CD to escalate to themselves', () => {
      const result = buildRoleContext({ name: 'Liz', role: 'CD' });
      expect(result).not.toContain('escalate to CD');
      // Should instead guide on delegating
      expect(result).toContain('delegating');
    });

    it('mentions disciplinary decisions', () => {
      const result = buildRoleContext({ name: 'Liz', role: 'CD' });
      expect(result).toContain('disciplinary');
    });
  });

  describe('AM role', () => {
    it('contains "Academic Manager"', () => {
      const result = buildRoleContext({ name: 'Jordan', role: 'AM' });
      expect(result).toContain('Academic Manager');
    });

    it('mentions "second-in-command"', () => {
      const result = buildRoleContext({ name: 'Jordan', role: 'AM' });
      expect(result).toContain('second-in-command');
    });
  });

  describe('SPA role', () => {
    it('contains "Summer Program Assistant"', () => {
      const result = buildRoleContext({ name: 'Chris', role: 'SPA' });
      expect(result).toContain('Summer Program Assistant');
    });

    it('mentions logistics and operations', () => {
      const result = buildRoleContext({ name: 'Chris', role: 'SPA' });
      expect(result).toContain('logistics');
    });
  });

  describe('Mentor role', () => {
    it('contains "Resident Mentor"', () => {
      const result = buildRoleContext({ name: 'Sam', role: 'Mentor' });
      expect(result).toContain('Resident Mentor');
    });

    it('mentions "escalate"', () => {
      const result = buildRoleContext({ name: 'Sam', role: 'Mentor' });
      expect(result).toContain('escalate');
    });
  });

  describe('Instructor role', () => {
    it('contains "Instructor"', () => {
      const result = buildRoleContext({ name: 'Prof. Lee', role: 'Instructor' });
      expect(result).toContain('Instructor');
    });

    it('mentions "classroom"', () => {
      const result = buildRoleContext({ name: 'Prof. Lee', role: 'Instructor' });
      expect(result).toContain('classroom');
    });
  });

  describe('unknown/other role', () => {
    it('uses generic greeting with name', () => {
      const result = buildRoleContext({ name: 'Taylor', role: 'Volunteer' });
      expect(result).toContain('Taylor');
      // Should not contain any specific role description
      expect(result).not.toContain('Campus Director');
      expect(result).not.toContain('Academic Manager');
    });
  });

  it('includes the user name in context', () => {
    const result = buildRoleContext({ name: 'Maria', role: 'CD' });
    expect(result).toContain('Maria');
  });

  it('falls back to "staff member" when no name provided', () => {
    const result = buildRoleContext({ role: 'Mentor' });
    expect(result).toContain('staff member');
  });
});
