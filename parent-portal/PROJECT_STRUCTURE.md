# Parent Portal - Production Architecture

## 🏗️ Modular Frontend Monolith Structure

```
parent-portal/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth group
│   │   ├── login/
│   │   └── onboarding/
│   ├── (dashboard)/                  # Protected routes
│   │   ├── layout.tsx                # Main layout with sidebar
│   │   ├── page.tsx                  # Dashboard
│   │   ├── children/
│   │   ├── behaviour/
│   │   ├── attendance/
│   │   ├── merits/
│   │   ├── detentions/
│   │   ├── interventions/
│   │   ├── messages/
│   │   ├── notifications/
│   │   └── settings/
│   ├── globals.css
│   └── layout.tsx                    # Root layout
│
├── modules/                          # Domain modules
│   ├── auth/
│   │   ├── api/                      # API calls
│   │   ├── hooks/                    # React Query hooks
│   │   ├── services/                 # Business logic
│   │   ├── components/               # Module-specific components
│   │   └── types/                    # TypeScript types
│   ├── behaviour/                    # Example complete module
│   │   ├── api/
│   │   │   └── behaviour.api.ts
│   │   ├── services/
│   │   │   └── behaviour.service.ts
│   │   ├── hooks/
│   │   │   └── useBehaviour.ts
│   │   ├── components/
│   │   │   ├── IncidentCard.tsx
│   │   │   ├── IncidentList.tsx
│   │   │   ├── IncidentFilters.tsx
│   │   │   └── BehaviourChart.tsx
│   │   └── types/
│   │       └── behaviour.types.ts
│   ├── children/
│   ├── attendance/
│   ├── merits/
│   ├── detentions/
│   ├── interventions/
│   ├── messages/
│   ├── notifications/
│   └── settings/
│
├── shared/                           # Shared across modules
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Dropdown.tsx
│   │   ├── layout/                   # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── charts/                   # Chart components
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── PieChart.tsx
│   │   └── feedback/                 # Feedback components
│   │       ├── Loading.tsx
│   │       ├── Error.tsx
│   │       ├── Empty.tsx
│   │       └── Toast.tsx
│   ├── hooks/                        # Shared hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useMediaQuery.ts
│   │   └── useLocalStorage.ts
│   ├── utils/                        # Utility functions
│   │   ├── cn.ts                     # Class name merger
│   │   ├── format.ts                 # Date/number formatting
│   │   └── validation.ts             # Form validation
│   └── types/                        # Shared types
│       ├── common.types.ts
│       └── api.types.ts
│
├── core/                             # Core infrastructure
│   ├── api/
│   │   ├── client.ts                 # Axios instance
│   │   ├── interceptors.ts           # Request/response interceptors
│   │   └── endpoints.ts              # API endpoint constants
│   ├── socket/
│   │   ├── client.ts                 # Socket.io client
│   │   └── events.ts                 # Event handlers
│   ├── auth/
│   │   ├── AuthProvider.tsx          # Auth context
│   │   └── auth.utils.ts             # Auth utilities
│   ├── providers/
│   │   ├── QueryProvider.tsx         # React Query provider
│   │   └── ThemeProvider.tsx         # Theme provider
│   └── config/
│       ├── constants.ts              # App constants
│       └── env.ts                    # Environment variables
│
├── .env.local
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🎯 Data Flow Pattern

```
Page Component
    ↓
Custom Hook (React Query)
    ↓
Service Layer (Business Logic)
    ↓
API Layer (HTTP Calls)
    ↓
Backend API
```

## 📦 Module Structure Example (Behaviour)

Each module follows this pattern:

1. **API Layer** (`api/behaviour.api.ts`)
   - Raw HTTP calls
   - No business logic
   - Returns typed responses

2. **Service Layer** (`services/behaviour.service.ts`)
   - Business logic
   - Data transformation
   - Validation

3. **Hook Layer** (`hooks/useBehaviour.ts`)
   - React Query integration
   - State management
   - Cache management

4. **Component Layer** (`components/`)
   - UI components
   - No business logic
   - Receives data via props

5. **Types** (`types/behaviour.types.ts`)
   - TypeScript interfaces
   - Zod schemas

## 🔌 API Integration

All API calls go through centralized client:
- Automatic token attachment
- Error handling
- Request/response interceptors
- Type-safe responses

## ⚡ Real-Time (Socket.io)

- Centralized socket client
- Event subscriptions via hooks
- Automatic reconnection
- Type-safe events

## 🎨 Component Philosophy

- Highly reusable
- Single responsibility
- Composition over inheritance
- Type-safe props
- Accessible (ARIA)

## 📊 State Management

- **Server State**: React Query
- **UI State**: React useState/useReducer
- **Global State**: Context API (minimal)
- **Form State**: Controlled components

## 🚀 Performance

- Dynamic imports for heavy components
- Image optimization (Next.js Image)
- Code splitting (automatic)
- Memoization where needed
- Server components where possible
