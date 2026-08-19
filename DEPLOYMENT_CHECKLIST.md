# Awa Stock deployment checklist

## Vercel / web app

- [ ] Push the application changes to GitHub `main`.
- [ ] Confirm Vercel Production is tracking `main`.
- [ ] Use the stable production URL: `https://awa-stock-master.vercel.app`.

## Firebase / cloud data

Vercel deployment does **not** deploy Firestore security rules. After changing `firestore.rules`, deploy the rules separately:

### Windows PowerShell

```powershell
npx firebase-tools deploy --only firestore:rules --project awa-stock
```

Or run the included script:

```powershell
.\DEPLOY_FIRESTORE_RULES.ps1
```

The Firebase CLI will ask you to authenticate if this computer is not already signed in.

## Final verification

- [ ] Staff login succeeds.
- [ ] Settings > Sync shows **Cloud: Synced** rather than **Sync Failed**.
- [ ] Desktop: logout appears only in the sidebar.
- [ ] Mobile: logout appears only in Settings > My account.
- [ ] Desktop sidebar collapse/expand button works and remembers the choice.
- [ ] Forgot password is visible on the login screen on both desktop and mobile.
