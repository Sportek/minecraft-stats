import { apiFetch } from "./client";

export interface VotePlayer {
  username: string;
  uuid: string | null;
  // Chemin relatif de la tête rendue côté serveur (`/images/heads/<uuid>`), ou null.
  headPath: string | null;
}

export interface VoteResult {
  voteCount: number;
  monthlyVoteCount: number;
  nextVoteAt: string | null;
  player: VotePlayer;
}

export interface VoteStatus {
  canVote: boolean;
  nextVoteAt: string | null;
  voteCount: number;
  monthlyVoteCount: number;
}

interface SubmitVoteInput {
  username: string;
  visitorId: string;
  acceptedTerms: boolean;
  turnstileToken?: string | null;
}

/**
 * Soumet un vote anonyme pour un serveur. Lève une `Error` avec le message
 * traduit renvoyé par l'API (pseudo invalide, conditions non acceptées, captcha,
 * cooldown 429…). Le pseudo Minecraft est le seul champ requis de l'utilisateur.
 */
export const submitVote = (serverId: number, input: SubmitVoteInput): Promise<VoteResult> =>
  apiFetch<VoteResult>(`/servers/${serverId}/vote`, {
    method: "POST",
    body: {
      username: input.username,
      visitorId: input.visitorId,
      acceptedTerms: input.acceptedTerms,
      turnstileToken: input.turnstileToken ?? undefined,
    },
  });

/**
 * Indique si le visiteur peut voter maintenant pour ce serveur (cooldown), la
 * date du prochain vote possible et le total de votes. Pilote l'état du bouton.
 */
export const getVoteStatus = (serverId: number, visitorId: string): Promise<VoteStatus> => {
  const params = new URLSearchParams({ visitorId });
  return apiFetch<VoteStatus>(`/servers/${serverId}/vote-status?${params.toString()}`);
};
