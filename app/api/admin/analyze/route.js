import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAdminQueries, getAdminUsers, getAdminTopics } from '@/lib/database';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get('session') || null;

    const [queriesResult, users, topics] = await Promise.all([
      getAdminQueries({ page: 1, pageSize: 200, sessionFilter: session }),
      getAdminUsers(session),
      getAdminTopics(session),
    ]);

    const queries = queriesResult.data || [];
    const totalQueries = queries.length;
    const topCategories = (topics || []).slice(0, 3).map(t => ({ name: t.topic, count: t.count }));

    if (totalQueries === 0) {
      return NextResponse.json({
        totalQueries: 0,
        topCategories: [],
        overview: 'No queries to analyze yet. Once staff start using the chatbot, insights will appear here.',
        staffInsights: [],
      });
    }

    const userMap = {};
    for (const u of users) {
      userMap[u.id] = { name: u.name || u.email, role: u.role || 'Unknown', queryCount: u.queryCount || 0 };
    }

    const querySummary = queries.map(q => {
      const u = userMap[q.user_id] || { name: 'Anonymous', role: 'Unknown' };
      return `[${u.role}] ${u.name}: "${q.message}"`;
    }).join('\n');

    const staffList = users
      .filter(u => u.queryCount > 0)
      .map(u => `${u.name || u.email} (${u.role || 'Unknown'}) - ${u.queryCount} queries`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are analyzing chatbot usage data for Summer Springboard, a summer program at UC Berkeley. Staff use this chatbot to get help with policies, emergencies, schedules, and student issues.

Recent queries from staff:
${querySummary}

Staff with queries:
${staffList}

Respond in exactly this JSON format (no markdown, no code fences, just raw JSON):
{
  "overview": "2-3 sentences about the most common areas of confusion across all staff. Be specific about what topics come up repeatedly and what that signals about training gaps.",
  "staffInsights": [
    {
      "name": "Person Name",
      "role": "Their Role",
      "insight": "1-2 sentences about what this person specifically needs help with, written with awareness of their role. For example, if a CD is asking basic questions, that's different from a new Mentor asking the same thing."
    }
  ]
}

Include an entry in staffInsights for every person who has sent queries. Be direct, specific, and human. No corporate speak.`
      }]
    });

    const text = response.content.find(c => c.type === 'text')?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { overview: text, staffInsights: [] };
    }

    return NextResponse.json({
      totalQueries,
      topCategories,
      overview: parsed.overview || '',
      staffInsights: parsed.staffInsights || [],
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
  }
}
