# Kế hoạch chức năng: Duyệt thường xuyên tự luận — Detail (full-page)

## Trạng thái: ✅ Đã xác nhận — sẵn sàng triển khai

## Mục tiêu

Khi người dùng click một đề tự luận trong danh sách `duyet-thuongxuyen-tuluan`, hệ thống mở **browser tab mới** chứa giao diện duyệt/nhận xét đề tự luận full-page (thay vì side panel cũ `templateFormViewTuluan`).

Mô hình tham chiếu: `duyet-thuongxuyen-duan-detail` — cùng cách hoạt động, UX, và pattern kỹ thuật.

## Hiện trạng

### Component `duyet-thuongxuyen-tuluan` (tab danh sách)
- Khi click đề tự luận → gọi `onSelectDeTuluan()` → load comments → **mở side panel** qua `notificationService.openSideNavigationMenu({ template: templateFormViewTuluan })`
- `templateFormViewTuluan` chứa: header (id + status + buttons next/back), body (app-view-thuongxuyen-tuluan + form duyệt + comments + reply)
- Cần chuyển sang pattern mở **tab mới** giống `duyet-thuongxuyen-duan`

### Pattern đã thực hiện ở `duyet-thuongxuyen-duan-detail`
- Standalone component full-page, lazy-loaded qua route
- Layout 2 cột (grid `1fr 420px`)
- BroadcastChannel sync → tab danh sách reload
- Auto-next (bỏ qua đề đã nhận xét)
- Undo 10 giây
- Back navigation

## Cấu trúc file mới

```text
src/app/modules/admin/features/duyetnoidung/duyet-thuongxuyen-tuluan-detail/
  duyet-thuongxuyen-tuluan-detail.component.ts
  duyet-thuongxuyen-tuluan-detail.component.html
  duyet-thuongxuyen-tuluan-detail.component.css
```

## Route

```text
/admin/hoi-dong/duyetnoidung/duyet-thuongxuyen-tuluan-detail/:tuluanId
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
| Title page = `"Tự luận - " + course_name` | Dùng `Title` service từ `@angular/platform-browser` |
| `secondary_feature` = `"Duyệt tự luận"` | Dùng `auth.setFeatureSecondary()` |
| Back navigation về `cauhoi?code=X` | Đọc `code` từ queryParams, navigate trực tiếp |

## Các chức năng (clone từ duyet-thuongxuyen-duan-detail, điều chỉnh cho tự luận)

### 1. Load dữ liệu (`loadFullContext()`)

Chain: `route.params` → `switchMap` → load đề tự luận → `forkJoin`:
- `loadCourseSelected$()` — thông tin khóa học → **set title + secondary_feature**
- `loadTuluanList$()` — danh sách đề cùng scope (phục vụ next/back)
- `loadCouncilRoles()` → `loadMyCommentedTuluanIds()` — hội đồng + track đề đã nhận xét
- `loadTieuChiCham$()` — tiêu chí chấm chi tiết (nếu có)

→ `switchMap` → `loadCommentTuluan$()` — comments + reply count

### 2. Title & Secondary Feature (`applyTitleAndSecondaryFeature`)

- `titleService.setTitle('Tự luận - ' + courseSelected.title)`
- `auth.setFeatureSecondary('Duyệt tự luận')`
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

- BroadcastChannel: `duyet-thuongxuyen-tuluan-detail-sync`
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
- Dashboard `backToClass()` cũng xử lý case `duyet-thuongxuyen-tuluan-detail`

## Layout

### Header sticky
- Mã đề `#id` + trạng thái badge (Đạt/Chờ duyệt/Yêu cầu sửa/Đã sửa)
- Thời gian duyệt (nếu đạt)
- Nút: Đề trước, Đề sau, Quay lại

### Body 2 cột
- **Cột trái**: Nội dung đề (`app-view-thuongxuyen-tuluan`) + Tiêu chí chấm (nếu có)
- **Cột phải**: Undo banner → Form ủy viên → Kết luận chủ tịch → Comments hội đồng + reply

