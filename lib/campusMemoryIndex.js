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
let records = [];
let recordIndex = {};

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
  const sections = [];
  let current = [];
  let currentHeader = title;

  for (const line of lines) {
    const sectionMatch = line.match(/^===\s*(.*?)\s*===\s*$/) || line.match(/^\[(.*?)\]\s*$/);
    const headerMatch = !sectionMatch && line.match(/^#{1,3}\s+(.+)$/);

    if ((sectionMatch || headerMatch) && current.length > 0) {
      sections.push({
        memoryId,
        title,
        header: currentHeader,
        content: current.join('\n').trim(),
      });
      current = [];
      currentHeader = (sectionMatch ? sectionMatch[1] : headerMatch[1]).trim() || title;
    }

    current.push(line);
  }

  if (current.length > 0) {
    sections.push({
      memoryId,
      title,
      header: currentHeader,
      content: current.join('\n').trim(),
    });
  }

  const MAX_CHUNK_CHARS = 3000;
  const result = [];
  for (const section of sections) {
    if (section.content.length <= MAX_CHUNK_CHARS) {
      result.push(section);
      continue;
    }
    const sLines = section.content.split('\n');
    let buf = [];
    let bufLen = 0;
    for (const sl of sLines) {
      if (bufLen + sl.length > MAX_CHUNK_CHARS && buf.length > 0) {
        result.push({
          memoryId: section.memoryId,
          title: section.title,
          header: section.header,
          content: buf.join('\n').trim(),
        });
        buf = [];
        bufLen = 0;
      }
      buf.push(sl);
      bufLen += sl.length + 1;
    }
    if (buf.length > 0) {
      result.push({
        memoryId: section.memoryId,
        title: section.title,
        header: section.header,
        content: buf.join('\n').trim(),
      });
    }
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

function extractRecords(content, memoryId) {
  const extracted = [];
  const lines = content.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const sectionMatch = line.match(/^\[(.*?)\]/) || line.match(/^===\s*(.*?)\s*===/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    // Pattern: "Name: X | Field: Y | Field: Z" (roster rows)
    const pipeFields = line.split('|').map(s => s.trim()).filter(Boolean);
    if (pipeFields.length >= 2) {
      const fieldMap = {};
      let allKeyed = true;
      for (const f of pipeFields) {
        const kv = f.match(/^([^:]+):\s*(.+)$/);
        if (kv) {
          fieldMap[kv[1].trim().toLowerCase()] = kv[2].trim();
        } else {
          allKeyed = false;
        }
      }

      if (allKeyed && fieldMap.name) {
        extracted.push({
          type: 'person',
          name: fieldMap.name,
          nameLower: fieldMap.name.toLowerCase(),
          fields: fieldMap,
          section: currentSection,
          memoryId,
          raw: line.trim(),
        });
        continue;
      }
    }

    // Extract ALL group definitions from this line
    const groupPattern = /Mentor GROUP\s+(\d+)\s+(.+?)\s*-\s*(\d+)(?:\s*\(S\d+\))?\s*-\s*(\w[\w\s]*?)(?=\s*[:|]|$)/g;
    let gm;
    while ((gm = groupPattern.exec(line)) !== null) {
      const gNum = parseInt(gm[1]);
      const existingGroup = extracted.find(
        r => r.type === 'group' && r.groupNumber === gNum
      );
      if (!existingGroup) {
        extracted.push({
          type: 'group',
          groupNumber: gNum,
          mentor: gm[2].trim(),
          mentorLower: gm[2].trim().toLowerCase(),
          count: parseInt(gm[3]),
          animal: gm[4].trim(),
          animalLower: gm[4].trim().toLowerCase(),
          members: [],
          section: currentSection,
          memoryId,
        });
      }
    }
  }

  // Build group membership from the side-by-side spreadsheet layout.
  // Format: each row has "GroupHeader: Value | GroupHeader: Value"
  // "Value" is either a student name, "First Name" (header row), or a new group definition.
  // When the value is a new group definition (contains "Mentor GROUP N ..."),
  // that group becomes the active group for subsequent rows in that column.
  const groups = extracted.filter(r => r.type === 'group');
  if (groups.length > 0) {
    let activeLeft = null;
    let activeRight = null;

    for (const line of lines) {
      if (!line.includes('Mentor GROUP')) continue;

      const parts = line.split('|').map(s => s.trim()).filter(Boolean);

      for (let col = 0; col < parts.length; col++) {
        const part = parts[col];
        // Extract the value after the colon (the "header: value" format)
        const colonMatch = part.match(/:\s*(.+)$/);
        if (!colonMatch) continue;
        const value = colonMatch[1].trim();

        // Is this value a group definition (divider row)?
        const groupDef = value.match(/Mentor GROUP\s+(\d+)\s+/);
        if (groupDef) {
          const gNum = parseInt(groupDef[1]);
          const group = groups.find(g => g.groupNumber === gNum);
          if (group) {
            if (col === 0) activeLeft = group;
            else activeRight = group;
          }
          continue;
        }

        // Is this the initial group header row (defines the first active group)?
        const headerGroupDef = part.match(/^Mentor GROUP\s+(\d+)\s+/);
        if (headerGroupDef && (value === 'First Name' || /^[A-Z][a-z]/.test(value))) {
          const gNum = parseInt(headerGroupDef[1]);
          const group = groups.find(g => g.groupNumber === gNum);
          if (group) {
            if (col === 0) activeLeft = activeLeft || group;
            else activeRight = activeRight || group;
          }
        }

        // Skip non-student values
        if (value === 'First Name') continue;
        if (value.startsWith('Mentor GROUP')) continue;
        if (!/^[A-Z]/.test(value)) continue;

        const active = col === 0 ? activeLeft : activeRight;
        if (active && !active.members.includes(value)) {
          active.members.push(value);
        }
      }
    }
  }

  return extracted;
}

function buildRecordIndex(recs) {
  const idx = {};
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.type === 'person') {
      const nameParts = r.nameLower.split(/\s+/);
      for (const part of nameParts) {
        if (!idx[part]) idx[part] = [];
        idx[part].push(i);
      }
      for (const [key, val] of Object.entries(r.fields)) {
        const valLower = val.toLowerCase();
        const words = valLower.split(/\s+/).filter(w => w.length > 2);
        for (const w of words) {
          if (!idx[w]) idx[w] = [];
          idx[w].push(i);
        }
      }
    } else if (r.type === 'group') {
      const mentorParts = r.mentorLower.split(/\s+/);
      for (const part of mentorParts) {
        if (!idx[part]) idx[part] = [];
        idx[part].push(i);
      }
      if (!idx[r.animalLower]) idx[r.animalLower] = [];
      idx[r.animalLower].push(i);
      // Index by multiple group key patterns
      const num = String(r.groupNumber);
      for (const prefix of ['group', 'group_']) {
        const gKey = `${prefix}${num}`;
        if (!idx[gKey]) idx[gKey] = [];
        idx[gKey].push(i);
      }
      // Also index the bare number so "group 6" tokenized as ["group","6"] works
      if (!idx[num]) idx[num] = [];
      idx[num].push(i);
      for (const member of r.members) {
        const mLower = member.toLowerCase();
        if (!idx[mLower]) idx[mLower] = [];
        idx[mLower].push(i);
      }
    }
  }
  return idx;
}

