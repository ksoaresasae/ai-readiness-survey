import { createClient } from '@supabase/supabase-js'
import { sections, openEnded, demographics, SURVEY_VERSION } from '../../lib/surveyData'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SYSTEM_PROMPT = `You are an organizational development analyst. You are given AGGREGATE results from an internal "AI Readiness" survey of an association's staff — quantitative distributions for each question, plus all open-ended comments and demographic breakdowns. Produce a clear, honest, leadership-facing assessment of where the organization stands right now with AI.

Use this exact structure and these markdown headings:

**Overall Readiness**
[3-4 sentences: the big picture across familiarity, confidence, sentiment, and organizational support. Name the overall posture plainly.]

**Strengths**
- [bullet]
- [bullet]
- [bullet]

**Gaps & Risks**
- [bullet]
- [bullet]
- [bullet]

**What People Are Asking For**
[2-3 sentences synthesizing the open-ended comments and the "what would most increase your comfort" responses — what support staff actually want.]

**Recommended Priorities**
1. [concrete, actionable priority]
2. [concrete, actionable priority]
3. [concrete, actionable priority]

**Notable Segments**
[1-2 sentences on any meaningful differences by department or tenure if the data shows them; otherwise note that patterns are broadly consistent.]

Ground every claim in the data provided and cite specific figures (averages, percentages) where they strengthen a point. Be candid about weaknesses — do not flatter or minimize gaps. Base sentiment and any paraphrased themes only on the supplied comments; do not invent quotes or facts. Avoid corporate jargon. Keep the whole assessment under 500 words.`

// Build a compact text digest of all responses for the model: per-question
// distributions, every open-ended comment, and demographic breakdowns.
function buildAggregate(responses) {
  const n = responses.length
  const lines = [`Total responses: ${n}`, `Survey version: ${SURVEY_VERSION}`, '']

  sections.forEach((s) => {
    lines.push(`## ${s.title}`)
    s.questions.forEach((q) => {
      if (q.type === 'scale') {
        const vals = responses
          .map((r) => r.answers?.[q.id])
          .filter((v) => typeof v === 'number')
        const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
        const dist = [1, 2, 3, 4, 5].map((v) => vals.filter((x) => x === v).length)
        lines.push(`- ${q.text}`)
        lines.push(
          `  avg ${avg.toFixed(2)}/5 | counts for 1..5: ${dist.join(', ')} | labels 1..5: ${q.labels.join(' / ')}`
        )
      } else {
        lines.push(`- ${q.text}`)
        q.options.forEach((opt, i) => {
          const c = responses.filter((r) => r.answers?.[q.id] === i + 1).length
          const pct = n ? Math.round((c / n) * 100) : 0
          lines.push(`  [${c} | ${pct}%] ${opt}`)
        })
      }
    })
    lines.push('')
  })

  lines.push('## Open-ended responses')
  openEnded.forEach((q) => {
    lines.push(`### ${q.text}`)
    const answers = responses
      .map((r) => r.open_answers?.[q.id])
      .filter((a) => a && String(a).trim())
    if (answers.length === 0) lines.push('(no responses)')
    answers.forEach((a) => lines.push(`- "${String(a).trim()}"`))
    lines.push('')
  })

  lines.push('## Demographics')
  demographics.forEach((d) => {
    lines.push(`### ${d.label}`)
    const counts = {}
    responses.forEach((r) => {
      const v = r.demo_answers?.[d.id] || 'Not specified'
      counts[v] = (counts[v] || 0) + 1
    })
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, c]) => lines.push(`- ${k}: ${c}`))
    lines.push('')
  })

  return lines.join('\n')
}

function requireAdmin(req, res) {
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

export default async function handler(req, res) {
  // Latest saved assessment.
  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return
    const { data, error } = await supabase
      .from('org_assessments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      console.error('Supabase fetch error (assessments):', error)
      return res.status(500).json({ error: 'Failed to load assessment' })
    }
    return res.status(200).json({ assessment: data && data[0] ? data[0] : null })
  }

  // Run a new assessment over all responses, save it, return it.
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return

    const { data: responses, error: rErr } = await supabase
      .from('responses')
      .select('*')
    if (rErr) {
      console.error('Supabase fetch error (responses):', rErr)
      return res.status(500).json({ error: 'Failed to load responses' })
    }
    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: 'There are no responses yet to assess.' })
    }

    const aggregate = buildAggregate(responses)

    let analysis = ''
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-8',
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: aggregate }],
        }),
      })
      const data = await response.json()
      analysis = data.content?.filter((b) => b.type === 'text').map((b) => b.text).join('') || ''
    } catch (e) {
      console.error('Anthropic API error:', e)
      return res.status(500).json({ error: 'Assessment generation failed' })
    }
    if (!analysis) {
      return res.status(500).json({ error: 'The assessment came back empty. Try again.' })
    }

    const row = {
      content: analysis,
      response_count: responses.length,
      survey_version: SURVEY_VERSION,
      created_at: new Date().toISOString(),
    }
    const { data: saved, error: sErr } = await supabase
      .from('org_assessments')
      .insert([row])
      .select()
    if (sErr) {
      console.error('Supabase insert error (assessments):', sErr)
      return res.status(500).json({ error: 'Generated the assessment but failed to save it.' })
    }

    return res.status(200).json({ assessment: saved && saved[0] ? saved[0] : row })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
