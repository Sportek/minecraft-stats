"use client";
import Route, { RouteMethod } from "@/components/api/route";

const routes = [
  {
    path: "/servers",
    method: RouteMethod.GET,
    description: "Get all servers",
    response: {
      "200": {
        description: "Success",
        type: "array",
        items: {
          type: "object",
          properties: {
            server: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                adress: { type: "string" },
                port: { type: "number" },
                version: { type: "string | null" },
                motd: { type: "string | null" },
                imageUrl: { type: "string | null" },
              },
            },
            stats: {
              type: "object",
              properties: {
                id: { type: "number" },
                serverId: { type: "number" },
                playerCount: { type: "number" },
                maxCount: { type: "number" },
                createdAt: { type: "date" },
              },
            },
            categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                id: { type: "number" },
                name: { type: "string" },
                createdAt: { type: "date" },
                updatedAt: { type: "date" },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    path: "/servers",
    method: RouteMethod.POST,
    description: "Create a server",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/servers/:id",
    method: RouteMethod.GET,
    description: "Get a server",
  },
  {
    path: "/servers/:id",
    method: RouteMethod.PUT,
    description: "Update a server",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/servers/:id",
    method: RouteMethod.DELETE,
    description: "Delete a server",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/servers/:server_id/categories",
    method: RouteMethod.GET,
    description: "Get all categories for a server",
  },
  {
    path: "/servers/:server_id/categories",
    method: RouteMethod.POST,
    description: "Add a category to a server",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/servers/:server_id/categories/:category_id",
    method: RouteMethod.DELETE,
    description: "Delete a category from a server",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/categories",
    method: RouteMethod.GET,
    description: "Get all categories",
  },
  {
    path: "/categories",
    method: RouteMethod.POST,
    description: "Create a category",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/categories/:category_id",
    method: RouteMethod.GET,
    description: "Get a category",
  },
  {
    path: "/categories/:category_id",
    method: RouteMethod.PUT,
    description: "Update a category",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/categories/:category_id",
    method: RouteMethod.DELETE,
    description: "Delete a category",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/servers/:server_id/stats",
    method: RouteMethod.GET,
    description: "Get stats for a server",
  },
  {
    path: "/users",
    method: RouteMethod.GET,
    description: "Get all users",
  },
  {
    path: "/users/:user_id",
    method: RouteMethod.GET,
    description: "Get a user",
  },
  {
    path: "/users/:user_id",
    method: RouteMethod.PUT,
    description: "Update a user",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/users/:user_id",
    method: RouteMethod.DELETE,
    description: "Delete a user",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/me",
    method: RouteMethod.GET,
    description: "Get the current user",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/change-password",
    method: RouteMethod.PUT,
    description: "Change the password for the current user",
    headers: {
      Authorization: "Bearer <token>",
    },
  },
  {
    path: "/login/:provider",
    method: RouteMethod.GET,
    description: "Login with a provider",
  },
  {
    path: "/callback/:provider",
    method: RouteMethod.GET,
    description: "Callback for a provider",
  },
];

const ApiPage = () => {
  return (
    <div className="flex flex-col gap-4 py-4">
      {routes.map((route) => (
        <Route
          key={`${route.path}-${route.method}`}
          path={route.path}
          method={route.method}
          description={route.description}
        >
          <div>Route</div>
        </Route>
      ))}
    </div>
  );
};

export default ApiPage;
