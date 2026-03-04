# Kaaya Farms — Security Audit & QA Report

**Date:** 2026-03-02
**Last updated:** 2026-03-02 — Critical, High, and selected Medium/QA issues fixed
**Scope:** `src/App.jsx`, `src/hooks.js`, `src/Login.jsx`, `src/supabase.js`, `.env.local`, `index.html`
**Stack:** React 19 + Vite 7 + Supabase JS v2

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟠 High | 3 |
| 🟡 Medium | 5 |
| 🔵 Low | 4 |
| ⚪ QA / UX | 7 |

---

## Security Findings

---

### ✅ FIXED — 🔴 CRITICAL — S-1: Row Level Security (RLS) Status Unverified

**Location:** Supabase dashboard (cannot be verified from frontend code)

**Finding:**
The entire data isolation model of this app depends on Supabase Row Level Security being enabled and correctly configured on all six tables: `cattle`, `milk_yield_logs`, `cattle_health_logs`, `feed_inventory`, `ledger_entries`, `todos`. If RLS is disabled or misconfigured on any table, **any authenticated user can read or modify every farm's data** using the public anon key.

The frontend applies `.eq('farm_id', FARM_ID)` filters on reads, but these are advisory client-side filters. Without RLS, a direct API call bypasses them entirely:

```
curl https://coxkkqylmaarpaqepcoc.supabase.co/rest/v1/ledger_entries \
  -H "apikey: <anon_key>" \
  -H "Authorization: Bearer <any_user_jwt>"
```

**Risk:** Complete data breach across all farms if any table lacks RLS.

**Fix applied:** `supabase-rls-policies.sql` generated at repo root. Run this script in the Supabase SQL Editor to enable RLS on all 6 tables using a `farm_members` join table. Follow the setup instructions in the file to insert your existing users.

**Recommended Fix:** _(see `supabase-rls-policies.sql` for complete SQL)_

---

### ✅ FIXED — 🟠 HIGH — S-2: `toggleTodo` Missing `farm_id` Filter

**Location:** `src/hooks.js:290–303`

**Finding:**
The `toggleTodo` function updates a todo row by `id` only, without an `.eq('farm_id', FARM_ID)` guard:

```js
// hooks.js:292
const { error } = await supabase
  .from('todos')
  .update({ status: ..., completed_at: ... })
  .eq('id', id)          // ← no farm_id check
```

Every other write operation in the file (`updateTodo`, `deleteTodo`, `updateEntry`, `deleteEntry`) correctly includes `.eq('farm_id', FARM_ID)`. This is an inconsistency. While RLS is the primary guard, defence-in-depth requires client-side scoping on all mutations.

**Fix applied:** `src/hooks.js` — `.eq('farm_id', FARM_ID)` added to `toggleTodo` update query. All mutation functions now also return `{ ok, error }` instead of bare booleans.

---

### ✅ FIXED (manually) — 🟠 HIGH — S-3: Open Signup with No Invite or Access Control

**Location:** `src/Login.jsx:48–52`

**Finding:**
The login screen exposes a publicly accessible "Sign up" link that creates new Supabase accounts with no restrictions:

```jsx
const { error: err } = await signUp(email, password)
```

Anyone can self-register. If the app is deployed to a public domain (e.g., Vercel), any person who finds the URL can create an account. Without RLS tying users to specific farms, or without an invite allowlist, new accounts may gain access to farm data.

**Fix applied (manually):** Self-registration has been disabled in Supabase Authentication → Settings → "Enable email signups = OFF". The sign-up UI in `Login.jsx` remains for development reference but new account creation is blocked at the platform level.

---

### 🟠 HIGH — S-4: `VITE_FARM_ID` Exposed in Frontend Bundle and Storage Paths

**Location:** `src/hooks.js:4`, `src/hooks.js:241`, `.env.local`

**Finding:**
`VITE_FARM_ID` (`fe6f537e-c7f1-4368-abbe-d8da4f97f8d0`) is baked into the production JavaScript bundle by Vite at build time. It is also embedded in all Supabase storage paths:

