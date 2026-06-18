export type ServerType = 'java' | 'bedrock'

export const SERVER_TYPES: ServerType[] = ['java', 'bedrock']

/** Port par défaut selon l'édition : Java écoute en TCP 25565, Bedrock en UDP 19132. */
export const DEFAULT_PORT: Record<ServerType, number> = {
  java: 25565,
  bedrock: 19132,
}
