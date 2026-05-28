import Category from '#models/category'
import CategoryPolicy from '#policies/category_policy'
import CacheService from '#services/cache_service'
import { CreateCategoryValidator } from '#validators/category'
import type { HttpContext } from '@adonisjs/core/http'

const CATEGORIES_CACHE_KEY = 'categories:all'

export default class CategoriesController {
  /**
   * @listCategories
   * @operationId listCategories
   * @tag CATEGORIES
   * @summary List all categories
   * @description Returns every category available for tagging servers (e.g. Survival, Creative, PvP). The result is cached for one hour under the `categories:all` cache key. Publicly accessible.
   * @responseBody 200 - <Category[]>
   */
  async index({ response }: HttpContext) {
    const categories = await CacheService.cacheOrFetch(CATEGORIES_CACHE_KEY, 3600, () =>
      Category.all()
    )
    return response.ok(categories)
  }

  /**
   * @createCategory
   * @operationId createCategory
   * @tag CATEGORIES
   * @summary Create a category
   * @description Creates a new category. The body is validated against `CreateCategoryValidator` (`name` string). Authorization is enforced by `CategoryPolicy.create`. The categories cache is invalidated on success.
   * @requestBody <CreateCategoryValidator>
   * @responseBody 200 - <Category>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "name"}]}
   */
  async store({ request, response, bouncer }: HttpContext) {
    const data = await CreateCategoryValidator.validate(request.body())
    if (await bouncer.with(CategoryPolicy).denies('create')) {
      return response.forbidden({ message: 'Unauthorized' })
    }
    const category = await Category.create(data)
    await CacheService.invalidate(CATEGORIES_CACHE_KEY)
    return response.ok(category)
  }

  /**
   * @destroyCategory
   * @operationId destroyCategory
   * @tag CATEGORIES
   * @summary Delete a category
   * @description Deletes a category. The target id is read from the request body (rather than the URL). Authorization is enforced by `CategoryPolicy.destroy`. The categories cache is invalidated on success.
   * @paramPath id - Category ID (ignored — id is read from the body) - @type(number) @example(3)
   * @requestBody {"id": 1}
   * @responseBody 200 - <Category>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Row not found"}
   */
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

  /**
   * @updateCategory
   * @operationId updateCategory
   * @tag CATEGORIES
   * @summary Update a category
   * @description Updates a category. The target id and the updated fields are both read from the request body. The body (minus `id`) is validated against `CreateCategoryValidator`. Authorization is enforced by `CategoryPolicy.update`. The categories cache is invalidated on success.
   * @paramPath id - Category ID (ignored — id is read from the body) - @type(number) @example(3)
   * @requestBody {"id": 1, "name": "Survival"}
   * @responseBody 200 - <Category>
   * @responseBody 403 - {"message": "Unauthorized"}
   * @responseBody 404 - {"message": "Row not found"}
   * @responseBody 422 - {"errors": [{"message": "Validation failed", "field": "name"}]}
   */
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
