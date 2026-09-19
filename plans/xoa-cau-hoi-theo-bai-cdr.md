# Kế hoạch tính năng: Xóa tất cả câu hỏi theo bài/CDR

## 1. Mục tiêu

Bổ sung thao tác xóa hàng loạt câu hỏi trong màn hình quản lý ngân hàng câu hỏi trắc nghiệm V2 theo hai phạm vi:

- **Theo bài**: toàn bộ CDR thuộc bài được chọn.
- **Theo CDR**: toàn bộ mức độ Bloom thuộc CDR được chọn.

Không xóa node bài học, node CDR hoặc cấu hình chỉ tiêu `cdr_cauhoi`.

## 2. Quyết định đã chốt

1. Dùng method hiện có:

```ts
CourseQuestionsService.deleteCourseQuestions(ids)
```

File: `src/app/modules/shared/services/course-questions.service.ts`.

2. Không tạo endpoint/service xóa mới.
3. Câu hỏi nhóm được xét theo câu hỏi cha:
   - cha có `status === 1` hoặc `old_status === 1`: giữ toàn bộ cha và con;
   - cha có `status !== 1` và `old_status !== 1`: xóa cha cùng toàn bộ câu con.
4. Xóa theo CDR áp dụng cho toàn bộ mức độ Bloom.
5. Quyền thao tác chỉ dùng `canDelete`.

## 3. Quy tắc nghiệp vụ

Một câu hỏi cha chỉ đủ điều kiện xóa khi đồng thời thỏa:

```ts
Number(question.status) !== 1 && Number(question.old_status) !== 1
```

Quy ước:

- `status === 1`: đang được duyệt — giữ toàn bộ nhóm.
- `old_status === 1`: từng được duyệt — giữ toàn bộ nhóm.
- `old_status` là `null`/`undefined`: được xem là chưa từng duyệt.
- Trạng thái câu hỏi con không quyết định quyền xóa riêng; câu con đi theo câu hỏi cha.
- Dữ liệu đủ điều kiện được xóa bằng `deleteCourseQuestions()` với danh sách ID cha và ID con.

## 4. Phạm vi dữ liệu

### 4.1. Xóa theo bài

1. Nhận `plan.id` của bài đang thao tác.
2. Lấy toàn bộ `ACTIVITY_CDR` có `parent_id === plan.id`.
3. Lấy toàn bộ câu hỏi cha có:
   - `course_id` đúng môn đang chọn;
   - `reference === 'course_plan_activities'`;
   - `reference_id` thuộc danh sách ID CDR của bài;
   - `group_id === 0`.
4. Lọc câu hỏi cha theo `status` và `old_status`.
5. Với mỗi cha đủ điều kiện, lấy toàn bộ câu con có `group_id === parent.id`.
6. Gộp ID cha và con rồi gọi hàm xóa hiện có.

### 4.2. Xóa theo CDR

1. Nhận `cdr.id` đang thao tác.
2. Lấy toàn bộ câu hỏi cha có:
   - `course_id` đúng môn đang chọn;
   - `reference === 'course_plan_activities'`;
   - `reference_id === cdr.id`;
   - `group_id === 0`.
3. Không lọc theo `cdr` mức độ Bloom; phạm vi bao phủ toàn bộ mức.
4. Lọc câu hỏi cha theo `status` và `old_status`.
5. Gộp ID cha đủ điều kiện cùng toàn bộ ID con tương ứng.
6. Gọi hàm xóa hiện có.

## 5. UI/UX

### 5.1. Nút thao tác

- Dòng bài: nút thùng rác, tooltip **“Xóa câu hỏi chưa duyệt của bài”**.
- Dòng CDR: nút thùng rác, tooltip **“Xóa câu hỏi chưa duyệt của CDR”**.
- Chỉ hiển thị khi `canDelete === true`.
- Disabled khi phạm vi không có câu hỏi cha đủ điều kiện.

### 5.2. Component xác nhận riêng

Tạo folder riêng:

```text
src/app/modules/admin/features/cauhoi-tracnghiem-v2/xoa-cau-hoi-theo-bai-cdr/
  xoa-cau-hoi-theo-bai-cdr.component.ts
  xoa-cau-hoi-theo-bai-cdr.component.html
  xoa-cau-hoi-theo-bai-cdr.component.css
```

Hộp thoại hiển thị:

- Môn học.
- Bài hoặc CDR đang thao tác.
- Số câu hỏi cha đủ điều kiện xóa.
- Tổng số bản ghi cha/con sẽ xóa.
- Số nhóm được giữ vì cha đã duyệt.
- Cảnh báo nổi bật:

> Cảnh báo: Dữ liệu câu hỏi bị xóa sẽ không thể khôi phục. Các nhóm câu hỏi có câu hỏi cha đã duyệt sẽ được giữ lại.

Checkbox bắt buộc:

> Tôi đã đọc cảnh báo và đồng ý xóa vĩnh viễn các câu hỏi đủ điều kiện.

Nút xác nhận:

- Nhãn: `Xóa vĩnh viễn X câu hỏi`.
- Màu đỏ.
- Disabled khi checkbox chưa chọn, không có dữ liệu hợp lệ hoặc request đang chạy.
- Checkbox reset về `false` mỗi lần mở và đóng.
- Không gọi thêm `confirmDelete()` sau hộp thoại này.

## 6. Thay đổi frontend

### 6.1. Manager component

File:

- `cauhoi-tracnghiem-manager.component.ts`
- `cauhoi-tracnghiem-manager.component.html`
- `cauhoi-tracnghiem-manager.component.css`

Thay đổi:

1. Bổ sung `old_status` vào trường `select` trong request câu hỏi của `loadCdrAndQuestion()`.
2. Lưu snapshot đầy đủ câu hỏi vừa tải để xác định cha/con và phạm vi xóa.
3. Tạo helper:
   - `canDeleteQuestionGroup(parent)`;
   - lấy câu hỏi cha theo bài;
   - lấy câu hỏi cha theo CDR;
   - lấy ID con theo `group_id`;
   - tạo preview số đủ điều kiện và được giữ.
4. Mở component xác nhận với dữ liệu scope và preview.
5. Sau khi checkbox được chọn, gọi `courseQuestionsService.deleteCourseQuestions(ids.toString())`.
6. Chặn double-click bằng trạng thái submitting.
7. Nếu số ID lớn, chia thành batch nhỏ trước khi gọi method hiện có để tránh URL quá dài.
8. Sau thành công:
   - đóng hộp thoại;
   - toast số nhóm và số bản ghi đã xóa;
   - thông báo số nhóm được giữ nếu có;
   - gọi lại `loadCdrAndQuestion()`;
   - giữ môn đang chọn.
9. Khi lỗi:
   - tắt processing/submitting;
   - giữ hộp thoại mở;
   - hiển thị lỗi;
   - tải lại dữ liệu nếu một batch trước đó đã xóa thành công, tránh thống kê cũ.

### 6.2. Service

Không sửa contract hiện có:

```ts
deleteCourseQuestions(ids: any): Observable<any>
```

Chỉ gọi method này từ manager. Không ảnh hưởng các màn hình đang dùng cùng service.

## 7. Luồng thao tác

1. Người dùng chọn môn.
2. Hệ thống tải bài/CDR và câu hỏi, gồm `status`, `old_status`, `group_id`, `reference_id`.
3. Người dùng bấm xóa tại dòng bài hoặc CDR.
4. Frontend xác định câu hỏi cha đủ điều kiện và toàn bộ câu con tương ứng.
5. Hộp thoại hiển thị cảnh báo, số sẽ xóa, số được giữ.
6. Nút xóa mặc định bị khóa.
7. Người dùng chọn checkbox đồng ý.
8. Người dùng bấm xóa.
9. Frontend gọi `deleteCourseQuestions()` bằng danh sách ID cha/con.
10. Thành công: reload cây và thống kê.
11. Thất bại: thông báo lỗi, không cập nhật giả dữ liệu local.

## 8. Tiêu chí nghiệm thu

### Điều kiện xóa theo câu hỏi cha

| `status` | `old_status` | Kết quả |
|---:|---:|---|
| `0` | `0`/`null` | Xóa cha và toàn bộ con |
| `-2` | `0`/`null` | Xóa cha và toàn bộ con |
| `1` | bất kỳ | Giữ toàn bộ nhóm |
| khác `1` | `1` | Giữ toàn bộ nhóm |

### Phạm vi

- Xóa theo bài bao phủ toàn bộ CDR thuộc bài.
- Xóa theo CDR bao phủ toàn bộ mức độ Bloom.
- Không xóa câu hỏi ngoài môn, bài hoặc CDR được chọn.
- Không xóa node bài/CDR hoặc quota `cdr_cauhoi`.
- Xóa cha luôn kèm toàn bộ con; không tạo dữ liệu con mồ côi.

