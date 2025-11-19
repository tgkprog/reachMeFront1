# ReachMe Web Client (Vue 3 + Vite)

Modern web client for ReachMe using Vue 3.5.24 and Vite.

## Features

- ✅ Google OAuth Sign-In (using Google Identity Services)
- ✅ Email/Password authentication
- ✅ Real-time polling for server commands
- ✅ Browser notifications for alarms
- ✅ Alarm history with deduplication
- ✅ TypeScript support
- ✅ Environment-based configuration
- ✅ Responsive design

## Setup

### 1. Install Dependencies

```bash
cd clientWeb
npm install
```

### 2. Configure Environment

Copy the appropriate environment file:

```bash
# For local development
cp .env.local .env

# For dev server
cp .env.dev .env
```

Update `.env` with your settings:

```env
VITE_API_BASE_URL=https://reachme2.com:8052
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:8080`
   - `http://localhost:8087`
   - Your production domain
6. Copy the Client ID to your `.env` file

## Development

```bash
# Start dev server on port 8080
npm run dev

# Start dev server on port 8087
npm run dev:8087

# Type check
npm run type-check
```

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
clientWeb/
├── src/
│   ├── views/           # Page components
│   │   ├── LoginView.vue
│   │   ├── ControlsView.vue
│   │   ├── AlarmsView.vue
│   │   └── AboutView.vue
│   ├── services/        # Business logic
│   │   ├── auth.ts      # Authentication
│   │   ├── storage.ts   # Local storage
│   │   └── polling.ts   # Server polling
│   ├── router/          # Vue Router
│   ├── types/           # TypeScript types
│   ├── config/          # Configuration
│   ├── App.vue          # Root component
│   ├── main.ts          # Entry point
│   └── style.css        # Global styles
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Google Sign-In Integration

This client uses [Google Identity Services](https://developers.google.com/identity/gsi/web) for web authentication. The Google Sign-In button is rendered using the official Google script.

### How it works:

1. The Google script is loaded in `LoginView.vue`
2. A global callback `handleGoogleCredential` receives the JWT credential
3. The credential is sent to your backend `/api/auth/google` endpoint
4. Backend validates the JWT and returns a user + token
5. Token is stored in localStorage for subsequent API calls

## API Integration

The client expects these backend endpoints:

- `POST /api/user/check` - Check if user is allowed
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/password-login` - Email/password login
- `POST /reachme/check` - Poll for commands (requires auth)
- `GET /about.html` - About page content

## Browser Notifications

The app requests notification permission on login. Alarms received from the server will trigger browser notifications if permission is granted.

## Storage

Uses `localStorage` for:
- User profile
- Auth token
- Device ID (auto-generated)
- Alarm history (max 100, 2-day retention)
- Poll settings
- Sleep/Mute states

## Environment Variables

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth Client ID

## Tech Stack

- **Vue 3.5.24** - Progressive framework
- **Vite 5** - Fast build tool
- **TypeScript** - Type safety
- **Vue Router 4** - Routing
- **Pinia 2** - State management (minimal usage)
- **Axios** - HTTP client
- **Google Identity Services** - OAuth authentication

## License

Private
