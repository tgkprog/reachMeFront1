import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: true,
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, "cert/reachme2.com+5-key.pem")
      ),
      cert: fs.readFileSync(path.resolve(__dirname, "cert/reachme2.com+5.pem")),
    },
  },
});
