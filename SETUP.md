# Running MyWardrobe locally

## Backend (Java 21, Spring Boot, MySQL)

The backend reads connection credentials and the JWT signing key from environment variables. This keeps secrets out of the source files. `.env.example` shows the required names but is a template; Spring Boot does not load that file automatically.

In IntelliJ IDEA, open **Run → Edit Configurations**, select `MyWardrobeApplication`, and add these under **Environment variables**:

- `DB_URL` — for example, `jdbc:mysql://127.0.0.1:3306/mywardrobe`
- `DB_USERNAME` — your MySQL account name
- `DB_PASSWORD` — that account's password
- `JWT_SECRET` — a private random value at least 32 UTF-8 bytes long
- `GEMINI_API_KEY` — optional Google AI Studio key for Gemini stylist rankings and explanations. Keep the key in the IntelliJ run configuration; never put it in React code or commit it. Without this key, the local wardrobe rules continue to generate outfits.
- `GEMINI_MODEL` — optional Gemini model ID; defaults to `gemini-3.6-flash`.

Use your own local MySQL username/password; do not paste them into Java files or commit them. Changing `JWT_SECRET` invalidates tokens created with the old key, so users will need to sign in again. The JPA setting remains `update`, which adds account preference and outfit favorite columns while retaining existing rows. Do not change it to `create` or `create-drop` for the existing database.

Start the backend with the IntelliJ run configuration, or start a shell where those environment variables are already set and run:

```powershell
.\mvnw.cmd spring-boot:run
```

## Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:8080/api`. To use a different backend, set `VITE_API_URL` in a local `frontend/.env.local` file, such as `VITE_API_URL=http://localhost:8080/api`, then restart Vite. Keep `.env.local` private.

## Checks

From `frontend`, run `npm run build` and `npm run lint`. From the project root, run `mvn test` (or `.\mvnw.cmd test`). Tests use an isolated in-memory H2 database and do not need or modify your MySQL database. Set the backend environment variables only when starting the actual application.

Images are stored in the local `uploads` folder. Back up that folder with the MySQL database; this project does not yet use cloud/object storage.

## Gemini stylist API

The optional authenticated endpoint `POST /api/stylist/advice` receives a styling context (`occasion`, `weather`, `mood`, optional `style`, `prioritizeComfort`, and an optional personal request up to 240 characters) plus up to three outfit options represented only by their clothing item IDs. The server confirms every item belongs to the signed-in user before sending limited clothing attributes to Gemini. The model can rank and explain only those supplied options; it cannot add wardrobe items.

When Gemini is not configured or is temporarily unavailable, the endpoint responds with `available: false` and the frontend continues with its local outfit ranking. Gemini failures do not prevent saving or browsing outfits. The Gemini API key must remain in the backend run configuration as `GEMINI_API_KEY`.
