import type User from '#models/user'
import { BaseMail } from '@adonisjs/mail'
import i18nManager from '@adonisjs/i18n/services/main'

export default class ResetPasswordNotification extends BaseMail {
  from = 'no-reply@minecraft-stats.fr'
  subject: string

  private t: ReturnType<typeof i18nManager.locale>

  constructor(
    public user: User,
    public resetToken: string,
    public locale: string = 'en'
  ) {
    super()
    this.t = i18nManager.locale(locale)
    this.subject = this.t.t('emails.resetPassword.subject')
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    this.message.to(this.user.email)
    this.message.htmlView('emails/reset_password_html', {
      reset_url: `${process.env.WEBSITE_URL}/reset-password/${this.resetToken}`,
      title: this.t.t('emails.resetPassword.title'),
      greeting: this.t.t('emails.resetPassword.greeting', { username: this.user.username }),
      intro: this.t.t('emails.resetPassword.intro'),
      cta: this.t.t('emails.resetPassword.cta'),
      expiry: this.t.t('emails.resetPassword.expiry'),
      ignore: this.t.t('emails.resetPassword.ignore'),
      viewInBrowser: this.t.t('emails.resetPassword.viewInBrowser'),
      footerReason: this.t.t('emails.resetPassword.footerReason'),
      copyright: this.t.t('emails.resetPassword.copyright'),
    })
  }
}
