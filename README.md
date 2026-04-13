# Proyecto ERP Tickets

Proyecto local de gestion de tickets con frontend Angular y microservicios backend conectados a Supabase/PostgreSQL.

## Estructura

- `src/`: frontend Angular.
- `user-service/`: microservicio Express para login, registro, usuarios, perfil y permisos globales.
- `groups-service/`: microservicio Express para grupos, integrantes y permisos por grupo.
- `tickets-service/`: microservicio Fastify para tickets, comentarios, historial, paginacion y estadisticas.
- `api-gateway/`: gateway Fastify que centraliza `/api/auth`, `/api/users`, `/api/groups` y `/api/tickets`.

## Requisitos

- Node.js y npm.
- Base de datos Supabase/PostgreSQL con las tablas del proyecto.
- Archivos `.env` locales en cada servicio, usando como guia los `.env.example`.

## Levantar el proyecto local

Ejecutar cada comando en una terminal distinta:

```bash
cd C:\Users\nunez\proyecto-ejemplo\user-service
npm run dev
```

```bash
cd C:\Users\nunez\proyecto-ejemplo\groups-service
npm run dev
```

```bash
cd C:\Users\nunez\proyecto-ejemplo\tickets-service
npm run dev
```

```bash
cd C:\Users\nunez\proyecto-ejemplo\api-gateway
npm run dev
```

```bash
cd C:\Users\nunez\proyecto-ejemplo
npm start
```

## Puertos locales

- Frontend: `http://localhost:4200`
- User service: `http://localhost:3000`
- Groups service: `http://localhost:3002`
- Tickets service: `http://localhost:3003`
- API Gateway: `http://localhost:4000`

## Health check

El gateway incluye un endpoint de salud para validar que los servicios esten arriba:

```http
GET http://localhost:4000/health
```

## Rate limiting

El API Gateway limita requests por usuario autenticado o por IP cuando no hay token. La configuracion por defecto es `100` requests por minuto:

```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

Si se excede el limite, el gateway responde `429` con el esquema global y el mensaje `Too many requests`.

## Credenciales demo

Despues de ejecutar el seed limpio:

- Superadmin: `admin@marher.com` / `Demo#12345`
- Usuario dev: `dev@marher.com` / `Demo#12345`

El superadmin queda con todos los permisos globales y todos los permisos por grupo.

## Formato de respuesta API

Los servicios responden con el formato:

```json
{
  "statusCode": 200,
  "intOpCode": "SxGW001",
  "data": {}
}
```

## Endpoints principales por gateway

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/users`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/groups`
- `POST /api/groups`
- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/stats`

## Verificacion rapida

```bash
npm run build
```

El build puede mostrar warnings de presupuesto de bundle/estilos, pero no debe fallar.