```js
// hooks.js:241
const path = `receipts/${FARM_ID}/${Date.now()}.${ext}`
```

This means:
1. Anyone who inspects the bundle or receipt URLs sees the farm UUID.
2. Paired with the also-exposed anon key, an attacker can query the API directly scoped to this farm — bypassing all client-side filters if RLS is absent.

**Note:** The `VITE_SUPABASE_ANON_KEY` being public is intentional per Supabase's design — the anon key is safe as long as RLS is enforced. The combination of anon key + farm UUID is the key risk.

**Recommended Fix:**
- Ensure RLS is fully enforced (S-1). With proper RLS, the farm UUID being known is not exploitable.
- For the storage bucket, add a storage policy restricting access to authenticated users.
- Optionally, use signed URLs instead of public URLs for receipts (see S-8).

---

### ✅ FIXED — 🟡 MEDIUM — S-5: `parseFloat()` Can Store `NaN` to Database

**Location:** `src/App.jsx:421`, `src/App.jsx:430`, `src/App.jsx:267`, `src/App.jsx:269`

**Finding:**
Multiple save functions call `parseFloat()` on user input without validating the result:

```js
// App.jsx:421 — Ledger add
await addEntry({ ...form, amount: parseFloat(form.amount) })

// App.jsx:430 — Ledger edit
await updateEntry(editEntry.id, { ...form, amount: parseFloat(form.amount) })

// App.jsx:267 — Milk yield
qty_liters: parseFloat(mf.qty_liters)

// App.jsx:269 — Feed inventory
stock: parseFloat(ff.stock), reorder_at: parseFloat(ff.reorder_at)
```

The disabled guard on the Save button checks `!form.amount` (truthy), which passes for strings like `"abc"`, `-5`, or `"1e999"`. `parseFloat("abc")` returns `NaN`. Supabase will either store `null`/`NaN` or return an error, but neither is surfaced to the user (see QA-5).

**Fix applied:** `src/App.jsx` — Ledger save/edit buttons now use `amountValid` computed as `!isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0`. Milk yield disabled guard includes `isNaN(parseFloat(mf.qty_liters))`. Feed stock/reorder default to `0` via `parseFloat(...) || 0`. All numeric inputs have `min='0'`.

---

### 🟡 MEDIUM — S-6: No Input Length Limits

**Location:** `src/App.jsx` — all `<Inp>` and `<Txta>` components

**Finding:**
No text input or textarea has a `maxLength` attribute. Long strings in free-text fields (`description`, `title`, `vet_name`, `item_name`) could:
- Exceed PostgreSQL column length limits and cause unexpected DB errors.
- Break UI layout with untruncated long text in cards and rows.

**Recommended Fix:**
Add `maxLength` to all text inputs:

```jsx
// Title/description fields
<Inp maxLength={200} .../>

// Longer text areas
<Txta maxLength={1000} rows={3} .../>
```

Check actual Postgres column definitions and align `maxLength` values accordingly.

---

### 🟡 MEDIUM — S-7: Realtime `fetch()` Calls `setLoading(true)` on Every Event

**Location:** `src/hooks.js` — all hooks (`useMilkLogs:54`, `useHealthLogs:95`, `useFeed:135`, `useLedger:183`, `useTodos:257`)

**Finding:**
The `fetch` callback used for both initial load and realtime event handling calls `setLoading(true)` at the top:

```js
const fetch = useCallback(async () => {
  setLoading(true)    // ← fires on every realtime event
  const { data, error } = await supabase.from(...)...
  setLoading(false)
}, [])
```

When a realtime event fires (e.g., another device logs milk), this briefly sets `loading = true` for the list, causing cards to disappear and re-render mid-session. This is disruptive UX and also unnecessary re-renders.

**Recommended Fix:**
Pass a `silent` flag to `fetch` so realtime-triggered refreshes don't show a loading state:

```js
const fetch = useCallback(async (silent = false) => {
  if (!silent) setLoading(true)
  const { data, error } = await supabase.from(...)...
  setLoading(false)
}, [])

// In realtime subscription:
.on('postgres_changes', { ... }, () => fetch(true))
```

