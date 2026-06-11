# Gusto Soft - Frontend

## Descripción

Aplicación cliente web para la gestión de restaurantes desarrollada con React, TypeScript y Vite.

## Estructura principal

- `src/`
  - `main.tsx`: punto de entrada de la aplicación.
  - `App.tsx`: componente raíz.
  - `styles.css`: estilos globales.
  - `api/`: cliente Axios y configuración de llamadas a la API.
  - `auth/`: contexto de autenticación.
  - `components/`: componentes reutilizables.
  - `hooks/`: hooks personalizados.
  - `pages/`: pantallas de la aplicación.
  - `services/`: servicios para interactuar con endpoints.

## Tecnologías

- React 19
- TypeScript
- Vite
- Axios
- Socket.IO Client
- jwt-decode

## Requisitos

- Node.js 20+ (o compatible con las dependencias del proyecto)
- npm

## Instalación

```bash
cd frontend-2
npm install
```

## Ejecución

```bash
cd frontend-2
npm run dev
```

## Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo Vite.
- `npm run build`: compila la aplicación para producción.
- `npm run preview`: sirve la versión construida localmente.
- `npm run lint`: ejecuta ESLint en el proyecto.

## Notas

- El frontend depende de un backend/API para obtener datos y autenticar usuarios.
- Revisa `src/services/` y `src/api/client.ts` para las integraciones con la API.
