import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KB_PATH = path.join(__dirname, '../../knowledge_base');

// Enhanced cache with sections, metadata, and source URLs
let kbCache = {};
let invertedIndex = {};
let sourceMapping = {};

// Portal and Manual URLs
const PORTAL_BASE = 'https://sites.google.com/summerspringboard.com/berkeley-b-summer-staff-portal';
const MANUAL_BASE = 'https://sites.google.com/terraeducation.com/ssbmanual2025/how-to-run-a-summer-program';

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
        defaultUrl: `${PORTAL_BASE}/important-resources`,
        description: 'Emergency Procedures & Safety',
        topics: [
          { keywords: ['emergency contact', 'phone number', 'ucpd', '9-1-1', 'helpline'], url: `${PORTAL_BASE}/important-resources`, label: 'Emergency Contacts' },
          { keywords: ['earthquake', 'drop', 'cover', 'hold'], url: `${PORTAL_BASE}/important-resources`, label: 'Earthquake Procedures' },
          { keywords: ['active shooter', 'run', 'hide', 'fight'], url: `${PORTAL_BASE}/important-resources`, label: 'Active Shooter Protocol' },
          { keywords: ['fire', 'evacuation', 'assembly'], url: `${PORTAL_BASE}/important-resources`, label: 'Fire & Evacuation' },
          { keywords: ['warnme', 'alert', 'notification'], url: `${PORTAL_BASE}/important-resources`, label: 'Campus Safety Systems' },
          { keywords: ['mandated reporting', 'abuse', 'neglect'], url: `${PORTAL_BASE}/cd-am-spa-resources`, label: 'Mandated Reporting (Leadership Access)' }
        ]
      },
      '02_student_arrival_procedures.md': {
        defaultUrl: `${PORTAL_BASE}/schedules-groups-lists`,
        description: 'Student Arrival & Check-In',
        topics: [
          { keywords: ['arrival', 'check-in', 'airport pickup', 'student arrival'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Arrival Day Schedule' },
          { keywords: ['orientation', 'welcome'], url: MANUAL_BASE, label: 'SSB Manual - Student Orientation' },
          { keywords: ['roommate', 'room condition'], url: `${PORTAL_BASE}/important-resources`, label: 'Forms & Documents' },
          { keywords: ['reach app', 'technology'], url: `${PORTAL_BASE}/important-resources`, label: 'Technology Resources' }
        ]
      },
      '03_first_aid_medical.md': {
        defaultUrl: `${PORTAL_BASE}/important-resources`,
        description: 'Healthcare & Medical Resources',
        topics: [
          { keywords: ['hospital', 'urgent care', 'alta bates', 'medical center'], url: `${PORTAL_BASE}/important-resources`, label: 'Healthcare Options' },
          { keywords: ['first aid', 'medical kit', 'supplies'], url: `${PORTAL_BASE}/important-resources`, label: 'Medical Supplies' },
          { keywords: ['incident report', 'medical treatment', 'injury'], url: MANUAL_BASE, label: 'SSB Manual - Incident Reporting' },
          { keywords: ['covid', 'quarantine', 'isolation'], url: MANUAL_BASE, label: 'SSB Manual - Health Protocols' },
          { keywords: ['mental health', 'anxiety', 'depression'], url: MANUAL_BASE, label: 'SSB Manual - Mental Health Support' }
        ]
      },
      '04_staff_schedules_policies.md': {
        defaultUrl: `${PORTAL_BASE}/schedules-groups-lists`,
        description: 'Staff Schedules & Policies',
        topics: [
          { keywords: ['staff schedule', 'duty schedule', 'mentor schedule'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Staff Schedules' },
          { keywords: ['time off', 'personal time', 'break'], url: `${PORTAL_BASE}/cd-am-spa-resources`, label: 'Staff Policies (CD/AM/SPA Resources)' },
          { keywords: ['on-call', 'evening duty', 'bed check'], url: MANUAL_BASE, label: 'SSB Manual - Daily Operations' },
          { keywords: ['incident report', 'documentation', 'behavioral'], url: MANUAL_BASE, label: 'SSB Manual - Incident Reporting' },
          { keywords: ['ratio', '10:1', 'supervision'], url: MANUAL_BASE, label: 'SSB Manual - Staffing Requirements' },
          { keywords: ['code of conduct', 'professional'], url: `${PORTAL_BASE}/cd-am-spa-resources`, label: 'Staff Code of Conduct (CD/AM/SPA Resources)' }
        ]
      },
      '05_instructors_courses.md': {
        defaultUrl: `${PORTAL_BASE}/course-specific-info`,
        description: 'Academic Courses & Instructors',
        topics: [
          { keywords: ['instructor', 'teacher', 'course'], url: `${PORTAL_BASE}/course-specific-info`, label: 'Instructor Directory & Course Info' },
          { keywords: ['classroom', 'building', 'location'], url: `${PORTAL_BASE}/course-specific-info`, label: 'Classroom Assignments' },
          { keywords: ['schedule', 'roster', 'academic'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Master Schedule & Rosters' }
        ]
      },
      '06_program_overview.md': {
        defaultUrl: `${PORTAL_BASE}/home`,
        description: 'Program Overview',
        topics: [
          { keywords: ['housing', 'dorm', 'residence hall', 'unit'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Housing Lists' },
          { keywords: ['dining', 'meal', 'food'], url: `${PORTAL_BASE}/important-resources`, label: 'Dining Services' },
          { keywords: ['excursion', 'trip', 'activity'], url: MANUAL_BASE, label: 'SSB Manual - Program Activities' },
          { keywords: ['student list', 'roster', 'group'], url: `${PORTAL_BASE}/schedules-groups-lists`, label: 'Student Lists' }
        ]
      },
      'SUMMER_SPRINGBOARD_MASTER_README.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Complete Manual',
        topics: [
          { keywords: ['incident report', 'reporting', 'documentation'], url: MANUAL_BASE, label: 'SSB Manual - Incident Reporting' },
          { keywords: ['policy', 'code of conduct', 'staff conduct'], url: MANUAL_BASE, label: 'SSB Manual - Policies' },
          { keywords: ['role', 'cd', 'am', 'spa', 'pd', 'campus director'], url: MANUAL_BASE, label: 'SSB Manual - Staff Roles' },
          { keywords: ['mental health', 'parent communication'], url: MANUAL_BASE, label: 'SSB Manual - Mental Health & Parent Communication' },
          { keywords: ['risk management', 'safety'], url: MANUAL_BASE, label: 'SSB Manual - Risk Management' }
        ]
      },
      // Medical Scenarios
      'scenarios/medical/anaphylaxis.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Medical Emergencies',
        topics: [
          { keywords: ['anaphylaxis', 'allergic', 'epipen', 'epinephrine'], url: MANUAL_BASE, label: 'SSB Manual - Anaphylaxis Protocol' }
        ]
      },
      'scenarios/medical/diabetes-emergency.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Medical Emergencies',
        topics: [
          { keywords: ['diabetes', 'glucose', 'insulin', 'hypoglycemia'], url: MANUAL_BASE, label: 'SSB Manual - Diabetes Emergency' }
        ]
      },
      'scenarios/medical/seizure.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Medical Emergencies',
        topics: [
          { keywords: ['seizure', 'epilepsy', 'convulsion'], url: MANUAL_BASE, label: 'SSB Manual - Seizure Protocol' }
        ]
      },
      'scenarios/medical/asthma-attack.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Medical Emergencies',
        topics: [
          { keywords: ['asthma', 'inhaler', 'breathing', 'wheezing'], url: MANUAL_BASE, label: 'SSB Manual - Asthma Emergency' }
        ]
      },
      'scenarios/medical/concussion.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Medical Emergencies',
        topics: [
          { keywords: ['concussion', 'head injury', 'traumatic brain'], url: MANUAL_BASE, label: 'SSB Manual - Concussion Protocol' }
        ]
      },
      'scenarios/medical/heat-illness.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Medical Emergencies',
        topics: [
          { keywords: ['heat', 'heatstroke', 'heat exhaustion', 'dehydration'], url: MANUAL_BASE, label: 'SSB Manual - Heat Illness' }
        ]
      },
      'scenarios/medical/cuts-and-bleeding.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - First Aid',
        topics: [
          { keywords: ['cut', 'bleeding', 'wound', 'laceration'], url: MANUAL_BASE, label: 'SSB Manual - Bleeding & Wounds' }
        ]
      },
      'scenarios/medical/broken-bones-sprains.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - First Aid',
        topics: [
          { keywords: ['fracture', 'broken bone', 'sprain', 'rice'], url: MANUAL_BASE, label: 'SSB Manual - Fractures & Sprains' }
        ]
      },
      'scenarios/medical/minor-emergencies.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - First Aid',
        topics: [
          { keywords: ['nosebleed', 'blister', 'headache', 'minor'], url: MANUAL_BASE, label: 'SSB Manual - Minor Medical Issues' }
        ]
      },
      // Behavioral Scenarios
      'scenarios/behavioral/physical-fighting.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Code of Conduct',
        topics: [
          { keywords: ['fight', 'fighting', 'physical', 'violence'], url: MANUAL_BASE, label: 'SSB Manual - Fighting & Violence' }
        ]
      },
      'scenarios/behavioral/bullying-harassment.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Code of Conduct',
        topics: [
          { keywords: ['bullying', 'harassment', 'cyberbullying'], url: MANUAL_BASE, label: 'SSB Manual - Bullying & Harassment' }
        ]
      },
      'scenarios/behavioral/substance-violations.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Code of Conduct',
        topics: [
          { keywords: ['alcohol', 'vape', 'drug', 'substance'], url: MANUAL_BASE, label: 'SSB Manual - Substance Violations' }
        ]
      },
      'scenarios/behavioral/sexual-harassment.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Code of Conduct',
        topics: [
          { keywords: ['sexual', 'title ix', 'consent'], url: MANUAL_BASE, label: 'SSB Manual - Sexual Harassment' }
        ]
      },
      'scenarios/behavioral/curfew-room-violations.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Code of Conduct',
        topics: [
          { keywords: ['curfew', 'room violation', 'bed check'], url: MANUAL_BASE, label: 'SSB Manual - Curfew & Room Violations' }
        ]
      },
      'scenarios/behavioral/technology-violations.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Code of Conduct',
        topics: [
          { keywords: ['phone', 'recording', 'technology', 'device'], url: MANUAL_BASE, label: 'SSB Manual - Technology Violations' }
        ]
      },
      // Mental Health Scenarios
      'scenarios/mental_health/suicidal_ideation.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Mental Health',
        topics: [
          { keywords: ['suicide', 'suicidal', 'self-harm', 'crisis'], url: MANUAL_BASE, label: 'SSB Manual - Suicidal Ideation' }
        ]
      },
      'scenarios/mental_health/panic_attack.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Mental Health',
        topics: [
          { keywords: ['panic', 'anxiety', 'attack'], url: MANUAL_BASE, label: 'SSB Manual - Panic Attacks' }
        ]
      },
      'scenarios/mental_health/homesickness.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Mental Health',
        topics: [
          { keywords: ['homesick', 'homesickness', 'wants to leave'], url: MANUAL_BASE, label: 'SSB Manual - Homesickness' }
        ]
      },
      // Parent Issues
      'scenarios/parent_issues/angry_parent_demanding_answers.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Parent Communication',
        topics: [
          { keywords: ['angry parent', 'upset parent', 'demanding'], url: MANUAL_BASE, label: 'SSB Manual - Difficult Parent Calls' }
        ]
      },
      'scenarios/parent_issues/parent_threatens_legal_action.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Parent Communication',
        topics: [
          { keywords: ['legal', 'lawsuit', 'attorney', 'lawyer'], url: MANUAL_BASE, label: 'SSB Manual - Legal Threats' }
        ]
      },
      'scenarios/parent_issues/student_wants_to_leave_homesick.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Parent Communication',
        topics: [
          { keywords: ['wants to leave', 'go home', 'withdrawal'], url: MANUAL_BASE, label: 'SSB Manual - Student Withdrawal' }
        ]
      },
      'scenarios/parent_issues/parent_reports_staff_misconduct.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Staff Management',
        topics: [
          { keywords: ['misconduct', 'staff complaint', 'inappropriate'], url: MANUAL_BASE, label: 'SSB Manual - Staff Misconduct' }
        ]
      },
      'scenarios/parent_issues/parent_child_doesnt_feel_safe.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Parent Communication',
        topics: [
          { keywords: ['doesnt feel safe', 'safety concern', 'threatened'], url: MANUAL_BASE, label: 'SSB Manual - Safety Concerns' }
        ]
      },
      'scenarios/parent_issues/parent_questions_discipline.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Parent Communication',
        topics: [
          { keywords: ['discipline', 'punishment', 'unfair'], url: MANUAL_BASE, label: 'SSB Manual - Discipline Questions' }
        ]
      },
      'scenarios/parent_issues/parent_demands_refund.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Parent Communication',
        topics: [
          { keywords: ['refund', 'money back', 'tuition'], url: MANUAL_BASE, label: 'SSB Manual - Refund Requests' }
        ]
      },
      // Training Resources
      'training/mentorship_best_practices.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Mentorship',
        topics: [
          { keywords: ['mentorship', 'mentor', 'best practices'], url: MANUAL_BASE, label: 'SSB Manual - Mentorship Best Practices' }
        ]
      },
      'training/deescalation_techniques.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - De-escalation',
        topics: [
          { keywords: ['deescalation', 'calm down', 'conflict'], url: MANUAL_BASE, label: 'SSB Manual - De-escalation Techniques' }
        ]
      },
      'training/difficult_conversations.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Communication',
        topics: [
          { keywords: ['difficult conversation', 'warning', 'dismissal'], url: MANUAL_BASE, label: 'SSB Manual - Difficult Conversations' }
        ]
      },
      'training/student_engagement.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Student Engagement',
        topics: [
          { keywords: ['engagement', 'activities', 'true you'], url: MANUAL_BASE, label: 'SSB Manual - Student Engagement' }
        ]
      },
      'training/professional_boundaries.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Professional Standards',
        topics: [
          { keywords: ['boundaries', 'professional', 'ethics'], url: MANUAL_BASE, label: 'SSB Manual - Professional Boundaries' }
        ]
      },
      'training/staff_wellness.md': {
        defaultUrl: MANUAL_BASE,
        description: 'SSB Manual - Staff Wellness',
        topics: [
          { keywords: ['wellness', 'burnout', 'self-care'], url: MANUAL_BASE, label: 'SSB Manual - Staff Wellness' }
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
