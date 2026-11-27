import type { HttpContext } from '@adonisjs/core/http'
import Webhook from '#models/webhook'
import WebhookService from '#services/webhook_service'
import { CreateWebhookValidator, UpdateWebhookValidator } from '#validators/webhook'

export default class WebhooksController {
  /**
   * @index
   * @operationId adminListWebhooks
   * @tag ADMIN
   * @summary List staff notification webhooks (admin)
   * @description Returns every Discord webhook with the events it receives and the outcome of its last delivery. The webhook URL is a secret and is only returned masked.
   * @responseBody 200 - [{"id": 1, "name": "Modération", "maskedUrl": "https://discord.com/api/webhooks/123/••••••••abcd", "events": ["server.submitted", "server_report.created"], "enabled": true, "lastStatus": 204, "lastError": "", "lastSentAt": "2026-11-27T12:00:00.000Z", "createdAt": "2026-11-27T12:00:00.000Z", "updatedAt": "2026-11-27T12:00:00.000Z"}]
   */
  async index() {
    return Webhook.query().orderBy('id', 'asc')
  }

  /**
   * @store
   * @operationId adminCreateWebhook
   * @tag ADMIN
   * @summary Add a Discord webhook (admin)
   * @description Registers a Discord webhook URL and the events it should receive: `ownership_claim.created` (manual ownership request), `server.submitted` (new server awaiting moderation), `server_report.created` (new report). Only `https://discord.com/api/webhooks/...` URLs are accepted.
   * @requestBody {"name": "Modération", "url": "https://discord.com/api/webhooks/123/abcd", "events": ["server.submitted"]}
   * @responseBody 201 - {"id": 1, "name": "Modération", "maskedUrl": "https://discord.com/api/webhooks/123/••••••••abcd", "events": ["server.submitted"], "enabled": true}
   * @responseBody 422 - {"errors": [{"message": "The url field format is invalid", "field": "url"}]}
   */
  async store({ request, response, auth }: HttpContext) {
    const data = await CreateWebhookValidator.validate(request.only(['name', 'url', 'events']))
    const webhook = await Webhook.create({ ...data, enabled: true, createdBy: auth.user!.id })
    return response.created(webhook)
  }

  /**
   * @update
   * @operationId adminUpdateWebhook
   * @tag ADMIN
   * @summary Rename, change the events of, or pause a webhook (admin)
   * @paramPath id - The webhook id - @type(number) @example(1) @required
   * @requestBody {"name": "Modération", "events": ["server.submitted", "server_report.created"], "enabled": false}
   * @responseBody 200 - {"id": 1, "name": "Modération", "events": ["server.submitted", "server_report.created"], "enabled": false}
   * @responseBody 404 - {"message": "Row not found"}
   */
  async update({ params, request }: HttpContext) {
    const webhook = await Webhook.findOrFail(params.id)
    const data = await UpdateWebhookValidator.validate(request.only(['name', 'events', 'enabled']))
    return webhook.merge(data).save()
  }

  /**
   * @destroy
   * @operationId adminDeleteWebhook
   * @tag ADMIN
   * @summary Delete a webhook (admin)
   * @paramPath id - The webhook id - @type(number) @example(1) @required
   * @responseBody 204 - {}
   * @responseBody 404 - {"message": "Row not found"}
   */
  async destroy({ params, response }: HttpContext) {
    const webhook = await Webhook.findOrFail(params.id)
    await webhook.delete()
    return response.noContent()
  }

  /**
   * @test
   * @operationId adminTestWebhook
   * @tag ADMIN
   * @summary Send a test message to a webhook (admin)
   * @paramPath id - The webhook id - @type(number) @example(1) @required
   * @responseBody 200 - {"ok": true, "status": 204, "error": ""}
   * @responseBody 404 - {"message": "Row not found"}
   */
  async test({ params }: HttpContext) {
    const webhook = await Webhook.findOrFail(params.id)
    return WebhookService.sendTest(webhook)
  }
}
