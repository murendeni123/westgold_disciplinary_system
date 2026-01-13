/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase Configuration (Required)
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  // Legacy API Configuration
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_API_URL?: string;
  
  // App Configuration
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

