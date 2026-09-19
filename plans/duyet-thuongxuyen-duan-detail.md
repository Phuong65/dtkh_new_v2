# Kế hoạch chức năng: Duyệt thường xuyên dự án — Detail (full-page)

## Trạng thái: ✅ Hoàn thành

## Mục tiêu

Khi người dùng click một đề dự án trong danh sách `duyet-thuongxuyen-duan`, hệ thống mở **browser tab mới** chứa giao diện duyệt/nhận xét đề dự án full-page.

Mô hình tham chiếu: `duyet-cauhoi-tn-detail` — cùng cách hoạt động, UX, và pattern kỹ thuật.

## Cấu trúc file

```text
src/app/modules/admin/features/duyetnoidung/duyet-thuongxuyen-duan-detail/
  duyet-thuongxuyen-duan-detail.component.ts
  duyet-thuongxuyen-duan-detail.component.html
  duyet-thuongxuyen-duan-detail.component.css
```

## Route

```text
/admin/hoi-dong/duyetnoidung/duyet-thuongxuyen-duan-detail/:tuluanId
  ?courseId=...&activityId=...&code=...
```

- `code` = `hoidong_thamdinh_monhoc_id` — truyền từ `duyet-cauhoi?code=17` để hỗ trợ Back navigation

## Kiến trúc

| Quyết định | Ghi chú |
|-----------|---------|
| Tab mới bằng `window.open` + route Angular | Tab danh sách gọi `onSelectDeTuluan()` |
| Standalone component, lazy-loaded | Đăng ký trong `duyetnoidung-routing.module.ts` |
| Layout full-page 2 cột (grid `1fr 420px`) | Responsive ≤1024px → 1 cột |
| BroadcastChannel sync | Tab detail → tab danh sách reload khi có thay đổi |
| Title page = `"Dự án - " + course_name` | Dùng `Title` service từ `@angular/platform-browser` |
| `secondary_feature` = `"Duyệt dự án"` | Dùng `auth.setFeatureSecondary()` |
| Back navigation về `cauhoi?code=X` | Đọc `code` từ queryParams, navigate trực tiếp |

## Các chức năng

### 1. Load dữ liệu (`loadFullContext()`)

Chain: `route.params` → `switchMap` → load đề → `forkJoin`:
- `loadCourseSelected$()` — thông tin khóa học → **set title + secondary_feature**
- `loadTuluanList$()` — danh sách đề cùng scope (phục vụ next/back)
- `loadCouncilRoles()` → `loadMyCommentedTuluanIds()` — hội đồng + track đề đã nhận xét
- `loadTieuChiCham$()` — tiêu chí chấm chi tiết

→ `switchMap` → `loadCommentTuluan$()` — comments + reply count

### 2. Title & Secondary Feature (`applyTitleAndSecondaryFeature`)

- `titleService.setTitle('Dự án - ' + courseSelected.title)`
- `auth.setFeatureSecondary('Duyệt dự án')`
- Gọi sau khi `loadCourseSelected$()` có data

### 3. Nhận xét ủy viên (`saveComment`)

- "Đồng ý duyệt" → auto-comment "Đồng ý duyệt" + auto-next
- "Yêu cầu sửa" → hiện textarea (UX 2 bước) → gửi nội dung + auto-next
- Ẩn khi `status === 1`

### 4. Kết luận chủ tịch (`duyetNoidung`)

- Cập nhật `status` + `approved_by` + `approved_at`
- Nếu duyệt (status=1) → tạo thêm comment "Đồng ý duyệt"
- Ẩn khi `status === -1 || status === 1`

### 5. Auto-next (`navigateNextTuluan`)

- Lọc danh sách từ index+1, tìm `status === 0`
- Ủy viên: bỏ qua đề đã nhận xét (`commentedTuluanIds`)
- Không tìm thấy → toast "Đã xử lý hết"

### 6. Đề trước / Đề sau (`openNewQuestion`)

- Wrap-around (đầu → cuối, cuối → đầu)
- Navigate cùng tab bằng `router.navigate`

### 7. Undo 10 giây

- `registerUndoAction()` → hiện banner + countdown
- `restorePreviousQuestion()` → xóa comment + rollback status (nếu chủ tịch)
- Hết 10s → tự xóa banner

### 8. Sync tab danh sách

- BroadcastChannel: `duyet-thuongxuyen-duan-detail-sync`
- Emit event: `{ type: 'TULUAN_REVIEW_UPDATED', tuluanId, courseId, activityId, updatedAt }`
- Tab danh sách listen → reload `loadKynangTuluan()`
- localStorage fallback cho trình duyệt không hỗ trợ BroadcastChannel

### 9. Reply comment (`saveCommentReply`)

- Hiển thị danh sách reply khi click "Phản hồi (N)"
- Gửi reply → reload danh sách reply

### 10. Back navigation (`goBack`)

- Đọc `code` từ `route.snapshot.queryParamMap`
- Nếu có `code` → `router.navigate(['/admin/hoi-dong/duyetnoidung/cauhoi'], { queryParams: { code } })`
- Nếu không có → fallback `location.back()`
- Dashboard `backToClass()` cũng xử lý case `duyet-thuongxuyen-duan-detail` (cùng logic với `duyet-cauhoi-tn-detail`)

## Layout

### Header sticky
- Mã đề `#id` + trạng thái badge (Đạt/Chờ duyệt/Yêu cầu sửa/Đã sửa)
- Thời gian duyệt (nếu đạt)
- Nút: Đề trước, Đề sau, Quay lại

### Body 2 cột
- **Cột trái**: Nội dung đề (`app-view-thuongxuyen-tuluan`) + Tiêu chí chấm (đầy đủ)
- **Cột phải**: Undo banner → Form ủy viên → Kết luận chủ tịch → Comments hội đồng + reply

## Liên kết với tab danh sách

File: `duyet-thuongxuyen-duan.component.ts`

- `onSelectDeTuluan()` → `window.open(url, '_blank', 'noopener,noreferrer')`
  - URL bao gồm `&code=X` (lấy từ `window.location.search` — URL cha `cauhoi?code=17`)
- `initBroadcastChannel()` → listen sync events → reload data
- Side panel cũ (`templateFormViewTuluan`) → **đã xóa** (2025-06-05)

## Dashboard integration

File: `dashboard-v2.component.ts`

- Block `close_left_menu` → default case: thêm `else if (activeLink.indexOf('duyet-thuongxuyen-duan-detail') !== -1)`
- Logic: parse URL lấy basePath = `hoi-dong/duyetnoidung/cauhoi`, đọc `code` queryParam → set `back_url`
- Nút Back trên header dashboard navigate đúng về `cauhoi?code=X`

## Câu hỏi đã chốt

| # | Vấn đề | Quyết định |
|---|--------|------------|
| 1 | `app-view-thuongxuyen-tuluan` import gì? | SharedModule |
| 2 | Giữ lại side panel cũ? | ❌ Đã xóa |
| 3 | Undo 10 giây? | ✅ Giữ nguyên pattern `duyet-cauhoi-tn-detail` |
| 4 | Tiêu chí chấm hiển thị? | Đầy đủ trên detail page |
| 5 | Back về đâu? | `cauhoi?code=X` — lấy `code` từ queryParams |
| 6 | Title page? | `"Dự án - " + course_name` |
| 7 | secondary_feature? | `"Duyệt dự án"` |
