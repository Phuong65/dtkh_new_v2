# Kế hoạch chức năng: Duyệt câu hỏi TN — Tab detail

## Mục tiêu

Khi người dùng click một câu hỏi trong danh sách duyệt câu hỏi trắc nghiệm, hệ thống mở **browser tab mới** chứa giao diện duyệt/nhận xét câu hỏi full-page. Giao diện cũ (side panel) bị thay thế hoàn toàn.

## Quyết định đã chốt

- Tab mới mở bằng route Angular + `window.open(..., '_blank')`.
- Tab mới giữ nút **Câu trước / Câu sau**.
- Sau khi duyệt/yêu cầu sửa, **tab danh sách tự reload** qua BroadcastChannel.
- Sau khi duyệt xong, tab detail **tự chuyển sang câu chờ duyệt tiếp theo**.
- **Cải thiện UX/UI** so với side panel: 2 cột full-page, header sticky, test mode.
- Folder: `duyet-cauhoi-tn-detail/`.

## Cấu trúc file

```text
src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-tn-detail/
  duyet-cauhoi-tn-detail.component.ts
  duyet-cauhoi-tn-detail.component.html
  duyet-cauhoi-tn-detail.component.css
```

## Route

```text
/admin/hoi-dong/duyetnoidung/duyet-cauhoi-tn-detail/:questionId
  ?courseId=...&activityId=...&cdrId=...
```

> Lưu ý: route prefix `/admin/hoi-dong/duyetnoidung/` tương ứng lazy-load qua `duyetnoidung-routing.module.ts`.

## Các chức năng chính

### 1. Mở tab mới từ danh sách

File: `duyet-cauhoi-tn.component.ts` → `chooseQuestion()`

Luồng:
1. Kiểm tra clone mới (`getCloneQuestion`) → nếu có thì reload + thông báo chọn lại.
2. Kiểm tra điều kiện test (`count_teacher || old_status === 1 || question_root_id || no_test_question`) → nếu không đạt thì cảnh báo.
3. Nếu đạt → `window.open(url, '_blank', 'noopener,noreferrer')`.

### 2. Load dữ liệu độc lập (tab detail)

`loadFullContext()` chain:
1. Load câu hỏi theo `questionId` → gán `selectedQuestion`.
2. Load course và tải trực tiếp câu hỏi con theo `group_id = selectedQuestion.id` (`loadSelectedQuestionChildren$()`). Câu con `status === -3` và phiên bản cũ đã được thay thế bị loại bỏ; lỗi tải có cảnh báo, không chặn trang detail.
3. Load danh sách câu cùng scope (`loadQuestionList$()`) → phục vụ next/back và bổ sung dữ liệu thống kê.
4. Load hội đồng + xác định vai trò (`loadCouncilRoles()`) → `kd_hoidong` / `kd_uyvien`.
5. Load danh sách câu ủy viên đã nhận xét (`loadMyCommentedQuestionIds()`) → lọc auto-next.
6. Load plan activity (`loadPlanActivity$()`) → lấy tên bài (Bài 1, Bài 2...) phục vụ set title + secondary_feature.
7. Load comment + report (`loadCommentQuestion$()`) → hiển thị nhận xét.

Tất cả được chain qua `switchMap` — khi route thay đổi (navigate nội bộ), subscription cũ bị cancel.
Việc tải câu hỏi con không phụ thuộc `loadQuestionList$()`, nên detail vẫn nhận biết `selectedQuestion.children` khi danh sách CDR lỗi hoặc không chứa câu hiện tại.

### 3. Nhận xét theo vai trò

#### 3.1. Ủy viên (`kd_uyvien`)

- Hiển thị 2 nút: **Đồng ý duyệt** / **Yêu cầu sửa**.
- `Đồng ý duyệt`: gửi comment mặc định `"Đồng ý duyệt"` (status=1), không confirm.
- `Yêu cầu sửa`: hiện form nhập nội dung → gửi comment (status=-1).
- Sau khi gửi thành công → đánh dấu câu vào `commentedQuestionIds` → auto-next.
- Ẩn section này khi `selectedQuestion.status === 1` (đã duyệt).

#### 3.2. Chủ tịch (`kd_hoidong`)

