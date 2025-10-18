# Ride Booking API — Postman collection guide

This README explains how to import and use the included Postman collection (`postman_collection.json`) for the Ride Booking API. It lists all routes (method + path), example request bodies, expected response shapes, and how to set dynamic variables in Postman.

Base assumptions

- The API root used in the collection is `{{base_url}}` (default: `http://localhost:4000/api`).
- The collection uses these Postman variables: `base_url`, `accessToken`, `refreshToken`, `rideId`, `userId`, `driverId`.
- Start the server before using the collection (for example `npm run dev` or your usual start command).

Importing the collection

1. In Postman: File → Import → choose `postman_collection.json` from the project root.
2. After import, open the collection and set an environment (or collection) variable `base_url` if your server runs on a different host/port.

Setting dynamic variables

- In Postman, open the collection's Variables (or create an Environment) and set:
  - `base_url` — e.g. `http://localhost:4000/api` (collection default)
  - `accessToken` — leave blank; set after login
  - `refreshToken` — leave blank; set after login
  - `rideId`, `userId`, `driverId` — used to store ids between requests

Quick token workflow

1. Register or Login (Auth folder).
2. Copy the returned `accessToken` and paste into the `accessToken` variable in Postman (or use the test script below to set it automatically).

Optional Postman test script (auto-set tokens)
In the Login request (Postman Tests tab) add:

```javascript
const body = pm.response.json();
if (body && body.accessToken) {
  pm.environment.set("accessToken", body.accessToken);
}
if (body && body.refreshToken) {
  pm.environment.set("refreshToken", body.refreshToken);
}
if (body && body.user && body.user.id) {
  pm.environment.set("userId", body.user.id);
}
```

Routes reference (by group)

Auth

- POST /auth/register

  - Body (application/json): { name, email, password, role }
  - Response: { user: { id, name, email, role }, accessToken, refreshToken, message, status }

- POST /auth/login

  - Body: { email, password }
  - Response: same shape as register

- POST /auth/refresh
  - Body: { token } (refresh token)
  - Response: { accessToken, status, message }

Users

- GET /users/profile

  - Headers: Authorization: Bearer {{accessToken}}
  - Response: { user: { name, email, role, createdAt }, status, message }

- GET /users/rides

  - Headers: Authorization
  - Response: { rides: [ ... ], status, message }

- GET /users/rides/:id
  - Headers: Authorization
  - Response: { ride, status, message }

Riders

- POST /riders/request

  - Headers: Authorization
  - Body: { pickup: { lat, lng, address? }, destination: { lat, lng, address? } }
  - Response (201): { ride, message, status }

- POST /riders/:id/cancel

  - Headers: Authorization
  - Response: { ride, message, status }

- GET /riders/history

  - Headers: Authorization
  - Response: { rides, status, message }

- GET /riders/:id
  - Headers: Authorization
  - Response: { ride, status, message }

Drivers

- POST /drivers/:id/accept

  - Headers: Authorization
  - Response: { ride, message, status }
  - Note: only a ride with status `requested` can be accepted. If another driver accepted it or the status changed, the endpoint will return a helpful message describing current state.

- POST /drivers/:id/reject

  - Headers: Authorization
  - Response: { ride, message, status }

- POST /drivers/:id/status

  - Headers: Authorization
  - Body: { status } where status ∈ ["picked_up","in_transit","completed"]
  - Response: { ride, message, status } (if completed, also returns `earning`)

- POST /drivers/availability

  - Headers: Authorization
  - Body: { available: boolean }
  - Response: { available, message, status }

- GET /drivers/earnings
  - Headers: Authorization
  - Response: { earnings, status }

Admin (requires admin token)

- GET /admin/users

  - Headers: Authorization
  - Response: { users, status }

- GET /admin/drivers

  - Response: { drivers, status }

- GET /admin/rides

  - Response: { rides, status }

- POST /admin/drivers/:id/approve

  - Response: { driver, message, status }

- POST /admin/drivers/:id/suspend

  - Response: { driver, message, status }

- POST /admin/users/:id/block

  - Response: { user, message, status }

- POST /admin/users/:id/unblock

  - Response: { user, message, status }

- GET /admin/reports
  - Response: { report: { /_ aggregated stats _/ }, status }

Example request/response snippets

- Register (request)

```json
{
  "name": "Test Rider",
  "email": "rider@example.com",
  "password": "password123",
  "role": "rider"
}
```

- Register (response)

```json
{
  "user": {
    "id": "<id>",
    "name": "Test Rider",
    "email": "rider@example.com",
    "role": "rider"
  },
  "accessToken": "<token>",
  "refreshToken": "<token>",
  "message": "User registered successfully",
  "status": 201
}
```

- Request Ride (request)

```json
{
  "pickup": { "lat": 12.9716, "lng": 77.5946, "address": "Pickup Address" },
  "destination": {
    "lat": 12.9352,
    "lng": 77.6245,
    "address": "Destination Address"
  }
}
```

Tips and troubleshooting

- If you get `401 Unauthorized`: verify `Authorization` header `Bearer {{accessToken}}` is set and token is valid.
- If `Ride cannot be accepted or already taken` when accepting a ride, it usually means the ride status changed (accepted/cancelled) or another driver took it — the accept response has been improved to include current ride state to help debug.
- Make sure Redis is running and the server connects successfully (used for refresh tokens).

Want automation? I can:

- Add Postman Tests to automatically set `accessToken`/`refreshToken` and `rideId`/`userId` from responses.
- Provide environment files for Postman with dev/prod values.

If you'd like, I can also generate a short step-by-step Postman runbook that registers a rider, requests a ride, registers a driver, accepts the ride and completes it so you can run a full end-to-end scenario with one click.

# Backend-Ride-Booking-API

## Postman Collection

You can download and import the Postman collection to test all API endpoints easily.

👉 [Download Postman Collection](./postman_collection.json)

Directly import this file in Postman:

1. Download Postman Collection from github
1. Install **Postman Desktop**
1. Open **Postman**
1. Click on **“Import”**
1. Select the exported `.json` file
1. Start testing the API(GET,POST,PUT,DELETE)

# Postman API Collection Interface:

![Screenshot_4](https://github.com/user-attachments/assets/76a11f92-c669-4afc-8b79-d03e06b00b9a)
