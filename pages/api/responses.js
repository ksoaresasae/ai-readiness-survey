import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple password check via header
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch error:', error)
    return res.status(500).json({ error: 'Failed to fetch responses' })
  }

  return res.status(200).json({ responses: data })
}
