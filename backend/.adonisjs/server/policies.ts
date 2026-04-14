export const policies = {
  CategoryPolicy: () => import('#policies/category_policy'),
  MainPolicy: () => import('#policies/main'),
  PostPolicy: () => import('#policies/post_policy'),
  ServerCategoryPolicy: () => import('#policies/server_category_policy'),
  ServerPolicy: () => import('#policies/server_policy'),
  UserPolicy: () => import('#policies/user_policy'),
}

