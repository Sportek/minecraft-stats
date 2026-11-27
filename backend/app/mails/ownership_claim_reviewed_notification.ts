import type Server from '#models/server'
import type User from '#models/user'
import { BaseMail } from '@adonisjs/mail'
import i18nManager from '@adonisjs/i18n/services/main'

export type ClaimDecision = 'approved' | 'rejected'

const DEFAULT_PORT = 25565

export default class OwnershipClaimReviewedNotification extends BaseMail {
  from = 'no-reply@minecraft-stats.fr'
  subject: string

  private readonly t: ReturnType<typeof i18nManager.locale>
  private readonly key: string

  constructor(
    public user: User,
    public server: Server,
    public decision: ClaimDecision,
    public note: string | null,
    public locale: string = 'en'
  ) {
    super()
    this.t = i18nManager.locale(i18nManager.getSupportedLocaleFor(locale) ?? 'en')
    this.key = decision === 'approved' ? 'emails.ownershipApproved' : 'emails.ownershipRejected'
    this.subject = this.t.t(`${this.key}.subject`, { server: server.name })
  }

  private link(path: string) {
    return `${process.env.WEBSITE_URL}/${this.t.locale}${path}`
  }

  prepare() {
    const { server } = this
    const tr = (name: string, data: Record<string, string> = {}) =>
      this.t.t(`${this.key}.${name}`, data)

    this.message.to(this.user.email)
    this.message.htmlView('emails/ownership_claim_html', {
      title: tr('title'),
      greeting: tr('greeting', { username: this.user.username }),
      intro: tr('intro'),
      serverName: server.name,
      serverAddress:
        server.port === DEFAULT_PORT ? server.address : `${server.address}:${server.port}`,
      noteLabel: this.note ? tr('noteLabel') : null,
      note: this.note,
      cta: tr('cta'),
      cta_url: this.link(
        this.decision === 'approved' ? `/servers/${server.id}/edit` : `/servers/${server.id}`
      ),
      footerReason: tr('footerReason'),
      copyright: this.t.t('emails.verifyEmail.copyright'),
    })
  }
}
