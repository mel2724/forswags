// Vite Configuration - Force rebuild v20
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fejnevxardxejdvjbipc.supabase.co'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlam5ldnhhcmR4ZWpkdmpiaXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQyOTQsImV4cCI6MjA3NDc0MDI5NH0.J_50aQGhUNGZu27lkTmjmoZwBQljw6eR_7DLIQ7rJiE'),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
