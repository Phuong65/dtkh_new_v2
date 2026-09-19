# Kế hoạch chức năng: Duyệt câu hỏi thực hành KTHP — Detail (full-page)

## Trạng thái: ✅ Đã xác nhận — sẵn sàng triển khai

## Mục tiêu

Khi người dùng click một đề thực hành KTHP trong danh sách `duyet-cauhoi-thuchanh-kthp`, hệ thống mở **browser tab mới** chứa giao diện duyệt/nhận xét đề thực hành full-page (thay vì side panel cũ `templateFormViewTuluan`).

Mô hình tham chiếu: `duyet-thuongxuyen-tuluan-detail` — cùng cách hoạt động, UX, và pattern kỹ thuật.

## Hiện trạng

### Component `duyet-cauhoi-thuchanh-kthp` (tab danh sách)
- Khi click đề thực hành → gọi `onSelectDeTuluan()` → `loadCommentTuluan()` → **mở side panel** qua `notificationService.openSideNavigationMenu({ template: templateFormViewTuluan })`
- `templateFormViewTuluan` chứa: header (id + status + buttons next/back), body (`app-view-thuongxuyen-tuluan hinhthuc="Thực hành"` + form duyệt + comments + reply)
- Cần chuyển sang pattern mở **tab mới** giống `duyet-thuongxuyen-tuluan-detail`

### Đặc điểm riêng so với `duyet-thuongxuyen-tuluan`
- Component là child của `duyet-cauhoi` (nhúng qua selector, **không** có route riêng)
- Nhận data qua `@Input()`: `selectedCourse`, `planTuluan`, `listThamDInh`
- `planTuluan.id === 0` (fake CoursePlanActivities) — KTHP thực hành dùng `course_plan_activity_id = 0`
- Query đề: `private = 1`, `course_id = X`, `course_plan_activity_id = 0`
- Dùng `hinhthuc="Thực hành"` cho `app-view-thuongxuyen-tuluan`
- Có thêm `approvedAll()`, `btnUpdateLockByActivityTuLuan()`, `huyTrangThai()`, `reDoAction()` trên danh sách
- Comment service: `CoursePlanTuluanCommentService` (giống `duyet-thuongxuyen-tuluan`)

### Pattern đã thực hiện ở `duyet-thuongxuyen-tuluan-detail`
- Standalone component full-page, lazy-loaded qua route
- Layout 2 cột (grid `1fr 420px`)
- BroadcastChannel sync → tab danh sách reload
- Auto-next (bỏ qua đề đã nhận xét)
- Undo 10 giây
- Back navigation

## Cấu trúc file mới

```text
src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail/
  duyet-cauhoi-thuchanh-kthp-detail.component.ts
  duyet-cauhoi-thuchanh-kthp-detail.component.html
  duyet-cauhoi-thuchanh-kthp-detail.component.css
```

## Route

```text
/admin/hoi-dong/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail/:tuluanId
  ?courseId=...&code=...
```

- `code` = `hoidong_thamdinh_monhoc_id` — truyền từ `duyet-cauhoi?code=X` để hỗ trợ Back navigation
- Không cần `activityId` vì luôn bằng `0`

## Kiến trúc

| Quyết định | Ghi chú |
|-----------|---------|
| Tab mới bằng `window.open` + route Angular | Tab danh sách gọi `onSelectDeTuluan()` |
| Standalone component, lazy-loaded | Đăng ký trong `duyetnoidung-routing.module.ts` |
| Layout full-page 2 cột (grid `1fr 420px`) | Responsive ≤1024px → 1 cột |
| BroadcastChannel sync | Tab detail → tab danh sách reload khi có thay đổi |
| Title page = `"KTHP - " + hinhthucthi + " - " + course_name` | Dùng `Title` service; `hinhthucthi` lấy từ `EXAMFORMAT` theo `course.params.exam_format/exam_type` |
| `secondary_feature` = `"Duyệt KTHP - " + hinhthucthi` | Dùng `auth.setFeatureSecondary()` |
| Back navigation về `cauhoi?code=X` | Đọc `code` từ queryParams, navigate trực tiếp |
| `hinhthuc = "Thực hành"` | Truyền cho `app-view-thuongxuyen-tuluan` |

