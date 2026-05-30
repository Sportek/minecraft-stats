/*
|--------------------------------------------------------------------------
| Serveur MCP Minecraft Stats (transport Streamable HTTP, mode stateless)
|--------------------------------------------------------------------------
|
| Au démarrage, on récupère le spec OpenAPI du backend et on génère un tool
| MCP par endpoint public autorisé. Chaque requête HTTP POST /mcp instancie
| un serveur + transport éphémères (stateless), conformément au pattern
| recommandé par le SDK pour les serveurs sans session.
|
*/

import express, { type Request, type Response } from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {
  ALLOWED_HOSTS,
  ALLOWED_ORIGINS,
  ENABLE_DNS_REBINDING_PROTECTION,
  HOST,
  MCP_PATH,
  PORT,
  SERVER_INFO,
} from './config.js'
import {
  buildToolDefinitions,
  callBackend,
  fetchSpec,
  type ToolDefinition,
} from './openapi.js'

/** Construit un McpServer et y enregistre tous les tools fournis. */
function createMcpServer(tools: ToolDefinition[]): McpServer {
  const server = new McpServer(SERVER_INFO)

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
      },
      async (args: Record<string, unknown>) => {
        const result = await callBackend(tool, args)
        return {
          isError: !result.ok,
          content: [
            {
              type: 'text' as const,
              text: result.ok
                ? result.body
                : `Erreur ${result.status} de l'API Minecraft Stats :\n${result.body}`,
            },
          ],
        }
      }
    )
  }

  return server
}

async function main() {
  console.log(`[mcp] Récupération du spec OpenAPI…`)
  const spec = await fetchSpec()
  const tools = buildToolDefinitions(spec)

  if (tools.length === 0) {
    throw new Error(
      "Aucun tool généré : vérifie l'allowlist PUBLIC_ENDPOINTS et le spec OpenAPI."
    )
  }
  console.log(`[mcp] ${tools.length} tools générés : ${tools.map((t) => t.name).join(', ')}`)

  const app = express()
  app.use(express.json())

  // CORS minimal pour les clients MCP navigateur (ex. claude.ai). API publique en
  // lecture seule : origine ouverte, méthodes limitées à POST/OPTIONS.
  app.use(MCP_PATH, (req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, mcp-protocol-version')
    res.header('Access-Control-Expose-Headers', 'mcp-session-id, mcp-protocol-version')
    if (req.method === 'OPTIONS') {
      res.sendStatus(204)
      return
    }
    next()
  })

  // Health check (utilisé par Docker / orchestrateur).
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', tools: tools.length, server: SERVER_INFO })
  })

  // Endpoint MCP — mode stateless : un serveur + transport éphémères par requête.
  app.post(MCP_PATH, async (req: Request, res: Response) => {
    const server = createMcpServer(tools)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      enableDnsRebindingProtection: ENABLE_DNS_REBINDING_PROTECTION,
      allowedHosts: ALLOWED_HOSTS.length > 0 ? ALLOWED_HOSTS : undefined,
      allowedOrigins: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : undefined,
    })

    res.on('close', () => {
      transport.close()
      server.close()
    })

    try {
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (error) {
      console.error('[mcp] Erreur lors du traitement de la requête :', error)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Erreur interne du serveur' },
          id: null,
        })
      }
    }
  })

  // En mode stateless, GET (flux SSE) et DELETE (fin de session) ne sont pas supportés.
  const methodNotAllowed = (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Méthode non autorisée (serveur MCP stateless).' },
      id: null,
    })
  }
  app.get(MCP_PATH, methodNotAllowed)
  app.delete(MCP_PATH, methodNotAllowed)

  app.listen(PORT, HOST, () => {
    console.log(`[mcp] Serveur MCP Minecraft Stats à l'écoute sur http://${HOST}:${PORT}${MCP_PATH}`)
  })
}

main().catch((error) => {
  console.error('[mcp] Démarrage impossible :', error)
  process.exit(1)
})
