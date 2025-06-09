import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // Validate required environment variables
  const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingEnvVars = requiredEnvVars.filter(key => !env[key]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    console.error('Please create a .env file in the root directory with the following variables:');
    console.error(requiredEnvVars.map(key => `${key}=your-value-here`).join('\n'));
  }

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : '';

  return {
    define: {
      // Pass environment variables to the client
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  server: {
    host: "::",
    port: 8080,
      cors: true,
    proxy: {
        '/rest/v1': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          secure: true,
          headers: {
            'apikey': env.VITE_SUPABASE_ANON_KEY
          }
        },
        '/auth/v1': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          secure: true,
          headers: {
            'apikey': env.VITE_SUPABASE_ANON_KEY
          }
        },
        '/storage/v1': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          secure: true,
          headers: {
            'apikey': env.VITE_SUPABASE_ANON_KEY
          }
        },
        '/realtime/v1': {
          target: env.VITE_SUPABASE_URL?.replace('http', 'ws'),
        changeOrigin: true,
          secure: true,
          ws: true,
          headers: {
            'apikey': env.VITE_SUPABASE_ANON_KEY
          },
          rewrite: (path) => path.replace(/^\/realtime\/v1/, '')
        }
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization, apikey'
      }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
