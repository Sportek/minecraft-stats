import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3334/mcp'))
const client = new Client({ name: 'smoke-test', version: '1.0.0' })
await client.connect(transport)

const tools = await client.listTools()
console.log('TOOLS:', tools.tools.map((t) => t.name).join(', '))

const ws = await client.callTool({ name: 'getWebsiteStats', arguments: {} })
console.log('getWebsiteStats ->', ws.content[0].text)

const stats = await client.callTool({
  name: 'getServerStats',
  arguments: { server_id: 125, interval: '1 hour' },
})
console.log('getServerStats ->', stats.content[0].text)

const gstats = await client.callTool({
  name: 'getGlobalStats',
  arguments: { categoryId: 3, fromDate: 1716854400000 },
})
console.log('getGlobalStats ->', gstats.content[0].text)

await client.close()
process.exit(0)