## Các chức năng (clone từ duyet-thuongxuyen-tuluan-detail, điều chỉnh cho thực hành KTHP)

### 1. Load dữ liệu (`loadFullContext()`)

Chain: `route.params` → `switchMap` → load đề thực hành → `forkJoin`:
- `loadCourseSelected$()` — thông tin khóa học (bao gồm `params.exam_format`/`params.exam_type`) → **set title + secondary_feature**
- `loadTuluanList$()` — danh sách đề cùng scope: `private=1`, `course_id=X`, `course_plan_activity_id=0`
- `loadCouncilRoles()` → `loadMyCommentedTuluanIds()` — hội đồng + track đề đã nhận xét

→ `switchMap` → `loadCommentTuluan$()` — comments + reply count

**Lưu ý:** Tiêu chí chấm (`loadTieuChiCham$`) **không cần load riêng** ở detail component vì `app-view-thuongxuyen-tuluan` đã tự load tiêu chí chấm bên trong (dùng `CoursePlanActivityTuluanTieuchichamService`).

### 2. Title & Secondary Feature (`applyTitleAndSecondaryFeature`)

- Xác định `hinhthucthi` từ `course.params`:
  - Nếu `course.params.exam_type` → tìm trong `EXAMFORMAT` theo `id`
  - Nếu không → tìm theo `course.params.exam_format`
  - Fallback: `"Thực hành"`
- `titleService.setTitle('KTHP - ' + hinhthucthi + ' - ' + courseSelected.title)`
- `auth.setFeatureSecondary('Duyệt KTHP - ' + hinhthucthi)`
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

- BroadcastChannel: `duyet-cauhoi-thuchanh-kthp-detail-sync`
- Emit event: `{ type: 'THUCHANH_KTHP_REVIEW_UPDATED', tuluanId, courseId, updatedAt }`
- Tab danh sách listen → reload `loadKynangTuluan()`
- localStorage fallback cho trình duyệt không hỗ trợ BroadcastChannel

### 9. Reply comment (`saveCommentReply`)

- Hiển thị danh sách reply khi click "Phản hồi (N)"
- Gửi reply → reload danh sách reply

### 10. Back navigation (`goBack`)

- Đọc `code` từ `route.snapshot.queryParamMap`
- Nếu có `code` → `router.navigate(['/admin/hoi-dong/duyetnoidung/cauhoi'], { queryParams: { code } })`
- Nếu không có → fallback `location.back()`
- Dashboard `backToClass()` cũng xử lý case `duyet-cauhoi-thuchanh-kthp-detail`

## Layout

### Header sticky
- Mã đề `#id` + trạng thái badge (Đạt/Chờ duyệt/Yêu cầu sửa/Đã sửa)
- Thời gian duyệt (nếu đạt)
- Nút: Đề trước, Đề sau, Quay lại

### Body 2 cột
- **Cột trái**: Nội dung đề (`app-view-thuongxuyen-tuluan hinhthuc="Thực hành"`)
- **Cột phải**: Undo banner → Form ủy viên → Kết luận chủ tịch → Comments hội đồng + reply

## Thay đổi ở component tab danh sách (`duyet-cauhoi-thuchanh-kthp`)

### `duyet-cauhoi-thuchanh-kthp.component.ts`
1. **Sửa `onSelectDeTuluan()`** — thay `loadCommentTuluan()` → `window.open(url, '_blank', 'noopener,noreferrer')`
   ```ts
   onSelectDeTuluan(tuluan: CoursePlanActivityTuluan) {
       const baseUrl = window.location.origin;
       const courseId = this.selectedCourse?.id;
       const urlParams = new URLSearchParams(window.location.search);
       const code = urlParams.get('code');
       let url = `${baseUrl}/admin/hoi-dong/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail/${tuluan.id}?courseId=${courseId}`;
       if (code) {
           url += `&code=${code}`;
       }
       window.open(url, '_blank', 'noopener,noreferrer');
   }
   ```