### Quyền và xác nhận

- `canDelete === false`: không hiển thị nút.
- `canDelete === true`: hiển thị nút.
- Chưa chọn checkbox: không thể xóa.
- Đã chọn checkbox và có dữ liệu hợp lệ: có thể xóa.
- Đóng rồi mở lại: checkbox chưa chọn.
- Double-click không tạo request trùng.
- Cảnh báo không thể khôi phục luôn xuất hiện trước thao tác.

### Kết quả và lỗi

- Thành công: số liệu bài/CDR được tải lại.
- Không có dữ liệu hợp lệ: không gọi API.
- API lỗi: loading được tắt, hiện thông báo, không cập nhật giả thống kê.
- Batch lỗi giữa chừng: tải lại dữ liệu để phản ánh số đã xóa thực tế.

## 9. Thứ tự triển khai

1. Bổ sung `old_status` và lưu snapshot câu hỏi trong manager.
2. Viết helper lọc câu hỏi cha theo bài/CDR và gom ID con.
3. Tạo component cảnh báo trong folder riêng.
4. Gắn nút theo `canDelete` vào dòng bài và CDR.
5. Gọi `deleteCourseQuestions()`; bổ sung batching nếu danh sách lớn.
6. Reload thống kê, xử lý success/error/partial batch.
7. Review tĩnh quyền, phạm vi, điều kiện trạng thái, reset checkbox và loading.
8. Chỉ build/test/run khi có yêu cầu riêng.

## 10. Trạng thái triển khai

### Đã hoàn thành

1. `old_status` được thêm vào query câu hỏi; snapshot đầy đủ cha/con lưu tại `courseQuestions`.
2. `buildDeleteQuestionsPreview()` xác định nhóm xóa (cha `status !== 1` và `old_status !== 1`), nhóm bảo vệ, gom ID cha + toàn bộ ID con.
3. Preview gắn vào từng bài và từng CDR sau mỗi lần `loadCdrAndQuestion()`.
4. Component `XoaCauHoiTheoBaiCdrComponent` (TS/HTML/CSS) trong folder riêng.
5. Nút xóa theo bài và theo CDR, chỉ hiện khi `canDelete`, disabled khi không có nhóm đủ điều kiện, `stopPropagation()` chặn toggle.
6. Gọi `deleteCourseQuestions(ids.toString())` theo batch 100 ID (`concatMap` tuần tự).
7. Chặn double-click bằng `submitting`; thành công đóng modal, toast số liệu, reload `loadCdrAndQuestion()`; lỗi giữ modal, hiển thị lỗi; lỗi giữa chừng (đã xóa ≥ 1 batch) tự reload dữ liệu.
8. Modal áp dụng Rule 2: CSS variables, header gradient + accent bar, stat cards icon + hover, checkbox có icon + focus ring, nút icon + text + active scale, spinner loading rõ ràng, responsive < 576px, custom scrollbar.

### Chưa thực hiện

- Build/test/run (chỉ thực hiện khi có yêu cầu riêng).

## 11. Changelog

### 2026-08-04 — Lần 1: Nâng cấp UI/UX modal xóa theo Rule 2
**Mục đích:** Đưa modal xóa về đúng tiêu chuẩn giao diện `docs/_rules.md` Rule 2 (modern, sạch, có khoảng trắng, icon + text, hover, CSS variables).

**Các thay đổi:**
1. **`xoa-cau-hoi-theo-bai-cdr.component.css`** — Viết lại toàn bộ: CSS variables, header gradient + accent bar, stat cards icon + hover, checkbox focus ring, nút icon + text + active scale, spinner, custom scrollbar, responsive, reduced-motion, `::ng-deep` bo modal-content.
2. **`xoa-cau-hoi-theo-bai-cdr.component.html`** — Header icon + eyebrow, warning icon tròn, scope/summary thành section có tiêu đề, checkbox có icon + nhãn phụ, panel loading, aria-labels.
3. **`plans/xoa-cau-hoi-theo-bai-cdr.md`** — Bổ sung mục trạng thái triển khai và changelog.

**Kết quả:** Modal nhất quán Rule 2; logic nghiệp vụ không đổi. Chưa build/test.

## 12. Câu hỏi mở

Không còn. Các quyết định nghiệp vụ và hướng tích hợp đã chốt.
