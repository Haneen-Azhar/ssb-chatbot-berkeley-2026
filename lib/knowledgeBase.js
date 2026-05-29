import fs from 'fs/promises';
import path from 'path';

const KB_PATH = path.join(process.cwd(), 'knowledge_base');

// Enhanced cache with sections, metadata, and source URLs
let kbCache = {};
let invertedIndex = {};
let sourceMapping = {};

// Portal and Manual URLs
const PORTAL_BASE = 'https://sites.google.com/summerspringboard.com/berkeley-b-summer-staff-portal';
const MANUAL_BASE = 'https://sites.google.com/terraeducation.com/ssbmanual2025';

// Recursively find all .md files in directory
async function findMdFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return findMdFiles(fullPath, baseDir);
    } else if (entry.name.endsWith('.md') && !entry.name.includes('README') && !entry.name.includes('SOURCES')) {
      const relativePath = path.relative(baseDir, fullPath);
      return { relativePath, fullPath };
    }
    return [];
  }));
  return files.flat();
}

// Load and index knowledge base with enhanced metadata
export async function loadKnowledgeBase() {
  try {
    const mdFiles = await findMdFiles(KB_PATH);

    for (const { relativePath, fullPath } of mdFiles) {
      const content = await fs.readFile(fullPath, 'utf-8');

      // Parse into sections with headers
      const sections = parseIntoSections(content, relativePath);

      kbCache[relativePath] = {
        fullContent: content,
        sections: sections,
        fileName: relativePath
      };

      // Build inverted index for fast lookup
      buildIndexForFile(relativePath, sections);
    }

    // Load source mapping
    await loadSourceMapping();

    console.log(`📚 Loaded ${mdFiles.length} knowledge base files`);
    console.log(`🔍 Indexed ${Object.keys(invertedIndex).length} unique terms`);
    return true;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return false;
  }
}

// Parse content into sections with metadata
function parseIntoSections(content, fileName) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let currentContent = [];
  let currentHeader = '';

  for (const line of lines) {
    // Check for headers (# ## ###)
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: currentContent.join('\n').trim()
        });
      }

      // Start new section
      currentHeader = headerMatch[2];
      currentContent = [line];
      currentSection = {
        header: currentHeader,
        level: headerMatch[1].length,
        fileName: fileName
      };
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections.push({
      ...currentSection,
      content: currentContent.join('\n').trim()
    });
  }

  return sections;
}

// Build inverted index for fast keyword lookup
function buildIndexForFile(fileName, sections) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could'
  ]);

  sections.forEach((section, idx) => {
    // Check if this section contains tags (usually first section after title)
    const isTags = section.content.toLowerCase().includes('**tags:**');
    const text = `${section.header} ${section.content}`.toLowerCase();
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    words.forEach(word => {
      if (!invertedIndex[word]) {
        invertedIndex[word] = [];
      }
      invertedIndex[word].push({
        fileName,
        sectionIdx: idx,
        header: section.header,
        isTag: isTags // Mark if this word came from tags
      });
    });

    // Index bigrams for better matching
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!invertedIndex[bigram]) {
        invertedIndex[bigram] = [];
      }
      invertedIndex[bigram].push({
        fileName,
        sectionIdx: idx,
        header: section.header,
        isTag: isTags
      });
    }
  });
}

