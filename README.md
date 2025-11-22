# reachme — Monorepo

Project layout and purpose (top-level overview):

- `server1/`: Express / Node.js backend. Primary API server and database adapters (MariaDB + SQLite). This is the canonical server implementation used by the apps.

- `clientWeb/`: Independent web frontend (Vue/Vite-based historically). Keep as-is; Vite-specific env keys remain in this folder.

- `fltr1/`: Flutter client (mobile-first). Current work targets this folder. Intended targets: web + Android now; iOS later.

- `client/`: Deprecated / unused folder. Marked deprecated in this repo — do not edit. Consider removing from the repo in a later cleanup.

- `reactNmake2/`: Deprecated / unused folder. Marked deprecated in this repo — do not edit. Consider removing from the repo in a later cleanup.

Notes

- The Flutter app (`fltr1/`) does not use Vite. Environment variables inside `fltr1/` use `API_*` keys loaded with `flutter_dotenv`.

- The web client (`clientWeb/`) still uses `VITE_` prefixed env variables and Vite build scripts; it is intentionally left unchanged.

- Deprecated folders are marked with `DEPRECATED_READONLY` files to avoid accidental edits while keeping history available.

Quick commands

- Run backend server (from `server1/`):

```bash
cd server1
# install & run (example)
npm install
npm run dev
```

- Run Flutter analyzer for `fltr1/`:

```bash
cd fltr1
flutter pub get
flutter analyze
```

If you'd like me to actually remove the deprecated folders (`client/` and `reactNmake2/`) from the repository (hard-delete), tell me and I will delete them instead of adding the marker files.
