import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("login/:provider", "routes/login-provider.ts"),
  route("logout", "routes/logout.ts"),
  route("feed", "routes/feed.tsx"),
  route("health", "routes/health.ts"),
  route("manifest.webmanifest", "routes/manifest.ts"),
] satisfies RouteConfig;
