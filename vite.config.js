import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the build work on any GitHub Pages project path (user.github.io/repo/)
export default defineConfig({
  base: "./",
  plugins: [react()],
});
