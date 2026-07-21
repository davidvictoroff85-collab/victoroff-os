import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local", "127.0.0.1", "localhost"],
  },
  build: {
    target: "es2022",
  },
});