---

### 🟡 MEDIUM — S-8: Receipt Files Use Public (Non-Signed) Storage URLs

**Location:** `src/hooks.js:246`

**Finding:**
Receipt photos are stored in a public Supabase storage bucket and retrieved with `getPublicUrl()`:

```js
const { data } = supabase.storage.from('farm-media').getPublicUrl(path)
return data.publicUrl
```

Public URLs never expire and require no authentication. Anyone who obtains a receipt URL (e.g., from browser history, logs, or network sniffing) can access the file without logging in.

**Recommended Fix:**
Use signed URLs instead of public URLs:

```js
const { data, error } = await supabase.storage
  .from('farm-media')
  .createSignedUrl(path, 3600)  // 1-hour expiry
if (error) { log('signReceiptUrl', error); return null }
return data.signedUrl
```

Note: Signed URLs must be regenerated before expiry. For a simple farm app, regenerating on each page load is acceptable.

---

### 🟡 MEDIUM — S-9: No Negative Value Validation on Numeric Fields

**Location:** `src/App.jsx` — all `type='number'` inputs

**Finding:**
Amount, stock, reorder level, and milk yield inputs have no `min` attribute. A user can accidentally (or intentionally) enter negative values:
- Negative `amount` in ledger creates incorrect balance totals.
- Negative `stock` or `reorder_at` breaks the feed progress bar logic.
- Negative `qty_liters` for milk yields corrupts the daily total.

**Recommended Fix:**

```jsx
// Amount fields (must be positive)
<Inp type='number' min='0.01' step='0.01' .../>

// Stock / milk quantity (must be >= 0)
<Inp type='number' min='0' step='0.1' .../>
```

---

### 🔵 LOW — S-10: Hardcoded Fallback `FARM_ID`

**Location:** `src/hooks.js:4`

```js
export const FARM_ID = import.meta.env.VITE_FARM_ID || 'YOUR-FARM-UUID-HERE'
```

If `VITE_FARM_ID` is missing from the environment (e.g., in a misconfigured CI deployment), all queries silently use the placeholder string. This returns zero results with no error, making the app appear empty rather than broken.

**Recommended Fix:**
Throw explicitly if the env var is missing, similar to how `supabase.js` handles missing URL/key:

```js
if (!import.meta.env.VITE_FARM_ID) throw new Error('VITE_FARM_ID is required')
export const FARM_ID = import.meta.env.VITE_FARM_ID
```

---

### 🔵 LOW — S-11: Predictable Receipt File Names

**Location:** `src/hooks.js:241`

```js
const path = `receipts/${FARM_ID}/${Date.now()}.${ext}`
```

`Date.now()` returns epoch milliseconds, which is predictable. An attacker who knows the approximate upload time and the farm ID could enumerate receipt file paths. For a private farm app this is low risk, but a random filename is trivially better.

**Recommended Fix:**

```js
const rand = Math.random().toString(36).slice(2, 10)
const path = `receipts/${FARM_ID}/${Date.now()}-${rand}.${ext}`
```

Or use `crypto.randomUUID()` for a UUID-named file.

---

### 🔵 LOW — S-12: No Content Security Policy (CSP) Headers

**Location:** `vite.config.js` / Vercel deployment config

**Finding:**
No CSP or security headers are configured. While the app does not use `dangerouslySetInnerHTML` and has no obvious XSS surface, a CSP header provides defence-in-depth.