- Không hiển thị "Nhận xét của bạn" — chỉ hiện **Kết luận của chủ tịch hội đồng**.
- `Đồng ý duyệt`:
  - Nếu tất cả ủy viên đồng ý → không confirm → gửi.
  - Nếu có ủy viên yêu cầu sửa → confirm cảnh báo.
  - Nếu chưa có ủy viên nào nhận xét → confirm.
- `Yêu cầu sửa`: confirm rồi gửi.
- Cập nhật `courseQuestions.status` + `approved_by` + `approved_at`.
- Sau thành công → auto-next.
- Ẩn section khi `status === 1 || status === -1`.

### 4. Auto-next đến câu chờ duyệt tiếp theo

`navigateNextQuestion()` → `findNextPendingQuestion()`:

Tiêu chí lọc câu kế tiếp (bắt đầu từ index hiện tại + 1):
- `status === 0` (chờ duyệt).
- `id !== currentId`.
- Nếu là ủy viên: câu chưa có trong `commentedQuestionIds`.

Nếu không tìm thấy câu nào → toast thông báo hoàn tất + `reloadCurrentQuestion()`.

### 5. Câu trước / Câu sau (thủ công)

`openNewQuestion('next' | 'back')`:
- Duyệt toàn bộ `list_question` theo thứ tự (bao gồm cả câu đã duyệt).
- Wrap-around: cuối danh sách → quay đầu.
- Navigate bằng `router.navigate` (cùng tab).

### 6. Undo — Khôi phục câu trước (10 giây)

Sau mỗi action thành công, ghi `PendingUndoAction`:
- `questionId`, `role`, `action`, `commentId`, `previousStatus/approvedBy/approvedAt`, `expiresAt`.

Banner hiển thị với countdown. Khi bấm `Khôi phục`:
- Xóa comment vừa tạo (`deleteCourseQuestionComment`).
- Nếu chủ tịch: rollback `status`/`approved_by`/`approved_at` về giá trị cũ.
- Nếu ủy viên: xóa câu khỏi `commentedQuestionIds`.
- Navigate lại câu vừa undo.

Cleanup: `clearInterval` khi hết hạn / destroy / chuyển câu.

### 7. Sync reload tab danh sách

Cơ chế: **BroadcastChannel** (`duyet-cauhoi-tn-detail-sync`) + **localStorage** fallback.

Tab detail phát event sau mỗi action thành công:
```ts
{ type: 'QUESTION_REVIEW_UPDATED', questionId, courseId, activityId, updatedAt }
```

Tab danh sách (`duyet-cauhoi-tn.component.ts`):
- Nghe BroadcastChannel + `window.addEventListener('storage', ...)`.
- So khớp `courseId`/`activityId` → gọi `loadData()`.
- Cleanup listener trong `ngOnDestroy`.

### 8. Test mode (kiểm thử đáp án)

Cho phép người dùng **thử trả lời câu hỏi** ngay trên giao diện duyệt:
- Nút `Bật kiểm thử` / `Tắt kiểm thử` trên header.
- Khi bật: question-type components chuyển sang interactive (`isReadOnly=false`).
- Nút `Kiểm tra đáp án`: evaluate kết quả → hiện badge Đúng/Sai + tỷ lệ câu con đúng.
- Nút `Thử lại`: reset về trạng thái ban đầu (clone lại từ `initialQuestion`).
- Khi tắt: restore lại câu hỏi gốc, ẩn kết quả.
- Hỗ trợ tất cả question_type: radio, checkbox, inputbox, reorder_words, arrange_paragraphs, drag_drop, group-input, group-radio, grouping.

### 9. Layout & UX

#### Page title & secondary_feature

Sau khi forkJoin hoàn tất (`loadCourseSelected$` + `loadPlanActivity$`):
- Lấy tên plan theo logic:
  - `planActivity.week > 0 && < 100` → `"Bài " + week` (giống sidebar `duyet-cauhoi`).
  - Còn lại → `planActivity.title` (ví dụ: "KTTX - Thực hành", "KTHP - Trắc nghiệm").
  - Nếu `activityId = 0` (xem tất cả) → fallback `"Duyệt Câu hỏi"`.
- `auth.setFeatureSecondary(planName)` — hiện tên bài trên breadcrumb/header hệ thống.
- `titleService.setTitle(planName + ' - ' + courseSelected.title)` — title tab trình duyệt.

