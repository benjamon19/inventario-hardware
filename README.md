# 📦 Wall | Inventario (Hardware Management System)

Un sistema de gestión de inventario de hardware moderno, rápido y en tiempo real, construido con **Next.js 14**, **Supabase** y **Tailwind CSS**. Está diseñado para equipos y departamentos de TI que necesitan mantener un control estricto de sus activos, generar etiquetas QR de forma masiva y escanear equipos para registrar entradas y salidas rápidamente.

<div align="center">
  <img src="./public/docs/1.png?v=2" alt="Login Wall" width="800" />
</div>

---

## 🚀 Características Principales

### 📊 Dashboard General
Una visión global e instantánea del estado del inventario, con métricas clave y accesos directos.
<div align="center">
  <img src="./public/docs/2.png?v=2" alt="Dashboard General" width="800" />
</div>

### 📦 Panel de Inventario en Tiempo Real 🔄
Gestiona todos tus activos tecnológicos. La tabla se actualiza en tiempo real gracias a los WebSockets de Supabase, lo que significa que varios operadores pueden estar usando el sistema a la vez sin necesidad de recargar la página.
- **Búsqueda instantánea:** Busca por modelo, número de serie o SKU.
- **Filtros rápidos:** Filtra fácilmente el inventario por Categoría, Estado o Ubicación (con scroll horizontal fluido).
- **Control de Metadatos:** Añade nuevas Categorías, Estados o Ubicaciones dinámicamente desde el propio formulario.

<div align="center">
  <img src="./public/docs/3.png?v=2" alt="Vista Principal del Inventario" width="800" />
</div>

#### Registro de Nuevos Equipos
<div align="center">
  <img src="./public/docs/4.png?v=2" alt="Registrar Nuevo Equipo" width="800" />
</div>

#### Potenciado con Inteligencia Artificial 🧠
El sistema integra **Gemini 2.5 Pro** para potenciar el análisis de datos. Toma una foto al equipo o al código de barras y la IA se encarga de extraer la información automáticamente.
<div align="center">
  <img src="./public/docs/5.png?v=2" alt="Potenciado con IA - Gemini 2.5" width="800" />
</div>

### 🖨️ Generación Masiva de Etiquetas QR
Olvídate de crear QRs uno por uno. El sistema cuenta con un módulo dedicado para prepararlos y enviarlos directo a la impresora térmica.

<div align="center">
  <img src="./public/docs/6.png?v=2" alt="Generar QR Vista Principal" width="800" />
</div>

<div align="center">
  <img src="./public/docs/7.png?v=2" alt="Detalle QR Individual" width="800" />
</div>

#### Modo de Selección Múltiple y Vista de Impresión
Selecciona múltiples equipos simultáneamente para imprimir toda una tanda de etiquetas de una sola vez con formato optimizado.

<div align="center">
  <img src="./public/docs/8.png?v=2" alt="Selección Múltiple de Códigos QR" width="800" />
</div>
<br/>
<div align="center">
  <img src="./public/docs/9.png?v=2" alt="Vista Optimizada para Imprimir" width="800" />
</div>

### 📷 Escáner de Hardware Integrado
Agiliza las salidas o ingresos al almacén de forma impecable usando la cámara del dispositivo móvil, tablet o webcam.
- **Detección automática:** Identifica al instante el SKU escaneado.

<div align="center">
  <img src="./public/docs/10.png?v=2" alt="Escáner en funcionamiento" width="800" />
</div>

#### Gestión de Movimientos
Mueve el stock, busca detalles y cambia el estado del equipo con un solo toque (Ej: "Disponible" -> "En Uso").

<div align="center">
  <img src="./public/docs/11.png?v=2" alt="Vista Mover Stock" width="800" />
</div>
<br/>
<div align="center">
  <img src="./public/docs/12.png?v=2" alt="Buscar Detalles" width="800" />
</div>

### 📖 Registro de Actividad y Auditoría (Logs)
Mantén el control absoluto. Toda acción dentro del sistema queda registrada inmutablemente.
- **Trazabilidad total:** Conoce quién, qué y cuándo ocurrió un movimiento.

<div align="center">
  <img src="./public/docs/13.png?v=2" alt="Historial de Actividad" width="800" />
</div>

### ⚙️ Configuración y Perfil
Personaliza tu experiencia de usuario, edita tu avatar y configura los parámetros del sistema.

<div align="center">
  <img src="./public/docs/14.png?v=2" alt="Configuración de Cuenta y Perfil" width="800" />
</div>

---

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, React 18, Server Components)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Realtime, RLS policies, Auth)
- **Inteligencia Artificial:** [Google Gemini 2.5 Pro](https://deepmind.google/technologies/gemini/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes / Iconos:** Headless UI, Lucide React
- **Otros:** `qrcode.react` (Generación QR), `ldrs` (Spinners de carga)

---

## 💻 Desarrollo Local

Para correr este proyecto en tu máquina de forma local:

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/benjamon19/inventario-hardware.git
   cd inventario-hardware
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase y de la API de Gemini:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   GEMINI_API_KEY=tu_api_key_de_gemini
   ```

4. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## 📁 Estructura del Proyecto

```text
src/
├── app/                  # Next.js App Router (Páginas y layouts principales)
│   ├── (auth)/           # Pantallas de Login
│   ├── admin/            # Módulos del Panel Administrativo (Protegidos)
│   │   ├── inventario/   # Gestión de equipos CRUD
│   │   ├── generar-qr/   # Generador y print de etiquetas
│   │   ├── escaner/      # Escáner vía cámara web o móvil
│   │   └── actividad/    # Logs y registro de transacciones
│   └── ...
├── components/           # Componentes UI reutilizables (Modales, Tablas, UI Base)
├── hooks/                # Custom React hooks (ej: useRealtimeTable, useAvatar)
├── lib/                  # Utilidades, configuración Supabase, Loggers y Mapeo de Colores
└── types/                # Interfaces y definiciones de TypeScript
```

---

## 🛡️ Licencia y Uso
Wall | Inventario - Sistema diseñado y construido para gestión corporativa interna.
