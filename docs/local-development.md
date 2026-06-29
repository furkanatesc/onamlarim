# Local Development (frontend + real backend)

Steps 1–3 run inside `server/` (its own package.json); steps 4–5 run in the repo root.

1. Start Postgres:        cd server && docker compose up -d
2. Migrate + seed:        npm run db:migrate && npm run db:seed   (still in server/; creates dr.muge@onamlarim.com / 123456)
3. Start the backend:     npm run start:dev        # still in server/; http://localhost:3000
4. Configure the SPA:     back in the repo root, create .env.local with:
                          VITE_API_URL=http://localhost:3000/api
5. Start the frontend:    npm run dev              # repo root; http://localhost:5173
6. Log in with: dr.muge / 123456

Without VITE_API_URL the SPA runs in mock mode (the Vercel demo behavior).
