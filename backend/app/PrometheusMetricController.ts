/* eslint-disable unicorn/filename-case */
// Pour éviter que on me casse les pieds avec les metrics
import { HttpContext } from '@adonisjs/core/http'

export default class PrometheusMetricController {
  async index({ response }: HttpContext) {
    response.send({ status: 'Metrics are working!' })
  }
}
