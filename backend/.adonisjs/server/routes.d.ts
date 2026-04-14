import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'servers.paginate': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.store': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.categories.index': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'servers.categories.store': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'servers.categories.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'server_id': ParamValue,'id': ParamValue} }
    'languages.index': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.stats.index': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'stats.global_stats': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'website_stats.index': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.retrieve_user': { paramsTuple?: []; params?: {} }
    'auth.change_password': { paramsTuple?: []; params?: {} }
    'auth.provider_login': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.google_callback': { paramsTuple?: []; params?: {} }
    'auth.discord_callback': { paramsTuple?: []; params?: {} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.get_placeholders': { paramsTuple?: []; params?: {} }
    'posts.admin_index': { paramsTuple?: []; params?: {} }
    'posts.store': { paramsTuple?: []; params?: {} }
    'posts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.unpublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.preview_placeholder': { paramsTuple?: []; params?: {} }
    'users.admin_index': { paramsTuple?: []; params?: {} }
    'users.update_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'uploads.upload_image': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'servers.paginate': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.categories.index': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'languages.index': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.stats.index': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'stats.global_stats': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'website_stats.index': { paramsTuple?: []; params?: {} }
    'auth.retrieve_user': { paramsTuple?: []; params?: {} }
    'auth.provider_login': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.google_callback': { paramsTuple?: []; params?: {} }
    'auth.discord_callback': { paramsTuple?: []; params?: {} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.get_placeholders': { paramsTuple?: []; params?: {} }
    'posts.admin_index': { paramsTuple?: []; params?: {} }
    'users.admin_index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'servers.paginate': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.categories.index': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'languages.index': { paramsTuple?: []; params?: {} }
    'categories.index': { paramsTuple?: []; params?: {} }
    'categories.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.stats.index': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'stats.global_stats': { paramsTuple?: []; params?: {} }
    'users.index': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'website_stats.index': { paramsTuple?: []; params?: {} }
    'auth.retrieve_user': { paramsTuple?: []; params?: {} }
    'auth.provider_login': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.google_callback': { paramsTuple?: []; params?: {} }
    'auth.discord_callback': { paramsTuple?: []; params?: {} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.get_placeholders': { paramsTuple?: []; params?: {} }
    'posts.admin_index': { paramsTuple?: []; params?: {} }
    'users.admin_index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'servers.store': { paramsTuple?: []; params?: {} }
    'servers.categories.store': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.change_password': { paramsTuple?: []; params?: {} }
    'posts.store': { paramsTuple?: []; params?: {} }
    'posts.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.unpublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.preview_placeholder': { paramsTuple?: []; params?: {} }
    'uploads.upload_image': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'servers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'servers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'servers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.categories.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'server_id': ParamValue,'id': ParamValue} }
    'categories.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}