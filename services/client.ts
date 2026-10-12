// The one place to point the app at a real backend later. Nothing reads this
// yet, but every service function is written as if it already does, so
// connecting a backend is a contained change to just the files in /services.
//
// Expo only exposes env vars to app code if they start with EXPO_PUBLIC_.
// Put it in a .env file at the project root, e.g.:
//   EXPO_PUBLIC_API_URL=https://your-api.example.com
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Simulates network latency so loading states actually get exercised during
// development. Delete this helper (and its calls) once real fetch() calls are in.
export function mockDelay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
