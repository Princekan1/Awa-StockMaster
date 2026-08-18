# Awa Stock — Production Launch Checklist

## Before deployment

- [ ] `npm install` completes without dependency errors.
- [ ] `npm run build` completes successfully on the deployment machine.
- [ ] No `.env` file or private credentials are committed.
- [ ] Production Firebase web configuration is set in hosting environment variables.
- [ ] Email/Password authentication is enabled.
- [ ] Google authentication is enabled if the Google button will be offered.
- [ ] Firestore rules are deployed with `firebase deploy --only firestore:rules`.
- [ ] Firestore production data is backed up before any migration or restore test.

## Windows test

- [ ] Owner can sign in.
- [ ] Owner can create/edit/archive products.
- [ ] Duplicate barcode is rejected.
- [ ] Receive stock and stock adjustment update the movement ledger.
- [ ] Sale decreases stock and creates a sale + movement.
- [ ] Reports show expected sales/profit values.
- [ ] Backup downloads successfully.
- [ ] Restore is owner-only and requires the matching shop.

## Android/PWA test

- [ ] Install the PWA.
- [ ] Navigation works in standalone mode.
- [ ] Camera barcode scanner works on a real device.
- [ ] App can be opened offline after a successful authenticated session.
- [ ] Existing local products/sales remain available offline.
- [ ] An offline sale survives closing and reopening the PWA.
- [ ] Reconnection triggers synchronization.

## Multi-device sync test

- [ ] Owner and staff use separate devices.
- [ ] A sale made on one device appears on the other after synchronization.
- [ ] Offline sales from two devices are both retained.
- [ ] Stock movements reconcile without resurrecting stale quantities.
- [ ] Pending-sync count returns to zero after successful synchronization.
- [ ] A failed sync remains visible and retries after reconnecting.

## Security test

- [ ] Staff cannot read another shop's data.
- [ ] Staff cannot manage products/settings/staff/suppliers outside permitted operations.
- [ ] Disabled staff cannot continue cloud access after reconnecting.
- [ ] Direct Firestore writes that violate the rules are rejected.

## PWA update test

- [ ] Deploy a new version.
- [ ] Reopen an already-installed PWA.
- [ ] Confirm the new hashed JavaScript/CSS assets load.
- [ ] Confirm old service-worker caches are removed.
- [ ] Refresh direct routes such as `/inventory` and `/reports`.

## Launch hygiene

- [ ] Remove development-only test accounts/data.
- [ ] Confirm the production shop has the correct name, currency and stock settings.
- [ ] Keep at least one verified backup outside the device.
- [ ] Record the production deployment date/version.
