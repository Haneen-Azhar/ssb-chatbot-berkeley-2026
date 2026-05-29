import { loadKnowledgeBase, searchKnowledgeBase } from '../lib/knowledgeBase.js';

// Integration tests — load real KB files from disk
// Run loadKnowledgeBase once before all tests in this suite
beforeAll(async () => {
  const loaded = await loadKnowledgeBase();
  expect(loaded).toBe(true);
});

// ─── loadKnowledgeBase ───────────────────────────────────────────────────────

describe('loadKnowledgeBase', () => {
  it('returns true on successful load', async () => {
    // Already verified in beforeAll, but test independently
    const result = await loadKnowledgeBase();
    expect(result).toBe(true);
  });
});

// ─── searchKnowledgeBase ─────────────────────────────────────────────────────

describe('searchKnowledgeBase', () => {
  describe('result shape', () => {
    it('returns an array', () => {
      const results = searchKnowledgeBase('emergency procedures');
      expect(Array.isArray(results)).toBe(true);
    });

    it('returns results with required fields', () => {
      const results = searchKnowledgeBase('emergency procedures');
      expect(results.length).toBeGreaterThan(0);

      const first = results[0];
      expect(first).toHaveProperty('file');
      expect(first).toHaveProperty('header');
      expect(first).toHaveProperty('score');
      expect(first).toHaveProperty('content');
      expect(first).toHaveProperty('sourceUrl');
      expect(first).toHaveProperty('sourceLabel');
    });

    it('returns at most 5 results (top 5)', () => {
      const results = searchKnowledgeBase('student medical emergency fire safety');
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('results are sorted by score descending', () => {
      const results = searchKnowledgeBase('incident report documentation');
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('relevance', () => {
    it('returns relevant results for "emergency"', () => {
      const results = searchKnowledgeBase('emergency');
      expect(results.length).toBeGreaterThan(0);

      const fileNames = results.map((r) => r.file);
      const hasEmergency = fileNames.some(
        (f) => f.includes('emergency') || f.includes('crisis') || f.includes('medical')
      );
      expect(hasEmergency).toBe(true);
    });

    it('returns relevant results for "incident report"', () => {
      const results = searchKnowledgeBase('incident report');
      expect(results.length).toBeGreaterThan(0);

      const fileNames = results.map((r) => r.file);
      const hasIncident = fileNames.some(
        (f) => f.includes('incident') || f.includes('reporting')
      );
      expect(hasIncident).toBe(true);
    });

    it('returns relevant results for scenario queries like "student fighting"', () => {
      const results = searchKnowledgeBase('student fighting');
      expect(results.length).toBeGreaterThan(0);

      const allContent = results.map((r) => `${r.file} ${r.header} ${r.content}`).join(' ').toLowerCase();
      const relevant = allContent.includes('fight') || allContent.includes('physical') || allContent.includes('discipline') || allContent.includes('violence');
      expect(relevant).toBe(true);
    });

    it('returns relevant results for "parent upset"', () => {
      const results = searchKnowledgeBase('parent upset');
      expect(results.length).toBeGreaterThan(0);

      const allContent = results.map((r) => `${r.file} ${r.header} ${r.content}`).join(' ').toLowerCase();
      const relevant = allContent.includes('parent') || allContent.includes('communication') || allContent.includes('angry');
      expect(relevant).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty query', () => {
      const results = searchKnowledgeBase('');
      expect(results).toEqual([]);
    });

    it('returns empty array for query with only stop words', () => {
      const results = searchKnowledgeBase('the and or');
      expect(results).toEqual([]);
    });
  });

  describe('source URL mapping', () => {
    it('emergency procedures maps to risk-management URLs', () => {
      const results = searchKnowledgeBase('emergency procedures earthquake');
      const emergencyResults = results.filter((r) => r.file.includes('emergency'));
      if (emergencyResults.length > 0) {
        const urls = emergencyResults.map((r) => r.sourceUrl);
        const hasRiskManagement = urls.some((u) => u.includes('risk-management'));
        expect(hasRiskManagement).toBe(true);
        // Should NOT be generic homepage
        const hasGenericHomepage = urls.some((u) => u === 'https://summerspringboard.com');
        expect(hasGenericHomepage).toBe(false);
      }
    });

    it('incident reporting maps to risk-management/incident-reporting', () => {
      const results = searchKnowledgeBase('incident report form documentation');
      const incidentResults = results.filter((r) => r.file.includes('incident'));
      if (incidentResults.length > 0) {
        const urls = incidentResults.map((r) => r.sourceUrl);
        const hasIncidentUrl = urls.some((u) => u.includes('incident-reporting'));
        expect(hasIncidentUrl).toBe(true);
      }
    });

    it('student code of conduct maps to ssb-policies', () => {
      const results = searchKnowledgeBase('code of conduct violation dismissal');
      const conductResults = results.filter((r) => r.file.includes('code_of_conduct') || r.file.includes('discipline'));
      if (conductResults.length > 0) {
        const urls = conductResults.map((r) => r.sourceUrl);
        const hasPoliciesUrl = urls.some((u) => u.includes('ssb-policies'));
        expect(hasPoliciesUrl).toBe(true);
      }
    });

    it('parent scenarios map to parent-management', () => {
      const results = searchKnowledgeBase('angry parent demanding answers');
      const parentResults = results.filter((r) => r.file.includes('parent'));
      if (parentResults.length > 0) {
        const urls = parentResults.map((r) => r.sourceUrl);
        const hasParentUrl = urls.some((u) => u.includes('parent-management'));
        expect(hasParentUrl).toBe(true);
      }
    });

    it('medical scenarios map to handling-student-medical-issues or physical-health-protocols', () => {
      const results = searchKnowledgeBase('student concussion head injury');
      const medicalResults = results.filter(
        (r) => r.file.includes('medical') || r.file.includes('concussion') || r.file.includes('health')
      );
      if (medicalResults.length > 0) {
        const urls = medicalResults.map((r) => r.sourceUrl);
        const hasMedicalUrl = urls.some(
          (u) => u.includes('handling-student-medical-issues') || u.includes('physical-health-protocols')
        );
        expect(hasMedicalUrl).toBe(true);
      }
    });
  });
});
