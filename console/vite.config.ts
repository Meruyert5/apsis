import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The production CSP. Nothing in the site loads a third party, calls the
// network, or runs an inline script, so the policy stays narrow.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export default defineConfig({
  plugins: [
    react(),
    {
      // Production only: the dev server needs an inline React refresh preamble.
      name: "apsis-csp",
      apply: "build",
      transformIndexHtml(html: string) {
        return html.replace(
          "</head>",
          `    <meta http-equiv="Content-Security-Policy" content="${CSP}" />\n  </head>`,
        );
      },
    },
  ],
  base: "./",
  build: {
    outDir: "dist",
    target: "es2022",
    rollupOptions: {
      input: {
        main: "index.html",
        dashboard: "dashboard.html",
      },
    },
    // The sixteen account bundles are inlined so the site makes no requests
    // for data; the raw size is the dataset itself.
    chunkSizeWarningLimit: 800,
  },
});