2. **Thêm `initBroadcastChannel()`** — listen sync events → reload data
3. **Xóa/giữ `templateFormViewTuluan`** → xóa template, xóa `@ViewChild`, xóa hàm `loadCommentTuluan()`, `openReply()`, `loadReplyComment()`, `saveCommentReply()`, `saveComment()`, `duyetNoidung()`, `closeForm()`, `openNewQuestion()` (tất cả chuyển vào detail component)
4. **Xóa** `selectedComment`, `selectedTuluan` (không cần khi panel bị xóa)
5. **Giữ nguyên** `approvedAll()`, `btnUpdateLockByActivityTuLuan()`, `huyTrangThai()`, `reDoAction()` — chỉ có trên danh sách

### `duyet-cauhoi-thuchanh-kthp.component.html`
1. **Xóa** toàn bộ `<ng-template #templateFormViewTuluan>` (dòng 151–189)
2. **Xóa** toàn bộ `<ng-template #templateDuyet>` (dòng 192–304)
3. Giữ nguyên table danh sách + filter + dialog progress

## Đăng ký Route

File: `duyetnoidung-routing.module.ts` — thêm:
```ts
{
    path: 'duyet-cauhoi-thuchanh-kthp-detail/:tuluanId',
    loadComponent: () => import('@modules/admin/features/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail/duyet-cauhoi-thuchanh-kthp-detail.component').then(c => c.DuyetCauhoiThuchanhKthpDetailComponent),
},
```

## Dashboard integration

File: `dashboard-v2.component.ts`

- Block `close_left_menu` → thêm `else if (activeLink.indexOf('duyet-cauhoi-thuchanh-kthp-detail') !== -1)`
- Logic: parse URL lấy basePath = `hoi-dong/duyetnoidung/cauhoi`, đọc `code` queryParam → set `back_url`

## Thứ tự triển khai

1. Tạo folder + 3 file `duyet-cauhoi-thuchanh-kthp-detail` (clone từ `duyet-thuongxuyen-tuluan-detail`, điều chỉnh:
   - title → `'KTHP - ' + hinhthucthi + ' - ' + course_name` (xác định `hinhthucthi` từ `EXAMFORMAT`)
   - secondary_feature → `'Duyệt KTHP - ' + hinhthucthi`
   - channel name → `'duyet-cauhoi-thuchanh-kthp-detail-sync'`
   - hinhthuc → `"Thực hành"`
   - query đề: `course_plan_activity_id = 0`, `private = 1`
   - **Không cần** `loadTieuChiCham$()` — `app-view-thuongxuyen-tuluan` đã tự load
2. Đăng ký route trong `duyetnoidung-routing.module.ts`
3. Sửa `duyet-cauhoi-thuchanh-kthp.component.ts` — `onSelectDeTuluan()` mở tab mới + BroadcastChannel listen
4. Xóa `templateFormViewTuluan` + `templateDuyet` khỏi HTML + xóa code liên quan khỏi TS
5. Cập nhật `dashboard-v2.component.ts` — Back navigation
6. Test thủ công: click đề → mở tab detail → duyệt → sync tab danh sách

## Câu hỏi đã chốt

| # | Vấn đề | Quyết định |
|---|--------|------------|
| 1 | Tiêu chí chấm cho thực hành KTHP? | ✅ Có — `app-view-thuongxuyen-tuluan` tự load (dùng `CoursePlanActivityTuluanTieuchichamService`) |
| 2 | Title page? | `"KTHP - " + hinhthucthi + " - " + course_name` (theo pattern `duyet-cauhoi.component.ts` dòng 361) |
| 3 | secondary_feature? | `"Duyệt KTHP - " + hinhthucthi` |
| 4 | `huyTrangThai()` + `reDoAction()` trên detail? | ❌ Chỉ giữ trên danh sách |
