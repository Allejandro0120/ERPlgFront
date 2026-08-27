# LogicPharma ERP — Frontend

Frontend del ERP de LogicPharma, construido con Vue 3, Vite y Vuetify.

## Requisitos

- Node.js 18+
- El backend de LogicPharma corriendo (repo `ERPSanBack`)

## Configuración

Copia `.env.example` a `.env` y ajusta la URL del backend si es necesario:

```sh
cp .env.example .env
```

- `VITE_API_URL`: URL base de la API del backend.

## Instalación

```sh
npm install
```

## Desarrollo

```sh
npm run dev
```

## Build de producción

```sh
npm run build
npm run preview   # sirve el build localmente para verificarlo
```

## Lint y formato

```sh
npm run lint        # revisa el código
npm run lint:fix     # corrige lo que se pueda automáticamente
npm run format       # formatea con Prettier
```

Un hook de pre-commit (Husky + lint-staged) corre lint/formato sobre los
archivos modificados, y un hook de pre-push corre `npm run build` para
evitar subir código que rompa el build de producción.

## Convención de commits

Los mensajes de commit deben seguir [Conventional Commits](https://www.conventionalcommits.org/)
(`tipo: descripción`).

- `feat`: funcionalidad nueva
- `fix`: corrección de un bug
- `chore`: mantenimiento (config, dependencias, limpieza)
- `docs`: solo documentación
- `refactor`: reordenar código sin cambiar comportamiento
- `style`: formato/espacios, sin cambios de lógica
- `perf`: mejora de rendimiento
- `test`: agregar o editar tests

Ejemplos:

```text
fix: corregir cálculo de saldo en cartera
feat: agregar filtro por fecha en recepciones
chore: actualizar dependencias de vuetify
```

## Estructura del proyecto

```text
src/
  api/          # cliente axios, servicios por dominio, middleware de auth
  layout/       # layouts de la app (Default, Blank) y componentes de sidebar
  modules/      # un módulo por dominio de negocio (auth, cartera, comercial, facturacion, mercancia)
  plugins/      # registro de plugins de Vue (Vuetify, toast, loading, confirm)
  router/       # definición de rutas y guard de autenticación
  shared/       # composables, componentes UI y utilidades reutilizables entre módulos
  stores/       # stores de Pinia
  styles/       # estilos globales
  theme/        # configuración del tema de Vuetify
```

Cada módulo declara sus propias rutas en `<modulo>Routes.js` y estas se
registran en `src/router/index.js`.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (y deshabilitar Vetur).
