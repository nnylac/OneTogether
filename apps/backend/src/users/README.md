## users runs on the following endpoints:

The users module handles individual people in the system.

Users are not the same as organisations.

- users = people/accounts using OneTogether
- organisations = agencies/groups such as SCDF, SPF, hospitals, NEA, PUB, relief groups

Current allowed user roles:

```txt
user      -> public/citizen user
responder -> responder/organisation-side user
admin     -> government/admin user
```

These roles can later be used by auth guards and frontend routing.

---

### List users:

`\users` [GET]

Full route:

```txt
GET /api/users
```

Optional query params:

```txt
role=user | responder | admin
isVerified=true | false
search=amy
take=20
skip=0
```

Examples:

```txt
GET /api/users
GET /api/users?role=responder
GET /api/users?isVerified=true
GET /api/users?search=amy
GET /api/users?role=user&take=10&skip=0
```

Returns:

```json
[
  {
    "id": "50000000-0000-0000-0000-000000000001",
    "username": "citizen_amy",
    "email": "amy.tan@example.sg",
    "firstName": "Amy",
    "lastName": "Tan",
    "phone": "+6590000001",
    "isVerified": true,
    "role": "user",
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z",
    "lastLogin": null
  }
]
```

Notes:

- `search` checks username, email, first name, and last name.
- `take` and `skip` are for pagination.
- invalid roles return `400 Bad Request`.

---

### Get one user:

`\users\:id` [GET]

Full route:

```txt
GET /api/users/:id
```

Example:

```txt
GET /api/users/50000000-0000-0000-0000-000000000001
```

Returns:

```json
{
  "id": "50000000-0000-0000-0000-000000000001",
  "username": "citizen_amy",
  "email": "amy.tan@example.sg",
  "firstName": "Amy",
  "lastName": "Tan",
  "phone": "+6590000001",
  "isVerified": true,
  "role": "user",
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z",
  "lastLogin": null
}
```

Notes:

- `id` must be a UUID.
- unknown user ids return `404 Not Found`.

---

### Update one user:

`\users\:id` [PATCH]

Full route:

```txt
PATCH /api/users/:id
```

JSON struct:

```json
{
  "firstName": "Amy",
  "lastName": "Tan",
  "phone": "+6590000001",
  "isVerified": true,
  "role": "responder"
}
```

All fields are optional. Send only the fields you want to update.

Example:

```json
{
  "firstName": "Amelia",
  "phone": "+6591234567"
}
```

Returns the updated user:

```json
{
  "id": "50000000-0000-0000-0000-000000000001",
  "username": "citizen_amy",
  "email": "amy.tan@example.sg",
  "firstName": "Amelia",
  "lastName": "Tan",
  "phone": "+6591234567",
  "isVerified": true,
  "role": "user",
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z",
  "lastLogin": null
}
```

Notes:

- `id` must be a UUID.
- invalid roles return `400 Bad Request`.
- unknown user ids return `404 Not Found`.
- this endpoint currently does not enforce auth/role guards yet.

---

## File responsibilities

### `users.controller.ts`

Exposes HTTP endpoints.

Current endpoints:

```txt
GET   /api/users
GET   /api/users/:id
PATCH /api/users/:id
```

Controller should stay thin:

- receives params/query/body
- calls `UsersService`
- returns service result

### `users.service.ts`

Contains user business logic.

Current responsibilities:

- list users
- get one user
- update one user
- validate role values
- parse query params such as `isVerified`, `take`, and `skip`
- throw `BadRequestException` and `NotFoundException`
- convert database records to `UserResponseDto`

### `users.repository.ts`

Contains Prisma database access.

Current responsibilities:

- `findMany`
- `findById`
- `findByEmail`
- `findByUsername`
- `update`

Repository should not contain HTTP logic.

### `users.module.ts`

Wires the users domain together.

Currently registers:

- `UsersController`
- `UsersService`
- `UsersRepository`

Also exports `UsersService` so other modules, such as `auth`, can use user lookup logic later.

---

## DTOs

### `dto/user-query.dto.ts`

Query params for listing users.

Fields:

```txt
role
isVerified
search
take
skip
```

### `dto/update-user.dto.ts`

Request body for updating a user.

Fields:

```txt
firstName
lastName
phone
isVerified
role
```

### `dto/user-response.dto.ts`

Response shape returned to frontend/API callers.

It converts Prisma/database snake_case fields to API camelCase fields:

```txt
first_name  -> firstName
last_name   -> lastName
is_verified -> isVerified
created_at  -> createdAt
updated_at  -> updatedAt
last_login  -> lastLogin
```

It does not expose password hashes or refresh tokens.

---

## Prisma / database notes

The users module reads from the `users` table.

Related auth tables:

```txt
accounts
refresh_tokens
```

Do not expose `accounts.password_hash` from this module.

Authentication logic belongs in `auth`.

Profile/person lookup belongs in `users`.

---

## Swagger

Swagger docs are available when the backend is running:

```txt
http://localhost:3001/api/docs
```

The users endpoints are tagged under:

```txt
users
```

