import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const KB = path.join(ROOT, 'knowledge_base');

function kbExists(relativePath) {
  return fs.existsSync(path.join(KB, relativePath));
}

function countMdFiles(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return count;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countMdFiles(fullPath);
    } else if (entry.name.endsWith('.md')) {
      count++;
    }
  }
  return count;
}

function findFilesByExtension(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFilesByExtension(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(path.relative(KB, fullPath));
    }
  }
  return results;
}

// ─── Core policy files ───────────────────────────────────────────────────────

describe('core policy files exist', () => {
  const coreFiles = [
    '01_emergency_procedures.md',
    '02_student_arrival_procedures.md',
    '03_first_aid_medical.md',
    '04_staff_schedules_policies.md',
    '05_instructors_courses.md',
    '06_student_code_of_conduct.md',
    '07_daily_schedule_operations.md',
    '08_staff_roles_responsibilities.md',
    '09_incident_reporting_oncall_protocols.md',
    '10_meal_activity_logistics.md',
    '11_parent_communication_protocols.md',
    '13_transportation_responsibilities.md',
  ];

  coreFiles.forEach((file) => {
    it(file, () => {
      expect(kbExists(file)).toBe(true);
    });
  });
});

// ─── Specific critical files ─────────────────────────────────────────────────

describe('specific critical files exist', () => {
  const criticalFiles = [
    '01_emergency_procedures.md',
    '03_first_aid_medical.md',
    '06_student_code_of_conduct.md',
    '09_incident_reporting_oncall_protocols.md',
    '10_meal_activity_logistics.md',
    '13_transportation_responsibilities.md',
  ];

  criticalFiles.forEach((file) => {
    it(file, () => {
      expect(kbExists(file)).toBe(true);
    });
  });
});

// ─── Scenario subdirectories ─────────────────────────────────────────────────

describe('scenario subdirectories exist', () => {
  const dirs = ['scenarios/behavioral', 'scenarios/medical', 'scenarios/mental_health', 'scenarios/parent_issues'];

  dirs.forEach((dir) => {
    it(dir, () => {
      expect(kbExists(dir)).toBe(true);
      expect(fs.statSync(path.join(KB, dir)).isDirectory()).toBe(true);
    });
  });
});

// ─── Behavioral scenarios ────────────────────────────────────────────────────

describe('behavioral scenario files', () => {
  const files = [
    'physical-fighting.md',
    'bullying-harassment.md',
    'substance-violations.md',
    'sexual-harassment.md',
    'curfew-room-violations.md',
    'technology-violations.md',
  ];

  files.forEach((file) => {
    it(`scenarios/behavioral/${file}`, () => {
      expect(kbExists(`scenarios/behavioral/${file}`)).toBe(true);
    });
  });
});

// ─── Medical scenarios ───────────────────────────────────────────────────────

describe('medical scenario files', () => {
  const files = [
    'anaphylaxis.md',
    'asthma-attack.md',
    'broken-bones-sprains.md',
    'concussion.md',
    'cuts-and-bleeding.md',
    'diabetes-emergency.md',
    'heat-illness.md',
    'minor-emergencies.md',
    'seizure.md',
  ];

  files.forEach((file) => {
    it(`scenarios/medical/${file}`, () => {
      expect(kbExists(`scenarios/medical/${file}`)).toBe(true);
    });
  });
});

// ─── Mental health scenarios ─────────────────────────────────────────────────

describe('mental health scenario files', () => {
  const files = ['homesickness.md', 'panic_attack.md', 'suicidal_ideation.md'];

  files.forEach((file) => {
    it(`scenarios/mental_health/${file}`, () => {
      expect(kbExists(`scenarios/mental_health/${file}`)).toBe(true);
    });
  });
});

// ─── Parent issue scenarios ──────────────────────────────────────────────────

describe('parent issue scenario files', () => {
  const files = [
    'angry_parent_demanding_answers.md',
    'parent_threatens_legal_action.md',
    'student_wants_to_leave_homesick.md',
    'parent_reports_staff_misconduct.md',
    'parent_child_doesnt_feel_safe.md',
    'parent_questions_discipline.md',
    'parent_demands_refund.md',
  ];

  files.forEach((file) => {
    it(`scenarios/parent_issues/${file}`, () => {
      expect(kbExists(`scenarios/parent_issues/${file}`)).toBe(true);
    });
  });
});

// ─── Training files ──────────────────────────────────────────────────────────

describe('training files', () => {
  const files = [
    'deescalation_techniques.md',
    'difficult_conversations.md',
    'mentorship_best_practices.md',
    'professional_boundaries.md',
    'staff_wellness.md',
    'student_engagement.md',
  ];

  files.forEach((file) => {
    it(`training/${file}`, () => {
      expect(kbExists(`training/${file}`)).toBe(true);
    });
  });
});

// ─── No stale file formats ───────────────────────────────────────────────────

describe('no stale file formats in knowledge_base', () => {
  it('no .pdf files (should have been moved to _archive)', () => {
    const pdfs = findFilesByExtension(KB, '.pdf');
    expect(pdfs, `Found PDF files: ${pdfs.join(', ')}`).toEqual([]);
  });

  it('no .txt files (should have been moved to _archive)', () => {
    const txts = findFilesByExtension(KB, '.txt');
    expect(txts, `Found TXT files: ${txts.join(', ')}`).toEqual([]);
  });
});

// ─── Total MD file count ─────────────────────────────────────────────────────

describe('knowledge base completeness', () => {
  it('total MD file count is at least 45', () => {
    const count = countMdFiles(KB);
    expect(count).toBeGreaterThanOrEqual(45);
  });
});
