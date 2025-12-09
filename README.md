# Rigga Industries Customer Order App

## Setup & Run
1. `npm install`
2. `npm run dev`
3. Open browser (usually http://localhost:5173)

## Features
- **LocalStorage Data**: Seeded on first run. Keys: `ri_products`, `ri_orders`, `ri_users`, etc.
- **Roles**:
  - Admin: `admin` / `admin123`
  - Customer: `user` / `user123`
- **Modules**:
  - Dashboard (Targets, Recent Orders)
  - Place Order (Single product flow, Schemes, Payment)
  - My Orders (Timeline, Cancel)
  - Admin Console (Approve, Dispatch, Deliver, Complaints)
  - New Launches & Not Tried Products

## Testing Steps
1. **Login**: Use `user` / `user123`.
2. **Place Order**: Go to Place Order, select a product, apply scheme if available (e.g., matching product). Submit.
3. **Verify Order**: Go to "My Orders". See status PENDING.
4. **Admin Action**: Logout, login as `admin` / `admin123`.
5. **Approve/Dispatch**: Go to "Admin Console". Filter by Pending -> Approve. Then filter by Approved -> Dispatch (enter vehicle no).
6. **Timeline**: Log back in as `user`. Expand order in "My Orders" to see timeline updates.
7. **Complaints**: Submit a complaint. Admin can view and resolve it in Admin Console.
