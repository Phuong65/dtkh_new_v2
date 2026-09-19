# Quy tắc phát triển chung (Development Rules)

File này ghi nhớ các quy tắc, kinh nghiệm đã rút ra trong quá trình phát triển để áp dụng nhất quán cho tất cả chức năng.

---

## 1. Template Binding — Không gọi hàm tính trạng thái trong HTML

**Áp dụng cho:** MỌI component Angular (standalone hoặc module-based).

**Nguyên tắc:**
- KHÔNG gọi method call trong template binding:
  - `{{ methodCall() }}` — interpolation gọi hàm
  - `[property]="methodCall()"` — property binding gọi hàm
  - `*ngIf="methodCall()"` — structural directive gọi hàm
- Chỉ dùng:
  - **Property**: `{{ someProperty }}`
  - **Map/Object đã tính sẵn**: `selectedStudentMap[student.student_id]`, `studentGroupName[student.student_id]`
  - **Form control**: `groupForm.controls['name'].invalid` thay vì `groupForm.get('name')?.invalid`
  - **Angular Pipe**: `{{ value | pipeName }}`
  - **trackBy**: chỉ dùng function reference `trackBy: trackByFn`, không phải `trackBy: trackByFn()`

**Xử lý dead code:**
- Method không được template sử dụng → phải xóa khỏi component.
- Kiểm tra bằng cách search tên method trong template HTML, nếu không có thì xóa.

**Ví dụ đã áp dụng (class-group component):**
- Xóa `isStudentSelected()` (dead code)
- Xóa `trackByGroupId()` (dead code, không được template dùng)
- Thay `groupForm.get('name')` → `groupForm.controls['name']`
- Thay `groupForm.get('ordering')` → `groupForm.controls['ordering']`

---

## 2. UI/UX — Tiêu chuẩn giao diện cho mọi component

**Áp dụng cho:** MỌI component Angular trong toàn bộ dự án (dtkh_v2.x và các dự án khác).

**Nguyên tắc chung:**
- Giao diện phải hiện đại, sạch sẽ, dễ nhìn, có khoảng trắng hợp lý.
- Tất cả buttons phải có **icon + text** (dùng Material Icons hoặc emoji).
- **Empty states** phải có: icon lớn + title + hint text, không chỉ text đơn thuần.
- **Loading** phải có progress bar hoặc spinner.
- **Hover effects** trên mọi phần tử tương tác (button, row, card, chip).

**CSS Variables:**
- Dùng CSS custom properties cho: `--primary`, `--primary-light`, `--gray-50`~`--gray-900`, `--radius-sm/md/lg`, `--shadow-sm/md/lg`, `--transition`.
- Không hardcode màu sắc, border-radius, shadow rải rác.

**Component structure:**
- **Header**: Gradient nền + accent bar bên trái + icon chức năng.
- **Summary/Stat cards**: Icon + text layout, hover nổi lên (translateY + shadow).
- **Bảng (table)**: Striped rows (zebra), hover highlight màu primary nhạt, border-radius, shadow.
- **Form controls**: Focus ring màu primary (3px opacity 0.1), invalid state màu danger.
- **Validation errors**: Icon ⚠️ + text đỏ, rõ ràng.
- **Buttons**: `display: inline-flex; align-items: center; gap: 6px;`, active scale 0.97.
- **Dialog**: Header gradient, divider line giữa content và actions, padding 20-24px.
- **Scrollbar**: Tùy chỉnh gọn gàng với `::-webkit-scrollbar` (width 6px, track xám nhạt, thumb xám đậm hơn).
- **Badge/Tag**: Border-radius pill (999px), padding 4px 10px.

**Responsive:**
- Breakpoint 992px: header xuống dòng, action buttons wrap.
- Breakpoint 576px: summary 1 cột, student row 2 cột, dialog padding giảm.

**Ví dụ đã áp dụng (class-group component):**
- CSS Variables cho toàn bộ component.
- Summary cards có icon + hover animation.
- Table striped + hover highlight.
- Student chips có avatar icon (👤) + hover border.
- Empty states: icon 📂📭👈 + title + hint.
- Search input với icon 🔍.
- Form error có icon ⚠️.

---

## 3. API phân trang — Lấy tổng số bản ghi

**Áp dụng cho:** API danh sách có tham số `limit`, `page` và response chứa `data.recordsFiltered`.

**Nguyên tắc:**
- `limit = -1` và `page = null` → tải hết tất cả bản ghi phù hợp filter.
- `limit = 1` và `page = null` → không tải toàn bộ; dùng `data.recordsFiltered` làm tổng số lượng có thể tìm thấy trên cơ sở dữ liệu.
- Khi chỉ cần thống kê tổng số, ưu tiên `limit = 1`, `page = null` để giảm tải dữ liệu.

---

## 4. Lịch sử chỉnh sửa (Changelog)