function searchRecords(query) {
  if (!records.length) return null;

  const qLower = query.toLowerCase();
  const keywords = tokenize(query);
  if (!keywords.length) return null;

  const INTENT_PHONE = /phone|number|cell|contact|call|#/i.test(query);
  const INTENT_GROUP = /group|mentor\s*group|team|animal/i.test(query);
  const INTENT_COURSE = /course|class|major|subject|roster/i.test(query);
  const INTENT_STUDENT = /student|member|kid/i.test(query);
  const INTENT_ROLE = /role|floor|classroom|club|check.in/i.test(query);

  const INTENT_WHO = /who\s+is|whos|who's/i.test(query);
  const INTENT_POSSESSIVE = /(\w+)(?:'s|s')\s/i.test(query);

  const candidateScores = new Map();

  // Extract numbers and name targets from query
  const queryNumbers = qLower.match(/\d+/g) || [];
  const possessiveMatch = qLower.match(/(\w+)(?:'s|s')\s/);
  let targetName = possessiveMatch ? possessiveMatch[1] : null;

  // Also detect no-apostrophe possessives: "lylas phone" -> "lyla"
  if (!targetName) {
    for (const kw of keywords) {
      if (kw.endsWith('s') && kw.length >= 4) {
        const stem = kw.slice(0, -1);
        if (recordIndex[stem]) {
          targetName = stem;
          break;
        }
      }
    }
  }

  for (const kw of keywords) {
    if (recordIndex[kw]) {
      for (const ri of recordIndex[kw]) {
        candidateScores.set(ri, (candidateScores.get(ri) || 0) + 3);
      }
    }
    for (const suf of SUFFIXES) {
      if (kw.endsWith(suf) && kw.length > suf.length + 2) {
        const stem = kw.slice(0, -suf.length);
        if (recordIndex[stem]) {
          for (const ri of recordIndex[stem]) {
            candidateScores.set(ri, (candidateScores.get(ri) || 0) + 1);
          }
        }
      }
    }
  }

  // Boost group records when query contains group numbers
  if (INTENT_GROUP && queryNumbers.length > 0) {
    for (const num of queryNumbers) {
      if (recordIndex[num]) {
        for (const ri of recordIndex[num]) {
          if (records[ri].type === 'group') {
            candidateScores.set(ri, (candidateScores.get(ri) || 0) + 20);
          }
        }
      }
    }
  }

  // When query is about "mentor groups" in general, boost all group records
  if (INTENT_GROUP && !queryNumbers.length && !targetName) {
    for (let i = 0; i < records.length; i++) {
      if (records[i].type === 'group') {
        candidateScores.set(i, (candidateScores.get(i) || 0) + 5);
      }
    }
  }

  // Boost name-based queries (possessive)
  if (targetName && recordIndex[targetName]) {
    for (const ri of recordIndex[targetName]) {
      candidateScores.set(ri, (candidateScores.get(ri) || 0) + 10);
    }
  }

  if (!candidateScores.size) return null;

  const ranked = Array.from(candidateScores.entries())
    .sort((a, b) => b[1] - a[1]);

  const results = [];
  const seen = new Set();

  for (const [ri, score] of ranked.slice(0, 10)) {
    const r = records[ri];
    if (r.type === 'person') {
      const nameKey = `person:${r.nameLower}`;
      if (seen.has(nameKey)) continue;
      seen.add(nameKey);

      if (INTENT_PHONE) {
        const phone = r.fields['phone number'] || r.fields.phone || r.fields.cell;
        if (phone) {
          results.push({
            text: `${r.name}'s phone number: ${phone}`,
            score: score + 20,
            record: r,
          });
        }
      } else if (INTENT_COURSE) {
        results.push({
          text: `${r.name}: ${r.fields.course || 'N/A'} (${r.fields['program type'] || 'N/A'})`,
          score: score + 10,
          record: r,
        });
      } else {
        const summary = Object.entries(r.fields)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        results.push({
          text: summary,
          score: score + 5,
          record: r,
        });
      }
    } else if (r.type === 'group') {
      const groupKey = `group:${r.groupNumber}`;
      if (seen.has(groupKey)) continue;
      seen.add(groupKey);

      if (INTENT_STUDENT || INTENT_GROUP || targetName === r.mentorLower) {
        const memberList = r.members.length > 0 ? r.members.join(', ') : '(no members listed)';
        results.push({
          text: `Mentor Group ${r.groupNumber} (${r.mentor} - ${r.animal}): ${memberList}`,
          score: score + 10,
          record: r,
        });
      } else {
        results.push({
          text: `Mentor Group ${r.groupNumber}: ${r.mentor} - ${r.animal} (${r.count} students)`,
          score: score + 5,
          record: r,
        });
      }
    }
  }

  if (!results.length) return null;

  results.sort((a, b) => b.score - a.score);
  const maxRecordResults = INTENT_GROUP && !targetName ? 20 : 5;
  const topResults = results.slice(0, maxRecordResults);

  let context = '\n\n**CAMPUS-SPECIFIC INFORMATION (structured records):**\n';
  for (const r of topResults) {
    context += `- ${r.text}\n`;
  }

  return context;
}