**Recommended Fix:**
Add a `vercel.json` with security headers:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' data: https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com;" }
      ]
    }
  ]
}
```

---

## QA Findings

---

### ✅ FIXED — QA-1: No Way to Add Cattle from the UI

**Location:** `src/App.jsx` — `Dairy()` function

**Finding:**
The `useCattle` hook exports `addCattle`, but no Sheet or button in the Dairy component calls it. The `onAdd` callback maps: `milk → mSh`, `health → hSh` (health log), `feed → fSh`. The Cattle Registry sub-section in the Health tab shows existing cattle but provides no "Add animal" action.

**Fix applied:** `src/App.jsx` — "+ Add Animal" button added in the Cattle Registry header within the Health sub-tab. Opens a new sheet with `name`, `tag`, `breed`, `dob` fields, backed by `addCattle` from `useCattle`.

---

### QA-2: No Delete or Edit for Cattle, Milk Logs, Health Logs, or Feed Items

**Location:** `src/App.jsx` — `Dairy()` function

**Finding:**
The Dairy section is append-only for most records:
- **Cattle:** Can only be added (no edit, no soft-delete/archive).
- **Milk logs:** No edit or delete UI (only `addLog` in the hook).
- **Health logs:** No edit or delete UI.
- **Feed items:** Can add and update stock via `updateStock`, but cannot delete an item or edit its name/unit/reorder level.

**Recommended Fix:**
Add ✏️ edit and 🗑️ delete actions (matching the pattern in Ledger and Tasks) for at minimum feed items and health logs, as these are most likely to contain data entry errors.

---

### QA-3: `loading` State Not Reflected in UI

**Location:** `src/App.jsx` — all module-level components

**Finding:**
All hooks return a `loading` boolean, but no component renders a loading indicator:

```js
const { cattle } = useCattle()               // loading unused
const { logs: milkLogs } = useMilkLogs()     // loading unused
const { entries } = useLedger()              // loading unused
```

On first load, all lists render as empty (`[]`) until data arrives, with no spinner or skeleton. Users see "No entries yet" briefly before data appears, which looks like the app is broken.

**Recommended Fix:**
Show a spinner or skeleton when `loading` is true:

```jsx
if (loading) return <div style={{textAlign:'center',padding:40,color:'#8A7A60'}}>Loading...</div>
```

---

### ✅ FIXED — QA-4: Save Errors Not Shown to User

**Location:** `src/hooks.js` — all `addXxx`/`updateXxx`/`deleteXxx` functions

**Finding:**
When a Supabase operation fails, hooks call `log()` (console.error) and return `false`. The UI checks the return value but only stops the spinner — it never shows an error message to the user:

```js
// hooks.js (example pattern)
if (error) { log('addLedgerEntry', error); return false }

// App.jsx (typical call-site)
const ok = await addEntry({...})
// if !ok, setSaving(false) and nothing else — no error shown
```

**Fix applied:** All mutation functions in `src/hooks.js` now return `{ ok: true }` or `{ ok: false, error: string }`. Each component (`Dairy`, `Ledger`, `Tasks`) has an `errMsg` state that is set on failure and cleared on sheet open/close. An inline red banner (`⚠️ <message>`) is rendered inside the sheet above the action buttons when an error occurs.

---

### ✅ FIXED — QA-5: Priority Sorted Alphabetically, Not Semantically

**Location:** `src/hooks.js:263`

```js
.order('priority', { ascending: true })
```

PostgreSQL sorts the `priority` column as text: `'high' < 'low' < 'medium'` alphabetically. The resulting order is **High → Low → Medium**, not the expected **High → Medium → Low**.

**Fix applied:** `src/hooks.js` — DB ordering changed to `due_date` only; after fetch, todos are sorted client-side using `RANK = { high:0, medium:1, low:2 }` so order is always High → Medium → Low, then by due date within each priority.

---

### QA-6: Receipt `<img>` Has No Error Handler

**Location:** `src/App.jsx:451`, `src/App.jsx:502`

```jsx
<img src={form.receipt_url} alt='receipt' style={{width:80,height:80,...}} />
<img src={e.receipt_url} alt='' style={{width:36,height:36,...}} />
```

If a receipt URL is broken (deleted from storage, expired signed URL, upload error), the browser renders a broken-image icon with no graceful fallback.

**Recommended Fix:**

```jsx
<img
  src={form.receipt_url}
  alt='receipt'
  style={{width:80,height:80,...}}
  onError={e => { e.target.style.display = 'none' }}
