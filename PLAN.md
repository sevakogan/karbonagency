# Plan: Google OAuth Sign-up + Admin Approval Flow

## Summary

Replace the invite-based user onboarding with a self-service flow: users sign up via Google, land in a pending queue, and admin approves them as Client, Employee, or Decline.

---

## Phase 1: Database Changes

### 1a. Add `pending` role to profiles
- Update `Profile` type: `role: "admin" | "client" | "pending"`
- No schema change needed — `role` is a TEXT column with no CHECK constraint
- Add SQL migration to `supabase-schema.sql` for documentation

### 1b. Add RLS policy for pending users
- Pending users should only be able to read their own profile (nothing else)
- Middleware blocks them from `/dashboard` and `/admin` — redirects to a `/pending` page

---

## Phase 2: Google OAuth on Login Page

### 2a. Update login page (`src/app/(auth)/login/page.tsx`)
- Add "Continue with Google" button using `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Keep existing password + magic link as fallback
- Redirect to `/auth/callback` on success

### 2b. Update AuthProvider (`src/components/auth/auth-provider.tsx`)
- Add `signInWithGoogle()` method
- Handle the case where a new Google user has `role: "pending"`

### 2c. Supabase config
- Google OAuth must be enabled in Supabase Dashboard → Auth → Providers → Google
- Needs Google Cloud OAuth client ID + secret (configured in Supabase, not in code)

---

## Phase 3: Pending User Handling

### 3a. Auth callback updates (`src/app/auth/callback/route.ts`)
- After code exchange, check profile role
- If `pending` → redirect to `/pending` instead of `/dashboard`

### 3b. New pending page (`src/app/(auth)/pending/page.tsx`)
- Simple page: "Your account is pending approval. We'll notify you when you're approved."
- Sign out button

### 3c. Middleware updates (`src/middleware.ts`)
- Fetch profile role for authenticated users
- If role is `pending` and trying to access `/dashboard` or `/admin` → redirect to `/pending`
- If role is `pending` and on `/pending` → allow

### 3d. Profile creation trigger
- Supabase trigger `handle_new_user` already creates a profile row on signup
- Ensure new Google users get `role: 'pending'` by default (update the trigger or set default column value)

---

## Phase 4: Admin Approval UI

### 4a. Update admin users page (`src/app/(dashboard)/admin/users/page.tsx`)
- Split into two sections:
  1. **Pending Approval** — users with `role: 'pending'`, each with 3 buttons: Client | Employee | Decline
  2. **Active Users** — existing users table (role = admin/client)

### 4b. New server actions (`src/lib/actions/users.ts`)
- `approveAsClient(userId: string, clientName: string)` — sets role to `client`, auto-creates a client record, links `client_id`
- `approveAsEmployee(userId: string)` — sets role to `admin`
- `declineUser(userId: string)` — deactivates user (`is_active: false`) or deletes
- `getPendingUsers()` — fetch users with `role: 'pending'`

### 4c. Approval UI component (`src/app/(dashboard)/admin/users/pending-users.tsx`)
- Client-side component with action buttons
- When "Client" is clicked → prompt for client/venue name (or use their Google name) → creates client record + approves
- When "Employee" is clicked → immediate approval as admin
- When "Decline" is clicked → deactivate

### 4d. Remove invite form
- Remove `InviteUserForm` component and `inviteClientUser` action (replaced by self-service sign-up)

---

## Phase 5: Auto-Create Client Record

When admin approves a user as "Client":
1. Create a new row in `clients` table with:
   - `name` = user's full name or venue name (admin can edit later)
   - `slug` = auto-generated from name
   - `contact_email` = user's email
2. Update profile: `role = 'client'`, `client_id = new_client.id`
3. Client now appears under Settings → Clients for further configuration (Meta ad account, etc.)

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Modify | `src/types/index.ts` — add `"pending"` to Profile role |
| Modify | `src/app/(auth)/login/page.tsx` — add Google OAuth button |
| Modify | `src/components/auth/auth-provider.tsx` — add `signInWithGoogle` |
| Modify | `src/app/auth/callback/route.ts` — redirect pending users |
| Modify | `src/middleware.ts` — handle pending role routing |
| Create | `src/app/(auth)/pending/page.tsx` — pending approval page |
| Modify | `src/lib/actions/users.ts` — add approve/decline actions |
| Modify | `src/app/(dashboard)/admin/users/page.tsx` — add pending section |
| Create | `src/app/(dashboard)/admin/users/pending-users.tsx` — approval UI |
| Delete | `src/app/(dashboard)/admin/users/invite-user-form.tsx` — no longer needed |
| Modify | `supabase-schema.sql` — document role changes |

---

## Prerequisites (Manual Steps)

1. **Enable Google OAuth in Supabase**: Dashboard → Auth → Providers → Google → Enable + add Google Cloud credentials
2. **Google Cloud Console**: Create OAuth 2.0 Client ID with redirect URI `https://<your-supabase-url>/auth/v1/callback`
3. **Supabase profile trigger**: Ensure `handle_new_user` trigger sets `role = 'pending'` as default for new users
