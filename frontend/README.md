# Rate by Recommendation

Una aplicación web profesional para buscar y explorar películas usando la API de The Movie Database (TMDb). Contiene la opción de calificar dicho contenido y aparecerán recomendaciones.

## Características

- 🔍 Búsqueda de películas en tiempo real
- 🎬 Tarjetas de películas con póster y detalles
- 📱 Diseño responsive y moderno
- ⭐ Visualización de calificaciones
- 🎨 Interfaz oscura y profesional

## Configuración

### 1. Obtener API Key de TMDb

1. Visita [The Movie Database](https://www.themoviedb.org/)
2. Crea una cuenta o inicia sesión
3. Ve a [Configuración de API](https://www.themoviedb.org/settings/api)
4. Solicita una API Key (es gratuita)
5. Copia tu API Key

### 2. Configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a **Settings** > **API** y copia:
   - **Project URL** (tu `REACT_APP_SUPABASE_URL`)
   - **anon/public key** (tu `REACT_APP_SUPABASE_ANON_KEY`)
4. Ejecuta los comandos SQL del archivo `SUPABASE_SETUP.md` en el SQL Editor de Supabase

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `frontend` con el siguiente contenido:

```
REACT_APP_TMDB_API_KEY=tu_api_key_aqui
REACT_APP_SUPABASE_URL=https://tu-proyecto-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

- **REACT_APP_TMDB_API_KEY**: Necesario para buscar películas (obligatorio)
- **REACT_APP_SUPABASE_URL**: URL de tu proyecto Supabase (obligatorio)
- **REACT_APP_SUPABASE_ANON_KEY**: Clave pública de Supabase (obligatorio)

Reemplaza los valores con tus credenciales reales.

### 4. Instalar Dependencias

```bash
cd frontend
npm install
```

### 5. Ejecutar la Aplicación

```bash
npm start
```

La aplicación se abrirá en [http://localhost:3000](http://localhost:3000)

## Uso

1. Ingresa el nombre de una película en el buscador
2. Haz clic en "Buscar" o presiona Enter
3. Explora los resultados en las tarjetas de películas
4. Haz clic en cualquier película para ver sus detalles
5. En el modal de detalles, puedes:
   - Ver información completa de la película
   - Calificar la película con estrellas (1-10)
   - Ver sinopsis, géneros, duración y más

### Características de Calificación

- Sistema de calificación con 5 estrellas (0-5)
- Reseñas personalizadas con texto opcional
- Calificaciones guardadas en Supabase
- Lista de seguimiento (watchlist) personal
- Autenticación completa con Supabase
- Cada usuario tiene su propio perfil y reseñas

## Tecnologías

- React 19
- TMDb API v3
- CSS3 con gradientes y animaciones
- Diseño responsive con CSS Grid

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── App.js          # Componente principal
│   ├── App.css         # Estilos de la aplicación
│   └── index.js        # Punto de entrada
├── .env                # Variables de entorno (crear manualmente)
└── package.json        # Dependencias del proyecto
```

## Notas

- Asegúrate de tener una conexión a internet para usar la API de TMDb
- La API Key debe mantenerse segura y no compartirse públicamente
- El archivo `.env` debe estar en `.gitignore` para no subirlo al repositorio
