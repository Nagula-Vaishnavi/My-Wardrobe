# MyWardrobe Requirements and Progress

This checklist compares the attached product concept and development requirements shared in the conversation with the existing project. The concept document was read from the Codex attachment. There is no `.git` directory in this checkout, so Git status and a baseline diff are unavailable.

Statuses: **Completed and verified** means the implementation passed a relevant automated check; **Partially completed** means some functionality exists but important behavior or real-service verification remains; **Not implemented** means there is no implementation; **Needs fixing** means an issue is known. Recognition remains intentionally de-scoped based on the user's later direction to remove it.

## Accounts and security

- [x] **Completed and verified** — Registration and login use backend validation, BCrypt password hashing, and JWT. The H2-backed API suite creates and signs in users.
- [x] **Completed and verified** — Clothing records are scoped to the signed-in user. API tests cover private listing, foreign update/delete rejection, and forged IDs on create.
- [x] **Completed and verified** — Outfit item IDs are validated against the current user's wardrobe; foreign outfit pieces are rejected. Favorite updates are owner-scoped.
- [x] **Completed and verified** — Profile preferences have authenticated GET/PUT APIs and persist to the database. Existing browser preferences are copied into the account on first sync when appropriate.
- [x] **Completed and verified** — Application MySQL credentials and JWT signing key are read from environment variables; static credentials were removed from main source config. Login errors return 401, and the unnecessary generated Spring development password was removed.
- [ ] **Partially completed** — Session restoration and logout are implemented in the existing React app, but browser-level flows were not automated in this run. JWTs are stateless and cannot be revoked on logout before expiry.

## Wardrobe, categories, and images

- [ ] **Partially completed** — Clothing CRUD is implemented. This run verified create and foreign-account read/update/delete protection, but did not exercise an owner's full edit/delete flow against real MySQL.
- [ ] **Partially completed** — Search, category filtering, sorting, details, and edit UI exist. Build/lint pass, but the browser and existing wardrobe records were not interactively exercised.
- [ ] **Partially completed** — Add clothing, manual attributes, image preview, upload, and image retrieval exist. Upload checks file type/size, uses generated filenames, and retrieval rejects unsafe filenames; successful upload/retrieval was not exercised in this run.
- [ ] **Partially completed** — Shared category taxonomy covers tops, shirts, T-shirts, bottoms, dresses, kurtis, palazzos, sarees, blouses, shoes, bags, and accessories. Historical MySQL values were not exhaustively checked.
- [ ] **Not implemented (intentionally de-scoped)** — AI image recognition and automatic category/color/pattern/style/fit/season extraction were removed at the user's request. Manual entry and local color suggestion remain.
- [ ] **Partially completed** — Images are stored in the local `uploads` folder, not cloud/object storage. Moving them requires a storage provider and credentials.

## Dashboard and profile

- [ ] **Partially completed** — Dashboard counts and recent pieces derive from saved wardrobe data. No browser run verified each displayed statistic against the user's MySQL records.
- [x] **Completed and verified** — Profile name remains backend-backed; style and show-prices preferences now persist per account. H2 API tests verify the preference round trip.

## Stylist, history, and saved looks

- [ ] **Partially completed** — The stylist uses wardrobe data to generate complete top+bottom, dress, and some traditional combinations, presents up to three ranked looks, and can optionally use Gemini to rank/explain those wardrobe-only candidates. Users can add a short natural-language preference (up to 240 characters). The authenticated endpoint validates item ownership and falls back cleanly without a key; H2 tests cover those paths. Live provider behavior/UI still need a real Gemini key for verification.
- [ ] **Partially completed** — Occasion, weather, style, mood, comfort, color coordination, pattern balance, and recent worn history affect ranking. Recommendations still depend on manually entered item details and have not been validated against a broad real wardrobe.
- [ ] **Partially completed** — Repeated combinations are avoided in the current session and persisted in browser storage per signed-in account across occasion/weather changes; recent marked-worn looks are deprioritized. Occasion matching now gives a stronger weight to explicit suitable-occasion fields, and weather matching considers season plus item details. If all eligible looks are already seen/worn, the stylist reuses a combination. Persistence and ranking were code-reviewed and build/lint checked, but not verified in a live browser.
- [ ] **Partially completed** — Users can try another full look or swap one piece from their wardrobe while retaining the rest. Full-look generation now prioritizes unseen top/bottom/dress combinations over footwear-only variations, and sends distinct clothing combinations to Gemini first. Piece swaps rank replacements by compatibility and prefer unseen, not-recently-worn combinations. Frontend lint/build pass; authenticated browser behavior still needs a wardrobe with multiple suitable pieces.
- [x] **Completed and verified** — Saved outfits, favorite status, and worn status persist through owner-scoped endpoints. API tests verify outfit creation, favorite persistence, and rejection of a foreign user's favorite update.
- [ ] **Partially completed** — Saved outfits can be browsed, filtered, deleted, and marked worn in the existing UI. Browser interaction and real MySQL behavior remain unverified.
- [ ] **Partially completed** — “Mark as worn” tracks a date when the user marks a saved outfit. The app cannot automatically infer what the user actually wore.

