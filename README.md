Welcome to your new TanStack Start app!

## Reservas con Google Calendar

El formulario crea citas en el calendario del estudio desde el servidor mediante una cuenta de servicio. Sin las cuatro variables configuradas, el sitio sigue funcionando y el formulario muestra que las reservas en línea aún no están disponibles.

### Configuración

1. En [Google Cloud Console](https://console.cloud.google.com/), crea o selecciona un proyecto. En **APIs y servicios → Biblioteca**, habilita **Google Calendar API**.
2. En **IAM y administración → Cuentas de servicio**, crea una cuenta de servicio. No necesita roles generales del proyecto. Abre esa cuenta y entra en **Claves → Agregar clave → Crear clave nueva → JSON**. Guarda el archivo de forma segura; no lo subas al repositorio.
3. En [Google Calendar](https://calendar.google.com/), abre **Configuración y uso compartido** del calendario del estudio. En **Compartir con personas o grupos específicos**, agrega el `client_email` del JSON y otorga **Hacer cambios en los eventos**. No hace falta delegación de todo el dominio.
4. En **Integrar el calendario**, copia el **ID del calendario** (no su URL pública).
5. Crea `.env.local` y completa estas cuatro variables de servidor:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: el `client_email` del JSON.
   - `GOOGLE_PRIVATE_KEY`: el `private_key` del JSON, entre comillas. Se admiten saltos de línea reales o secuencias literales `\n`.
   - `GOOGLE_CALENDAR_ID`: el ID copiado del calendario.
   - `BOOKING_TIMEZONE`: una zona IANA, por ejemplo `America/Mexico_City`. Las fechas, horarios y confirmaciones usan esta zona, no la del dispositivo de quien reserva.
6. Reinicia el servidor (`bun --bun run dev`). En producción, configura las mismas cuatro variables en el entorno del servidor y reinícialo. Nunca las nombres con el prefijo `VITE_`.

Plantilla con valores ficticios (reemplázalos antes de agendar):

```dotenv
GOOGLE_SERVICE_ACCOUNT_EMAIL=booking@example-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="REPLACE_WITH_PRIVATE_KEY_FROM_JSON"
GOOGLE_CALENDAR_ID=replace-with-studio-calendar-id@group.calendar.google.com
BOOKING_TIMEZONE=America/Mexico_City
```

No compartas el archivo JSON ni la clave privada. No se envían al navegador, al resultado de la reserva ni a los registros de errores.

### Horarios y operación

Edita servicios, duraciones, días y horarios en `src/modules/booking/config.ts`. Por defecto: martes a sábado de 4:00 p. m. a 10:00 p. m., citas cada 2 horas (4:00, 6:00 y 8:00 p. m.) y reservas desde mañana hasta 60 días adelante. Cada servicio debe terminar antes del cierre. Los bloqueos y eventos de día completo del calendario se consultan con `freeBusy`; los eventos marcados como libres no bloquean citas.

Antes de crear una cita se vuelve a consultar disponibilidad. La comprobación y la inserción se serializan dentro de **un proceso** del servidor. Google Calendar no ofrece una inserción condicional atómica: varios procesos/réplicas o cambios manuales simultáneos pueden provocar solapamientos. Usa un único proceso de reservas; si necesitas múltiples réplicas, añade coordinación distribuida antes de habilitarlas. El campo trampa reduce spam básico, pero no sustituye límites de solicitudes en el proveedor de alojamiento.

La cita incluye nombre y teléfono, y correo y notas si se proporcionan; restringe el acceso al calendario. El correo no se agrega como asistente y no se envían invitaciones ni confirmaciones por correo. Ante un fallo de red durante la inserción, revisa el calendario antes de volver a intentar: Google podría haber recibido la cita aunque la respuesta se haya perdido.

### Verificación sin credenciales

`bun test src/modules/booking` usa un cliente de calendario y solicitudes HTTP simulados; no realiza llamadas reales a Google. No hacen falta credenciales para ejecutar las pruebas.

# Getting Started

To run this application:

```bash
bun install
bun --bun run dev
```

# Building For Production

To build this application for production:

```bash
bun --bun run build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting & Formatting


This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
bun --bun run lint
bun --bun run format
bun --bun run check
```


## Deploy with Nitro

This project uses Nitro as a generic server adapter, so it can run on any Node-compatible host.

```bash
npm run build
node dist/server/index.mjs
```

The build output is a self-contained Node server. To deploy, push the `dist/` directory to your host (Render, Fly.io, your own VPS, etc.) and run the server command above.

For host-specific presets (Vercel, Netlify, Cloudflare, AWS Lambda, etc.) and tuning, see https://v3.nitro.build/deploy.


## T3Env

- You can use T3Env to add type safety to your environment variables.
- Add Environment variables to the `src/env.mjs` file.
- Use the environment variables in your code.

### Usage

```ts
import { env } from "#/env";

console.log(env.VITE_APP_TITLE);
```






## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')
  
  useEffect(() => {
    getServerTime().then(setTime)
  }, [])
  
  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).



# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
