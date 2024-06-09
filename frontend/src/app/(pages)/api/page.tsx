import Route, { RouteMethod } from "@/components/api/route";

const routes = [
  {
    path: "/servers",
    method: RouteMethod.GET,
    description: "Get all servers"
  },
  {
    path: "/servers",
    method: RouteMethod.POST,
    description: "Create a server"
  },
  {
    path: "/servers/:id",
    method: RouteMethod.GET,
    description: "Get a server"
  },
  {
    path: "/servers/:id",
    method: RouteMethod.PUT,
    description: "Update a server"
  },
  {
    path: "/servers/:id",
    method: RouteMethod.DELETE,
    description: "Delete a server"
  },
  {
    path: "/servers/:server_id/categories",
    method: RouteMethod.GET,
    description: "Get all categories for a server"
  },
  {
    path: "/servers/:server_id/categories",
    method: RouteMethod.POST,
    description: "Add a category to a server"
  },
  {
    path: "/servers/:server_id/categories/:category_id",
    method: RouteMethod.DELETE,
    description: "Delete a category from a server"
  },
  {
    path: "/categories",
    method: RouteMethod.GET,
    description: "Get all categories"
  },
  {
    path: "/categories",
    method: RouteMethod.POST,
    description: "Create a category"
  },
  {
    path: "/categories/:category_id",
    method: RouteMethod.GET,
    description: "Get a category"
  },
  {
    path: "/categories/:category_id",
    method: RouteMethod.PUT,
    description: "Update a category"
  },
  {
    path: "/categories/:category_id",
    method: RouteMethod.DELETE,
    description: "Delete a category"
  },
  {
    path: "/servers/:server_id/stats",
    method: RouteMethod.GET,
    description: "Get stats for a server"
  },
  {
    path: "/users",
    method: RouteMethod.GET,
    description: "Get all users"
  },
  {
    path: "/users/:user_id",
    method: RouteMethod.GET,
    description: "Get a user"
  },
  {
    path: "/users/:user_id",
    method: RouteMethod.PUT,
    description: "Update a user"
  },
  {
    path: "/users/:user_id",
    method: RouteMethod.DELETE,
    description: "Delete a user"
  },
  {
    path: "/me",
    method: RouteMethod.GET,
    description: "Get the current user"
  },
  {
    path: "/change-password",
    method: RouteMethod.PUT,
    description: "Change the password for the current user"
  },
  {
    path: "/login/:provider",
    method: RouteMethod.GET,
    description: "Login with a provider"
  },
  {
    path: "/callback/:provider",
    method: RouteMethod.GET,
    description: "Callback for a provider"
  }
]


const ApiPage = () => {
  return <div className="flex flex-col gap-4 py-4">
    {routes.map((route) => (
      <Route key={route.path} path={route.path} method={route.method} description={route.description}>
        <div>Route</div>
      </Route>
    ))}
  </div>;
};

export default ApiPage;
