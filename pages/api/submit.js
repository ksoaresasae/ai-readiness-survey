import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { answers, openAnswers, demoAnswers, surveyVersion } = req.body

  if (!answers || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: 'No answers provided' })
  }

  const { error } = await supabase.from('responses').insert([
    {
      survey_version: surveyVersion,
      answers,
      open_answers: openAnswers || {},
      demo_answers: demoAnswers || {},
      submitted_at: new Date().toISOString(),
    },
  ])

  if (error) {
    console.error('Supabase insert error:', error)
    return res.status(500).json({ error: 'Failed to save response' })
  }

  return res.status(200).json({ success: true })
}
