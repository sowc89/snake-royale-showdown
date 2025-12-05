import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/auth": "http://127.0.0.1:8001",
      "/rooms": "http://127.0.0.1:8001",
      "/games": "http://127.0.0.1:8001",
      "/leaderboard": "http://127.0.0.1:8001",
      "/live-games": "http://127.0.0.1:8001",
      "/modes": "http://127.0.0.1:8001",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
