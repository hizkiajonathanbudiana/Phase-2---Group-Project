# Phase-2---Group-Project

Sir Rizky &amp; Sir Hizkia

# QuiRushAI API Documentation

DOMAIN: https://quizapi.hizkiajonathanbudiana.my.id  
AWS Public IP: http://13.250.121.199/

## Table of Contents

- Frontend Integration
- Authentication
- Email Verification
- Game Status (Leaderboard)
- Real-Time Socket.IO Events
- Global Errors

---

## Frontend Integration

- **Frontend Domain:** https://quizai.hizkiajonathanbudiana.my.id
- **Base API URL:** https://quizapi.hizkiajonathanbudiana.my.id

Routing is defined using React Router. Public and protected routes are guarded using `ProtectedRoute`.  
Verified email users can access `/home` and `/rank`, while unverified users are redirected to `/verify`.  
Unauthenticated users are redirected to `/` (login page).

### Route Overview

| Path               | Access Level      | Component           |
| ------------------ | ----------------- | ------------------- |
| `/`                | Public            | LoginPage           |
| `/register`        | Public            | RegisterPage        |
| `/email/search`    | Public            | SearchEmailPage     |
| `/password/verify` | Public            | VerifyPassPage      |
| `/verify`          | Protected         | VerifyPage          |
| `/home`            | Verified Only     | HomePage            |
| `/rank`            | Verified Only     | RankPage            |
| `*`                | Redirect fallback | Based on auth state |

Global error handling is managed in Redux with matchers that handle rejected thunks and route redirection based on message.

---

## Authentication

### 1. POST /register

**Description:** Register a new user account.

**Request:**

```json
{
  "username": "hizkia",
  "email": "user@mail.com",
  "password": "123456"
}
```

**Responses:**

- 201 Created
- 400 Bad Request

---

### 2. POST /login

**Description:** Login with email and password.

**Request:**

```json
{
  "email": "user@mail.com",
  "password": "123456"
}
```

**Responses:**

- 200 OK
- 400 Bad Request / 401 Unauthorized

---

### 3. POST /google

**Description:** Login or register using Google OAuth.

**Request:**

```json
{
  "token": "GOOGLE_ID_TOKEN"
}
```

**Responses:**

- 200 OK
- 400 Bad Request

---

### 4. GET /auth/me

**Description:** Get the current logged-in user.

**Requires:** Cookie `accessToken`

**Response:**

- 200 OK
- 401 Unauthorized

---

### 5. POST /logout

**Description:** Logout and clear cookies.

**Response:**

- 200 OK

---

## Email Verification

### 6. POST /verify/send

**Description:** Send verification code via email.

**Response:**

- 201 Created
- 500 Internal Server Error

---

### 7. POST /verify

**Description:** Submit verification code to verify user.

**Request:**

```json
{
  "verifyCode": "123456"
}
```

**Responses:**

- 200 OK
- 400 Bad Request / 401 Unauthorized

---

### 8. POST /password/forgot

**Description:** Request password reset verification code.

**Request:**

```json
{
  "email": "user@mail.com"
}
```

**Response:**

- 201 Created
- 404 User Not Found

---

### 9. POST /password/reset

**Description:** Reset password using verification code.

**Request:**

```json
{
  "password": "newpassword",
  "verifyCode": "123456"
}
```

**Response:**

- 200 OK
- 400 Bad Request / 401 Unauthorized

---

## Game Status (Leaderboard)

### 10. GET /status

**Description:** Retrieve leaderboard (sorted by solved count).

**Response:**

- 200 OK (List of users with scores)
- 401 Unauthorized

---

## Real-Time Socket.IO Events

**Socket Endpoint:** `https://quizapi.hizkiajonathanbudiana.my.id`

### Events from Client

- `joinGame`: Join user into game session.
- `submitAnswer`: Submit an answer to current question.
- `voteNewQuestion`: Vote to skip question.
- `adminUpdateSettings`: Admin changes quiz topic/difficulty.

### Events from Server

- `newQuestion`: Server sends new quiz question.
- `questionAnswered`: Server announces correct answer and winner.
- `updatePlayerList`: Current players.
- `updateVoteCount`: Current skip votes.
- `gameNotification`: Game-wide messages.
- `gameSettingsUpdated`: Emit when settings are changed.

---

## Global Errors

All errors follow this format:

```json
{ "message": "Error description" }
```

Common HTTP status codes:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

---

## Built With ❤️ by Team Rizki & Hizkia

Phase 2 Group Project @ Hacktiv8