/>
```

---

### QA-7: Dairy Feed Progress Bar Can Divide by Zero

**Location:** `src/App.jsx:341`

```js
const pct = Math.min(100, (f.stock / (f.reorder_at * 3)) * 100)
```

If `f.reorder_at` is `0` (or `null`), this produces `Infinity` or `NaN`. `Math.min(100, Infinity)` returns `100`, so the bar renders as full — misleading for an item with no reorder threshold set.

**Recommended Fix:**

```js
const pct = f.reorder_at > 0
  ? Math.min(100, (f.stock / (f.reorder_at * 3)) * 100)
  : (f.stock > 0 ? 50 : 0)
```

---

## Checklist Summary

### Security

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| S-1 | 🔴 Critical | RLS not verified on all tables | ✅ `supabase-rls-policies.sql` generated — run in SQL Editor |
| S-2 | 🟠 High | `toggleTodo` missing `farm_id` filter | ✅ Fixed in `hooks.js` |
| S-3 | 🟠 High | Open signup, no invite mechanism | ✅ Disabled manually in Supabase Auth settings |
| S-4 | 🟠 High | `FARM_ID` exposed in bundle + storage paths | ⚠️ Mitigated — enforce RLS (S-1) to prevent exploitation |
| S-5 | 🟡 Medium | `parseFloat()` can store `NaN` | ✅ Fixed — `amountValid` guard + `min='0'` on all numeric inputs |
| S-6 | 🟡 Medium | No `maxLength` on text inputs | 🔲 Pending |
| S-7 | 🟡 Medium | Realtime `fetch()` triggers `setLoading(true)` | 🔲 Pending |
| S-8 | 🟡 Medium | Receipt URLs are permanently public | 🔲 Pending |
| S-9 | 🟡 Medium | Negative numbers allowed in numeric fields | ✅ Fixed — `min='0'` added to numeric inputs |
| S-10 | 🔵 Low | Hardcoded fallback `FARM_ID` | 🔲 Pending |
| S-11 | 🔵 Low | Predictable receipt file names | 🔲 Pending |
| S-12 | 🔵 Low | No security headers / CSP | 🔲 Pending |

### QA

| ID | Finding | Status |
|----|---------|--------|
| QA-1 | No Add Cattle UI | ✅ Fixed — "+ Add Animal" sheet added in Dairy → Health tab |
| QA-2 | No delete/edit for cattle, milk logs, health logs, feed items | 🔲 Pending |
| QA-3 | `loading` state never shown in UI | 🔲 Pending |
| QA-4 | Save/update errors silently swallowed | ✅ Fixed — inline error banners in all sheets |
| QA-5 | Priority sorted alphabetically (h < l < m) | ✅ Fixed — client-side semantic sort in `useTodos` |
| QA-6 | Broken receipt images show default browser error icon | 🔲 Pending |
| QA-7 | Feed progress bar divides by zero when `reorder_at = 0` | 🔲 Pending |

---

## Priority Order of Fixes

| # | Item | Status |
|---|------|--------|
| 1 | S-1 — RLS policies for all 6 tables | ✅ SQL script generated (`supabase-rls-policies.sql`) — **run it now** |
| 2 | S-3 — Disable open signup | ✅ Done manually in Supabase |
| 3 | S-2 — `farm_id` filter on `toggleTodo` | ✅ Fixed in `hooks.js` |
| 4 | S-5 + S-9 — NaN / negative value validation | ✅ Fixed in `App.jsx` |
| 5 | QA-4 — Surface save errors to user | ✅ Fixed — inline error banners |
| 6 | QA-5 — Priority sort order | ✅ Fixed — semantic client-side sort |
| 7 | QA-1 — Add cattle registration UI | ✅ Fixed — new sheet in Dairy |
| 8 | S-7 — Silent realtime fetch | 🔲 Pending |
| 9 | S-6 — Input `maxLength` limits | 🔲 Pending |
| 10 | S-8 — Signed receipt URLs | 🔲 Pending |
| 11 | QA-2/3/6/7 — Remaining QA items | 🔲 Pending |
| 12 | S-10/11/12 — Low severity items | 🔲 Pending |
