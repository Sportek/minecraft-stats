/*
|--------------------------------------------------------------------------
| Génération des tools MCP depuis le spec OpenAPI
|--------------------------------------------------------------------------
|
| Ce module récupère le spec OpenAPI du backend, le filtre via l'allowlist
| publique, puis transforme chaque opération en définition de tool MCP
| (schéma Zod + handler qui relaie la requête vers l'API).
|
*/

import { z, type ZodTypeAny } from 'zod'
import { parse as parseYaml } from 'yaml'
import { API_BASE_URL, OPENAPI_URL, PROXY_TIMEOUT_MS, PUBLIC_ENDPOINTS } from './config.js'

/** Paramètre OpenAPI (sous-ensemble utilisé). */
interface OpenApiParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  description?: string
  schema?: { type?: string; items?: { type?: string }; enum?: unknown[] }
  example?: unknown
}

interface OpenApiOperation {
  operationId?: string
  summary?: string
  description?: string
  parameters?: OpenApiParameter[]
}

interface OpenApiSpec {
  paths: Record<string, Record<string, OpenApiOperation>>
}

/** Définition d'un tool prête à être enregistrée sur le serveur MCP. */
export interface ToolDefinition {
  name: string
  title: string
  description: string
  inputSchema: Record<string, ZodTypeAny>
  pathTemplate: string
  parameters: OpenApiParameter[]
}

/**
 * Récupère le spec OpenAPI depuis le backend, avec quelques tentatives au
 * démarrage (le backend peut ne pas être encore prêt dans un déploiement Docker).
 */
export async function fetchSpec(retries = 10, delayMs = 3000): Promise<OpenApiSpec> {
  let lastError: unknown
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(OPENAPI_URL, {
        headers: { accept: 'application/yaml, application/json, text/yaml' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} en récupérant ${OPENAPI_URL}`)
      // AutoSwagger sert le spec en YAML ; YAML étant un sur-ensemble de JSON,
      // parseYaml gère les deux formats indifféremment.
      const text = await res.text()
      const spec = parseYaml(text) as OpenApiSpec
      if (!spec || !spec.paths) throw new Error('Spec OpenAPI invalide : "paths" manquant')
      return spec
    } catch (error) {
      lastError = error
      console.error(
        `[openapi] Échec de récupération du spec (tentative ${attempt}/${retries}) : ${(error as Error).message}`
      )
      if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  throw new Error(`Impossible de charger le spec OpenAPI après ${retries} tentatives : ${lastError}`)
}

/** Convertit un type de schéma OpenAPI en schéma Zod (avec coercition pour les query strings). */
function zodForParameter(param: OpenApiParameter): ZodTypeAny {
  const type = param.schema?.type
  let schema: ZodTypeAny

  switch (type) {
    case 'integer':
    case 'number':
      schema = z.coerce.number()
      break
    case 'boolean':
      schema = z.coerce.boolean()
      break
    case 'array': {
      const itemType = param.schema?.items?.type
      const itemSchema: ZodTypeAny =
        itemType === 'integer' || itemType === 'number' ? z.coerce.number() : z.string()
      schema = z.array(itemSchema)
      break
    }
    default:
      schema = z.string()
  }

  const descriptionParts: string[] = []
  if (param.description) descriptionParts.push(param.description)
  if (param.example !== undefined) descriptionParts.push(`Exemple : ${JSON.stringify(param.example)}`)
  if (descriptionParts.length > 0) schema = schema.describe(descriptionParts.join(' '))

  return param.required ? schema : schema.optional()
}

/**
 * Génère un nom de tool stable et lisible à partir de la méthode et du chemin.
 * Utilise l'operationId du spec s'il est présent.
 */
function toolName(method: string, path: string, operationId?: string): string {
  if (operationId) return operationId
  const segments = path
    .replace(/^\/api\/v1/, '')
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      const paramMatch = seg.match(/^\{(.+)\}$/)
      const base = paramMatch ? `By ${paramMatch[1]}` : seg
      return base
        .replace(/[-_]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
    })
    .join('')
  return `${method.toLowerCase()}${segments}`
}

/** Filtre le spec via l'allowlist et construit les définitions de tools. */
export function buildToolDefinitions(spec: OpenApiSpec): ToolDefinition[] {
  const tools: ToolDefinition[] = []

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const key = `${method.toLowerCase()} ${path}`
      if (!PUBLIC_ENDPOINTS.has(key)) continue
      if (method.toLowerCase() !== 'get') continue // sécurité : lecture seule uniquement

      const parameters = (operation.parameters ?? []).filter(
        (p) => p.in === 'path' || p.in === 'query'
      )

      const inputSchema: Record<string, ZodTypeAny> = {}
      for (const param of parameters) {
        inputSchema[param.name] = zodForParameter(param)
      }

      const descriptionParts: string[] = []
      if (operation.summary) descriptionParts.push(operation.summary)
      if (operation.description) descriptionParts.push(operation.description)
      descriptionParts.push(`(Source : GET ${path} sur l'API Minecraft Stats.)`)

      tools.push({
        name: toolName(method, path, operation.operationId),
        title: operation.summary ?? path,
        description: descriptionParts.join('\n\n'),
        inputSchema,
        pathTemplate: path,
        parameters,
      })
    }
  }

  return tools
}

/** Résultat brut d'un appel en proxy. */
export interface ProxyResult {
  ok: boolean
  status: number
  body: string
}

/** Exécute l'appel HTTP vers le backend pour un tool donné. */
export async function callBackend(
  tool: ToolDefinition,
  args: Record<string, unknown>
): Promise<ProxyResult> {
  let urlPath = tool.pathTemplate
  const query = new URLSearchParams()

  for (const param of tool.parameters) {
    const value = args[param.name]
    if (value === undefined || value === null) continue

    if (param.in === 'path') {
      urlPath = urlPath.replace(`{${param.name}}`, encodeURIComponent(String(value)))
    } else if (Array.isArray(value)) {
      for (const item of value) query.append(param.name, String(item))
    } else {
      query.append(param.name, String(value))
    }
  }

  const qs = query.toString()
  const url = `${API_BASE_URL}${urlPath}${qs ? `?${qs}` : ''}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
    const body = await res.text()
    return { ok: res.ok, status: res.status, body }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: JSON.stringify({ error: `Échec de l'appel vers le backend : ${(error as Error).message}` }),
    }
  } finally {
    clearTimeout(timeout)
  }
}
