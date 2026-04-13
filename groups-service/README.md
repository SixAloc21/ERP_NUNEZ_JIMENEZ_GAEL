# Groups Service

Microservicio en Node.js/Express para gestionar:

- Grupos o workspaces
- Miembros por grupo
- Permisos por usuario dentro de cada grupo

## Scripts

```bash
npm install
npm run dev
```

## Variables de entorno

```env
PORT=3002
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

## Endpoints

- `GET /`
- `GET /health`
- `GET /api/groups`
- `GET /api/groups/:groupId`
- `POST /api/groups`
- `PATCH /api/groups/:groupId`
- `DELETE /api/groups/:groupId`
- `GET /api/groups/permissions/catalog`
- `GET /api/groups/:groupId/members`
- `POST /api/groups/:groupId/members`
- `PATCH /api/groups/:groupId/members/:userId/permissions`
- `DELETE /api/groups/:groupId/members/:userId`

## Notas

- Sigue el esquema JSON universal del proyecto: `statusCode`, `intOpCode`, `data`.
- Asume que la autenticación y autorización fuerte quedarán en el API Gateway.
- Incluye un SQL base en `sql/001_groups_schema.sql`.