export function rebuildCampusMemoryIndex(memories) {
  chunks = [];
  records = [];
  for (const m of memories) {
    const memChunks = chunkContent(m.title, m.content, m.id);
    chunks.push(...memChunks);
    const memRecords = extractRecords(m.content, m.id);
    records.push(...memRecords);
  }
  index = buildIndex(chunks);
  recordIndex = buildRecordIndex(records);
}

export function searchCampusMemory(query, maxResults = 5, maxChars = 10000) {
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

  // Try structured records first for precise answers
  const recordResult = searchRecords(query);

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
    .sort((a, b) => b[1] - a[1]);

  // If structured records found a strong match, prepend it to chunk results
  if (recordResult) {
    if (!ranked.length) return recordResult;

    const charsForChunks = maxChars - recordResult.length;
    let context = recordResult;

    if (charsForChunks > 500) {
      const includedChunks = new Set();
      const topScore = ranked[0][1];

      for (const [ci, score] of ranked.slice(0, 3)) {
        includedChunks.add(ci);
        if (score >= topScore * 0.5) {
          const chunk = chunks[ci];
          for (let i = 0; i < chunks.length; i++) {
            if (i !== ci && chunks[i].memoryId === chunk.memoryId && chunks[i].header === chunk.header) {
              includedChunks.add(i);
            }
          }
        }
      }

      const sorted = Array.from(includedChunks).sort((a, b) => a - b);
      let chunkContext = '\n\n**Additional context:**\n';
      let total = chunkContext.length;
      let lastHeader = '';

      for (const ci of sorted) {
        const chunk = chunks[ci];
        const headerLine = chunk.header !== lastHeader ? `\n--- ${chunk.header} ---\n` : '';
        lastHeader = chunk.header;
        const entry = headerLine + chunk.content + '\n';
        if (total + entry.length > charsForChunks) break;
        chunkContext += entry;
        total += entry.length;
      }

      if (total > chunkContext.length) {
        context += chunkContext;
      }
    }

    return context;
  }

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

  const includedChunks = new Set();
  const topScore = ranked[0][1];

  for (const [ci, score] of ranked.slice(0, maxResults)) {
    includedChunks.add(ci);
    if (score >= topScore * 0.5) {
      const chunk = chunks[ci];
      for (let i = 0; i < chunks.length; i++) {
        if (i !== ci && chunks[i].memoryId === chunk.memoryId && chunks[i].header === chunk.header) {
          includedChunks.add(i);
        }
      }
    }
  }

  const sorted = Array.from(includedChunks).sort((a, b) => a - b);

  let context = '\n\n**CAMPUS-SPECIFIC INFORMATION:**\n';
  let total = context.length;
  let lastHeader = '';

  for (const ci of sorted) {
    const chunk = chunks[ci];
    const headerLine = chunk.header !== lastHeader ? `\n--- ${chunk.title}: ${chunk.header} ---\n` : '';
    lastHeader = chunk.header;
    const entry = headerLine + chunk.content + '\n';
    if (total + entry.length > maxChars) {
      const remaining = maxChars - total - 30;
      if (remaining > 200) {
        context += headerLine + chunk.content.slice(0, remaining) + '\n[...truncated]\n';
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