// Load source URL mapping - based on SOURCES_AND_LINKS.md
async function loadSourceMapping() {
  try {
    // Comprehensive mapping based on actual KB file content and SOURCES_AND_LINKS.md
    sourceMapping = {
      '01_emergency_procedures.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/managing-crisis-events`,
        description: 'Emergency Procedures & Safety',
        topics: [
          { keywords: ['emergency contact', 'phone number', 'ucpd', '9-1-1', 'helpline'], url: `${PORTAL_BASE}/important-resources`, label: 'Staff Portal - Emergency Contacts' },
          { keywords: ['earthquake', 'drop', 'cover', 'hold'], url: `${MANUAL_BASE}/risk-management/emergency-action-plans-program-risk-assessments`, label: 'SSB Manual - Emergency Action Plans' },
          { keywords: ['active shooter', 'run', 'hide', 'fight'], url: `${MANUAL_BASE}/risk-management/managing-crisis-events`, label: 'SSB Manual - Managing Crisis Events' },
          { keywords: ['fire', 'evacuation', 'assembly'], url: `${MANUAL_BASE}/risk-management/emergency-action-plans-program-risk-assessments`, label: 'SSB Manual - Emergency Action Plans' },
          { keywords: ['warnme', 'alert', 'notification'], url: `${MANUAL_BASE}/risk-management/on-site-safety-briefings`, label: 'SSB Manual - Safety Briefings' },
          { keywords: ['mandated reporting', 'abuse', 'neglect'], url: `${MANUAL_BASE}/ssb-policies/sexual-abuse-prevention-policy`, label: 'SSB Manual - Sexual Abuse Prevention Policy' }
        ]
      },
      '02_student_arrival_procedures.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures`,
        description: 'Student Arrival & Check-In',
        topics: [
          { keywords: ['arrival', 'check-in', 'student arrival'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures`, label: 'SSB Manual - Check-In Procedures' },
          { keywords: ['airport', 'pickup', 'flight'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures/airport-logistics`, label: 'SSB Manual - Airport Logistics' },
          { keywords: ['orientation', 'welcome'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/running-orientation-sessions`, label: 'SSB Manual - Running Orientation' },
          { keywords: ['roommate', 'room condition'], url: `${PORTAL_BASE}/important-resources`, label: 'Staff Portal - Forms & Documents' },
          { keywords: ['reach app', 'technology'], url: `${PORTAL_BASE}/important-resources`, label: 'Staff Portal - Important Resources' }
        ]
      },
      '03_first_aid_medical.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`,
        description: 'Healthcare & Medical Resources',
        topics: [
          { keywords: ['hospital', 'urgent care', 'alta bates', 'medical center'], url: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`, label: 'SSB Manual - Handling Medical Issues' },
          { keywords: ['first aid', 'medical kit', 'supplies'], url: `${MANUAL_BASE}/risk-management/first-aid-kits`, label: 'SSB Manual - First Aid Kits' },
          { keywords: ['incident report', 'medical treatment', 'injury'], url: `${MANUAL_BASE}/risk-management/incident-reporting`, label: 'SSB Manual - Incident Reporting' },
          { keywords: ['covid', 'quarantine', 'isolation'], url: `${MANUAL_BASE}/risk-management/field-operations-physical-health-protocols`, label: 'SSB Manual - Physical Health Protocols' },
          { keywords: ['mental health', 'anxiety', 'depression'], url: `${MANUAL_BASE}/risk-management/field-operations-mental-health-response-protocols`, label: 'SSB Manual - Mental Health Protocols' },
          { keywords: ['medication', 'prescription', 'medicine'], url: `${MANUAL_BASE}/risk-management/medication-management`, label: 'SSB Manual - Medication Management' },
          { keywords: ['insurance', 'travel assistance'], url: `${MANUAL_BASE}/risk-management/medical-insurance-travel-assistance`, label: 'SSB Manual - Medical Insurance' }
        ]
      },
      '04_staff_schedules_policies.md': {
        defaultUrl: `${PORTAL_BASE}/schedules-groups-lists`,
        description: 'Staff Schedules & Policies',
        topics: [
          { keywords: ['staff schedule', 'duty schedule', 'mentor schedule'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Staff Portal - Schedules & Lists' },
          { keywords: ['time off', 'personal time', 'break'], url: `${MANUAL_BASE}/time-off-in-between-session`, label: 'SSB Manual - Time Off & Between Sessions' },
          { keywords: ['on-call', 'evening duty', 'bed check'], url: `${MANUAL_BASE}/risk-management/on-call`, label: 'SSB Manual - On-Call Duties' },
          { keywords: ['incident report', 'documentation', 'behavioral'], url: `${MANUAL_BASE}/risk-management/incident-reporting`, label: 'SSB Manual - Incident Reporting' },
          { keywords: ['ratio', '10:1', 'supervision'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/campus-boundaries`, label: 'SSB Manual - Campus Boundaries & Supervision' },
          { keywords: ['code of conduct', 'professional'], url: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`, label: 'SSB Manual - Code of Conduct' }
        ]
      },
      '05_instructors_courses.md': {
        defaultUrl: `${PORTAL_BASE}/course-specific-info`,
        description: 'Academic Courses & Instructors',
        topics: [
          { keywords: ['instructor', 'teacher', 'course'], url: `${PORTAL_BASE}/course-specific-info`, label: 'Staff Portal - Course Info' },
          { keywords: ['classroom', 'building', 'location'], url: `${PORTAL_BASE}/course-specific-info`, label: 'Staff Portal - Course Info' },
          { keywords: ['schedule', 'roster', 'academic'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Staff Portal - Schedules & Lists' }
        ]
      },
      '06_program_overview.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program`,
        description: 'Program Overview',
        topics: [
          { keywords: ['housing', 'dorm', 'residence hall', 'unit'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Staff Portal - Schedules & Lists' },
          { keywords: ['dining', 'meal', 'food'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/typical-day-on-program`, label: 'SSB Manual - Typical Day on Program' },
          { keywords: ['excursion', 'trip'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/program-activities/academic-and-weekend-excursions`, label: 'SSB Manual - Excursions' },
          { keywords: ['student list', 'roster', 'group'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Staff Portal - Schedules & Lists' },
          { keywords: ['activity', 'club', 'evening'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/program-activities/student-clubs-evening-activities`, label: 'SSB Manual - Clubs & Evening Activities' }
        ]
      },
      '06_student_code_of_conduct.md': {
        defaultUrl: `${MANUAL_BASE}/ssb-policies/student-discipline`,
        description: 'Student Code of Conduct',
        topics: [
          { keywords: ['dismissal', 'expulsion', 'zero tolerance'], url: `${MANUAL_BASE}/ssb-policies/student-discipline`, label: 'SSB Manual - Student Discipline' },
          { keywords: ['code of conduct', 'behavior', 'rules', 'violation'], url: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`, label: 'SSB Manual - Enforcing Code of Conduct' },
          { keywords: ['warning', 'consequence', 'escalating'], url: `${MANUAL_BASE}/ssb-policies/student-discipline`, label: 'SSB Manual - Student Discipline' },
          { keywords: ['substance', 'alcohol', 'drug', 'vape'], url: `${MANUAL_BASE}/ssb-policies/student-discipline`, label: 'SSB Manual - Student Discipline' }
        ]
      },
      '07_daily_schedule_operations.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program/typical-day-on-program`,
        description: 'Daily Schedule & Operations',
        topics: [
          { keywords: ['schedule', 'daily', 'routine', 'typical day'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/typical-day-on-program`, label: 'SSB Manual - Typical Day on Program' },
          { keywords: ['activity', 'scheduling', 'managing'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/scheduling-managing-activities`, label: 'SSB Manual - Scheduling & Managing Activities' },
          { keywords: ['classroom', 'expectations'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/classroom-expectations`, label: 'SSB Manual - Classroom Expectations' }
        ]
      },
      '08_staff_roles_responsibilities.md': {
        defaultUrl: `${MANUAL_BASE}/summer-on-campus-team`,
        description: 'Staff Roles & Responsibilities',
        topics: [
          { keywords: ['campus director', 'cd role'], url: `${MANUAL_BASE}/summer-on-campus-team/campus-director`, label: 'SSB Manual - Campus Director' },
          { keywords: ['academic manager', 'am role'], url: `${MANUAL_BASE}/summer-on-campus-team/academic-manager`, label: 'SSB Manual - Academic Manager' },
          { keywords: ['spa', 'program assistant'], url: `${MANUAL_BASE}/summer-on-campus-team/summer-program-assistant`, label: 'SSB Manual - Summer Program Assistant' },
          { keywords: ['mentor', 'resident mentor', 'alumni'], url: `${MANUAL_BASE}/summer-on-campus-team/resident-mentor-alumni-mentor`, label: 'SSB Manual - Resident & Alumni Mentor' },
          { keywords: ['instructor', 'teaching assistant'], url: `${MANUAL_BASE}/summer-on-campus-team/instructor`, label: 'SSB Manual - Instructor' },
          { keywords: ['program director', 'pd role'], url: `${MANUAL_BASE}/summer-on-campus-team/program-director`, label: 'SSB Manual - Program Director' }
        ]
      },
      '09_check_in_check_out_procedures.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures`,
        description: 'Check-In & Check-Out',
        topics: [
          { keywords: ['check-in', 'arrival', 'registration'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures`, label: 'SSB Manual - Check-In Procedures' },
          { keywords: ['check-out', 'departure', 'leaving'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/check-out-procedures`, label: 'SSB Manual - Check-Out Procedures' },
          { keywords: ['airport', 'flight', 'transport'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures/airport-logistics`, label: 'SSB Manual - Airport Logistics' },
          { keywords: ['wrap up', 'session end', 'closing'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/wrapping-up-a-session`, label: 'SSB Manual - Wrapping Up a Session' }
        ]
      },
      '09_incident_reporting_oncall_protocols.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/incident-reporting`,
        description: 'Incident Reporting & On-Call',
        topics: [
          { keywords: ['incident report', 'reporting', 'documentation', 'report form'], url: `${MANUAL_BASE}/risk-management/incident-reporting`, label: 'SSB Manual - Incident Reporting' },
          { keywords: ['staff conduct', 'staff incident'], url: `${MANUAL_BASE}/risk-management/incident-reporting/staff-conduct-incident-report`, label: 'SSB Manual - Staff Conduct Reports' },
          { keywords: ['on-call', 'overnight', 'emergency call'], url: `${MANUAL_BASE}/risk-management/on-call`, label: 'SSB Manual - On-Call Procedures' },
          { keywords: ['crisis', 'managing crisis'], url: `${MANUAL_BASE}/risk-management/managing-crisis-events`, label: 'SSB Manual - Managing Crisis Events' }
        ]
      },
      '10_meal_activity_logistics.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program/scheduling-managing-activities`,
        description: 'Meals & Activity Logistics',
        topics: [
          { keywords: ['meal', 'breakfast', 'lunch', 'dinner', 'dining', 'food'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/typical-day-on-program`, label: 'SSB Manual - Typical Day on Program' },
          { keywords: ['excursion', 'field trip', 'off-campus'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/program-activities/academic-and-weekend-excursions`, label: 'SSB Manual - Excursions' },
          { keywords: ['activity', 'scheduling', 'logistics'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/scheduling-managing-activities`, label: 'SSB Manual - Scheduling & Managing Activities' },
          { keywords: ['allergy', 'dietary', 'restriction'], url: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`, label: 'SSB Manual - Handling Medical Issues' }
        ]
      },
      '10_medical_protocols_safety.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/field-operations-physical-health-protocols`,
        description: 'Medical Protocols & Safety',
        topics: [
          { keywords: ['physical health', 'medical protocol', 'health protocol'], url: `${MANUAL_BASE}/risk-management/field-operations-physical-health-protocols`, label: 'SSB Manual - Physical Health Protocols' },
          { keywords: ['mental health', 'psychological'], url: `${MANUAL_BASE}/risk-management/field-operations-mental-health-response-protocols`, label: 'SSB Manual - Mental Health Protocols' },
          { keywords: ['medication', 'prescription'], url: `${MANUAL_BASE}/risk-management/medication-management`, label: 'SSB Manual - Medication Management' },
          { keywords: ['medical issue', 'student medical', 'poa'], url: `${MANUAL_BASE}/risk-management/handling-student-medical-issues/plan-of-action-poa`, label: 'SSB Manual - Plan of Action (POA)' },
          { keywords: ['safety', 'risk'], url: `${MANUAL_BASE}/risk-management`, label: 'SSB Manual - Risk Management' }
        ]
      },
      '11_parent_communication_protocols.md': {
        defaultUrl: `${MANUAL_BASE}/parent-management`,
        description: 'Parent Communication',
        topics: [
          { keywords: ['parent', 'family', 'communication', 'call'], url: `${MANUAL_BASE}/parent-management`, label: 'SSB Manual - Parent Management' },
          { keywords: ['communication protocol', 'messaging'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/communication-protocols`, label: 'SSB Manual - Communication Protocols' },
          { keywords: ['complaint', 'concern', 'upset'], url: `${MANUAL_BASE}/parent-management`, label: 'SSB Manual - Parent Management' }
        ]
      },
      '13_transportation_responsibilities.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures/airport-logistics`,
        description: 'Transportation',
        topics: [
          { keywords: ['airport', 'flight', 'pickup', 'dropoff'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures/airport-logistics`, label: 'SSB Manual - Airport Logistics' },
          { keywords: ['transport', 'bus', 'van', 'vehicle'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/check-in-procedures/airport-logistics`, label: 'SSB Manual - Airport Logistics' }
        ]
      },
      '00_POLICY_EXTRACTION_SUMMARY.md': {
        defaultUrl: `${MANUAL_BASE}/ssb-policies`,
        description: 'Policy Summary',
        topics: [
          { keywords: ['policy', 'policies'], url: `${MANUAL_BASE}/ssb-policies`, label: 'SSB Manual - Policies' }
        ]
      },
      'SUMMER_SPRINGBOARD_MASTER_README.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program`,
        description: 'SSB Complete Manual',
        topics: [
          { keywords: ['incident report', 'reporting', 'documentation'], url: `${MANUAL_BASE}/risk-management/incident-reporting`, label: 'SSB Manual - Incident Reporting' },
          { keywords: ['policy', 'code of conduct', 'staff conduct'], url: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`, label: 'SSB Manual - Code of Conduct' },
          { keywords: ['role', 'cd', 'am', 'spa', 'pd', 'campus director'], url: `${MANUAL_BASE}/summer-on-campus-team`, label: 'SSB Manual - Staff Roles' },
          { keywords: ['mental health', 'parent communication'], url: `${MANUAL_BASE}/risk-management/mental-health-spotlight-protocol`, label: 'SSB Manual - Mental Health Protocol' },
          { keywords: ['risk management', 'safety'], url: `${MANUAL_BASE}/risk-management`, label: 'SSB Manual - Risk Management' }
        ]
      },
      'DIRECTOR_TRAINING_EXTRACTION_SUMMARY.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program/pre-program-training`,
        description: 'Director Training',
        topics: [
          { keywords: ['training', 'director', 'pre-program'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/pre-program-training`, label: 'SSB Manual - Pre-Program Training' }
        ]
      },
      'QUICK_REFERENCE.md': {
        defaultUrl: `${MANUAL_BASE}/cheat-sheetindex`,
        description: 'Quick Reference',
        topics: [
          { keywords: ['quick reference', 'cheat sheet', 'index'], url: `${MANUAL_BASE}/cheat-sheetindex`, label: 'SSB Manual - Cheat Sheet / Index' }
        ]
      },
      // Medical Scenarios
      'scenarios/medical/anaphylaxis.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`,
        description: 'Anaphylaxis Protocol',
        topics: [
          { keywords: ['anaphylaxis', 'allergic', 'epipen', 'epinephrine'], url: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`, label: 'SSB Manual - Handling Medical Issues' }
        ]
      },
      'scenarios/medical/diabetes-emergency.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`,
        description: 'Diabetes Emergency',
        topics: [
          { keywords: ['diabetes', 'glucose', 'insulin', 'hypoglycemia'], url: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`, label: 'SSB Manual - Handling Medical Issues' }
        ]
      },
      'scenarios/medical/seizure.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`,
        description: 'Seizure Protocol',
        topics: [
          { keywords: ['seizure', 'epilepsy', 'convulsion'], url: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`, label: 'SSB Manual - Handling Medical Issues' }
        ]
      },
      'scenarios/medical/asthma-attack.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`,
        description: 'Asthma Emergency',
        topics: [
          { keywords: ['asthma', 'inhaler', 'breathing', 'wheezing'], url: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`, label: 'SSB Manual - Handling Medical Issues' }
        ]
      },
      'scenarios/medical/concussion.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/field-operations-physical-health-protocols`,
        description: 'Concussion Protocol',
        topics: [
          { keywords: ['concussion', 'head injury', 'traumatic brain'], url: `${MANUAL_BASE}/risk-management/field-operations-physical-health-protocols`, label: 'SSB Manual - Physical Health Protocols' }
        ]
      },
      'scenarios/medical/heat-illness.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/field-operations-physical-health-protocols`,
        description: 'Heat Illness',
        topics: [
          { keywords: ['heat', 'heatstroke', 'heat exhaustion', 'dehydration'], url: `${MANUAL_BASE}/risk-management/field-operations-physical-health-protocols`, label: 'SSB Manual - Physical Health Protocols' }
        ]
      },
      'scenarios/medical/cuts-and-bleeding.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/first-aid-kits`,
        description: 'First Aid - Bleeding',
        topics: [
          { keywords: ['cut', 'bleeding', 'wound', 'laceration'], url: `${MANUAL_BASE}/risk-management/first-aid-kits`, label: 'SSB Manual - First Aid' }
        ]
      },
      'scenarios/medical/broken-bones-sprains.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`,
        description: 'First Aid - Fractures',
        topics: [
          { keywords: ['fracture', 'broken bone', 'sprain', 'rice'], url: `${MANUAL_BASE}/risk-management/handling-student-medical-issues`, label: 'SSB Manual - Handling Medical Issues' }
        ]
      },
      'scenarios/medical/minor-emergencies.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/first-aid-kits`,
        description: 'Minor Medical Issues',
        topics: [
          { keywords: ['nosebleed', 'blister', 'headache', 'minor'], url: `${MANUAL_BASE}/risk-management/first-aid-kits`, label: 'SSB Manual - First Aid' }
        ]
      },
      // Behavioral Scenarios
      'scenarios/behavioral/physical-fighting.md': {
        defaultUrl: `${MANUAL_BASE}/ssb-policies/student-discipline`,
        description: 'Fighting & Violence',
        topics: [
          { keywords: ['fight', 'fighting', 'physical', 'violence'], url: `${MANUAL_BASE}/ssb-policies/student-discipline`, label: 'SSB Manual - Student Discipline' }
        ]
      },
      'scenarios/behavioral/bullying-harassment.md': {
        defaultUrl: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`,
        description: 'Bullying & Harassment',
        topics: [
          { keywords: ['bullying', 'harassment', 'cyberbullying'], url: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`, label: 'SSB Manual - Enforcing Code of Conduct' }
        ]
      },
      'scenarios/behavioral/substance-violations.md': {
        defaultUrl: `${MANUAL_BASE}/ssb-policies/student-discipline`,
        description: 'Substance Violations',
        topics: [
          { keywords: ['alcohol', 'vape', 'drug', 'substance'], url: `${MANUAL_BASE}/ssb-policies/student-discipline`, label: 'SSB Manual - Student Discipline' }
        ]
      },
      'scenarios/behavioral/sexual-harassment.md': {
        defaultUrl: `${MANUAL_BASE}/ssb-policies/sexual-abuse-prevention-policy`,
        description: 'Sexual Harassment',
        topics: [
          { keywords: ['sexual', 'title ix', 'consent'], url: `${MANUAL_BASE}/ssb-policies/sexual-abuse-prevention-policy`, label: 'SSB Manual - Sexual Abuse Prevention' }
        ]
      },
      'scenarios/behavioral/curfew-room-violations.md': {
        defaultUrl: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`,
        description: 'Curfew & Room Violations',
        topics: [
          { keywords: ['curfew', 'room violation', 'bed check'], url: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`, label: 'SSB Manual - Enforcing Code of Conduct' }
        ]
      },
      'scenarios/behavioral/technology-violations.md': {
        defaultUrl: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`,
        description: 'Technology Violations',
        topics: [
          { keywords: ['phone', 'recording', 'technology', 'device'], url: `${MANUAL_BASE}/ssb-policies/enforcing-the-code-of-conduct-managing-student-behavior`, label: 'SSB Manual - Enforcing Code of Conduct' }
        ]
      },
      // Mental Health Scenarios
      'scenarios/mental_health/suicidal_ideation.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/mental-health-spotlight-protocol`,
        description: 'Suicidal Ideation',
        topics: [
          { keywords: ['suicide', 'suicidal', 'self-harm', 'crisis'], url: `${MANUAL_BASE}/risk-management/mental-health-spotlight-protocol`, label: 'SSB Manual - Mental Health Protocol' },
          { keywords: ['debrief', 'critical incident'], url: `${MANUAL_BASE}/risk-management/special-topics-in-adolescent-mental-health/debriefing-critical-incidents`, label: 'SSB Manual - Debriefing Critical Incidents' }
        ]
      },
      'scenarios/mental_health/panic_attack.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/field-operations-mental-health-response-protocols`,
        description: 'Panic Attacks',
        topics: [
          { keywords: ['panic', 'anxiety', 'attack'], url: `${MANUAL_BASE}/risk-management/field-operations-mental-health-response-protocols`, label: 'SSB Manual - Mental Health Response' }
        ]
      },
      'scenarios/mental_health/homesickness.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/field-operations-mental-health-response-protocols`,
        description: 'Homesickness',
        topics: [
          { keywords: ['homesick', 'homesickness', 'wants to leave'], url: `${MANUAL_BASE}/risk-management/field-operations-mental-health-response-protocols`, label: 'SSB Manual - Mental Health Response' }
        ]
      },
      // Parent Issues
      'scenarios/parent_issues/angry_parent_demanding_answers.md': {
        defaultUrl: `${MANUAL_BASE}/parent-management`,
        description: 'Difficult Parent Calls',
        topics: [
          { keywords: ['angry parent', 'upset parent', 'demanding'], url: `${MANUAL_BASE}/parent-management`, label: 'SSB Manual - Parent Management' }
        ]
      },
      'scenarios/parent_issues/parent_threatens_legal_action.md': {
        defaultUrl: `${MANUAL_BASE}/parent-management`,
        description: 'Legal Threats',
        topics: [
          { keywords: ['legal', 'lawsuit', 'attorney', 'lawyer'], url: `${MANUAL_BASE}/parent-management`, label: 'SSB Manual - Parent Management' }
        ]
      },
      'scenarios/parent_issues/student_wants_to_leave_homesick.md': {
        defaultUrl: `${MANUAL_BASE}/parent-management`,
        description: 'Student Withdrawal',
        topics: [
          { keywords: ['wants to leave', 'go home', 'withdrawal'], url: `${MANUAL_BASE}/parent-management`, label: 'SSB Manual - Parent Management' }
        ]
      },
      'scenarios/parent_issues/parent_reports_staff_misconduct.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/incident-reporting/staff-conduct-incident-report`,
        description: 'Staff Misconduct Reports',
        topics: [
          { keywords: ['misconduct', 'staff complaint', 'inappropriate'], url: `${MANUAL_BASE}/risk-management/incident-reporting/staff-conduct-incident-report`, label: 'SSB Manual - Staff Conduct Reports' }
        ]
      },
      'scenarios/parent_issues/parent_child_doesnt_feel_safe.md': {
        defaultUrl: `${MANUAL_BASE}/parent-management`,
        description: 'Safety Concerns',
        topics: [
          { keywords: ['doesnt feel safe', 'safety concern', 'threatened'], url: `${MANUAL_BASE}/parent-management`, label: 'SSB Manual - Parent Management' }
        ]
      },
      'scenarios/parent_issues/parent_questions_discipline.md': {
        defaultUrl: `${MANUAL_BASE}/parent-management`,
        description: 'Discipline Questions',
        topics: [
          { keywords: ['discipline', 'punishment', 'unfair'], url: `${MANUAL_BASE}/ssb-policies/student-discipline`, label: 'SSB Manual - Student Discipline' }
        ]
      },
      'scenarios/parent_issues/parent_demands_refund.md': {
        defaultUrl: `${MANUAL_BASE}/parent-management`,
        description: 'Refund Requests',
        topics: [
          { keywords: ['refund', 'money back', 'tuition'], url: `${MANUAL_BASE}/parent-management`, label: 'SSB Manual - Parent Management' }
        ]
      },
      // Training Resources
      'training/mentorship_best_practices.md': {
        defaultUrl: `${MANUAL_BASE}/summer-on-campus-team/resident-mentor-alumni-mentor`,
        description: 'Mentorship Best Practices',
        topics: [
          { keywords: ['mentorship', 'mentor', 'best practices'], url: `${MANUAL_BASE}/summer-on-campus-team/resident-mentor-alumni-mentor`, label: 'SSB Manual - Mentor Role' }
        ]
      },
      'training/deescalation_techniques.md': {
        defaultUrl: `${MANUAL_BASE}/conflict-management`,
        description: 'De-escalation Techniques',
        topics: [
          { keywords: ['deescalation', 'calm down', 'conflict'], url: `${MANUAL_BASE}/conflict-management`, label: 'SSB Manual - Conflict Management' }
        ]
      },
      'training/difficult_conversations.md': {
        defaultUrl: `${MANUAL_BASE}/conflict-management`,
        description: 'Difficult Conversations',
        topics: [
          { keywords: ['difficult conversation', 'warning', 'dismissal'], url: `${MANUAL_BASE}/conflict-management`, label: 'SSB Manual - Conflict Management' }
        ]
      },
      'training/student_engagement.md': {
        defaultUrl: `${MANUAL_BASE}/how-to-run-a-summer-program/program-activities`,
        description: 'Student Engagement',
        topics: [
          { keywords: ['engagement', 'activities'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/program-activities`, label: 'SSB Manual - Program Activities' },
          { keywords: ['true you'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/program-activities/true-you`, label: 'SSB Manual - True You' },
          { keywords: ['ice breaker', 'icebreaker'], url: `${MANUAL_BASE}/how-to-run-a-summer-program/program-activities/ice-breakers`, label: 'SSB Manual - Ice Breakers' }
        ]
      },
      'training/professional_boundaries.md': {
        defaultUrl: `${MANUAL_BASE}/staff-onboarding`,
        description: 'Professional Boundaries',
        topics: [
          { keywords: ['boundaries', 'professional', 'ethics'], url: `${MANUAL_BASE}/staff-onboarding`, label: 'SSB Manual - Staff Onboarding' },
          { keywords: ['sexual abuse', 'prevention'], url: `${MANUAL_BASE}/ssb-policies/sexual-abuse-prevention-policy`, label: 'SSB Manual - Abuse Prevention Policy' }
        ]
      },
      'training/staff_wellness.md': {
        defaultUrl: `${MANUAL_BASE}/risk-management/special-topics-in-adolescent-mental-health/emotional-self-care-advice-for-ssb-staff`,
        description: 'Staff Wellness',
        topics: [
          { keywords: ['wellness', 'burnout', 'self-care'], url: `${MANUAL_BASE}/risk-management/special-topics-in-adolescent-mental-health/emotional-self-care-advice-for-ssb-staff`, label: 'SSB Manual - Staff Self-Care' }
        ]
      }
    };
  } catch (error) {
    console.error('Could not load source mapping:', error);
  }
}

// Enhanced search with semantic relevance and source URLs
export function searchKnowledgeBase(query) {
  const keywords = extractKeywords(query);

  if (keywords.length === 0) {
    return [];
  }

  const matches = new Map();

  // Also try to match full query phrases (2-4 word combinations)
  const queryLower = query.toLowerCase();
  const phrases = [];
  const words = queryLower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);

  // Generate 2-word and 3-word phrases from query
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  // First, try exact phrase matches (highest priority)
  phrases.forEach(phrase => {
    if (invertedIndex[phrase]) {
      invertedIndex[phrase].forEach(match => {
        const key = `${match.fileName}:${match.sectionIdx}`;
        if (!matches.has(key)) {
          matches.set(key, { ...match, score: 0 });
        }
        // Phrase matches in tags get huge bonus (20 points), in content get 10 points
        const matchWeight = match.isTag ? 20 : 10;
        matches.get(key).score += matchWeight;
      });
    }
  });

  // Find all matching sections using inverted index
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();

    // Exact match
    if (invertedIndex[keywordLower]) {
      invertedIndex[keywordLower].forEach(match => {
        const key = `${match.fileName}:${match.sectionIdx}`;
        if (!matches.has(key)) {
          matches.set(key, { ...match, score: 0 });
        }
        // Tag matches get 5x bonus, regular exact matches get 3 points
        const matchWeight = match.isTag ? 15 : 3;
        matches.get(key).score += matchWeight;
      });
    }

    // Partial match
    Object.keys(invertedIndex).forEach(indexedTerm => {
      if (indexedTerm.includes(keywordLower) || keywordLower.includes(indexedTerm)) {
        invertedIndex[indexedTerm].forEach(match => {
          const key = `${match.fileName}:${match.sectionIdx}`;
          if (!matches.has(key)) {
            matches.set(key, { ...match, score: 0 });
          }
          // Tag partial matches get 3x bonus, regular partial matches get 1 point
          const matchWeight = match.isTag ? 3 : 1;
          matches.get(key).score += matchWeight;
        });
      }
    });
  });

  // Convert to results with full content
  const results = Array.from(matches.values())
    .map(match => {
      const fileData = kbCache[match.fileName];
      const section = fileData.sections[match.sectionIdx];

      // Get source URL with label
      const source = getSourceUrl(match.fileName, section.header, query);

      return {
        file: match.fileName,
        header: match.header,
        score: match.score,
        content: section.content.substring(0, 1500), // Increased to 1500 chars for more context
        sourceUrl: source.url,
        sourceLabel: source.label
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 results for more comprehensive context

  return results;
}

// Get specific source URL for a topic - returns {url, label}
function getSourceUrl(fileName, header, query) {
  const mapping = sourceMapping[fileName];
  if (!mapping) {
    return {
      url: `${PORTAL_BASE}/important-resources`,
      label: 'Staff Portal - Important Resources'
    };
  }

  const queryLower = query.toLowerCase();
  const headerLower = header.toLowerCase();
  const searchText = `${queryLower} ${headerLower}`;

  // Try to find best matching topic by keyword relevance
  let bestMatch = null;
  let bestScore = 0;

  if (mapping.topics) {
    for (const topic of mapping.topics) {
      let score = 0;
      for (const keyword of topic.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          score += keyword.length; // Longer keyword matches score higher
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = topic;
      }
    }
  }

  // If we found a good match, return it
  if (bestMatch) {
    return {
      url: bestMatch.url,
      label: bestMatch.label
    };
  }

  // Otherwise use default
  return {
    url: mapping.defaultUrl,
    label: mapping.description || 'SSB Staff Resources'
  };
}

// Extract keywords with better preprocessing
function extractKeywords(query) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'what', 'when', 'where', 'who', 'how', 'why',
    'me', 'you', 'i'
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Get specific file content
export function getFileContent(filename) {
  return kbCache[filename]?.fullContent || null;
}

// Get all available files
export function getAvailableFiles() {
  return Object.keys(kbCache);
}
