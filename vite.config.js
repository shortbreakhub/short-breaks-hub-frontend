import {readFileSync} from "node:fs";
import {HOME_PLANNING_DATA_ID} from "./src/utils/homePlanning.js";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss(), {
    name: "published-home-planning-bootstrap",
    apply: "serve",
    transformIndexHtml(html) {
      // Dev serves the source shell rather than prerendered HTML. Reuse the
      // current build's published inventory; no extra API or maintained data.
      try {
        const published = readFileSync(new URL("./dist/index.html", import.meta.url), "utf8");
        const script = published.match(new RegExp(`<script id="${HOME_PLANNING_DATA_ID}" type="application/json">[\\s\\S]*?</script>`))?.[0];
        return script && !html.includes(`id="${HOME_PLANNING_DATA_ID}"`)
          ? html.replace("</body>", `${script}\n</body>`) : html;
      } catch {
        console.warn("Homepage destination CTA: run npm run build to supply the published inventory for development.");
        return html;
      }
    },
  }],
  worker: { format: 'es' },
  build: {
    manifest: true,
  },
})
