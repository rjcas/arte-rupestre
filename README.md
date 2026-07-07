# Arte Rupestre — Sistema de registro de sitios

Reemplazo web del sistema original (SQL Server + Visual Basic, CONICET) para el registro
de datos de Arte Rupestre Patagónico, según el **Apéndice N° 3 - Guía para el ingreso de
datos de Arte Rupestre**.

Cubre los seis módulos: **I. Lugar, II. Motivos, III. Técnicas, IV. Antropomorfos,
V. Operaciones Cognitivas, VI. Conjunto**, con cálculo automático de tamaño, cromatismo y
proporcionalidad tal como los define el apéndice.

Los editores acceden con usuario y contraseña. Solo el administrador (vos) da de alta las
cuentas, con un comando de consola — no hay registro público.

---

## 1. Qué necesitás (todo gratis)

1. Una cuenta en **[Neon](https://neon.tech)** — base de datos PostgreSQL gratuita.
2. Una cuenta en **[Vercel](https://vercel.com)** — hosting de la aplicación.
3. Una cuenta en **[GitHub](https://github.com)** — para subir el código (Vercel se conecta desde ahí).
4. **Node.js** instalado en tu computadora (para correr el comando de alta de editores). Descargalo de [nodejs.org](https://nodejs.org) si no lo tenés.

---

## 2. Crear la base de datos en Neon

1. Entrá a [neon.tech](https://neon.tech) y creá una cuenta gratuita.
2. Creá un proyecto nuevo (podés llamarlo `arte-rupestre`).
3. En el panel del proyecto, buscá **"Connection string"** y copiala. Se ve así:
   ```
   postgres://usuario:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Guardala, la vas a necesitar en el paso 4 y 5.

---

## 3. Subir el código a GitHub

1. Creá un repositorio nuevo en GitHub (por ejemplo `arte-rupestre`), vacío, sin README.
2. En tu computadora, dentro de la carpeta del proyecto que te compartí:
   ```bash
   git init
   git add .
   git commit -m "Primera versión"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/arte-rupestre.git
   git push -u origin main
   ```

---

## 4. Aplicar el esquema de la base de datos

Antes de desplegar, hay que crear las tablas en Neon. Desde tu computadora, dentro de la
carpeta del proyecto:

```bash
npm install
echo "DATABASE_URL=TU_CONNECTION_STRING_DE_NEON" > .env.local
npm run migrate
```

Si ves `Listo. Tablas creadas/actualizadas.`, la base ya está lista.

---

## 5. Desplegar en Vercel

1. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con tu cuenta de GitHub.
2. Hacé clic en **"Add New… → Project"** y elegí el repositorio `arte-rupestre`.
3. En **"Environment Variables"**, agregá:
   - `DATABASE_URL` → la connection string de Neon (paso 2).
   - `JWT_SECRET` → una clave secreta aleatoria. La generás corriendo esto en tu computadora:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
     y pegás el resultado.
4. Hacé clic en **"Deploy"**. En un par de minutos vas a tener tu URL, algo como
   `https://arte-rupestre.vercel.app`.

---

## 6. Dar de alta a los editores

Los editores no se registran solos: vos les creás la cuenta desde tu computadora. Con el
mismo `.env.local` del paso 4 (apuntando a la base de Neon):

```bash
npm run create-user
```

Te va a pedir usuario, nombre y contraseña. Repetilo una vez por cada editor. También sirve
para cambiar la contraseña de alguien: si volvés a poner el mismo usuario, la actualiza.

---

## 7. Uso del sistema

- Los editores entran a tu URL de Vercel y hacen login con las credenciales que les diste.
- Desde **"Lugares"** crean un sitio (módulo I), y dentro de cada lugar cargan sus
  **Motivos** (módulo II).
- Cada motivo tiene pestañas para **Técnicas**, **Antropomorfos**, **Operaciones
  Cognitivas** y **Conjunto** (módulos III a VI).
- Tamaño, cromatismo y proporcionalidad se calculan solos según las reglas del apéndice.

---

## Desarrollo local (opcional)

Si en algún momento querés seguir modificando el sistema:

```bash
npm install
cp .env.example .env.local   # completá DATABASE_URL y JWT_SECRET
npm run migrate               # crea las tablas si hace falta
npm run create-user           # crea tu usuario de prueba
npm run dev                   # http://localhost:3000
```

## Estructura del proyecto

```
pages/              rutas de la aplicación (páginas + API)
components/          formularios y layout reutilizables
lib/                 conexión a la base, autenticación, cálculos, catálogos
scripts/             esquema SQL, migración, alta de editores
```

## Posibles próximos pasos

- Panel web para administrar editores (hoy es por consola).
- Exportar datos a Excel/CSV.
- Subida de imágenes/calcos por motivo.
