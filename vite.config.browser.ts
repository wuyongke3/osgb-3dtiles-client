import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: { host: "127.0.0.1", port: 5199, strictPort: true },
  plugins: [vue()],
});
