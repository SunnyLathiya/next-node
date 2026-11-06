# Field Notes

A full-stack posts app. Users register and log in, write public or private posts, and like or dislike posts. The feed supports search, sort, and pagination.

- Frontend: Next.js (`client`) on http://localhost:3001
- Backend: Express (`server`) on http://localhost:5002
- Database: MongoDB database `assessment` via Mongoose

## Run it

MongoDB must already be running on `127.0.0.1:27017`.

Terminal 1, API:

```bash
cd server
npm install
npm run dev
```

Terminal 2, site:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3001.

The client is fixed to port 3001 because another app on this machine may already use port 3000. The API allows both `http://localhost:3000` and `http://localhost:3001`.

### Demo accounts

These accounts already exist in the local database:

| Email | Password |
| --- | --- |
| ada@example.com | password123 |
| grace@example.com | password123 |

Ada has a private draft. Log out to confirm other people cannot see it.

Reset the database to those two users and three sample posts:

```bash
cd server
npm run seed
```

`npm run seed` deletes every post in the `assessment` database, then recreates the sample data.

## Environment

`server/.env`:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Default `5002`. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign login tokens. |
| `CLIENT_URL` | Browser origin allowed by CORS. |

`client/.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API base URL, `http://localhost:5002/api`. |

Copy `server/.env.example` if `.env` is missing. Do not commit `.env`.

## Repository layout

```
app/
  client/                         Next.js UI
    src/app/                      pages
      page.tsx                    feed
      login/page.tsx
      register/page.tsx
      posts/new/page.tsx
      posts/[id]/page.tsx         one post
      posts/[id]/edit/page.tsx
    src/components/               Navbar, Feed, PostCard, PostForm, Pagination
    src/store/                    Redux Toolkit store and auth slice
    src/lib/api.ts                fetch wrapper
    src/lib/types.ts              shared response types
  server/                         Express API
    src/index.js                  app setup, CORS, route mounting
    src/config/db.js              mongoose.connect
    src/models/User.js
    src/models/Post.js
    src/routes/                   URL to controller
    src/controllers/              read the request, send the response
    src/services/                 business rules and database calls
    src/validators/schemas.js     Joi rules
    src/middleware/               auth, validation, errors
    src/seed.js
```

## Pages

| URL | Who | What it does |
| --- | --- | --- |
| `/` | anyone | Search, sort, and page through posts |
| `/login` | guest | Log in |
| `/register` | guest | Create an account and log in |
| `/posts/new` | logged-in user | Create a post |
| `/posts/:id` | anyone who is allowed to see it | Read one post |
| `/posts/:id/edit` | author only | Update that post |

## API

Base URL: `http://localhost:5002/api`

Send the token on protected routes:

```
Authorization: Bearer <token>
```

| Method | Path | Auth | Body / query |
| --- | --- | --- | --- |
| GET | `/health` | no | — |
| POST | `/auth/register` | no | `name`, `email`, `password` |
| POST | `/auth/login` | no | `email`, `password` |
| GET | `/auth/me` | yes | — |
| POST | `/auth/refresh` | refresh token | `{ "refreshToken": "..." }` |
| POST | `/auth/logout` | refresh token | `{ "refreshToken": "..." }` |
| GET | `/posts` | optional | `search`, `sort`, `page`, `limit` |
| GET | `/posts/:id` | optional | — |
| POST | `/posts` | yes | `title`, `content`, `isPublic` |
| PUT | `/posts/:id` | yes, author | `title`, `content`, `isPublic` |
| DELETE | `/posts/:id` | yes, author | — |
| POST | `/posts/:id/reactions` | yes | `{ "type": "like" }` or `{ "type": "dislike" }` |

`sort` is `newest`, `oldest`, or `mostLiked`. `page` starts at 1. `limit` is 1 to 20. The feed asks for 6.

Register and login return:

```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "Ada Lovelace", "email": "ada@example.com" }
}
```

