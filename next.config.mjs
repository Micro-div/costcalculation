/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANT: no `output: 'export'` here. Static export removes API routes
  // (app/api/analyze, app/api/estimates), which are required for the AI
  // analysis. Deploy as a normal Next.js app (Vercel default).

  // Fix Windows build crash during trace collection
  // Limit build workers: this machine has ~4GB RAM and the worker pool
  // otherwise gets OOM-killed during static generation/export
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

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