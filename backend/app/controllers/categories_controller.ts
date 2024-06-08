import Category from '#models/category'
import type { HttpContext } from '@adonisjs/core/http'

export default class CategoriesController {
  async index({ response }: HttpContext) {
    const categories = await Category.all()
    return response.ok(categories)
  }

  async store({ request, response }: HttpContext) {
    const data = await request.validate(CreateCategoryValidator)
  }
}