## Capsule, shopping, and visualization

- [x] **Completed per user direction** — Capsule planner and its page styling were removed from the frontend. No capsule data or wardrobe records were deleted.
- [ ] **Not implemented (de-scoped with capsule)** — Wardrobe-gap and shopping suggestions were part of the removed capsule page. Smart shopping needs a separate feature if requested later.
- [ ] **Not implemented** — Photo try-on of the user's actual outfit on their own photo. This requires selecting a try-on provider, credentials, consent, and image retention/deletion handling. The app does not pretend a static model image is a try-on.
- [ ] **Not implemented (later roadmap)** — Live camera try-on.
- [ ] **Not implemented (later roadmap)** — Retailer shopping integrations and browser extension.

## Verification and data safety

- [x] **Completed and verified** — Hibernate schema update remains non-destructive. New columns are modeled for account preferences and outfit favorites with defaults; no table/data reset or SQL migration was run.
- [x] **Completed and verified** — Explicit Jackson `ObjectMapper` configuration fixes the earlier missing-bean startup failure; both Spring test contexts load.
- [x] **Completed and verified** — `mvn test`: 5 tests passed, 0 failures/errors. Integration tests use an isolated in-memory H2 database, never the user's MySQL data. The additional test covers stylist endpoint authentication, account ownership, and the no-key fallback.
- [x] **Completed and verified** — `npm run build` and `npm run lint` passed.
- [ ] **Partially completed** — An earlier session verified MySQL connectivity, protected endpoints, CORS, and the Vite root without modifying user records. During this inspection no backend or frontend dev server was listening, so live authenticated flows were not rechecked.

## Inspection and implementation update — 2026-10-23

- [x] **Completed and verified** — Corrected frontend import casing so Linux builds resolve the checked-in `Components` and `Pages` directories and the actual `Pageheader.jsx` filename.
- [x] **Completed and verified** — Removed hardcoded MySQL username/password from `application.properties`; the app now reads `DB_USERNAME` and `DB_PASSWORD`, matching `.env.example` and `SETUP.md`.
- [x] **Completed and verified** — Added safe lifecycle cleanup for generated wardrobe image files when an image is replaced or its clothing record is deleted. Cleanup only accepts generated upload paths.
- [x] **Completed and verified** — Outfit deletion now looks up by both outfit ID and logged-in user, returning the same not-found response for another user's outfit.
- [x] **Completed and verified** — Gemini/provider and frontend authentication/network failures now produce actionable fallback messages without exposing credentials.
- [x] **Completed and verified** — `mvn test -q` passed (6 tests, 0 failures/errors), including image cleanup/path safety; frontend lint and production build passed.
- [ ] **Partially completed** — The actual application was not run against the user's MySQL instance or an authenticated browser session in this pass; neither backend nor frontend dev server was listening during inspection. Test database was isolated H2.

## Remaining dependencies and next work

1. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and a private `JWT_SECRET` in the IntelliJ run configuration; users must sign in again after the JWT key changes.
2. Start the app against the existing MySQL database and verify sign-in/session restore/logout, wardrobe add/edit/delete/search/filter/sort/details, upload/image retrieval, dashboard counts, and account preference persistence with real records.
3. Verify stylist requests with the configured `GEMINI_API_KEY`, including personal requests, repeat avoidance, and context ranking. Generate and refresh, then change occasion/weather; unseen combinations should rank ahead of the same exact pieces when alternatives exist. Confirm fallback still works if Gemini is unavailable.
4. Choose a virtual try-on provider and supply its credentials and privacy requirements before building photo try-on.
5. Add a separate smart-shopping analysis only if desired; the capsule planner and its attached gap report were removed per the user's decision.
