export interface ApiToken {
  id: string | number;
  name: string;
  abilities: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

export interface CreatedApiToken {
  type: string;
  name: string;
  token: string;
  abilities: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export interface CreateApiTokenInput {
  name: string;
  expiresInDays?: number;
}
