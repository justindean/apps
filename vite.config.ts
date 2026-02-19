import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    host: true,
    watch: {
      ignored: ["**/vite.config.*"],
    },
  },
  plugins: [react()],
});
