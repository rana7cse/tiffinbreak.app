import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("login/:provider", "routes/login-provider.ts"),
  route("logout", "routes/logout.ts"),
  route("feed", "routes/feed.tsx"),
  route("write", "routes/write.tsx"),
  route("schools", "routes/schools.ts"),
  route("stories/:id", "routes/story.tsx"),
  route("covers/:name", "routes/covers.ts"),
  route("profile", "routes/profile.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("data-deletion", "routes/data-deletion.tsx"),
  route("health", "routes/health.ts"),
  route("manifest.webmanifest", "routes/manifest.ts"),
] satisfies RouteConfig;
