/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANT: no `output: 'export'` here. Static export removes API routes
  // (app/api/analyze, app/api/estimates), which are required for the AI
  // analysis. Deploy as a normal Next.js app (Vercel default).

  // NOTE: do NOT re-add `experimental: { workerThreads: false, cpus: 1 }`.
  // Limiting the build to one CPU makes Next.js 15.3 race its own trace
  // collection on Windows and the build dies with ENOENT on
  // pages-manifest.json / middleware-manifest.json before emitting output.
  // The default worker pool builds reliably here and on Vercel.

  // Specify the path if your app is not deployed at the root of your domain.
  // basePath: '/',

  // Optional: Change links `/me` -> `/me/` and emit `/me.html` -> `/me/index.html`
  // trailingSlash: true,

  // Optional: Prevent automatic `/me` -> `/me/`, instead preserve `href`
  // skipTrailingSlashRedirect: true,

  // Optional: Change the output directory `out` -> `dist`. Remember to update
  // it in .gitlab-ci.yml as well.
  // distDir: 'dist',
};

export default nextConfig;