**Áp dụng cho:** File kế hoạch (`plans/*.md`) của mỗi chức năng.

**Cấu trúc mỗi entry:**
```markdown
### YYYY-MM-DD — Lần N: Tiêu đề ngắn gọn
**Mục đích:** Lý do thực hiện thay đổi.

**Các thay đổi:**
1. **`path/file.ts`** — Mô tả thay đổi cụ thể.
2. **`path/file.html`** — Mô tả thay đổi cụ thể.
3. **`path/file.md`** — Mô tả thay đổi cụ thể.

**Kết quả:** Trạng thái sau khi chỉnh sửa.
```

---

## 4. Xóa dữ liệu liên quan trước khi xóa bản ghi cha

**Áp dụng cho:** Mọi thao tác xóa có quan hệ cha-con.

**Nguyên tắc:**
- Frontend chủ động xóa dữ liệu con trước khi xóa bản ghi cha.
- Không phụ thuộc vào cascade từ backend.
- Xóa tuần tự: xóa member/child record trước → xóa parent record sau.
- Dùng `runSequential()` pattern với `reduce` + `mergeMap` để chạy tuần tự.

**Ví dụ đã áp dụng (class-group):**
- Xóa nhóm: xóa `class-group-member` theo `class_group_id` → xóa `class-group`
- Tạo lại nhiều nhóm: xóa member theo `class_id` → xóa group theo `class_id` → tạo nhóm mới

---

## 5. UX đánh giá chuẩn — Áp dụng cho mọi chức năng

**Áp dụng cho:** BA, PO, PM, Designer, Dev khi phân tích, thiết kế, review UI/UX cho tất cả chức năng.

**6 tiêu chí bắt buộc:**
1. **Clarity (Tính dễ hiểu)**
   - Giao diện phải giúp người dùng biết ngay cần làm gì.
   - CTA, nhãn, icon, trạng thái phải rõ ràng, dễ nhận biết.

2. **Consistency (Tính nhất quán)**
   - Nút, màu sắc, khoảng cách, bố cục, kiểu tương tác phải lặp lại có quy tắc.
   - Trải nghiệm giữa web/mobile và giữa các màn phải đồng bộ.

3. **Efficiency (Tính hiệu quả)**
   - Giảm thao tác thừa, rút ngắn số bước.
   - Ưu tiên luồng thao tác nhanh cho nhiệm vụ chính (ví dụ: hướng tới one-click hoặc ít-click nhất có thể).

4. **Feedback (Tính phản hồi)**
   - Mọi thao tác quan trọng phải có phản hồi rõ: loading, success, error, disabled.
   - Tránh trạng thái im lặng làm người dùng không biết hệ thống đang xử lý gì.

5. **Accessibility (Tính tiếp cận)**
   - Đảm bảo độ tương phản, cỡ chữ, vùng bấm, khả năng đọc tốt cho nhiều nhóm người dùng.
   - Ưu tiên khả năng hỗ trợ text size, high contrast, và các phương thức phản hồi bổ trợ khi cần.

6. **Emotion (Tính cảm xúc)**
   - UX phải tạo cảm giác tin tưởng, dễ chịu, tích cực khi sử dụng.
   - Tránh cảm giác căng thẳng, rối mắt, hoặc thiếu thân thiện.

**Checklist review nhanh trước khi chốt thiết kế:**
- Màn hình này có rõ người dùng cần làm gì không? (Clarity)
- Pattern UI có thống nhất với các màn hiện có không? (Consistency)
- Có thể giảm thêm bước/thao tác nào không? (Efficiency)
- Mọi hành động quan trọng đã có phản hồi trạng thái chưa? (Feedback)
- Người dùng yếu thị lực/lớn tuổi có dùng thuận lợi không? (Accessibility)
- Trải nghiệm tổng thể có tạo cảm giác tích cực không? (Emotion)

---

## 6. Không gọi subscribe trong vòng lặp / đệ quy

**Áp dụng cho:** Mọi service call (Observable) trong Angular.

**Nguyên tắc:**
- Không gọi `.subscribe()` bên trong `forEach`, `map`, `for`, `while`, hoặc bất kỳ vòng lặp nào.
- Không gọi API trong đệ quy.
- Gom dữ liệu cần thiết thành 1-2 API call, dùng `forkJoin` (parallel) hoặc `mergeMap`/`concatMap` (sequential) thay thế.
- Khi cần load child data theo parent list:
  1. Gọi 1 API lấy hết parent records.
  2. Gọi 1 API lấy hết child records.
  3. `filter()` child records vào parent bằng khóa ngoại.

**Ví dụ đã áp dụng (cauhoi-tuluan-15p):**
- Load lessons + forms bằng 1 `forkJoin` → map forms vào lessons theo `week`.
- Không gọi `loadFormForLesson()` riêng cho từng bài học.