import User from '#models/user'
import { BaseMail } from '@adonisjs/mail'

export default class VerifyENotification extends BaseMail {
  from = 'no-reply@minecraft-stats.fr'
  subject = 'Verify your email address'

  constructor(
    public user: User,
    public jwtToken: string
  ) {
    super()
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  prepare() {
    this.message.to(this.user.email)
    this.message.htmlView('emails/verify_email_html', {
      username: this.user.username,
      verify_url: `${process.env.WEBSITE_URL}/verify-email/${this.jwtToken}`,
    })
  }
}
