import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [{ title: "টিফিনব্রেক" }];
}

// Placeholder until the landing page ticket ports theme/index.html.
export default function Home() {
  return (
    <main>
      <h1>টিফিনব্রেক</h1>
    </main>
  );
}
