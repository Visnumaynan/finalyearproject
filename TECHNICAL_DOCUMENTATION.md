# LiverCare AI — Comprehensive Technical Documentation

> **Purpose:** Manual testing reference · Code review guide · Developer onboarding · Presentation reference
> **Application:** NAFLD (Non-Alcoholic Fatty Liver Disease) Risk Detection System
> **Version:** 2.0 · Last updated: April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Frontend Structure](#3-frontend-structure)
4. [Backend Structure](#4-backend-structure)
5. [Database Design](#5-database-design)
6. [Data Flow — End-to-End](#6-data-flow--end-to-end)
7. [AI Service Pipeline](#7-ai-service-pipeline)
8. [Dependencies & Tools](#8-dependencies--tools)
9. [Testing Strategy](#9-testing-strategy)
10. [Code Quality & Review Guidelines](#10-code-quality--review-guidelines)
11. [Commands & Setup](#11-commands--setup)
12. [Error Handling & Logging](#12-error-handling--logging)
13. [Security Considerations](#13-security-considerations)
14. [Performance Considerations](#14-performance-considerations)
15. [Conclusion / Presentation Summary](#15-conclusion--presentation-summary)

---

## 1. Project Overview

### 1.1 What the Application Does

**LiverCare AI** is a clinical-grade web application that helps individuals detect their risk of developing Non-Alcoholic Fatty Liver Disease (NAFLD) — one of the most common liver conditions globally, often linked to obesity, diabetes, and metabolic syndrome.

The user submits a set of routine blood test results (e.g., ALT, triglycerides, BMI, blood pressure). The application sends those values to a trained machine learning model, which returns a **risk score (0–100%)** and a **risk level (Low / Medium / High)**. Results are stored over time so users can track how their liver health improves or worsens.

**In plain language:**
> "You paste in your blood test numbers — the AI tells you how at-risk your liver is, and tracks it over months."

---

### 1.2 Key Features

| Feature | Description |
|---|---|
| **Risk Prediction** | ML model (LightGBM) returns a probability score and risk classification |
| **Health History** | All tests stored; users can view a chronological trend chart |
| **Soft Delete Records** | Users can delete incorrect test records; deleted tests are excluded from all calculations |
| **Alerts System** | Automatic alerts (Critical / Warning) when risk is High or escalates |
| **Alert Dismissal** | Clicking dismiss permanently marks an alert as read in the database |
| **Clinical Dashboard** | Charts, recent records, BMI/ALT/BP summary — all filtered to exclude deleted tests |
| **Profile Management** | Users set biological sex and date of birth — used by the AI model |
| **Retry Predictions** | If AI service is offline when a test is submitted, prediction can be retried later |
| **Two-Factor Auth** | Optional 2FA via TOTP (e.g., Google Authenticator) |
| **Responsive UI** | Full mobile + desktop support with dark premium design |

---

### 1.3 User Flows

**Primary flow — "Submit a test and get a result":**

```
1. User registers / logs in
2. User fills in health profile (sex + date of birth) — required for AI model
3. User navigates to "Add Test"
4. User enters blood test values from their latest lab report
5. System validates inputs, creates a BloodTest record
6. System calls the AI service, gets back a risk score
7. User is redirected to the History page with the result displayed
8. If risk is High or escalated, a Critical/Warning alert is created
```

**Secondary flow — "Monitor over time":**

```
1. User returns each month and submits a new test
2. Dashboard shows a trend line chart (risk % over time)
3. Alerts notify the user when their risk is High or escalates
4. User can filter history by risk level (Low / Medium / High)
5. User can delete incorrect records — deleted tests disappear from all views immediately
```

---

### 1.4 Target Users

| User Type | Description |
|---|---|
| **General Public** | Individuals with existing metabolic risk factors (obesity, diabetes, high cholesterol) |
| **Pre-diabetic / Obese individuals** | People monitoring lifestyle intervention outcomes |
| **Clinicians (secondary)** | Doctors who want to share a self-monitoring tool with patients |
| **Researchers / Demo reviewers** | Evaluating the feasibility of AI-powered NAFLD screening |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│           React 19 SPA (rendered by Inertia.js v2)          │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTPS (Inertia + Axios)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               LARAVEL 12 BACKEND  (Port 8000)               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │   Routing    │  │ Controllers  │  │     Services      │ │
│  │  web.php     │→ │  BloodTest   │→ │ MLPrediction      │ │
│  │  settings.php│  │  Profile     │  │  Service          │ │
│  └──────────────┘  └──────────────┘  └────────┬──────────┘ │
│                                               │            │
│  ┌──────────────────────────────┐    HTTP POST│/predict    │
│  │     Eloquent ORM / SQLite    │             │            │
│  │  Users · BloodTests          │             │            │
│  │  RiskPredictions · Alerts    │             │            │
│  └──────────────────────────────┘             │            │
└───────────────────────────────────────────────┼────────────┘
                                                │
                            Internal HTTP call  │
                            (X-Internal-Token)  │
                                                ▼
┌─────────────────────────────────────────────────────────────┐
│              FASTAPI AI SERVICE  (Port 8001)                │
│                                                             │
│  ┌────────────────┐   ┌─────────────────────────────────┐  │
│  │  POST /predict │→  │  model.py                       │  │
│  │  GET  /health  │   │  - Unit conversion (mg/dL→mmol) │  │
│  └────────────────┘   │  - Derived features (TYG, etc.) │  │
│                       │  - LightGBM pipeline.predict()  │  │
│                       │  - Risk classification          │  │
│                       └─────────────────────────────────┘  │
│                                                             │
│              nafld_pipeline.pkl (trained model)             │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Monolith vs Microservices

| Part | Pattern | Reason |
|---|---|---|
| Laravel backend | **Monolith** | Auth, routing, database, business logic, and frontend rendering are tightly coupled by design. Laravel + Inertia removes the need for a separate REST API. |
| AI service | **Microservice** | The ML model is isolated into its own FastAPI process. It can be restarted, redeployed, or scaled independently without touching the web app. |

---

### 2.3 How Components Interact

```
Browser ──[Inertia visit]──► Laravel routes web.php
                                    │
                                    ▼
                          Controller (e.g., BloodTestController)
                                    │
                          ┌─────────┴──────────┐
                          │                    │
                     Eloquent ORM        MLPredictionService
                     (read/write DB)          │
                                              │ HTTP POST
                                              ▼
                                      FastAPI /predict
                                              │
                                      LightGBM model
                                              │
                                      Returns { probability, risk }
                                              │
                          ┌───────────────────┘
                          │
                    RiskPrediction created
                    Alert maybe created
                          │
                          ▼
                   Inertia::render('Dashboard') ──► Browser
```

---

## 3. Frontend Structure

### 3.1 Technology Choices

| Tool | Version | Role |
|---|---|---|
| **React 19** | 19.x | UI library using hooks and functional components |
| **Inertia.js** | v2 | Bridges Laravel routing to React pages — no REST API needed |
| **TypeScript** | 5.2 | Static typing across all frontend code |
| **Tailwind CSS** | v4 | Utility-first CSS — all styling done with class names |
| **Framer Motion** | v12 | Page animations, staggered card reveals, scroll-triggered sections, count-up hooks |
| **Recharts** | v2 | Declarative `AreaChart` components for risk trend visualisation |
| **Lucide React** | 0.468 | Clean stroke icon library |
| **Vite** | 7.x | Dev server and bundler with fast HMR |
| **clsx + tailwind-merge** | — | Conditional Tailwind class merging without conflicts |

> **Note:** The project was fully migrated from Vue 3 to React 19. All `.vue` files, Vue composables, Reka UI, vue-chartjs, and Wayfinder have been removed. All pages are now `.tsx` files.

---

### 3.2 Folder Structure

```
backend-app/resources/js/
│
├── app.tsx                    ← Entry point: mounts React app with Inertia
├── ssr.tsx                    ← SSR entry point (server-side render support)
│
├── pages/                     ← One file per page (Inertia convention)
│   ├── Welcome.tsx            ← Public landing page (hero, animations, stats)
│   ├── Dashboard.tsx          ← Authenticated dashboard
│   ├── BloodTest/
│   │   ├── Create.tsx         ← Blood test submission form
│   │   └── Index.tsx          ← Test history with trend chart + delete
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── ConfirmPassword.tsx
│   │   └── VerifyEmail.tsx
│   └── settings/
│       ├── Profile.tsx        ← Name, email, sex, DOB + delete account
│       └── Password.tsx       ← Change password
│
├── layouts/
│   ├── AppLayout.tsx          ← Authenticated layout with sidebar
│   └── AuthLayout.tsx         ← Centred dark layout for auth pages
│
├── lib/
│   └── utils.ts               ← cn() helper for merging Tailwind classes
│
└── types/
    ├── index.ts               ← AppPageProps type
    ├── auth.ts                ← User, Auth types
    └── globals.d.ts           ← Vite env types, Inertia PageProps extension
```

---

### 3.3 Key Files Explained

#### `app.tsx` — Entry Point
```tsx
createInertiaApp({
    title: (title) => (title ? `${title} - LiverCare` : 'LiverCare'),
    resolve: (name) =>
        resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: '#ffffff' },
});
```
Inertia dynamically imports the correct React component based on the server-returned page name (e.g., `"Dashboard"` → `pages/Dashboard.tsx`).

#### `pages/Dashboard.tsx` — Main Dashboard
- **Props received from Laravel:** `latest`, `trend`, `distribution`, `trendSeries`, `recentTests`, `clinicalBio`, `unreadAlerts`
- **All queries exclude deleted tests** via `whereHas('bloodTest')` on the backend
- **`useCountUp` hook:** `requestAnimationFrame` animates the risk score from 0 to target on mount
- **Recharts `AreaChart`:** Renders the risk trend with a gradient fill
- **Alert bar:** Shows below the charts if `risk_level !== 'Low'`
- **Risk score display:** Backend sends score already as percentage (e.g., `73.2`) — frontend displays directly without multiplying

#### `pages/BloodTest/Create.tsx` — Blood Test Form
- Uses `useForm()` from `@inertiajs/react` — tracks field values + validation errors
- Shows amber warning banner if `aiAvailable === false` (Python service down)
- Reusable `Field` and `NumberInput` components keep the form DRY
- Two-column grid: Personal Info (left) + Blood Test Values (right)

#### `pages/BloodTest/Index.tsx` — History Page
- Client-side pagination (8 records per page)
- Client-side risk filter (All / Low / Medium / High)
- **Trend chart:** Each dot coloured by its own risk level (green/amber/red); chart line colour matches latest result
- **Chart ordering:** Backend sorts by `test_date DESC, id DESC` — deterministic even when two tests share the same date
- **Soft delete:** Trash icon → inline Confirm/Cancel → `DELETE /blood-tests/{id}` → record hidden everywhere
- **Alert dismissal:** Clicking X calls `POST /alerts/{id}/dismiss` → marks `is_read = true` in DB → survives page reload
- **Alerts shown:** Only `Critical` and `Warning` types — `Info` alerts filtered out on both frontend and backend

---

### 3.4 State Management

No global state store (no Redux, no Zustand).

| Mechanism | Used For |
|---|---|
| **Inertia shared props** | Auth user, flash messages — passed from Laravel on every request |
| **Local React `useState`** | Page-specific state: pagination cursor, active filters, confirm-delete ID, dismissed alerts |

Inertia's server-driven model means the server is the source of truth. The frontend never fetches data independently.

---

### 3.5 Routing and Navigation

Routing is **server-side** (Laravel), not client-side (React Router).

```
User clicks link → Inertia intercepts the request
                 → Sends XHR to Laravel instead of full page load
                 → Laravel returns JSON with { component, props }
                 → Inertia swaps the React component without reload
```

Navigation uses the `<Link>` component from `@inertiajs/react`:

```tsx
<Link href="/blood-tests/create">Add Test</Link>
```

All URLs are hardcoded strings — Wayfinder was removed as it was not used by any React page.

---

## 4. Backend Structure

### 4.1 Folder Structure

```
backend-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── BloodTestController.php    ← Blood test CRUD + ML trigger + soft delete
│   │   │   └── Settings/
│   │   │       └── ProfileController.php  ← Profile + health profile update
│   │   ├── Middleware/
│   │   │   ├── HandleInertiaRequests.php  ← Injects shared props (auth.user, flash)
│   │   │   └── HandleAppearance.php       ← Light/dark mode cookie
│   │   └── Requests/
│   │       └── StoreBloodTestRequest.php  ← Input validation + type casting
│   ├── Models/
│   │   ├── User.php
│   │   ├── UserProfile.php
│   │   ├── BloodTest.php                  ← SoftDeletes trait
│   │   ├── DerivedFeature.php
│   │   ├── RiskPrediction.php
│   │   └── Alert.php                      ← SoftDeletes + markRead()
│   ├── Services/
│   │   └── MLPredictionService.php        ← All AI communication logic
│   └── Exceptions/
│       ├── FeatureMismatchException.php
│       └── MLPredictionException.php
│
├── routes/
│   ├── web.php                            ← All HTTP routes incl. alerts/dismiss
│   ├── settings.php                       ← Settings sub-routes
│   └── console.php
│
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/
│       ├── DatabaseSeeder.php             ← Calls DemoUserSeeder + SamplePatientsSeeder
│       ├── DemoUserSeeder.php             ← James Anderson — 12-month narrative
│       └── SamplePatientsSeeder.php       ← 5 diverse clinical profiles
│
└── config/
    └── services.php                       ← FastAPI URL, timeout, token
```

---

### 4.2 Route Structure

```
// ── Public ──────────────────────────────────────────────────────────
GET  /                           → Welcome page

// ── Authenticated + Email Verified ──────────────────────────────────
GET  /dashboard                  → Dashboard (excludes deleted test data)

// Blood Tests
GET  /blood-tests                → History page
GET  /blood-tests/create         → Create form (+ AI health check)
POST /blood-tests                → Store + trigger AI prediction
GET  /blood-tests/{id}           → Show single result
DELETE /blood-tests/{id}         → Soft delete a blood test record
POST /blood-tests/{id}/retry     → Re-run prediction for a saved test

// Alerts
POST /alerts/{id}/dismiss        → Mark alert as read permanently (inline route)

// Settings (from routes/settings.php)
GET  /settings/profile           → Edit profile form
PATCH /settings/profile          → Update name/email
PATCH /settings/profile/health   → Update sex/DOB
DELETE /settings/profile         → Delete account
GET  /settings/password          → Change password
PUT  /settings/password          → Save new password
```

---

### 4.3 Controllers in Detail

#### `BloodTestController`

| Method | Route | What it Does |
|---|---|---|
| `index()` | `GET /blood-tests` | Queries tests with eager-loaded predictions. Filters alerts to `Critical`/`Warning` only. |
| `create()` | `GET /blood-tests/create` | Calls `MLPredictionService::healthCheck()` to set `aiAvailable` prop. |
| `store()` | `POST /blood-tests` | Validates → creates `BloodTest` → calls `processBloodTest()` → redirects with flash. |
| `show()` | `GET /blood-tests/{id}` | Checks ownership (403 if not user's) → returns detail view. |
| `destroy()` | `DELETE /blood-tests/{id}` | Checks ownership → calls `$bloodTest->delete()` (soft delete) → redirects. |
| `retry()` | `POST /blood-tests/{id}/retry` | Checks prediction doesn't exist → re-runs `processBloodTest()`. |

#### `ProfileController` (Settings)

| Method | What it Does |
|---|---|
| `edit()` | Returns profile + health profile data |
| `update()` | Updates `users.name` and `users.email` |
| `updateHealth()` | Creates or updates `user_profiles` (sex, date_of_birth) |
| `destroy()` | Validates password confirmation → deletes user + related data |

#### Alert Dismiss (Inline Route in `web.php`)

A single inline closure handles alert dismissal — no separate controller needed:

```php
Route::post('alerts/{alert}/dismiss', function (Alert $alert) {
    abort_unless($alert->user_id === Auth::id(), 403);
    $alert->markRead();
    return back();
})->name('alerts.dismiss');
```

---

### 4.4 The `MLPredictionService`

The most important service class — owns all communication with the FastAPI AI service.

**Complete processing pipeline:**

```
Input: BloodTest $bloodTest
         │
         ▼
1. Extract features
   BloodTest::toFeatureArray()
   → sex (0=Male, 1=Female) and age from UserProfile
   → all 16 blood values with correct keys
         │
         ▼
2. Validate required features
   Checks: has_fatty_liver, bmi, body_weight,
           waist_circumference, alt, ast
   → Throws FeatureMismatchException if any missing
         │
         ▼
3. Compute + store DerivedFeature
   TYG     = ln(TG_mmol × Glucose_mmol / 2)
   TG/HDL  = TG_mmol / HDL_mmol
   TYG_BMI = TYG × BMI
   → updateOrCreate DerivedFeature record
         │
         ▼
4. Call FastAPI  (time measured in ms)
   POST http://127.0.0.1:8001/predict
   Header: X-Internal-Token: {token}
   Body: feature array as JSON
   → Throws MLPredictionException if fails
         │
         ▼
5. Parse + validate response
   { probability: 0.623, risk: "MEDIUM" }
   → Validates keys + risk value present
   → risk_score = probability (stored as 0–1 decimal)
   → risk_level = ucfirst(strtolower(risk))
         │
         ▼
6. Create RiskPrediction record
   Stores: risk_score, risk_level, model_used,
           fastapi_response_ms, feature_snapshot (JSON)
         │
         ▼
7. Conditionally create Alert (maybeCreateAlert)
   Get previous prediction's risk_level
   Rules:
     - risk_level == "High"         → Critical alert
     - currentLevel > previousLevel → Warning alert
     - risk same or lower           → no alert
         │
         ▼
Output: RiskPrediction $prediction
```

**`healthCheck()`** — separate utility called on page load to show/hide the "AI offline" banner. Hits `GET /health` with a 5-second timeout. Returns `true` or `false`.

**Key design:** BloodTest is saved **before** `processBloodTest()` is called. If Python is offline, the test data is never lost — it sits in the DB awaiting a retry.

---

### 4.5 Middleware

| Middleware | Purpose |
|---|---|
| `HandleInertiaRequests` | Injects shared props into every Inertia response: `auth.user`, `flash` messages |
| `HandleAppearance` | Reads `appearance` cookie, applies dark/light class |
| `auth` | Redirects to login if not authenticated |
| `verified` | Redirects to email verification if not confirmed |

---

### 4.6 Validation — `StoreBloodTestRequest`

```
Field                     | Rule                          | Notes
──────────────────────────────────────────────────────────────────────
test_date                 | required, date, ≤ today       | Cannot submit future tests
bmi                       | required, numeric, 10–100     | Physiological range
body_weight               | required, numeric, 10–400 kg
waist_circumference       | required, numeric, 30–300 cm
alt                       | required, numeric, 0–5000     | Required by ML model
ast                       | required, numeric, 0–5000     | Required by ML model
ggt                       | nullable, numeric, 0–5000
has_fatty_liver           | required, boolean             | Normalised from string
triglycerides             | nullable, 0–2000 mg/dL
hdl                       | nullable, 5–500 mg/dL
total_cholesterol         | nullable, 0–1000 mg/dL
fasting_glucose           | nullable, 40–1000 mg/dL
hba1c                     | nullable, 1–20 %
blood_pressure_systolic   | nullable, 60–300 mmHg
blood_pressure_diastolic  | nullable, 40–200 mmHg
```

`prepareForValidation()` casts all numeric strings to `float` and normalises `has_fatty_liver` to a PHP boolean before validation runs.

---

## 5. Database Design

### 5.1 Database Engine

**SQLite** is used for development (`database/database.sqlite`).
Can be swapped to **MySQL or PostgreSQL** in production via `DB_CONNECTION` in `.env`.

---

### 5.2 Schema Design (Entity-Relationship)

```
users
  │ id, name, email, password, email_verified_at
  │ two_factor_secret, two_factor_recovery_codes
  │
  ├──(1:1)──► user_profiles
  │              id, user_id, sex, date_of_birth
  │
  ├──(1:N)──► blood_tests
  │              id, user_id, test_date
  │              bmi, body_weight, waist_circumference
  │              alt, ast, ggt
  │              triglycerides, hdl, total_cholesterol
  │              fasting_glucose, hba1c
  │              blood_pressure_systolic, blood_pressure_diastolic
  │              has_fatty_liver
  │              deleted_at  ← soft delete
  │              │
  │              ├──(1:1)──► derived_features
  │              │              id, blood_test_id
  │              │              tyg_index, tg_hdl_ratio, tyg_bmi
  │              │
  │              └──(1:1)──► risk_predictions
  │                             id, user_id, blood_test_id
  │                             risk_score (0–1), risk_level, model_used
  │                             prediction_date, fastapi_response_ms
  │                             feature_snapshot (JSON)
  │                             │
  │                             └──(1:N)──► alerts
  │                                            id, user_id, risk_prediction_id
  │                                            alert_type (Critical|Warning)
  │                                            message
  │                                            previous_risk_level, current_risk_level
  │                                            is_read, read_at
  │                                            deleted_at  ← soft delete
  │
  └──(1:N)──► risk_predictions (direct user_id FK for fast dashboard queries)
  └──(1:N)──► alerts (direct user_id FK for fast alert queries)
```

---

### 5.3 Key Design Decisions

**Why `user_id` on both `blood_tests` AND `risk_predictions`?**
Avoids a JOIN when querying "all predictions for this user". The dashboard reads predictions directly via `user_id` without going through blood tests.

**Why soft deletes on `blood_tests`?**
Medical data should never be permanently deleted. Soft delete sets `deleted_at` — the row stays in the database but is hidden from all queries. The dashboard uses `whereHas('bloodTest')` to automatically exclude predictions from soft-deleted tests.

**Why store `feature_snapshot` as JSON?**
The exact feature values used for a prediction are frozen at inference time. If the model is retrained with different features, old predictions still have their original inputs captured — supporting model versioning and auditability.

**Why `DerivedFeature` as a separate table?**
TYG index and other insulin-resistance markers are computed values, not raw user input. Separating them keeps `blood_tests` clean and allows recomputation without modifying user data.

**Risk score stored as 0–1 decimal, displayed as 0–100%:**
The backend stores `risk_score` as the raw probability (e.g., `0.623`). The dashboard route converts to percentage before sending to React (`round($score * 100, 1)` → `62.3`). The BloodTest history controller sends the raw decimal and the frontend multiplies. This distinction is important — the two pages handle it differently.

---

### 5.4 Migration Timeline

```
0001_01_01_000000  → users, password_reset_tokens, sessions
0001_01_01_000001  → cache, cache_locks
0001_01_01_000002  → jobs, job_batches, failed_jobs
2025_01_29_000001  → user_profiles
2025_01_29_000002  → blood_tests (with softDeletes)
2025_01_29_000003  → derived_features
2025_01_29_000004  → risk_predictions
2025_01_29_000005  → alerts (with softDeletes)
2025_08_14_170933  → Add two-factor auth columns to users
2026_04_17_000001  → Add fastapi_response_ms, feature_snapshot to risk_predictions
                     Add previous_risk_level, current_risk_level, read_at to alerts
2026_04_17_000002  → Add body_weight, has_fatty_liver to blood_tests
```

---

## 6. Data Flow — End-to-End

### 6.1 Step-by-Step: Submitting a Blood Test

```
STEP 1 — USER FILLS FORM
  Browser: User fills BloodTest/Create.tsx form
  React: useForm() tracks field values in state
  ─────────────────────────────────────────────────────────────

STEP 2 — FORM SUBMISSION
  React: post('/blood-tests', data)
  Inertia: XHR POST to /blood-tests
  Headers: X-CSRF-TOKEN, X-Inertia: true
  Body: { test_date, bmi, alt, ast, ... }
  ─────────────────────────────────────────────────────────────

STEP 3 — LARAVEL VALIDATION
  StoreBloodTestRequest runs before controller
  If fails: returns 422 → Inertia puts errors into form.errors
  If passes: controller receives clean validated data
  ─────────────────────────────────────────────────────────────

STEP 4 — CREATE BLOOD TEST RECORD
  BloodTest::create([...validated, 'user_id' => Auth::id()])
  DB: INSERT INTO blood_tests (...)
  ─────────────────────────────────────────────────────────────

STEP 5 — LOAD USER PROFILE
  $bloodTest->load('user.profile')
  → Sex and age needed for toFeatureArray()
  ─────────────────────────────────────────────────────────────

STEP 6 — CALL AI SERVICE
  MLPredictionService::processBloodTest($bloodTest)
  → toFeatureArray() builds 16-feature array
  → HTTP POST http://127.0.0.1:8001/predict
  → Header: X-Internal-Token
  ─────────────────────────────────────────────────────────────

STEP 7 — AI MODEL PROCESSES REQUEST
  FastAPI validates BloodTestInput schema
  Python converts mg/dL → mmol/L for lipids/glucose
  Python computes TYG, TYG_BMI, TYG_WC, TG/HDL
  Python builds 20-column DataFrame in correct feature order
  Python imputes nulls with training means
  pipeline.predict_proba([[...]]) → e.g., [[0.377, 0.623]]
  probability = 0.623 → risk = "MEDIUM"
  Returns { prediction: 1, probability: 0.623, risk: "MEDIUM" }
  ─────────────────────────────────────────────────────────────

STEP 8 — STORE RESULTS
  DerivedFeature::updateOrCreate([tyg_index, tg_hdl_ratio, tyg_bmi])
  RiskPrediction::create([
    risk_score: 0.623,
    risk_level: 'Medium',
    model_used: 'nafld_lgbm_v1',
    fastapi_response_ms: 312,
    feature_snapshot: { ...all features... }
  ])
  ─────────────────────────────────────────────────────────────

STEP 9 — GENERATE ALERT (IF NEEDED)
  Previous risk was Low, current is Medium → Warning alert
  Current is High → Critical alert
  Same or lower risk → no alert created
  ─────────────────────────────────────────────────────────────

STEP 10 — REDIRECT RESPONSE
  return redirect()->route('blood-tests.index')
      ->with('success', 'Analysis complete — Risk: Medium (62.3%)')
  Inertia: Browser navigates to /blood-tests
  Flash message shown from shared props
```

---

### 6.2 Soft Delete Flow

```
User clicks trash icon on a test row
  → Confirm / Cancel buttons appear inline
  → User clicks Confirm
  → deleteForm.delete('/blood-tests/{id}')
  → BloodTestController::destroy()
  → abort_unless($bloodTest->user_id === Auth::id(), 403)
  → $bloodTest->delete()  (sets deleted_at = now())
  → redirect with 'Test record deleted.' flash

Dashboard on next load:
  → RiskPrediction queries use whereHas('bloodTest')
  → Eloquent automatically adds WHERE deleted_at IS NULL
  → Deleted test's prediction excluded from score, chart, table
```

---

### 6.3 Alert Dismiss Flow

```
Alert appears on BloodTest/Index page (via Inertia props)
  → User clicks X button
  → dismiss(id) called:
      1. setDismissed(prev => new Set([...prev, id]))  ← instant UI hide
      2. router.post('/alerts/{id}/dismiss', {}, { preserveScroll: true })
  → Backend: alert->markRead() → is_read = true, read_at = now()
  → On next page reload: alert not included in unreadAlerts (already read)
  → Alert is permanently gone
```

---

## 7. AI Service Pipeline

### 7.1 Overview

The AI service is a standalone **Python FastAPI application** that loads a pre-trained **LightGBM** model and exposes it over HTTP. It has no database — it is purely stateless inference.

**Location:** `ai-service/`
**Port:** 8001
**Model file:** `backend-app/public/model/nafld_pipeline.pkl`

---

### 7.2 Model Details

| Property | Value |
|---|---|
| **Algorithm** | LightGBM (Light Gradient Boosting Machine) |
| **Task type** | Binary classification |
| **Output** | Probability (0.0 – 1.0) of developing NAFLD |
| **Training dataset** | International Journal of Obesity dataset |
| **Pipeline** | scikit-learn `Pipeline` (preprocessing + LightGBM estimator) |
| **Feature count** | 20 features |

**Why LightGBM?**
LightGBM handles tabular medical data extremely well. It is fast, handles missing values natively, and produces calibrated probabilities — outperforming logistic regression and random forest on metabolic risk data.

---

### 7.3 Input → Processing → Output

```
                     RAW INPUT (from Laravel)
                     ┌────────────────────────┐
                     │ sex: 0 (Male)           │
                     │ age: 42                 │
                     │ bmi: 28.5               │
                     │ alt: 52 IU/L            │
                     │ triglycerides: 185 mg/dL│  ← mg/dL
                     │ fasting_glucose: 118    │
                     └────────────┬───────────┘
                                  │
                     UNIT CONVERSION (model.py)
                     TG mmol/L  = 185 ÷ 88.57  = 2.089
                     Glucose    = 118 ÷ 18.0   = 6.556
                     HDL mmol/L = 44  ÷ 38.67  = 1.138
                                  │
                     DERIVED FEATURES
                     TYG     = ln(2.089 × 6.556 / 2) = 1.924
                     TYG_BMI = 1.924 × 28.5           = 54.83
                     TYG_WC  = 1.924 × 97             = 186.6
                     TG_HDL  = 2.089 / 1.138           = 1.836
                                  │
                     20-COLUMN DATAFRAME (exact order required)
                     NULL IMPUTATION (missing → training means)
                                  │
                     pipeline.predict_proba([[...]])
                              [0.377, 0.623]
                               No NAFLD  NAFLD
                                  │
                     RISK CLASSIFICATION
                     ≥ 0.70 → HIGH
                     ≥ 0.40 → MEDIUM
                     < 0.40 → LOW
                                  │
                     { prediction: 1, probability: 0.623, risk: "MEDIUM" }
```

---

### 7.4 The 20 Features (Exact Order)

```python
FEATURE_COLUMNS = [
    "Sex, 1:Men, 2:Women",                      # 0=Male, 1=Female
    "Baseline Age, yrs",
    "Baseline Fatty liver 0/1",                  # 0=No, 1=Yes
    "Baseline BMI, kg/m2",
    "Baseline Waist circumference(WC), cm",
    "Baseline ALT, IU/L",
    "Baseline AST, IU/L",
    "Baseline Body Weight, kg",
    "Baseline GGT, IU/L",
    "Baseline HDL-cholesterol, mmol/L",          # converted from mg/dL
    "Baseline Total Cholesterol, mmol/L",        # converted from mg/dL
    "Baseline Triglycerides, mmol/L",            # converted from mg/dL
    "Baseline HbA1c, %",
    "Baseline Fasting plasma glucose, mmol/L",   # converted from mg/dL
    "Baseline Systolic blood pressure, mmHg",
    "Baseline Diastolic blood pressure, mmHg",
    "TyG",
    "TyG_BMI",
    "TyG_WC",
    "TG_HDL",
]
```

---

### 7.5 Error Handling and Fallbacks

| Error | Where | What Happens |
|---|---|---|
| AI service is down | `MLPredictionService` | `MLPredictionException` thrown. BloodTest is **saved**; user sees warning with Retry option. |
| Feature mismatch | FastAPI `/predict` | Returns 422. Laravel catches and throws `FeatureMismatchException`, logs critical. |
| Required field missing | `StoreBloodTestRequest` | Returns 422 with field errors. BloodTest is **not** created. |
| Model file not found | FastAPI startup | Crashes immediately — fast fail prevents silent failures. |
| Token mismatch | FastAPI middleware | Returns 401 immediately. |

---

## 8. Dependencies & Tools

### 8.1 PHP / Laravel Dependencies

| Package | Version | Purpose |
|---|---|---|
| `laravel/framework` | ^12.0 | Core framework |
| `inertiajs/inertia-laravel` | ^2.0 | Server-side Inertia adapter |
| `laravel/fortify` | ^1.30 | Auth backend: login, register, 2FA, password reset |
| `laravel/tinker` | ^2.10 | REPL for debugging |
| `pestphp/pest` | ^4.3 | PHP testing framework |
| `laravel/pint` | ^1.24 | PHP code formatter |
| `fakerphp/faker` | ^1.23 | Fake data for factories/seeders |

---

### 8.2 JavaScript / React Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` + `react-dom` | ^19.0 | UI library |
| `@inertiajs/react` | ^2.0 | React Inertia client adapter |
| `framer-motion` | ^12.0 | Animations, transitions, scroll-triggered reveals |
| `recharts` | ^2.15 | Declarative chart components |
| `lucide-react` | ^0.468 | Icon library |
| `tailwindcss` | ^4.1 | Utility-first CSS |
| `@vitejs/plugin-react` | ^4.5 | React Fast Refresh + JSX transform |
| `clsx` + `tailwind-merge` | — | Conditional class merging |
| `class-variance-authority` | ^0.7 | Component variant styling |
| `typescript` | ^5.2 | Static type-checking |
| `vite` | ^7.0 | Build tool |

---

### 8.3 Python / AI Dependencies

| Package | Version | Purpose |
|---|---|---|
| `fastapi` | 0.115.6 | Async Python web framework |
| `uvicorn` | 0.34.0 | ASGI server |
| `lightgbm` | 4.5.0 | Gradient boosting model |
| `scikit-learn` | 1.5.2 | ML pipeline wrapper |
| `pandas` | 2.2.3 | DataFrame operations |
| `numpy` | 1.26.4 | Numerical operations |
| `pydantic` | 2.10.6 | Input schema validation |

---

### 8.4 Development Tools

| Tool | Purpose |
|---|---|
| **Pint** | Auto-formats PHP code to PSR-12 + Laravel standards |
| **ESLint** | TypeScript linting |
| **Prettier** | TypeScript/CSS formatting |
| **Pest** | PHP test runner |
| **Vite HMR** | Instant browser updates on save |

---

## 9. Testing Strategy

### 9.1 Test Users (Seeded)

Run `php artisan migrate:fresh --seed` to create these accounts. All passwords: `password`.

| Email | Profile | Scenario Covered |
|---|---|---|
| `demo@livercare.test` | James Anderson, 42M | Full 12-month arc: Low → Medium → High → Low. Best for dashboard/chart testing. |
| `sarah@livercare.test` | Sarah Young, 28F | Always Low risk. Healthy baseline display. |
| `robert@livercare.test` | Robert Chen, 55M | Always High risk. Critical alerts, red UI states. |
| `maria@livercare.test` | Maria Santos, 45F | Worsening (Low → High). Alert escalation. |
| `david@livercare.test` | David Kim, 38M | Improving (High → Low). Recovery display. |
| `priya@livercare.test` | Priya Patel, 50F | Oscillating Medium. Borderline states. |

---

### 9.2 Manual Test Scenarios

#### Authentication
| # | Scenario | Expected Result |
|---|---|---|
| A1 | Register with valid email + password | Redirected to dashboard |
| A2 | Register with duplicate email | Error: "The email has already been taken." |
| A3 | Login with wrong password | Error: "These credentials do not match our records." |
| A4 | Access `/dashboard` without logging in | Redirected to `/login` |

#### Blood Test Submission
| # | Scenario | Expected Result |
|---|---|---|
| B1 | Submit form with all required fields | History page with success flash and new row |
| B2 | Submit with BMI = 5 (below min 10) | Validation error on BMI field |
| B3 | Submit with future test date | Validation error: "Test date cannot be in the future." |
| B4 | Submit with ALT left empty | Validation error on ALT field |
| B5 | Submit while AI service is offline | Warning flash: "Blood test saved. AI unreachable — retry later." |
| B6 | Click Retry on a pending test | Prediction appears; Retry button disappears |

#### Soft Delete
| # | Scenario | Expected Result |
|---|---|---|
| SD1 | Click trash icon on a test row | Confirm / Cancel appear inline |
| SD2 | Click Cancel | Buttons disappear, row unchanged |
| SD3 | Click Confirm | Row removed; success flash shown |
| SD4 | Reload page after delete | Record does not reappear |
| SD5 | Check dashboard after deleting latest test | Risk score, chart and recent records update to exclude the deleted test |

#### Dashboard
| # | Scenario | Expected Result |
|---|---|---|
| D1 | Login as `demo@livercare.test` | Risk score shown as percentage (e.g., 18%), line chart shows 12-month arc |
| D2 | Login as `robert@livercare.test` | High risk score, red card, Critical alert bar |
| D3 | Login as new user with no tests | "No prediction yet" placeholder |

#### History Page
| # | Scenario | Expected Result |
|---|---|---|
| H1 | Add High risk test then Low risk test | Chart shows High on left, Low on right (correct order) |
| H2 | Filter by "High" on `robert@livercare.test` | All rows remain |
| H3 | Filter by "Low" on `robert@livercare.test` | 0 rows, empty state shown |
| H4 | Dismiss an alert on this page | Alert disappears; does not reappear on reload |

#### Alerts
| # | Scenario | Expected Result |
|---|---|---|
| AL1 | Login as `maria@livercare.test` | Warning/Critical alerts visible (no Info alerts) |
| AL2 | Click X on an alert | Alert hides instantly; stays hidden after reload |

#### Profile / Settings
| # | Scenario | Expected Result |
|---|---|---|
| P1 | Save Health Profile with sex + valid DOB | Subsequent AI predictions use correct sex/age |
| P2 | Change email to already-used email | Validation error |
| P3 | Delete account | User deleted; redirected to home |

---

### 9.3 API Testing with Postman

**Health check:**
```
GET http://127.0.0.1:8001/health
Expected: { "status": "ok", "model_loaded": true, "feature_count": 20 }
```

**Low risk prediction:**
```
POST http://127.0.0.1:8001/predict
Header: X-Internal-Token: nafld-secret-token
Body:
{
    "sex": 1, "age": 28, "has_fatty_liver": 0,
    "bmi": 21.0, "body_weight": 58.0, "waist_circumference": 70,
    "alt": 16, "ast": 14, "ggt": 15,
    "triglycerides_mgdl": 68, "hdl_mgdl": 78, "total_cholesterol_mgdl": 155,
    "fasting_glucose_mgdl": 78, "hba1c": 4.9,
    "blood_pressure_systolic": 108, "blood_pressure_diastolic": 68
}
Expected: { "prediction": 0, "probability": ~0.09, "risk": "LOW" }
```

**High risk prediction:**
```
POST http://127.0.0.1:8001/predict
Body:
{
    "sex": 0, "age": 55, "has_fatty_liver": 1,
    "bmi": 34.3, "body_weight": 101.7, "waist_circumference": 111,
    "alt": 95, "ast": 76, "ggt": 110,
    "triglycerides_mgdl": 260, "hdl_mgdl": 30, "total_cholesterol_mgdl": 267,
    "fasting_glucose_mgdl": 150, "hba1c": 7.4,
    "blood_pressure_systolic": 152, "blood_pressure_diastolic": 98
}
Expected: { "prediction": 1, "probability": ~0.79, "risk": "HIGH" }
```

---

### 9.4 Running Automated Tests

```bash
php artisan test --compact
php artisan test --compact --filter=BloodTest
```

---

## 10. Code Quality & Review Guidelines

### 10.1 PHP Coding Standards

- **PSR-12** style enforced by Laravel Pint — run `vendor/bin/pint --dirty` before every commit
- **PHP 8.3** features: constructor property promotion, `match` expressions, nullsafe operator
- **Explicit return types** on all methods
- **No `env()` calls** outside `config/` files
- **`@var` type hints** where IDE loses type inference (e.g., `Auth::user()`, `Http::post()`)

### 10.2 TypeScript / React Standards

- **Functional components** with TypeScript typed props interfaces
- **`cn()` helper** for conditional Tailwind classes
- **`<Link>` component** from `@inertiajs/react` for all internal navigation
- **`router.post()`** for non-GET Inertia actions (dismiss, delete confirm)
- **Hardcoded URL strings** — Wayfinder not used; all routes are simple strings

### 10.3 File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React pages | PascalCase | `Dashboard.tsx`, `BloodTest/Index.tsx` |
| PHP controllers | PascalCase + suffix | `BloodTestController.php` |
| PHP models | PascalCase singular | `BloodTest.php`, `RiskPrediction.php` |
| PHP migrations | snake_case with timestamp | `2026_04_17_000001_extend_risk_predictions.php` |
| PHP seeders | PascalCase + suffix | `DemoUserSeeder.php` |

### 10.4 Code Review Checklist

**Security**
- [ ] No `env()` calls outside `config/`
- [ ] No raw SQL — use Eloquent
- [ ] All write routes behind `auth` middleware
- [ ] All model access checks `user_id === Auth::id()` (no IDOR)

**Database**
- [ ] N+1 queries prevented with `with()` eager loading
- [ ] Dashboard queries use `whereHas('bloodTest')` to exclude deleted tests
- [ ] Soft deletes used for user-owned data

**Controller**
- [ ] Validation in Form Request, not inline
- [ ] Controllers are thin — logic in Service
- [ ] Flash messages via `with('success', ...)` or `with('warning', ...)`

**Frontend**
- [ ] `<Link>` used (not `<a>`) for navigation
- [ ] `form.errors.field` shown under each input
- [ ] Dismiss actions call backend (not just local state)
- [ ] Risk score not double-multiplied (dashboard sends % already)

---

## 11. Commands & Setup

### 11.1 Prerequisites

| Requirement | Version |
|---|---|
| PHP | ≥ 8.3 |
| Composer | ≥ 2.x |
| Node.js | ≥ 18 |
| Python | ≥ 3.11 |

---

### 11.2 First-Time Setup

```bash
# 1. Laravel setup
cd backend-app
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed

# 2. AI service setup
cd ../ai-service
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

---

### 11.3 Running the Application

**Terminal 1 — Laravel + Vite:**
```bash
cd backend-app
composer run dev
# Starts Laravel (port 8000) + Vite HMR (port 5173)
```

**Terminal 2 — FastAPI AI service:**
```bash
cd ai-service
venv\Scripts\activate
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

**Access:**
- Web app: `http://localhost:8000`
- AI health check: `http://localhost:8001/health`

---

### 11.4 Environment Variables

```env
APP_NAME=LiverCare
APP_ENV=local
APP_KEY=               ← generated by php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=sqlite

FASTAPI_URL=http://127.0.0.1:8001
FASTAPI_TIMEOUT=30
FASTAPI_INTERNAL_TOKEN=nafld-secret-token
```

The same token must be set for the AI service:
```bash
# Windows PowerShell:
$env:FASTAPI_INTERNAL_TOKEN = "nafld-secret-token"
# Mac/Linux:
export FASTAPI_INTERNAL_TOKEN="nafld-secret-token"
```

---

### 11.5 Common Commands Reference

```bash
# Database
php artisan migrate:fresh --seed      # Full reset with test data
php artisan db:seed                   # Seed without re-migrating

# Code quality
vendor/bin/pint --dirty               # Format PHP
npm run lint                          # ESLint
npm run format                        # Prettier

# Testing
php artisan test --compact
php artisan test --compact --filter=BloodTest

# Frontend
npm run dev                           # Dev server
npm run build                         # Production build

# Debugging
php artisan tinker                    # Interactive PHP REPL
php artisan route:list                # All registered routes
php artisan config:clear              # Clear config cache
```

---

## 12. Error Handling & Logging

### 12.1 Custom Exceptions

| Exception | Code | When Thrown |
|---|---|---|
| `FeatureMismatchException` | 500 | Model's expected features differ from what Laravel sends |
| `MLPredictionException` | 503 | FastAPI unreachable, returns error, or response malformed |

Both implement `render()` returning JSON — caught gracefully by the controller which redirects with a warning flash instead of crashing.

---

### 12.2 Frontend Error Handling

**Form validation errors:**
```tsx
{errors.bmi && <p className="text-xs text-red-400">{errors.bmi}</p>}
```

**Flash messages:**
```php
// Backend:
return redirect()->back()->with('warning', 'AI service offline...');
```
```tsx
// Frontend reads from usePage().props.flash
const flash = pageProps.flash;
{flash?.warning && <div className="...amber...">{flash.warning}</div>}
```

**AI service offline:**
`GET /blood-tests/create` calls `healthCheck()` → if offline → `aiAvailable = false` → amber banner in form header.

---

### 12.3 Logging

**Laravel** (`storage/logs/laravel.log`):
```bash
tail -f storage/logs/laravel.log
```

Log levels used:
- `Log::critical()` — feature mismatch (developer bug)
- `Log::error()` — FastAPI 4xx/5xx responses
- `Log::warning()` — FastAPI unreachable, health check failed
- `Log::info()` — successful prediction stored

**FastAPI** (uvicorn terminal output):
```
INFO: Model loaded: 20 features
INFO: Prediction — risk=MEDIUM prob=0.6230 pred=1
ERROR: Feature mismatch: missing=[...]
```

---

### 12.4 Debugging Checklist

**"Prediction not appearing after submit":**
1. Check `storage/logs/laravel.log` for exceptions
2. Check uvicorn terminal for connection errors
3. Confirm `FASTAPI_URL` port matches uvicorn's `--port`
4. Confirm `FASTAPI_INTERNAL_TOKEN` matches in both `.env` and AI service env

**"Dashboard still shows deleted test data":**
1. Confirm `whereHas('bloodTest')` is on both prediction queries in `web.php`
2. Confirm `BloodTest` model has `use SoftDeletes`

**"Alert reappears after dismiss":**
1. Confirm `router.post('/alerts/{id}/dismiss')` is being called (check Network tab)
2. Confirm the inline dismiss route exists in `web.php`

**"Risk score shows as 7320% instead of 73.2%":**
The dashboard backend sends scores already multiplied by 100. The frontend must NOT multiply again. Use `props.latest.risk_score` directly (not `* 100`).

---

## 13. Security Considerations

### 13.1 Authentication Flow

```
Register → Fortify creates user → Email verification sent
→ User clicks link → email_verified_at set → Access granted

Login → Fortify validates → Session created
→ HTTP-only encrypted session cookie issued

Optional 2FA → TOTP code verified → two_factor_confirmed_at set
→ All subsequent logins require 6-digit TOTP code
```

---

### 13.2 Data Protection

| Measure | Implementation |
|---|---|
| **Password hashing** | bcrypt via Laravel Fortify |
| **CSRF protection** | Inertia includes X-CSRF-TOKEN on every non-GET request |
| **Cookie encryption** | All cookies encrypted |
| **SQL injection prevention** | Eloquent ORM with PDO prepared statements |
| **Soft deletes** | Medical data never permanently deleted |
| **Feature snapshot** | Full audit trail of inputs for every prediction |

---

### 13.3 API Security

```
X-Internal-Token: nafld-secret-token
```
Every request from Laravel to FastAPI carries this header. FastAPI validates it before processing. Missing or wrong token → 401.

---

### 13.4 Authorisation (IDOR Prevention)

```php
// Every controller action that accesses a user-owned record:
abort_unless($bloodTest->user_id === Auth::id(), 403);
```

This prevents a user from deleting or viewing another user's blood test by guessing an ID in the URL.

---

### 13.5 Common Vulnerabilities Addressed

| Vulnerability | Mitigation |
|---|---|
| **SQL Injection** | Eloquent ORM + prepared statements |
| **XSS** | React auto-escapes JSX; no `dangerouslySetInnerHTML` |
| **CSRF** | Inertia X-CSRF-TOKEN on all mutations |
| **IDOR** | Explicit `user_id === Auth::id()` in every controller action |
| **Mass Assignment** | All models have explicit `$fillable` |
| **Brute Force** | Fortify rate limits login attempts |
| **Session Fixation** | Laravel rotates session ID on login |

---

## 14. Performance Considerations

### 14.1 Database Queries

**Eager loading prevents N+1:**
```php
// ✓ Correct — 2 queries
BloodTest::with(['riskPrediction', 'derivedFeature'])->where('user_id', $id)->get();

// ✗ Wrong — 1 + N queries
BloodTest::where('user_id', $id)->get()->each(fn($bt) => $bt->riskPrediction);
```

**Dashboard exclusion of deleted tests:**
```php
RiskPrediction::whereHas('bloodTest')->where('user_id', $userId)->...
// Eloquent adds WHERE blood_tests.deleted_at IS NULL automatically
```

---

### 14.2 Frontend Performance

| Technique | Implementation |
|---|---|
| **Code splitting** | Vite splits each page into its own chunk |
| **Client-side pagination** | History table paginates 8 records in JavaScript |
| **Client-side filtering** | Risk filter applied in component state — no network call |
| **Framer Motion** | Animations use `requestAnimationFrame` — GPU-composited |
| **Recharts** | Charts only render when data has ≥ 2 points |

---

### 14.3 AI Service Performance

| Measure | Value |
|---|---|
| **Model loaded at startup** | Pickle loaded once — not per request |
| **Stateless inference** | Each request is independent |
| **Response time** | 140–750ms (stored as `fastapi_response_ms`) |
| **Async framework** | FastAPI handles concurrent requests efficiently |

---

## 15. Conclusion / Presentation Summary

### 15.1 Key Takeaways

1. **Full-stack AI health tool** built for NAFLD risk detection using routine blood test data — a real clinical need addressed with modern web technology.

2. **Pragmatic architecture** — Laravel + Inertia + React handles 95% of the application. The AI model is isolated as a microservice only because it has fundamentally different deployment characteristics.

3. **Every design decision has a medical context** — soft deletes (can't lose medical data), feature snapshots (audit trail), retry mechanism (AI can go offline), alert logic (only warn when risk worsens).

4. **Vue → React migration completed** — the entire frontend was rewritten from Vue 3 to React 19 with Framer Motion animations, Recharts, and a dark premium 21st.dev-inspired design system.

---

### 15.2 How All Parts Connect

```
┌────────────────────────────────────────────────────────────────┐
│  User visits browser → React SPA rendered via Inertia          │
│  (page data arrives as props from Laravel — no API calls)       │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────────┐
│  Laravel 12 handles everything server-side:                     │
│  Auth (Fortify) · Routing · Validation · ORM · Business Logic  │
└────────────────────────┬───────────────────────────────────────┘
                         │ When blood test submitted
┌────────────────────────▼───────────────────────────────────────┐
│  MLPredictionService calls FastAPI over HTTP                    │
│  FastAPI loads LightGBM model → returns risk probability        │
│  Risk score + alert stored in SQLite                            │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────────┐
│  Dashboard rebuilt on next page load:                           │
│  Charts, risk score, alerts — all filtered to exclude           │
│  soft-deleted test records via whereHas('bloodTest')            │
└────────────────────────────────────────────────────────────────┘
```

---

### 15.3 Simplified Explanation (For Non-Technical Audiences)

> Imagine going to the doctor and getting a blood test. Instead of waiting weeks for results, you open LiverCare AI, type in your numbers, and within 2 seconds see a risk score — like a credit score for your liver.
>
> The system was trained on hundreds of thousands of real patient records. It looks at your BMI, liver enzymes, blood sugar, and cholesterol, and calculates how likely you are to develop fatty liver disease.
>
> Every test you submit is saved. Over months, you can see a chart — did your lifestyle changes actually help? If you entered a wrong record, you can delete it and the dashboard updates automatically. The system alerts you only when your risk is dangerously high or getting worse.
>
> Three risk levels: **Green (Low)** — you're doing well. **Amber (Medium)** — watch your diet. **Red (High)** — see a doctor.

---

### 15.4 Quick Reference Card

```
┌─ STACK SUMMARY ────────────────────────────────────────────────┐
│  Frontend:  React 19 + Inertia.js + TypeScript + Tailwind CSS  │
│             Framer Motion + Recharts + Lucide React            │
│  Backend:   Laravel 12 + Eloquent ORM + Fortify Auth           │
│  Database:  SQLite (dev) / MySQL (prod)                        │
│  AI:        FastAPI + LightGBM + scikit-learn                   │
│  Build:     Vite 7 + Laravel Pint + ESLint + Prettier          │
│  Tests:     Pest 4                                             │
└────────────────────────────────────────────────────────────────┘

┌─ PORTS ────────────────────────────────────────────────────────┐
│  Laravel web app:    http://localhost:8000                      │
│  FastAPI AI service: http://localhost:8001                      │
│  Vite HMR server:    http://localhost:5173 (dev only)          │
└────────────────────────────────────────────────────────────────┘

┌─ KEY COMMANDS ─────────────────────────────────────────────────┐
│  composer run dev                   Laravel + Vite (Terminal 1) │
│  uvicorn main:app --port 8001       AI service (Terminal 2)    │
│  php artisan migrate:fresh --seed   Reset + reseed database    │
│  vendor/bin/pint --dirty            Format PHP before commit   │
│  php artisan test --compact         Run all tests              │
└────────────────────────────────────────────────────────────────┘

┌─ TEST ACCOUNTS ────────────────────────────────────────────────┐
│  demo@livercare.test   James Anderson  12-month full arc       │
│  sarah@livercare.test  Sarah Young     Always Low risk         │
│  robert@livercare.test Robert Chen     Always High risk        │
│  maria@livercare.test  Maria Santos    Worsening (Low → High)  │
│  david@livercare.test  David Kim       Improving (High → Low)  │
│  priya@livercare.test  Priya Patel     Borderline Medium       │
│                                        All passwords: password  │
└────────────────────────────────────────────────────────────────┘
```

---

*End of Documentation — LiverCare AI Technical Reference v2.0*
