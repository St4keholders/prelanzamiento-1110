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

## 2. Cómo cargar las 11 palabras del reto

**Desde el panel de administración → Palabras (`/admin/palabras`).** Ahí ves los 11 días; en cada uno escribes la palabra o frase y su categoría y pulsas **Guardar**.

- La palabra de un día se puede escribir o cambiar **hasta las 11:59 p. m. del día anterior** (hora Colombia). Ej.: la del 5 de noviembre, hasta el 4 de noviembre a las 11:59 p. m.
- Cuando su día empieza (12:00 a. m.) queda **bloqueada**, y los días pasados también. El servidor lo valida, no solo la pantalla.
- Se guarda en MAYÚSCULAS automáticamente. Puede llevar espacios, tildes, `Ñ`, guiones o puntos.

> Alternativa por SQL: [`supabase/seed-palabras.sql`](./supabase/seed-palabras.sql) en el **SQL Editor** de Supabase (no tiene el bloqueo por fecha, úsalo con cuidado). ⚠️ No subas a Git ese archivo con las palabras reales.

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
3. Dentro del panel encontrarás cuatro vistas:
   - **Resumen (`/admin`)**: total de inscritos y tabla de los 11 días con la palabra del día, cuántos iniciaron, ganadores, derrotas por vidas, derrotas por tiempo y partidas en curso.
   - **Palabras (`/admin/palabras`)**: cargar o editar la palabra y la categoría de cada día (ver sección 2).
   - **Inscritos (`/admin/inscritos`)**: buscador por nombre, correo o celular, días jugados/ganados y alerta visual cuando un mismo número de celular está registrado con varios correos.
   - **Resultados por día (`/admin/resultados`)**: selector del Día 1 al Día 11, ganadores ordenados por hora de finalización (el primero arriba), buscador y botones de descarga en **Excel (`.xlsx`)** y **CSV (`;` con BOM UTF-8)** tanto del día seleccionado como de todos los días.

---

## 5. Cómo cambiar la palabra de un día si hiciera falta

Desde **Panel → Palabras**, antes de las 11:59 p. m. del día anterior. Una vez empieza el día ya no se puede cambiar desde el panel, para que nadie juegue con una palabra distinta a la de los demás.

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
