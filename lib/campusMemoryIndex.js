const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'what', 'when', 'where', 'who', 'how', 'why',
  'me', 'you', 'i', 'my', 'your', 'give', 'get', 'all', 'each', 'them', 'their',
  'this', 'that', 'these', 'those', 'there', 'here', 'not', 'its', 'our',
]);

const SUFFIXES = ['s', 'es', 'ed', 'ing', 'er', 'tion', 'ment', 'ness', 'ly'];

let chunks = [];
let index = {};

const KEEP_SHORT = new Set([
  'cd', 'am', 'pd', 'spa', 'ra', 'ta', 'pm',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => {
      if (KEEP_SHORT.has(w)) return true;
      return w.length > 2 && !STOP_WORDS.has(w);
    });
}

function chunkContent(title, content, memoryId) {
  const lines = content.split('\n');
  const result = [];
  let current = [];
  let currentHeader = title;

  for (const line of lines) {
    const headerMatch = line.match(/^(?:#{1,3}\s+|===\s*)(.*?)(?:\s*===)?$/);
    if (headerMatch && current.length > 0) {
      result.push({
        memoryId,
        title,
        header: currentHeader,
        content: current.join('\n').trim(),
      });
      current = [];
      currentHeader = headerMatch[1].trim() || title;
    }

    current.push(line);

    if (current.length >= 40) {
      result.push({
        memoryId,
        title,
        header: currentHeader,
        content: current.join('\n').trim(),
      });
      current = [];
    }
  }

  if (current.length > 0) {
    result.push({
      memoryId,
      title,
      header: currentHeader,
      content: current.join('\n').trim(),
    });
  }

  return result;
}

function buildIndex(chunkList) {
  const idx = {};

  chunkList.forEach((chunk, chunkIdx) => {
    const text = `${chunk.title} ${chunk.header} ${chunk.content}`;
    const words = tokenize(text);
    const seen = new Set();

    for (const word of words) {
      if (!seen.has(word)) {
        seen.add(word);
        if (!idx[word]) idx[word] = [];
        idx[word].push(chunkIdx);
      }
    }

    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!seen.has(bigram)) {
        seen.add(bigram);
        if (!idx[bigram]) idx[bigram] = [];
        idx[bigram].push(chunkIdx);
      }
    }
  });

  return idx;
}

export function rebuildCampusMemoryIndex(memories) {
  chunks = [];
  for (const m of memories) {
    const memChunks = chunkContent(m.title, m.content, m.id);
    chunks.push(...memChunks);
  }
  index = buildIndex(chunks);
}

export function searchCampusMemory(query, maxResults = 5, maxChars = 6000) {
  if (!chunks.length) return '';

  const keywords = tokenize(query);
  if (!keywords.length) {
    let context = '\n\n**CAMPUS-SPECIFIC INFORMATION:**\n';
    let total = context.length;
    for (const chunk of chunks.slice(0, 3)) {
      const entry = `\n--- ${chunk.title}: ${chunk.header} ---\n${chunk.content.slice(0, 500)}\n`;
      if (total + entry.length > maxChars) break;
      context += entry;
      total += entry.length;
    }
    return context;
  }

  const scores = new Map();

  for (const kw of keywords) {
    if (index[kw]) {
      for (const ci of index[kw]) {
        scores.set(ci, (scores.get(ci) || 0) + 3);
      }
    }

    if (kw.length >= 4) {
      for (const suf of SUFFIXES) {
        if (kw.endsWith(suf) && kw.length > suf.length + 2) {
          const stem = kw.slice(0, -suf.length);
          if (index[stem]) {
            for (const ci of index[stem]) {
              scores.set(ci, (scores.get(ci) || 0) + 2);
            }
          }
        }
        const variant = kw + suf;
        if (index[variant]) {
          for (const ci of index[variant]) {
            scores.set(ci, (scores.get(ci) || 0) + 2);
          }
        }
      }
    }
  }

  for (let i = 0; i < keywords.length - 1; i++) {
    const bigram = `${keywords[i]} ${keywords[i + 1]}`;
    if (index[bigram]) {
      for (const ci of index[bigram]) {
        scores.set(ci, (scores.get(ci) || 0) + 10);
      }
    }
  }

  const ranked = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxResults);

  if (!ranked.length) {
    let context = '\n\n**CAMPUS-SPECIFIC INFORMATION:**\n';
    let total = context.length;
    for (const chunk of chunks.slice(0, 2)) {
      const entry = `\n--- ${chunk.title} ---\n${chunk.content.slice(0, 300)}\n`;
      if (total + entry.length > maxChars) break;
      context += entry;
      total += entry.length;
    }
    return context;
  }

  let context = '\n\n**CAMPUS-SPECIFIC INFORMATION:**\n';
  let total = context.length;

  for (const [ci] of ranked) {
    const chunk = chunks[ci];
    const entry = `\n--- ${chunk.title}: ${chunk.header} ---\n${chunk.content}\n`;
    if (total + entry.length > maxChars) {
      const remaining = maxChars - total - 50;
      if (remaining > 200) {
        context += `\n--- ${chunk.title}: ${chunk.header} ---\n${chunk.content.slice(0, remaining)}\n[...truncated]\n`;
      }
      break;
    }
    context += entry;
    total += entry.length;
  }

  return context;
}

export function getCampusMemoryChunkCount() {
  return chunks.length;
}

export function getCampusMemoryIndexSize() {
  return Object.keys(index).length;
}
