import { ReactNode } from "react";
import { Crown, Sparkles, ThumbsUp, TrendingUp, Users } from "lucide-react";
import { RankingSort } from "@/http/rankings";

/**
 * Les 5 classements du site, dans l'ordre d'affichage de la navigation.
 * `sort` est le segment d'URL de la page dédiée (/rankings/<sort>) ; `icon`
 * alimente les en-têtes et la navigation.
 */
export const RANKING_SECTIONS: { sort: RankingSort; icon: ReactNode }[] = [
  { sort: "players", icon: <Users className="h-5 w-5" /> },
  { sort: "trending", icon: <TrendingUp className="h-5 w-5" /> },
  { sort: "votes", icon: <ThumbsUp className="h-5 w-5" /> },
  { sort: "peak", icon: <Crown className="h-5 w-5" /> },
  { sort: "newest", icon: <Sparkles className="h-5 w-5" /> },
];
