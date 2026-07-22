import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'servers.paginate': { paramsTuple?: []; params?: {} }
    'servers.mine': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.store': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_votes.store': { paramsTuple: [ParamValue]; params: {'serverId': ParamValue} }
    'server_votes.status': { paramsTuple: [ParamValue]; params: {'serverId': ParamValue} }
    'server_ownership.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.start_motd': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.verify_motd': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.start_dns': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.verify_dns': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.submit_manual': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.retrieve_user': { paramsTuple?: []; params?: {} }
    'auth.change_password': { paramsTuple?: []; params?: {} }
    'auth.change_username': { paramsTuple?: []; params?: {} }
    'auth.update_avatar': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.logout_all': { paramsTuple?: []; params?: {} }
    'api_tokens.index': { paramsTuple?: []; params?: {} }
    'api_tokens.store': { paramsTuple?: []; params?: {} }
    'api_tokens.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'auth.provider_login': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.google_callback': { paramsTuple?: []; params?: {} }
    'auth.discord_callback': { paramsTuple?: []; params?: {} }
    'user_providers.confirm': { paramsTuple?: []; params?: {} }
    'user_providers.index': { paramsTuple?: []; params?: {} }
    'user_providers.destroy': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.get_placeholders': { paramsTuple?: []; params?: {} }
    'posts.resolve_placeholders': { paramsTuple?: []; params?: {} }
    'posts.record_view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.submit_feedback': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'advertisements.index': { paramsTuple?: []; params?: {} }
    'advertisements.record_impression': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.click': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.hit': { paramsTuple?: []; params?: {} }
    'analytics.pageview': { paramsTuple?: []; params?: {} }
    'analytics.identify': { paramsTuple?: []; params?: {} }
    'posts.admin_index': { paramsTuple?: []; params?: {} }
    'posts.store': { paramsTuple?: []; params?: {} }
    'posts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.unpublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.admin_stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.preview_placeholder': { paramsTuple?: []; params?: {} }
    'analytics.dashboard': { paramsTuple?: []; params?: {} }
    'server_ownership.admin_index': { paramsTuple?: []; params?: {} }
    'server_ownership.approve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.reject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.admin_index': { paramsTuple?: []; params?: {} }
    'users.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.admin_index': { paramsTuple?: []; params?: {} }
    'advertisements.stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.store': { paramsTuple?: []; params?: {} }
    'advertisements.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'uploads.upload_image': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'servers.paginate': { paramsTuple?: []; params?: {} }
    'servers.mine': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_votes.status': { paramsTuple: [ParamValue]; params: {'serverId': ParamValue} }
    'server_ownership.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'api_tokens.index': { paramsTuple?: []; params?: {} }
    'auth.provider_login': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.google_callback': { paramsTuple?: []; params?: {} }
    'auth.discord_callback': { paramsTuple?: []; params?: {} }
    'user_providers.index': { paramsTuple?: []; params?: {} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.get_placeholders': { paramsTuple?: []; params?: {} }
    'advertisements.index': { paramsTuple?: []; params?: {} }
    'advertisements.click': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.admin_index': { paramsTuple?: []; params?: {} }
    'posts.admin_stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.dashboard': { paramsTuple?: []; params?: {} }
    'server_ownership.admin_index': { paramsTuple?: []; params?: {} }
    'users.admin_index': { paramsTuple?: []; params?: {} }
    'users.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.admin_index': { paramsTuple?: []; params?: {} }
    'advertisements.stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'servers.paginate': { paramsTuple?: []; params?: {} }
    'servers.mine': { paramsTuple?: []; params?: {} }
    'servers.index': { paramsTuple?: []; params?: {} }
    'servers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_votes.status': { paramsTuple: [ParamValue]; params: {'serverId': ParamValue} }
    'server_ownership.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'api_tokens.index': { paramsTuple?: []; params?: {} }
    'auth.provider_login': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.google_callback': { paramsTuple?: []; params?: {} }
    'auth.discord_callback': { paramsTuple?: []; params?: {} }
    'user_providers.index': { paramsTuple?: []; params?: {} }
    'posts.index': { paramsTuple?: []; params?: {} }
    'posts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.get_placeholders': { paramsTuple?: []; params?: {} }
    'advertisements.index': { paramsTuple?: []; params?: {} }
    'advertisements.click': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.admin_index': { paramsTuple?: []; params?: {} }
    'posts.admin_stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.dashboard': { paramsTuple?: []; params?: {} }
    'server_ownership.admin_index': { paramsTuple?: []; params?: {} }
    'users.admin_index': { paramsTuple?: []; params?: {} }
    'users.admin_show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.admin_index': { paramsTuple?: []; params?: {} }
    'advertisements.stats': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'servers.store': { paramsTuple?: []; params?: {} }
    'server_votes.store': { paramsTuple: [ParamValue]; params: {'serverId': ParamValue} }
    'server_ownership.start_motd': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.verify_motd': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.start_dns': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.verify_dns': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.submit_manual': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'servers.categories.store': { paramsTuple: [ParamValue]; params: {'server_id': ParamValue} }
    'categories.store': { paramsTuple?: []; params?: {} }
    'users.store': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.change_password': { paramsTuple?: []; params?: {} }
    'auth.change_username': { paramsTuple?: []; params?: {} }
    'auth.update_avatar': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.logout_all': { paramsTuple?: []; params?: {} }
    'api_tokens.store': { paramsTuple?: []; params?: {} }
    'user_providers.confirm': { paramsTuple?: []; params?: {} }
    'posts.resolve_placeholders': { paramsTuple?: []; params?: {} }
    'posts.record_view': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'posts.submit_feedback': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'advertisements.record_impression': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'analytics.hit': { paramsTuple?: []; params?: {} }
    'analytics.pageview': { paramsTuple?: []; params?: {} }
    'analytics.identify': { paramsTuple?: []; params?: {} }
    'posts.store': { paramsTuple?: []; params?: {} }
    'posts.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.unpublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.preview_placeholder': { paramsTuple?: []; params?: {} }
    'server_ownership.approve': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'server_ownership.reject': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.store': { paramsTuple?: []; params?: {} }
    'uploads.upload_image': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'servers.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'categories.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'posts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'api_tokens.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'user_providers.destroy': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'posts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'advertisements.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}