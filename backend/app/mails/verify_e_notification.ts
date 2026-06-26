import type User from '#models/user'
import { BaseMail } from '@adonisjs/mail'
import i18nManager from '@adonisjs/i18n/services/main'

export default class VerifyENotification extends BaseMail {
  from = 'no-reply@minecraft-stats.fr'
  subject: string

  private t: ReturnType<typeof i18nManager.locale>

  constructor(
    public user: User,
    public jwtToken: string,
    public locale: string = 'en'
  ) {
    super()
    this.t = i18nManager.locale(locale)
    this.subject = this.t.t('emails.verifyEmail.subject')
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    this.message.to(this.user.email)
    this.message.htmlView('emails/verify_email_html', {
      verify_url: `${process.env.WEBSITE_URL}/verify-email/${this.jwtToken}`,
      title: this.t.t('emails.verifyEmail.title'),
      greeting: this.t.t('emails.verifyEmail.greeting', { username: this.user.username }),
      intro: this.t.t('emails.verifyEmail.intro'),
      cta: this.t.t('emails.verifyEmail.cta'),
      viewInBrowser: this.t.t('emails.verifyEmail.viewInBrowser'),
      footerReason: this.t.t('emails.verifyEmail.footerReason'),
      copyright: this.t.t('emails.verifyEmail.copyright'),
    })
  }
}
