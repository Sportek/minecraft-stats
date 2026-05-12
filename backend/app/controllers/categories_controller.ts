import Category from '#models/category'
import CategoryPolicy from '#policies/category_policy'
import CacheService from '#services/cache_service'
import { CreateCategoryValidator } from '#validators/category'
import type { HttpContext } from '@adonisjs/core/http'

const CATEGORIES_CACHE_KEY = 'categories:all'

export default class CategoriesController {
  async index({ response }: HttpContext) {
    const categories = await CacheService.cacheOrFetch(CATEGORIES_CACHE_KEY, 3600, () =>
      Category.all()
    )
    return response.ok(categories)
  }

  async store({ request, response, bouncer }: HttpContext) {
    const data = await CreateCategoryValidator.validate(request.body())
    if (await bouncer.with(CategoryPolicy).denies('create')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    const category = await Category.create(data)
    await CacheService.invalidate(CATEGORIES_CACHE_KEY)
    return response.ok(category)
  }

  async destroy({ request, response, bouncer }: HttpContext) {
    const { id } = request.body()
    const category = await Category.findOrFail(id)
    if (await bouncer.with(CategoryPolicy).denies('destroy')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    await category.delete()
    await CacheService.invalidate(CATEGORIES_CACHE_KEY)
    return response.ok(category)
  }

  async update({ request, response, bouncer }: HttpContext) {
    const { id, ...data } = request.body()
    const validatedData = await CreateCategoryValidator.validate(data)
    if (await bouncer.with(CategoryPolicy).denies('update')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    const category = await Category.findOrFail(id)
    await category.merge(validatedData).save()
    await CacheService.invalidate(CATEGORIES_CACHE_KEY)
    return response.ok(category)
  }
}
