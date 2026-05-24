import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path from team B bot/backend/src/services/ to knowledge_base/
const KB_PATH = path.join(__dirname, '../../../../knowledge_base');

// Cache for knowledge base files
let kbCache = {};

// Load all knowledge base files into memory
export async function loadKnowledgeBase() {
  try {
    const files = await fs.readdir(KB_PATH);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = path.join(KB_PATH, file);
      const content = await fs.readFile(filePath, 'utf-8');
      kbCache[file] = content;
    }

    console.log(`📚 Loaded ${mdFiles.length} knowledge base files`);
    return true;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return false;
  }
}

// Extract keywords from query
function extractKeywords(query) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'what', 'when', 'where', 'who', 'how', 'why'
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Calculate relevance score
function calculateRelevance(content, keywords) {
  const lowerContent = content.toLowerCase();
  let score = 0;

  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = lowerContent.match(regex);
    if (matches) {
      // Weight by frequency and position
      score += matches.length;
      // Bonus if in first 500 chars (likely headers/important sections)
      if (lowerContent.substring(0, 500).includes(keyword)) {
        score += 2;
      }
    }
  });

  return score;
}

// Extract relevant sections from content
function extractRelevantSections(content, keywords, maxLength = 2000) {
  const sections = content.split(/\n#{1,3}\s/);
  const relevantSections = [];

  for (const section of sections) {
    const score = calculateRelevance(section, keywords);
    if (score > 0) {
      relevantSections.push({ section, score });
    }
  }

  // Sort by score and take top sections
  relevantSections.sort((a, b) => b.score - a.score);

  let combinedText = '';
  for (const { section } of relevantSections) {
    if (combinedText.length + section.length <= maxLength) {
      combinedText += section + '\n\n';
    } else {
      break;
    }
  }

  return combinedText.trim();
}

// Search knowledge base for relevant context (optimized)
export function searchKnowledgeBase(query) {
  const keywords = extractKeywords(query);

  // Early return if no keywords
  if (keywords.length === 0) {
    return [];
  }

  const results = [];

  // Search each file
  for (const [filename, content] of Object.entries(kbCache)) {
    const score = calculateRelevance(content, keywords);

    if (score > 0) {
      const relevantContent = extractRelevantSections(content, keywords);
      results.push({
        file: filename,
        score,
        content: relevantContent
      });
    }
  }

  // Sort by relevance and return top 3
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}

// Get specific file content
export function getFileContent(filename) {
  return kbCache[filename] || null;
}

// Get all available files
export function getAvailableFiles() {
  return Object.keys(kbCache);
}
