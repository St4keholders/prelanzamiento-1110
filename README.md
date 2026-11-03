# Ahorcadito Diario · 11Diez (4 al 14 de noviembre de 2026)

Aplicación web para la campaña **Ahorcadito Diario 11Diez**: 11 días seguidos (del **4 al 14 de noviembre de 2026**, hora oficial de Colombia `America/Bogota`, UTC−5) con una palabra secreta por día, un único intento por persona por día, **3 vidas** y **120 segundos** por partida.

Construida con **Next.js (App Router + TypeScript + Tailwind CSS)** y **Supabase** consumido exclusivamente desde el servidor (`SUPABASE_SECRET_KEY`). La palabra del día **nunca** viaja al navegador.

---

## 1.Cómo correr en local

1. **Requisitos**: Node.js 20+ y `pnpm`.
2. **Instalar dependencias**:
   ```bash
   pnpm install
   ```
3. **Configurar variables de entorno**:
   Copia `.env.example` a `.env.local` y completa los valores:
   ```bash
   cp .env.example .env.local
   ```
   Variables requeridas en `.env.local`:
   - `SUPABASE_URL`: URL del proyecto Supabase.
   - `SUPABASE_SECRET_KEY`: clave secreta `sb_secret_...` (solo servidor).
   - `SESSION_SECRET`: cadena aleatoria de mínimo 32 caracteres (puedes generarla con `openssl rand -base64 48`).
   - `ADMIN_USER`: usuario para entrar a `/admin`.
   - `ADMIN_PASSWORD`: contraseña para entrar a `/admin`.
   - `DEV_FAKE_NOW` *(opcional, solo desarrollo)*: fecha/hora ISO para simular el reloj del servidor en local (ej. `2026-11-06T10:00:00-05:00`). Se ignora por completo cuando `NODE_ENV=production`.
4. **Iniciar el servidor de desarrollo**:
   ```bash
   pnpm dev
   ```
   Abre [http://localhost:3000](http://localhost:3000).
5. **Correr pruebas y validaciones**:
   ```bash
   pnpm test
   pnpm lint
   pnpm build
   ```

---

## 2. Cómo cargar las 11 palabras del reto en Supabase

Las palabras viven únicamente en la tabla `public.daily_words` de Supabase:

1. Abre el archivo [`supabase/seed-palabras.sql`](./supabase/seed-palabras.sql).
2. Reemplaza cada `PALABRA_DIA_1` … `PALABRA_DIA_11` y `CATEGORIA_DIA_1` … `CATEGORIA_DIA_11` por la palabra/frase (en MAYÚSCULAS; puede llevar espacios, tildes, `Ñ` o guiones) y su categoría.
   > ⚠️ **No guardes ni subas a Git** el archivo con las palabras reales si el repositorio es público.
3. Entra a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**, pega el contenido y pulsa **Run**.
4. Verifica que quedaron las 11 filas ejecutando:
   ```sql
   select game_date, word, category from public.daily_words order by game_date;
   ```

---

## 3. Cómo desplegar en Vercel

1. Sube este repositorio a tu cuenta de GitHub.
2. En [Vercel](https://vercel.com), haz clic en **Add New… → Project** e importa el repositorio.
3. En la sección **Environment Variables**, agrega **únicamente** estas 5 variables (para *Production*, *Preview* y *Development*):
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `SESSION_SECRET` (genera uno fuerte con `openssl rand -base64 48`)
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   > 🚫 **No agregues** `DEV_FAKE_NOW` ni tokens personales de Supabase (`SUPABASE_ACCESS_TOKEN`).
4. Haz clic en **Deploy**.

---

## 4. Cómo entrar al panel de administración (`/admin`)

1. Abre `https://tu-dominio.vercel.app/admin/login` (o `http://localhost:3000/admin/login` en local).
2. Ingresa con el usuario y la contraseña configurados en `ADMIN_USER` y `ADMIN_PASSWORD`.
3. Dentro del panel encontrarás tres vistas:
   - **Resumen (`/admin`)**: total de inscritos y tabla de los 11 días con la palabra del día, cuántos iniciaron, ganadores, derrotas por vidas, derrotas por tiempo y partidas en curso.
   - **Inscritos (`/admin/inscritos`)**: buscador por nombre, correo o celular, días jugados/ganados y alerta visual cuando un mismo número de celular está registrado con varios correos.
   - **Resultados por día (`/admin/resultados`)**: selector del Día 1 al Día 11, ganadores ordenados por hora de finalización (el primero arriba), buscador y botones de descarga en **Excel (`.xlsx`)** y **CSV (`;` con BOM UTF-8)** tanto del día seleccionado como de todos los días.

---

## 5. Cómo cambiar la palabra de un día si hiciera falta

Desde el **SQL Editor** de Supabase ejecuta:

```sql
update public.daily_words
   set word = 'NUEVA PALABRA EN MAYÚSCULAS',
       category = 'Nueva categoría'
 where game_date = '2026-11-06';
```

> Recomendación: haz cambios de palabra **antes** de las 12:00 AM (hora Colombia) de ese día para que ningún participante haya iniciado partida con la palabra anterior.

---

## 6. Cómo verificar un código de ganador

Cuando un participante envíe su captura de pantalla de victoria:

1. Entra a `/admin/resultados` y selecciona la fecha correspondiente al día que aparece en la captura.
2. Escribe el código único (formato `11D-XXXXXX`, por ejemplo `11D-7KQ2XM`) en el buscador y pulsa **Buscar**.
3. Confirma que coincidan:
   - **Código ganador** (`11D-...`)
   - **Nombre completo** y **correo**
   - **Estado**: `Ganó`
   - **Hora de fin (Colombia)**, **duración** y **vidas restantes**.