## Thay đổi ở component tab danh sách (`duyet-thuongxuyen-tuluan`)

### `duyet-thuongxuyen-tuluan.component.ts`
1. **Sửa `onSelectDeTuluan()`** — thay `loadCommentTuluan()` → `window.open(url, '_blank', 'noopener,noreferrer')`
   ```ts
   onSelectDeTuluan(tuluan: CoursePlanActivityTuluan) {
       const baseUrl = window.location.origin;
       const activityId = this.planTuluan?.id || tuluan.course_plan_activity_id;
       const courseId = this.selectedCourse?.id;
       const urlParams = new URLSearchParams(window.location.search);
       const code = urlParams.get('code');
       let url = `${baseUrl}/admin/hoi-dong/duyetnoidung/duyet-thuongxuyen-tuluan-detail/${tuluan.id}?courseId=${courseId}&activityId=${activityId}`;
       if (code) {
           url += `&code=${code}`;
       }
       window.open(url, '_blank', 'noopener,noreferrer');
   }
   ```
2. **Thêm `initBroadcastChannel()`** — listen sync events → reload data
3. **Xóa/giữ `templateFormViewTuluan`** → xóa template, xóa `@ViewChild`, xóa hàm `loadCommentTuluan()`, `openReply()`, `loadReplyComment()`, `saveCommentReply()`, `saveComment()`, `duyetNoidung()`, `closeForm()`, `openNewQuestion()` (tất cả chuyển vào detail component)
4. **Xóa** `selectedComment`, `selectedTuluan` (không cần khi panel bị xóa)

### `duyet-thuongxuyen-tuluan.component.html`
1. **Xóa** toàn bộ `<ng-template #templateFormViewTuluan>` (dòng 143–181)
2. **Xóa** toàn bộ `<ng-template #templateDuyet>` (dòng 184–296)
3. Giữ nguyên table danh sách + filter

## Đăng ký Route

File: `duyetnoidung-routing.module.ts` — thêm:
```ts
{
    path: 'duyet-thuongxuyen-tuluan-detail/:tuluanId',
    loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-thuongxuyen-tuluan-detail/duyet-thuongxuyen-tuluan-detail.component').then(c => c.DuyetThuongxuyenTuluanDetailComponent),
},
```

## Dashboard integration

File: `dashboard-v2.component.ts`

- Block `close_left_menu` → thêm `else if (activeLink.indexOf('duyet-thuongxuyen-tuluan-detail') !== -1)`
- Logic: parse URL lấy basePath = `hoi-dong/duyetnoidung/cauhoi`, đọc `code` queryParam → set `back_url`

## Thứ tự triển khai

1. Tạo folder + 3 file `duyet-thuongxuyen-tuluan-detail` (clone từ `duyet-thuongxuyen-duan-detail`, đổi tên + title + secondary_feature + channel name)
2. Đăng ký route trong `duyetnoidung-routing.module.ts`
3. Sửa `duyet-thuongxuyen-tuluan.component.ts` — `onSelectDeTuluan()` mở tab mới + BroadcastChannel listen
4. Xóa `templateFormViewTuluan` + `templateDuyet` khỏi HTML + xóa code liên quan khỏi TS
5. Cập nhật `dashboard-v2.component.ts` — Back navigation
6. Test thủ công: click đề → mở tab detail → duyệt → sync tab danh sách

## Câu hỏi đã chốt

| # | Vấn đề | Quyết định |
|---|--------|------------|
| 1 | `app-view-thuongxuyen-tuluan` hoạt động? | ✅ Đã tồn tại và hoạt động OK |
| 2 | Tiêu chí chấm cho tự luận? | ✅ Có — dùng `CoursePlanActivityTuluanTieuchichamService` |
| 3 | `huyTrangThai()` + `reDoAction()` trên detail? | ❌ Chỉ giữ trên danh sách |
| 4 | Title page? | `"Tự luận - " + course_name` |
| 5 | secondary_feature? | `"Duyệt tự luận"` |