Methods: `loadPlanActivity$()`, `applyTitleAndSecondaryFeature()`, `getPlanName()`.

#### Header sticky
- Mã câu hỏi `#id` + CDR.
- Trạng thái: Đạt / Chưa đạt / Đã sửa / Chờ duyệt (màu sắc).
- Public/Private + Đảo phương án.
- Buttons: Câu trước, Câu sau, Bật kiểm thử, Quay lại.

#### Body 2 cột (grid `1fr 420px`)
- **Cột trái**: Nội dung câu hỏi (card) + kết quả test mode.
- **Cột phải**: Report giảng viên test → Undo banner → Form nhận xét ủy viên / Kết luận chủ tịch → Nhận xét hội đồng + reply.

#### UX
- Loading spinner khi chuyển câu.
- Empty state khi không tìm thấy câu hỏi.
- Reply comment inline.
- Form yêu cầu sửa slide-down khi bấm nút (không popup).

## Trạng thái triển khai

### Đã hoàn thành ✅

| Bước | Ghi chú |
|------|---------|
| Feature folder & route | `duyet-cauhoi-tn-detail/:questionId` đăng ký trong `duyetnoidung-routing.module.ts` |
| UI detail full page | Layout 2 cột, sticky header, card UI, question types, test mode |
| Load dữ liệu độc lập | `loadFullContext()` chain forkJoin + switchMap, guard stale; catch lỗi ngoài cùng để tắt loading và báo lỗi tải câu hỏi |
| Load câu hỏi con độc lập | `loadSelectedQuestionChildren$()` tải theo `group_id`, lọc câu vô hiệu/phiên bản cũ, không phụ thuộc danh sách CDR |
| Load plan activity | `loadPlanActivity$()` — lấy tên bài phục vụ title/secondary |
| Set title & secondary_feature | `applyTitleAndSecondaryFeature()` — title tab + breadcrumb theo logic week/title |
| Load danh sách next/back | `loadQuestionList$()` qua `CoursePlanActivitiesService` → `CourseQuestionsService` |
| Nghiệp vụ comment/duyệt | Ủy viên: 2 nút rút gọn. Chủ tịch: 3-nhánh confirm logic |
| Sync reload tab danh sách | BroadcastChannel + localStorage; list lắng nghe cả hai |
| Đổi `chooseQuestion` | Mở tab mới, giữ check clone + điều kiện test |
| Auto-next + filter ủy viên | Lọc `status===0` + skip câu đã nhận xét (`commentedQuestionIds`) |
| Undo 10 giây | Timer, rollback comment + status, restore `commentedQuestionIds` |
| Test mode | Evaluate tất cả question types, retry, exit restore |

### Còn lại ⏸️

| Mục | Chi tiết | Ưu tiên |
|-----|----------|---------|
| **Dọn side panel cũ** | Xóa `templateQuestionView`, `templateDuyet`, các hàm chỉ phục vụ side panel trong `duyet-cauhoi-tn.component` | Thấp — chờ test ổn |
| **Test thực tế** | Build + test trên dev server: routing, loading, sync reload, auto-next, undo, test mode, title/secondary | Cao |

## Rủi ro cần chú ý

1. **`commentedQuestionIds` chỉ load 1 lần khi init**: nếu ủy viên mở 2 tab detail cùng lúc, tab thứ 2 có thể thiếu dữ liệu → navigate vào câu đã nhận xét rồi.
2. **Wrap-around next/back**: `openNewQuestion` wrap-around, nhưng `navigateNextQuestion` (auto-next) không wrap — chỉ tìm từ vị trí hiện tại đến cuối. Đây là hành vi cố ý (tránh loop vô tận).
3. **Popup blocker**: `window.open` sau `await getCloneQuestion` (async) hiếm khi bị chặn vì vẫn nằm trong event handler stack. Tuy nhiên cần test trên các browser cũ.
4. **Sync listener leak**: Nếu `ngOnDestroy` không chạy (force close tab), listener không được cleanup — không gây vấn đề vì cùng bị GC.
5. **`activityId = 0`**: Khi xem tất cả bài, `loadPlanActivity$()` skip (không gọi API), secondary_feature fallback "Duyệt Câu hỏi".

## Không còn câu hỏi mở

Tất cả quyết định thiết kế đã chốt và triển khai xong. Chỉ còn QA thực tế + dọn code cũ.
