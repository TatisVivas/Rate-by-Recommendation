# Rate by Recommendation 🎬

Una aplicación web moderna para descubrir, calificar y gestionar películas usando la API de The Movie Database (TMDb).

## ✨ Características

- 🔍 **Búsqueda de películas** en tiempo real
- ⭐ **Sistema de calificaciones** personalizado (1-5 estrellas)
- 📝 **Reseñas** con texto opcional
- 📋 **Lista de seguimiento** (Watchlist) personal
- 🎯 **Recomendaciones inteligentes** basadas en tu lista
- 🎨 **Temas claro/oscuro** con preferencias guardadas
- 🌐 **Multiidioma** (Español/Inglés)
- 💫 **Cursor interactivo** con efectos fluidos
- 📱 **Diseño responsive** y moderno

## 🚀 Tecnologías

- **Frontend:** React 19
- **Base de datos:** Supabase
- **API:** The Movie Database (TMDB)
- **Estilos:** CSS3 con gradientes y animaciones

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Cuenta en [The Movie Database](https://www.themoviedb.org/)
- Cuenta en [Supabase](https://supabase.com)

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd movie-app-fullstack
   ```

2. **Instalar dependencias**
   ```bash
   cd frontend
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la carpeta `frontend`:
   ```env
   REACT_APP_TMDB_API_KEY=tu_api_key_aqui
   REACT_APP_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```

4. **Configurar Supabase**
   
   - Crea un proyecto en Supabase
   - Ejecuta los comandos SQL necesarios para crear las tablas:
     - `profiles`
     - `watchlist`
     - `reviews`
     - `preferences`

5. **Ejecutar la aplicación**
   ```bash
   npm start
   ```

   La aplicación se abrirá en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
movie-app-fullstack/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── rbr.ico
│   │   └── ...
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas principales
│   │   ├── context/         # Context API
│   │   ├── lib/             # Configuración Supabase
│   │   ├── styles/          # Estilos globales
│   │   └── utils/           # Utilidades y traducciones
│   ├── package.json
│   └── README.md
└── README.md
```

## 🎯 Funcionalidades Principales

### Búsqueda y Exploración
- Búsqueda de películas por título
- Películas en tendencia
- Detalles completos de cada película

### Gestión Personal
- Perfil de usuario personalizable
- Lista de seguimiento (watchlist)
- Calificaciones y reseñas guardadas
- Preferencias de tema e idioma

### Recomendaciones
- Recomendaciones basadas en tu watchlist
- Películas similares
- Películas populares en tus géneros favoritos

## 📝 Notas

- Asegúrate de tener una conexión a internet para usar la API de TMDb
- La API Key debe mantenerse segura y no compartirse públicamente
- El archivo `.env` debe estar en `.gitignore` para no subirlo al repositorio

## 📄 Licencia

Este proyecto utiliza la API de TMDb pero no está respaldado ni certificado por TMDb.

© 2026 Rate by Recommendation - Tatis Vivas

## 🙏 Agradecimientos

- [The Movie Database (TMDb)](https://www.themoviedb.org/) por la API
- [Supabase](https://supabase.com) por el backend como servicio

