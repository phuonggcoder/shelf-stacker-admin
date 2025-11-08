# Hướng Dẫn FE: Admin - Quản Lý Voucher

Mục tiêu: Hướng dẫn chi tiết cho Frontend admin để tạo, sửa, xóa, lưu trữ, và theo dõi voucher, phù hợp với backend hiện tại.

## 1. Tổng quan chức năng admin
- Tạo voucher mới
- Chỉnh sửa voucher
- Kích hoạt / Hủy kích hoạt voucher
- Một số voucher có giới hạn số lần sử dụng hoặc cho nhóm người dùng cụ thể
- Xem lịch sử sử dụng và báo cáo

## 2. API contract (endpoint, method, request, response mẫu)

- Tạo voucher
  - Endpoint: `POST /api/v1/admin/vouchers`
  - Body:
    ```json
    {
      "code":"SUMMER2025",
      "type":"percentage|fixed",
      "value":10,
      "minOrderValue":100000,
      "validFrom":"2025-01-01T00:00:00Z",
      "validTo":"2025-12-31T23:59:59Z",
      "usageLimit":1000,
      "userSegment":"all|new_users|vip"
    }
    ```
  - Response 201: created voucher object

- Sửa voucher
  - Endpoint: `PUT /api/v1/admin/vouchers/:id`
  - Body: Các trường có thể cập nhật (trừ `id` và `code` nếu không cho phép đổi)

- Xóa voucher (hoặc archive)
  - Endpoint: `DELETE /api/v1/admin/vouchers/:id` hoặc `POST /api/v1/admin/vouchers/:id/archive`
  - Response 200: success

- Lấy danh sách (với filter)
  - Endpoint: `GET /api/v1/admin/vouchers?status=active|archived&search=...&page=&limit=`

- Lấy lịch sử sử dụng voucher
  - Endpoint: `GET /api/v1/admin/vouchers/:id/usages`
  - Response: list of orders or usages

## 3. Admin UI Flows & Components

- Voucher Management Page
  - Component: `VoucherTable`
  - Columns: `code`, `type`, `value`, `validTo`, `usageLimit`, `status`, `actions`
  - Actions: `Edit`, `Archive`, `View usages`, `Duplicate`

- Create/Edit Drawer or Modal
  - Component: `VoucherForm`
  - Fields: `code`, `type`, `value`, `minOrderValue`, `validFrom`, `validTo`, `usageLimit`, `userSegment`, `description`
  - Validation rules mirrored from backend (required fields, date ranges, numeric limits)

- Usage/Reports Page
  - Component: `VoucherUsageReport`
  - Filters: date range, voucher code, user id
  - Exports: CSV export of usages

## 4. Soft-delete (Archive) / Restore / Permanent Delete — SPEC for FE

- Goal: Xóa mềm (archive) đưa voucher vào "Danh sách đã xóa" (trash) để có thể khôi phục; hỗ trợ xóa vĩnh viễn từ trash.

- Backend expectations / API
  - Soft-delete (archive):
    - Endpoint: `POST /api/v1/admin/vouchers/:id/archive`
    - Response 200: `{ "ok": true, "voucher": { ...updatedVoucher } }`
    - Behaviour: sets `isArchived: true`, `archivedBy`, `archivedAt` fields on voucher.

  - Restore from archive:
    - Endpoint: `POST /api/v1/admin/vouchers/:id/restore`
    - Response 200: `{ "ok": true, "voucher": { ...updatedVoucher } }`
    - Behaviour: clears `isArchived`, `archivedBy`, `archivedAt`.

  - Permanent delete (from archive/trash):
    - Endpoint: `DELETE /api/v1/admin/vouchers/:id?permanent=true`
    - Response 200: `{ "ok": true, "deletedId": "..." }`
    - Behaviour: permanently removes voucher record from DB; should be allowed only if `isArchived=true` or under admin permission scope.

  - List archived vouchers:
    - Endpoint: `GET /api/v1/admin/vouchers?status=archived&page=&limit=`
    - Response 200: paginated archived vouchers with `archivedBy`, `archivedAt` fields.

