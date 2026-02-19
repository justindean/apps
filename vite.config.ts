import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  server: {
    host: true,
    watch: {
      ignored: ["**/vite.config.*", "**/tsconfig*"],
    },
  },
  plugins: [react()],
});
