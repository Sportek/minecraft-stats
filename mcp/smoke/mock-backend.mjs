import http from 'node:http'
import { readFileSync } from 'node:fs'

// On sert le spec en YAML, exactement comme l'endpoint /swagger d'AutoSwagger.
const swaggerYaml = readFileSync(new URL('../../backend/swagger.yml', import.meta.url))

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  res.setHeader('content-type', 'application/json')
  if (url.pathname === '/swagger') {
    res.setHeader('content-type', 'application/yaml')
    return res.end(swaggerYaml)
  }
  if (url.pathname === '/api/v1/website-stats')
    return res.end(JSON.stringify({ servers: 42, players: 12345, mock: true }))
  if (url.pathname.startsWith('/api/v1/servers/') && url.pathname.endsWith('/stats'))
    return res.end(
      JSON.stringify([{ serverId: 125, playerCount: 100, createdAt: '2026-05-28T12:00:00Z', qs: url.search }])
    )
  if (url.pathname === '/api/v1/global-stats')
    return res.end(JSON.stringify([{ createdAt: '2026-05-28T12:00:00Z', playerCount: 48230, qs: url.search }]))
  res.statusCode = 404
  res.end(JSON.stringify({ error: 'not found', path: url.pathname }))
})

server.listen(3399, () => console.log('[mock] backend on 3399'))
