import vine from '@vinejs/vine'
import { REPORT_REASONS } from '../constants/server_report.js'

export const CreateServerReportValidator = vine.compile(
  vine.object({
    reason: vine.enum(REPORT_REASONS),
    details: vine.string().trim().maxLength(2000).optional(),
  })
)