- UI Flows and components
  - `VoucherTable` filters:
    - Add `Status` filter: `Active | Archived | All`.
    - When `Archived` selected, table shows `Restore` and `Delete permanently` actions.

  - Archive action (soft-delete):
    - User clicks `Archive` on a row -> show confirmation modal:
      - Title: "Xác nhận lưu trữ voucher"
      - Body: "Voucher [CODE] sẽ được chuyển vào danh sách đã xóa. Bạn có thể khôi phục sau."
      - Buttons: `Huỷ`, `Xác nhận lưu trữ`
    - On confirm: call `POST /admin/vouchers/:id/archive` -> optimistic UI: mark row as archived or remove from active list and show toast "Đã lưu trữ".
    - Log audit: FE should display or record `archivedBy` and `archivedAt` from response.

  - Restore action:
    - In Archived view, `Restore` button calls `POST /admin/vouchers/:id/restore` with confirmation modal.
    - On success, move voucher back to active list and show toast "Đã khôi phục".

  - Permanent delete:
    - In Archived view, `Delete permanently` opens a stronger confirmation modal:
      - Title: "Xác nhận xóa vĩnh viễn"
      - Body: "Hành động này sẽ xóa voucher [CODE] vĩnh viễn và không thể khôi phục. Tiếp tục?"
      - Require an extra confirmation (checkbox `Tôi hiểu` or typing the code) to prevent accidental deletes.
    - On confirm: call `DELETE /admin/vouchers/:id?permanent=true`.
    - On success: remove from UI and show toast "Đã xóa vĩnh viễn".

- Permissions & audit
  - Only users with `admin.manage_vouchers` permission see Archive/Restore/Delete buttons.
  - Display `archivedBy`, `archivedAt`, `deletedBy`, `deletedAt` in voucher detail or archived list.

- Optimistic updates and error handling
  - Optimistic: for Archive/Restore show a loading state; on failure rollback and show error toast.
  - If permanent delete fails with 403 or 401, show permission error; if 409 (conflict), show explanatory message.

- Accessibility
  - Modal focus trap; confirmation requires keyboard-accessible checkbox or input.

- UX Considerations
  - Add an `Archived` badge to archived items in lists for clarity.
  - Provide an `Empty Trash` bulk action (admin only) with similar confirmation and audit logging.

## 5. Edge Cases & Business Rules
- If voucher is archived while referenced by an active promotion or scheduled campaign, show warning and block archive (backend should return 409 with reason `IN_USE_BY_CAMPAIGN`). FE shows message and link to related campaign.
- If voucher has usages (orders), archiving should not affect historical orders; restoring should not retroactively change past orders but should allow future orders to use it again (depending on business rules).

## 6. QA Checklist for Soft-Delete Flow
- Archive action removes from active list and appears in archived list with `archivedBy` and `archivedAt`.
- Restore action moves item back to active list with preserved fields.
- Permanent delete removes item from archived list and attempts to fetch it return 404.
- Permission checks prevent unauthorized users from seeing or calling archive/restore/delete endpoints.
- Confirmation modals require explicit confirmation (checkbox or code) for permanent deletes.
- Bulk `Empty Trash` respects pagination and shows number of items to delete.

## 7. Implementation notes for FE dev
- Endpoints should include proper status codes for edge conditions; FE must interpret common codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Server Error.
- Use pagination when listing archived items; avoid loading entire trash.
- Keep audit fields read-only in UI.

## 8. Example UI snippets
- ...existing code...

---

_Cập nhật: nếu backend có endpoint hoặc schema khác (ví dụ dùng `isArchived` boolean field, hoặc trường `deletedAt`), tôi sẽ điều chỉnh spec cho khớp. Nếu bạn muốn, tôi có thể tạo React components skeleton (TypeScript) cho `VoucherTable`, `VoucherForm`, và `ArchivedList` với các hành vi archive/restore/delete._
