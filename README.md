# Awa Stock

Offline-first inventory management for small shops, designed for Windows and Android/PWA use.

## Quick start

```bash
npm install
npm run dev
```

For production, provide the Firebase web configuration through the `VITE_FIREBASE_*` environment variables. Do not commit `.env`.

## Production features

- Firebase email/password authentication and optional Google sign-in
- Owner and staff roles with shop isolation
- Offline IndexedDB data cache
- Append-only sales and stock-movement synchronization
- Barcode scanning and duplicate-barcode protection
- Receive stock, stock adjustments, sales, reports and expiry/low-stock alerts
- Verified owner backup and restore
- PWA support for Windows and Android

## Firebase setup

1. Enable Authentication providers required by the app.
2. Create/enable Firestore.
3. Configure `.env` from `.env.example`.
4. Deploy the Firestore rules before production use:

```bash
firebase deploy --only firestore:rules
```

5. Add the same `VITE_FIREBASE_*` variables to the production hosting environment.

## Important

- The first newly registered account becomes the owner of a new shop.
- Staff must use the exact email address invited by the shop owner.
- Staff access is enforced by Firestore rules as well as the client.
- Keep a separate backup before restoring another backup. Restore replaces the current shop dataset.
- Offline mode supports previously authenticated users with cached shop data; a first-time sign-in still requires connectivity.

## Recommended production test

- Owner on Windows: sign in, create a product and receive stock.
- Owner: invite staff.
- Staff on Android: sign in with the invited email.
- Confirm the product appears on Android.
- Staff: record a sale and confirm the stock updates on Windows.
- Put Android offline, close/reopen the PWA, make a sale, reconnect, and confirm it syncs.
- Disable the staff invitation and confirm an already-open staff session loses access after reconnecting.
- Test duplicate barcode rejection on both add and edit.
- Test backup download and restore.
- Test direct navigation/refresh on `/inventory`, `/sell`, `/settings`, and `/reports`.
- Test installing the PWA, updating to a new deployment, and reopening it after the update.
