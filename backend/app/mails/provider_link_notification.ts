import type User from '#models/user'
import { BaseMail } from '@adonisjs/mail'
import i18nManager from '@adonisjs/i18n/services/main'

export default class ProviderLinkNotification extends BaseMail {
  from = 'no-reply@minecraft-stats.fr'
  subject: string

  private t: ReturnType<typeof i18nManager.locale>

  constructor(
    public user: User,
    public provider: 'google' | 'discord',
    public linkToken: string,
    public locale: string = 'en'
  ) {
    super()
    this.t = i18nManager.locale(locale)
    this.subject = this.t.t('emails.providerLink.subject', { provider: this.providerName })
  }

  private get providerName() {
    return this.provider === 'google' ? 'Google' : 'Discord'
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    const provider = this.providerName
    this.message.to(this.user.email)
    this.message.htmlView('emails/provider_link_html', {
      link_url: `${process.env.WEBSITE_URL}/link-provider/${this.linkToken}`,
      title: this.t.t('emails.providerLink.title', { provider }),
      greeting: this.t.t('emails.providerLink.greeting', { username: this.user.username }),
      intro: this.t.t('emails.providerLink.intro', { provider }),
      cta: this.t.t('emails.providerLink.cta', { provider }),
      expiry: this.t.t('emails.providerLink.expiry'),
      ignore: this.t.t('emails.providerLink.ignore'),
      footerReason: this.t.t('emails.providerLink.footerReason'),
      copyright: this.t.t('emails.providerLink.copyright'),
    })
  }
}
