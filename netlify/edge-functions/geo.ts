// GET /api/geo → { "country": "IN" }
// Netlify works out the visitor's country at the edge; only the 2-letter code
// is returned, and nothing is logged or stored here.
import type { Config, Context } from '@netlify/edge-functions'

export default (_req: Request, context: Context) =>
  Response.json(
    { country: context.geo?.country?.code ?? null },
    { headers: { 'cache-control': 'no-store' } }
  )

export const config: Config = { path: '/api/geo' }
