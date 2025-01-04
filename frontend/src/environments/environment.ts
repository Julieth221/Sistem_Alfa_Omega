// Definir el tipo para las variables de entorno
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_ENV: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'  // URL de tu API NestJS
}; 