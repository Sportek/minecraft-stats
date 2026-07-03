import { ReactNode } from "react";
import { Crown, Sparkles, TrendingUp, Users } from "lucide-react";
import { RankingSort } from "@/http/rankings";

/**
 * Les 4 classements du site, dans l'ordre d'affichage. `id` sert d'ancre sur la
 * page hub /rankings ; `sort` est le segment d'URL de la page dédiée
 * (/rankings/<sort>) ; `icon` alimente les en-têtes et la navigation.
 */
export const RANKING_SECTIONS: { sort: RankingSort; id: string; icon: ReactNode }[] = [
  { sort: "players", id: "top", icon: <Users className="h-5 w-5" /> },
  { sort: "trending", id: "trending", icon: <TrendingUp className="h-5 w-5" /> },
  { sort: "peak", id: "peak", icon: <Crown className="h-5 w-5" /> },
  { sort: "newest", id: "new", icon: <Sparkles className="h-5 w-5" /> },
];
