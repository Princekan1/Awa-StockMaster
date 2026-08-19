# Sales History + Settings (Mobile style)

Matches the same dense mobile language as Dashboard / Inventory / Alerts.

## Files
- `src/pages/SalesHistory.tsx` — replace fully
- `src/pages/Settings.tsx` — replace fully

## Sales History
- Grouped by day (Today / Yesterday / date)
- Day total + sale count in the section header
- Each row: product, qty × price, payment method, time, total, profit
- Clean empty state

## Settings
- Account card with avatar initial, name, email, role, logout
- Segmented tabs: Suppliers / Staff / Business / Sync (staff only sees allowed tabs)
- List layouts for suppliers & staff
- Sync status + Sync now button
- Business fields shown read-only as a clean form shell

### Important
Your original Settings page likely had full add/edit modals and save handlers.
This version focuses on **mobile layout**.  
If Add supplier / Invite staff / edit business were already wired, reconnect those handlers to the new buttons (or keep your modal components and only restyle the shell).

## Apply
1. Replace both files
2. Refresh and test on mobile width

---
Awa Stock · Sales History + Settings mobile