The post list returns `{ posts, pagination }`. `pagination` has `page`, `limit`, `total`, and `totalPages`.

## Rules

- A public post is visible to everyone, including logged-out visitors.
- A private post is visible only to its author. Other people get `404`, including on the direct URL.
- Only the author can update or delete a post. Anyone else gets `403`.
- Like and dislike require login. Clicking the active reaction removes it. Choosing the other reaction switches to it.
- Name must be at least 2 characters. Password must be at least 6. Title must be 3 to 120 characters. Content must be 10 to 5000 characters. Email must be a valid email. The same checks run in the browser and again on the API.
- A duplicate email returns `409`.

## Request flow

Example: Ada opens the feed and likes a post.

1. The browser loads `client` at http://localhost:3001. `StoreProvider` dispatches the `restoreSession` thunk. That thunk reads `posts_token` from `localStorage` and, when a token exists, calls `GET /api/auth/me`. The user and token live in the Redux `auth` slice. Pages read them with `useAppSelector`.
2. `Feed` calls `GET /api/posts?search=&sort=newest&page=1&limit=6` through `src/lib/api.ts`. The helper adds `Authorization: Bearer <token>` when the store has a token.
3. Express matches `/api/posts` to `postRoutes`.
4. `optionalAuth` verifies the JWT when one is present and sets `req.user`. A missing token continues as a guest. A bad token on this public route is ignored.
5. Joi checks `search`, `sort`, `page`, and `limit`.
6. `postController.listPosts` calls `postService.listPosts`.
7. The service builds a MongoDB filter. Guests only get `isPublic: true`. A logged-in user also gets their own private posts. Search matches `title` or `content`. Sort uses `createdAt` or `likesCount`.
8. Mongoose returns the page of documents. The service shapes each one into `id`, author name, counts, `liked`, `disliked`, and `isOwner`.
9. The controller sends JSON. `Feed` renders a `PostCard` per post.
10. Ada clicks Like. `PostCard` sends `POST /api/posts/:id/reactions` with `{ "type": "like" }`.
11. `requireAuth` rejects the call with `401` when the token is missing or expired.
12. `postService.reactToPost` updates the `likes` and `dislikes` arrays, stores the new counts, and returns the updated post. The card replaces its local copy with that response.

Create, update, and delete follow the same path: page, `api.ts`, route, `requireAuth`, Joi, controller, service, Mongoose, JSON response. Update and delete also check that `req.user` is the post author.

Validation failures return `400` with an `errors` array. Unexpected failures reach `errorHandler`, which returns `500` and does not leak a stack trace to the client. A duplicate email is MongoDB error `11000` and becomes `409`.

## Data

`User`: `name`, `email` (unique, stored lowercase), `password` (bcrypt hash, never sent to the client).

`Post`: `title`, `content`, `isPublic`, `author`, `likes`, `dislikes`, `likesCount`, `dislikesCount`, `createdAt`, `updatedAt`.

Passwords are hashed with bcrypt before insert. Login compares the submitted password with that hash, then returns two JWTs. The access token payload is `{ id, type: "access" }` and it expires in 15 minutes. The refresh token payload is `{ id, email, type: "refresh", jti }` and it expires in 7 days. `jti` is a random id so each issued token is unique. Only a SHA-256 hash of the refresh token is stored on the user. `POST /api/auth/refresh` checks the signature, the 7-day expiry, and that hash, then rotates both tokens. The old refresh token stops working. A refresh token cannot be used as the access token because protected routes accept only `type: "access"`.

The browser keeps both tokens in `localStorage`. `src/lib/api.ts` sends the access token. When any request returns 401, that call enters `src/lib/requestQueue.ts`. If a refresh is already running, the request waits in that queue. Only the first 401 calls `POST /api/auth/refresh`. After it finishes, every queued request retries once with the new access token. If the refresh fails, the tokens are cleared and those requests retry once without a token, so public pages still load and protected pages show the login error.
