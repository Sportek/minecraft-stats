export type ModerationStatus = 'pending' | 'approved' | 'blocked'

export type ModerationVerdict = 'approved' | 'blocked'

export const MODERATION_VERDICTS: ModerationVerdict[] = ['approved', 'blocked']
