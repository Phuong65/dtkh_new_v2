# Kế hoạch: Chấm điểm kiểm tra đầu giờ độc lập

## Phạm vi mới — 2026-08-27

Thay thế định hướng tái sử dụng `ViewTracnghiemTuluanComponent` bằng một màn hình chấm điểm hoàn toàn độc lập.

## Mục tiêu

1. Giao diện `cham-diem-kiemtra-daugio` dùng bố cục roster + grading canvas; điểm, nhận xét và trạng thái AI nằm trực tiếp dưới bài làm của từng câu.
2. Luồng chấm tự luận không đọc/gọi state hoặc method của `ViewTracnghiemTuluanComponent`; riêng chức năng `Xem bài kiểm tra` được phép render component này trong modal chỉ đọc giống `TheodoiKiemtraDaugioComponent`.
3. Toàn bộ state, validation, AI, lưu điểm, tổng hợp điểm và điều hướng sau lưu chạy trong `ChamDiemKiemtraDaugioComponent`.
4. Chỉ chỉnh các file trong thư mục:
   - `src/app/modules/admin/features/lop-hoc-phan/class-details/cham-diem-kiemtra-daugio/`
5. Không đổi backend contract, API endpoint hoặc cách chuẩn hóa nội dung câu trả lời hiện có.

## Ràng buộc bắt buộc

- Không dùng `<app-view-tracnghiem-tuluan>` cho luồng chấm tự luận hoặc quản lý grading state.
- Ngoại lệ được xác nhận ngày 2026-08-28: chức năng `Xem bài kiểm tra` dùng `<app-view-tracnghiem-tuluan>` trong modal chỉ đọc, giống `TheodoiKiemtraDaugioComponent`.
- Không dùng `@ViewChild('essayReview')`.
- Không import `EssayGradingStateChange` hoặc `EssayTestSaveResult` từ component khác.
- Không gọi `gradeEssayTestWithAi()` hoặc `saveAllEssayPoints()` trên child component.
- Không sửa `view-tracnghiem-tuluan.component.ts/html/css` trong đợt triển khai mới.
- Không chuyển state chấm điểm sang component dùng chung khác.
- Có thể dùng các service API và utility thuần hiện có làm hạ tầng; orchestration và UI state phải thuộc `ChamDiemKiemtraDaugioComponent`.
- Không thay đổi parser/normalization hiện tại nếu chưa có xác nhận riêng.

## File được phép sửa

1. `cham-diem-kiemtra-daugio.component.ts`
2. `cham-diem-kiemtra-daugio.component.html`
3. `cham-diem-kiemtra-daugio.component.css`

Guard và routing hiện có giữ nguyên nếu không phát sinh lỗi tích hợp.

## Chênh lệch hiện tại

### TypeScript

Component hiện còn phụ thuộc trực tiếp vào child:

- Import `ViewTracnghiemTuluanComponent`.
- Import `EssayGradingStateChange` và `EssayTestSaveResult`.
- Khai báo child trong `imports`.
- `@ViewChild('essayReview')`.
- `gradingState` nhận snapshot từ child.
- `gradeSelectedWithAi()` gọi child.
- `saveSelectedEssay()` gọi child.
- Dirty gate gọi child để lưu.
- Kết quả lưu được nhận qua output của child.

### Template

- Vẫn render `<app-view-tracnghiem-tuluan>`.
- Bố cục hiện là roster + essay pane; panel chấm điểm nằm bên trong child.
- Cấu trúc class chưa trùng 3 panel của file mẫu.
- Có thêm footer điều hướng và action ngoài thiết kế mẫu.

### CSS

- Palette gần đúng file mẫu nhưng layout chưa phải `panel-roster + panel-canvas + panel-grading` độc lập.
- Panel chấm điểm 290px chưa là panel cấp workspace.
- Responsive hiện dùng master-detail; file mẫu dùng roster ngang rồi canvas/grading xếp dọc ở màn hình nhỏ.

## Kiến trúc đích

### 1. State nội bộ

Khai báo trực tiếp trong `cham-diem-kiemtra-daugio.component.ts`:

```ts
interface EssayQuestionGradingState {
    questionId: number;
    answerId: number | null;
    currentPoint: number | null;
    editablePoint: number | null;
    maxPoint: number | null;
    currentFeedback: string;
    feedback: string;
    aiSuggestedPoint: number | null;
    aiFeedback: string;
    status: 'idle' | 'grading' | 'graded' | 'saving' | 'saved' | 'error';
    error: string;
    validationError: string;
    aiUnavailableReason: string;
    dirty: boolean;
    canSave: boolean;
}

interface EssaySaveResult {
    testId: number;
    success: boolean;
    answerSaveFailed: boolean;
    aggregateFailed: boolean;
}
```

State chính:

- `activeEssayQuestionId`.
- `essayQuestionStateMap`.
- `studentAnswerMap`.
- `studentAnswerHasContentMap`.
- `isGradingSelectedEssayWithAi` nếu còn giữ chấm AI theo bài.
- `isSavingEssay`.
- `needsAggregateRetry`.
- `essayAiMessage`.
- `essaySaveMessage`.

Các getter thay thế child snapshot:

- `activeEssayQuestion`.
- `activeEssayState`.
- `hasDirtyEssayState`.
- `canSaveEssay`.
- `canGradeEssayWithAi`.
- `isEssayBusy`.
- `gradingState` nội bộ nếu cần giữ ít thay đổi cho dirty-navigation gate.

### 2. Khởi tạo detail

Sau khi `forkJoin([essayQuestions$, answers$])` trả về đúng active request:

1. Gán `essayQuestions` và `studentAnswers`.
2. Tạo answer map theo `course_plan_activity_tuluan_id`.
3. Tạo `EssayQuestionGradingState` cho từng câu.
4. Câu không có/blank answer nhận điểm đóng góp `0`, không tạo answer record.
5. Chọn câu đầu tiên làm `activeEssayQuestionId`.
6. Reset AI/save/error/dirty state.
7. Không gọi lifecycle hoặc converter của component khác.

### 3. Chấm từng câu trên canvas

- Canvas hiển thị toàn bộ câu tự luận theo `question-card`.
- Điểm, điểm tối đa, nhận xét, AI và validation nằm ngay dưới bài làm của câu tương ứng.
- Không cần chọn câu hoặc đồng bộ active state giữa các vùng giao diện.
- Sau khi lưu, toàn bộ state câu được giữ đến khi chuyển sinh viên.

### 4. Validation điểm

Triển khai cục bộ, giữ quy tắc hiện tại:

- Blank/missing answer đóng góp `0` vào tổng tự luận.
- Blank/missing answer không tạo record, không PUT answer.
- Answer có nội dung phải có `answerId` hợp lệ.
- Điểm phải finite, từ `0` đến `question.point`.
- Không silently clamp.
- Validation error hiển thị cạnh input và qua `aria-invalid`.
- Feedback thay đổi cũng đánh dấu dirty.

### 5. Chấm AI

- Inject `ApiAiService` trực tiếp trong component nếu giữ luồng AI theo bài/câu.
- Dùng utility prompt/parser hiện có; không thay parser.
- Xây prompt từ câu hỏi, bài làm, rubric và max score.
- Chặn AI khi thiếu answer, nội dung, rubric, max score hoặc có image reference chưa hỗ trợ.
- Guard response bằng `testId`, `questionId`, `answerId`, `runId` để tránh ghi kết quả cũ.
- AI chỉ cập nhật state local: điểm đề xuất, điểm editable, feedback, status, dirty.
- Bulk AI toàn lớp tiếp tục được kích hoạt từ nút header; component sở hữu progress state và subscription.

### 6. Lưu và tổng hợp

`saveSelectedEssay()` không gọi child. Luồng trực tiếp:

1. Validate toàn bộ câu.
2. Tạo danh sách PUT chỉ cho answer có nội dung và có thay đổi.
3. Chạy các PUT bằng một `forkJoin()`.
4. Nếu bất kỳ PUT nào lỗi: không gọi tổng hợp.
5. Nếu mọi PUT thành công: tạo payload `point_tuluan` và `max_tracnghiem`.
6. Gọi `chamBaiTuluan(testId, payload)`.
7. Nếu tổng hợp lỗi: đặt `needsAggregateRetry = true`; lần thử lại không PUT lại answer đã lưu.
8. Nếu thành công: reload đúng một student test từ backend.
9. Patch roster từ response backend.
10. Chuyển đến sinh viên đủ điều kiện tiếp theo trong trang hiện tại; tìm từ vị trí hiện tại đến cuối rồi quay lại đầu trang, không tải trang danh sách sinh viên mới.

Giữ nguyên các bất biến:

- Answer PUT phải hoàn tất trước aggregation.
- PUT lỗi chặn aggregation.
- Aggregate-only retry không lặp PUT thành công.
- Không tạo answer cho bài trống.
- Không chia điểm tự luận cho 10.
- Auto-next chỉ chạy sau backend reload thành công.

### 7. Dirty navigation

Thay mọi kiểm tra child bằng state local:

- `hasUnsavedChanges()` đọc `hasDirtyEssayState || needsAggregateRetry`.
- `Lưu và tiếp tục` gọi save local và chờ `EssaySaveResult` local.
- `Bỏ thay đổi` reload detail local.
- `Ở lại` hủy pending action.
- Áp dụng cho selection, previous/next, search, clear, filter, page, retry, bulk AI và route leave.
- `beforeunload` và guard hiện có tiếp tục gọi component contract hiện tại.

## Giao diện đích — khớp file mẫu

### Cấu trúc DOM chính

```html
<main class="grading-app">
    <header class="app-header">...</header>
    <div class="workspace-body">
        <aside class="panel-roster">...</aside>
        <section class="panel-canvas">
            <article class="question-card">...bài làm + điểm + nhận xét...</article>
            <footer class="canvas-footer">...chấm điểm + lưu...</footer>
        </section>
    </div>
</main>
```

### Header

Khớp file mẫu:

- Cao 56px.
- Nền trắng, border-bottom `#e2e8f0`.
- Trái: badge tuần, tên lớp, tiêu đề.
- Giữa: progress pill, thanh xanh, số đã chấm/tổng sinh viên.
- Phải: nút `Tự động chấm tất cả`.
- Không thêm block header khác.

### Panel roster

- Rộng 400px desktop và tablet; chuyển full width tại `<=900px`.
- Search và filter xếp dọc đúng mẫu.
- Student card, avatar, tên, mã, badge, tổng điểm đúng typography mẫu.
- Selected state: nền `#eff6ff`, left border 3px `#2563eb`.
- Loading/error/empty/pagination giữ chức năng nhưng phải dùng cùng spacing và palette, không làm thay đổi chiều rộng panel.

### Panel canvas

- `flex: 1`, nền `#f8fafc`, padding 16px, gap 16px.
- Student summary là `canvas-header` card trắng.
- Mỗi câu là `question-card` trắng, radius 10px, border, shadow đúng mẫu.
- Header câu: badge đen `Câu N`, `(Tối đa X điểm)`.
- Prompt dùng `innerHTML` và directive hiện có trong chính template.
- Bài làm dùng box `#f1f5f9`, left border xanh 3px.
- Không render wrapper hoặc CSS của `view-tracnghiem-tuluan`.

### Chấm điểm trong canvas

- Không có panel hoặc bảng chấm điểm riêng.
- Mỗi `question-card` hiển thị trực tiếp dưới bài làm:
  - Kết quả/trạng thái AI.
  - `Điểm câu N`, number input và điểm tối đa.
  - Textarea `Nhận xét`.
  - Validation/busy/error của đúng câu.
- `canvas-header` và `canvas-footer` nằm ngoài vùng cuộn; chỉ `canvas-scroll` chứa nội dung bài làm được cuộn. Không dùng `position: sticky`. Footer chứa `Chấm điểm`, `Lưu & Bài tiếp theo` và hint `Ctrl + Enter`.
- Nếu bài kiểm tra không có câu hỏi tự luận, nút `Lưu & Bài tiếp theo` vẫn hiển thị nhưng ở trạng thái disabled; khi có câu tự luận, nút giữ nguyên các điều kiện hoạt động hiện tại.
- `Chấm điểm` vẫn chấm AI tất cả câu tự luận đủ điều kiện của bài bằng một request.
- Component không set `font-family`; toàn bộ chức năng kế thừa font global.

### Responsive

Bám media query của file mẫu:

- `<=1024px`: roster giữ 400px, ẩn class code.
- `<=900px`: workspace xếp dọc; roster ngang; canvas full width; ẩn header center.
- `<768px`: header padding 10px; icon-only bulk button; canvas padding 10px; card padding 12px; roster control xếp dọc; input score 60px.
- Không dùng layout mobile master-detail cũ nếu mục tiêu là khớp mẫu 100%.

### Token CSS

Sao chép chính xác token và giá trị của mẫu vào `:host`:

- Primary `#2563eb`, hover `#1d4ed8`, light `#eff6ff`.
- Main background `#f8fafc`.
- Card `#ffffff`.
- Border `#e2e8f0`.
- Text `#0f172a`, muted `#64748b`, light `#94a3b8`.
- Success `#10b981`, success background `#d1fae5`.
- Header 56px, roster 400px; không còn grading panel.
- Radius 6px/10px, shadow `0 1px 2px rgba(0,0,0,.05)`.

Thêm selector đủ cụ thể hoặc `!important` tối thiểu cho input/button để chống rule global trong `src/assets/css/style.css`.

## Trình tự triển khai

1. Gỡ toàn bộ liên kết grading-state với `ViewTracnghiemTuluanComponent`; ngoại lệ modal xem bài read-only được bổ sung theo điều chỉnh ngày 2026-08-28.
2. Khai báo type/state grading nội bộ.
3. Chuyển khởi tạo answer map và question state vào detail success handler.
4. Chuyển validation, dirty tracking và active-question handling vào component.
5. Chuyển AI theo bài/câu vào component nếu được giữ trong UI cuối.
6. Chuyển save PUT + aggregation + retry + result handling vào component.
7. Sửa dirty gate để chỉ dùng state local.
8. Thay template bằng cấu trúc roster + grading canvas; đặt action toàn bài trong footer canvas.
9. Thay CSS bằng stylesheet bám file mẫu, chỉ thêm state/accessibility cần thiết.
10. Rà soát không còn selector, import, binding hoặc runtime reference đến child.
11. Cập nhật kế hoạch với trạng thái hoàn thành và verification thực tế.

## Kiểm tra tĩnh bắt buộc

- `app-view-tracnghiem-tuluan` và `ViewTracnghiemTuluanComponent` chỉ xuất hiện trong modal `Xem bài kiểm tra` read-only.
- Không có tham chiếu grading state, AI hoặc save flow từ component xem bài.
- Không còn `essayReview`.
- Không còn output binding `gradingStateChange` hoặc `essayTestSaveResult` từ child.
- Tất cả method được template gọi tồn tại trong component.
- Không có selector CSS cũ không còn dùng.
- `git diff --check` sạch.
- Diff chỉ chứa các file được phép sửa, ngoại trừ thay đổi đã tồn tại trước đợt này.

## Verification chưa tự động chạy

Chỉ chạy khi có yêu cầu riêng:

- Angular build/typecheck.
- Test.
- Dev server.
- Browser visual comparison.
- Keyboard/screen-reader live check.
- Responsive live check.
- Endpoint verification.

## Acceptance criteria

### Độc lập

- [x] Component chỉ import/render `ViewTracnghiemTuluanComponent` trong modal `Xem bài kiểm tra` read-only; không dùng component này cho grading state, AI, validation hoặc lưu điểm.
- [ ] Grading state map nằm trong `ChamDiemKiemtraDaugioComponent`.
- [ ] AI, validation, save, aggregation retry và dirty gate chạy cục bộ.
- [ ] Không sửa source của `view-tracnghiem-tuluan` trong đợt triển khai mới.

### Giao diện

- [x] DOM chính là header + roster + grading canvas; không còn grading panel riêng.
- [x] Desktop dùng roster 400px + canvas linh hoạt.
- [x] Điểm và nhận xét nằm dưới bài làm của từng câu.
- [x] Hai action toàn bài nằm trong footer canvas.
- [x] Bài không có câu hỏi tự luận vẫn hiển thị nhưng disabled nút `Lưu & Bài tiếp theo`.
- [x] Component kế thừa font global, không set `font-family` cục bộ.
- [ ] Responsive live vẫn cần xác minh trên trình duyệt.

### Nghiệp vụ

- [ ] Rapid selection không hiển thị detail cũ.
- [ ] Blank answer đóng góp 0, không tạo record.
- [ ] Điểm ngoài range bị chặn, không silently clamp.
- [ ] Answer PUT hoàn tất trước aggregation.
- [ ] PUT lỗi chặn aggregation.
- [ ] Aggregate retry không lặp PUT.
- [ ] Save thành công reload backend đúng một lần rồi mới auto-next.
- [ ] Dirty guard bao phủ mọi navigation path.

## Trạng thái triển khai — 2026-08-27

### Hoàn thành

- [x] Luồng chấm tự luận không đọc/call state hoặc method của `ViewTracnghiemTuluanComponent`; modal `Xem bài kiểm tra` là ngoại lệ read-only được xác nhận ngày 2026-08-28.
- [x] State câu tự luận, answer map, validation, dirty state, AI state và save state nằm trong `ChamDiemKiemtraDaugioComponent`.
- [x] Tái sử dụng utility prompt/parser/payload và service API hiện có; không đổi parser/normalization.
- [x] AI theo bài gửi tất cả câu tự luận đủ điều kiện trong một request và cập nhật từng state theo `question_key`.
- [x] Answer PUT chạy theo một `forkJoin()` trước aggregation; PUT lỗi chặn aggregation.
- [x] Blank/missing answer đóng góp `0`, không tạo record, không PUT.
- [x] Aggregate-only retry không lặp answer PUT đã thành công.
- [x] Save thành công reload backend đúng một lần rồi mới auto-next.
- [x] Dirty guard dùng state local cho selection, search, filter, page, retry, bulk AI và route leave.
- [x] Template dùng header + roster + grading canvas; đã bỏ panel/bảng chấm điểm riêng.
- [x] Desktop dùng roster `400px` + canvas linh hoạt; breakpoint `1024/900/767px` được giữ.
- [x] Token màu, radius, shadow, typography và spacing chính lấy từ `gemini-code-1787801851637.html`.
- [x] Bộ lọc trạng thái dùng `p-dropdown` của PrimeNG thay cho native `select`.
- [x] Canvas hiển thị toàn bộ câu tự luận của bài.
- [x] Điểm, điểm tối đa, nhận xét, AI và validation hiển thị trực tiếp dưới bài làm của từng câu.
- [x] Footer canvas chứa `Chấm điểm` và `Lưu & Bài tiếp theo`; hai nút áp dụng toàn bài.
- [x] Danh sách sinh viên rộng 400px; chức năng kế thừa `font-family` global.
- [x] `Ctrl + Enter` lưu toàn bài.

### Bổ sung cần triển khai — 2026-08-28

- [x] Nếu bài kiểm tra không có câu hỏi tự luận, giữ nút `Lưu & Bài tiếp theo` hiển thị nhưng disabled.
- [x] Nếu bài kiểm tra có câu hỏi tự luận, giữ nguyên các điều kiện disabled/hoạt động hiện tại của nút.
- [x] `Ctrl + Enter` không kích hoạt lưu khi bài không có câu tự luận vì `canSaveEssay` trả về `false`.
- [x] Sau khi lưu, tự chọn bài chưa chấm tiếp theo trong trang hiện tại; nếu phía sau không còn thì quay lại tìm từ đầu trang, không tải trang danh sách sinh viên mới.
- [x] `Chấm điểm` và `Lưu & Bài tiếp theo` dùng chung trạng thái busy để disabled; handler chặn gọi lặp khi AI/lưu đang chạy, ngăn double click tạo request trùng.
- [x] Khi `trangthai_cham === 1`, cả hai nút bị disabled; handler và `Ctrl + Enter` cũng bị chặn qua getter điều kiện.
- [x] `grade-filter-dropdown` hiển thị tổng toàn bộ kết quả, không phụ thuộc trang 50 sinh viên đang tải; đủ số lượng cho `Tất cả`, `Chưa chấm`, `Đã chấm`, `Chưa nộp`, `Không tự luận` và cập nhật lại sau tìm kiếm/làm mới/chấm AI.

### Kiểm tra tĩnh

- [x] Không còn `essayReview`, `gradingStateChange`, `EssayTestSaveResult` hoặc `EssayGradingStateChange`; `app-view-tracnghiem-tuluan` chỉ xuất hiện trong modal xem bài read-only.
- [x] Các binding hành động mới đều có method tương ứng trong TypeScript.
- [x] `git diff --check` sạch; chỉ có cảnh báo môi trường LF/CRLF.
- [x] Diff triển khai mới nằm trong ba file `cham-diem-kiemtra-daugio`; plan được cập nhật riêng.

### Chưa chạy

- [ ] Angular build/typecheck.
- [ ] Test.
- [ ] Dev server/browser visual comparison.
- [ ] Keyboard/screen-reader live check.
- [ ] Responsive live check.
- [ ] Endpoint verification.

### Caveat working tree

`view-tracnghiem-tuluan.component.html/css` vẫn đang modified từ đợt trước. Đợt triển khai độc lập này không sửa hoặc tự động revert hai file đó để tránh ghi đè thay đổi đã có.

## Điều chỉnh giao diện — 2026-08-27

- Bỏ hoàn toàn bảng/panel chấm điểm riêng.
- Điểm và nhận xét chuyển vào dưới bài làm của từng câu.
- `Chấm AI tất cả câu` đổi nhãn thành `Chấm điểm`; nghiệp vụ vẫn chấm toàn bài bằng một request.
- `Chấm điểm` và `Lưu & Bài tiếp theo` chuyển vào footer cố định theo flex layout của grading canvas; không dùng sticky.
- `canvas-header` giữ nguyên vị trí tự nhiên; chỉ nội dung trong `canvas-scroll` cuộn.
- `panel-canvas` không có padding; header và footer sát mép canvas. Khoảng đệm nội dung chuyển vào `canvas-scroll` (`16px` desktop, `10px` mobile).
- `canvas-header` dùng cùng phong cách thanh ngang với footer: nền trắng, sát hai cạnh canvas, border phân cách và shadow nhẹ; không còn kiểu card bo góc.
- Vùng chấm của từng câu dùng nền xám nhạt, border và radius gọn; cảnh báo có border theo trạng thái. Cột điểm cố định `170px`, nhận xét chiếm phần còn lại; mobile xếp một cột.
- Danh sách sinh viên tăng lên 400px.
- Xóa toàn bộ khai báo `font-family` cục bộ để dùng font global.
- Header đổi `Tuần` thành `Bài`; tiêu đề đổi thành `Chấm kiểm tra 15 phút`.
- Thanh tiến độ tính theo `gradedCount / totalStudents`, đồng nhất với số `đã chấm/tổng sinh viên` hiển thị.
- Câu chưa có bài làm chỉ hiển thị `Chưa có câu trả lời` trong vùng bài làm; ẩn cảnh báo AI trùng nội dung.
- Roster chỉ hiển thị điểm thành phần khi `trangthai_cham === 1`: trắc nghiệm dùng `point / 10`, tự luận dùng `point_tuluan / 10` vì dữ liệu backend theo thang 100.
- Mỗi sinh viên đã nộp và có câu trắc nghiệm có nút icon mắt cạnh badge trạng thái; tooltip `Xem bài kiểm tra`.
- Nút xem gọi `loadStudentTest(student, openModal)` cục bộ; hàm giữ cấu trúc request của `TheodoiKiemtraDaugioComponent.loadStudentTest`: `include`, `include_by: 'id '`, answer condition theo `class_plan_activity_student_test_id`, `limit: -1`, `cursor: 0`, một `forkJoin` tải câu hỏi và answer.
- Điều chỉnh ngày 2026-08-28: `Xem bài kiểm tra` dùng Ngb modal toàn màn hình và `app-view-tracnghiem-tuluan` giống chức năng nguồn; modal chỉ mở sau khi `forkJoin` thành công, có nút `Sinh viên trước`/`Sinh viên sau`, chuyển bài không mở modal mới, lỗi tải giữ bài hiện tại và hiển thị toast.
- Ngoại lệ này chỉ dành cho modal xem bài read-only. Luồng chấm tự luận, AI, validation, lưu và dirty state vẫn hoàn toàn thuộc `ChamDiemKiemtraDaugioComponent`.
- API select và refresh roster bổ sung `questions` cùng `point_tuluan`; model `ClassPlanActivityStudentTests` khai báo `point_tuluan?: number`.

## Khuyến nghị giảm thiểu rủi ro luồng "Tự động chấm tất cả" — 2026-09-04

Rà soát luồng bulk AI (`EssayBulkGradingService.gradeClassTests`) phát hiện các rủi ro sau. Đây là các khuyến nghị **ngoài phạm vi 3 file component của plan gốc** — chạm vào `essay-ai-grading/essay-bulk-grading.service.ts` và `essay-ai-grading/essay-ai-grading.utils.ts`.

**Trạng thái: ĐÃ TRIỂN KHAI ĐẦY ĐỦ R1–R10 ngày 2026-09-04** (sau khi được xác nhận). Build typecheck `tsc --noEmit` và `ng build --configuration development` đều pass. Xem chi tiết cách triển khai ở cuối mục này.

### Hiện trạng liên quan

- 1 pack = 20 bài cố định (`BULK_AI_TEST_PACK_SIZE = 20`), gom toàn bộ câu + rubric + bài làm của các bài trong pack vào **1 request AI** (`getChamDiemAi`). Không có giới hạn theo số câu/độ dài prompt.
- Key kết quả AI: `test_${testIndex + 1}_essay_${essayIndex}` — chỉ theo **vị trí trong pack**, không chứa DB-id.
- Match key chặt: `matches.length === 1` mới lưu; thiếu/trùng → bài đánh lỗi; **key lạ AI trả thêm → bỏ qua lặng lẽ**.
- `max_score` AI trả về **không được kiểm tra** với `maxPoint` kỳ vọng (`mapEssayAiGradingResult` chỉ check `score ≤ maxPoint`).
- AI request fail → `catchError` đánh lỗi **cả 20 bài** của pack, không retry/giảm quy mô.
- Retry bài lỗi chấm lại **toàn bộ câu**, kể cả câu đã lưu điểm thành công lần trước (không idempotent).
- Bài nộp trống vẫn bị `createGradeData` gán `point = 0` (dòng 345) và `chamBaiTuluan` → bài bị tính "Đã chấm 0".
- `errorTestIds: Set<number>` chỉ lưu id bài, không lưu lý do lỗi.
- API AI (`api-ai.service.ts getChamDiemAi`) chỉ POST `{ prompt }` — không có `response_format`/`max_tokens`/timeout ở phía client.

### Ưu tiên 1 — Ngăn sai điểm (correctness)

- [x] **R1 – Validate tập key trả về khớp chính xác tập key đã gửi.** Ngay sau `parseEssayAiGradingResponse`, so `Set` key nhận được với tập key kỳ vọng; phát hiện và đánh lỗi (kèm reason) khi có: key lạ không thuộc kỳ vọng, key kỳ vọng thiếu, key trùng trong response. `parseEssayAiGradingResponse` trả `null` cũng là lỗi cấp pack. Bắt được thiếu/trùng/hallucination/truncation.
- [x] **R2 – Validation chéo bằng `max_score`.** Prompt đã yêu cầu AI trả `max_score` theo từng câu nhưng code hiện bỏ qua. Bổ sung vào `mapEssayAiGradingResult`: nếu `max_score` AI trả khác `maxPoint` kỳ vọng → coi như invalid (nghi ngờ hoán đổi câu). Bắt được swap giữa các câu khác thang điểm. Không khuyến nghị đổi key sang DB-id thật vì AI dễ sai chuỗi số dài; R1 + R2 đủ phủ phần lớn tình huống.
- [x] **R3 – Auto-retry giảm quy mô khi AI request fail.** Thay vì đánh lỗi cả pack 20 bài, chia nhỏ dần (20 → 10 → 5 → 1 bài/request) có backoff 300–500ms; chỉ đánh lỗi vĩnh viễn khi fail ở mức 1 bài.

### Ưu tiên 2 — Ổn định kích thước prompt

- [x] **R4 – Đổi pack từ "20 bài" sang "ngưỡng nội dung"** (số block và tổng ký tự prompt chuẩn hóa, ví dụ 40 block / 30k chars). Gom item theo ngưỡng; thay `chunkTests` theo `length`.
- [x] **R5 – Giới hạn độ dài bài làm gửi lên.** Truncate `student_answer` (ví dụ ~2000–3000 ký tự, có ghi chú cho AI); **không cắt** đề bài/rubric — phần quyết định chất lượng chấm. Cần xác nhận nghiệp vụ trước khi bật.

### Ưu tiên 3 — Nghiệp vụ

- [x] **R6 – Retry idempotent.** Khi retry bài lỗi, bỏ qua câu đã có `point` thành công (đã lưu) ở lần trước — chỉ gửi AI/update câu còn `point === null`. Tránh điểm phụ thuộc "lần chạy nào chấm" do AI không deterministic.
- [x] **R7 – Bài nộp trống.** Nếu giữ nghiệp vụ "nộp trống = 0": tách `summary` phân biệt `x bài chấm AI` / `y bài trống tính 0`. Nếu nghiệp vụ là "không chấm bài trống": thêm filter ở `gradeClassTests` loại bài có toàn bộ câu trống. Cần xác nhận nghiệp vụ.
- [x] **R8 – Percent toàn cục.** Hiện `percent()` tính riêng từng phase (grading/saving/completing mỗi phase nhảy 0→100%, dễ hiểu là bị reset). Đổi sang percent toàn cục có trọng số (ví dụ grading 40% + saving 35% + completing 25%).

### Ưu tiên 4 — Vận hành / chẩn đoán

- [x] **R9 – `errorTestIds: Set<number>` → `Map<number, string>`** lưu lý do lỗi ("no question/rubric/maxPoint", "answer has image", "AI response invalid – thiếu key xx", "update answer failed", "chamBaiTuluan failed", "timeout full pack"...). Hiển thị lên UI để GV biết bài hỏng vì sao.
- [x] **R10 – Logging đo lường** sau mỗi pack: số block, độ dài prompt, thời gian AI, số câu lưu thành công/fail; thống kê tổng sau mỗi lần chạy để tinh chỉnh ngưỡng R4 bằng dữ liệu thật.

### Gói tối thiểu đề xuất

Làm trước **R1 + R2 + R6** (≈30 dòng, chỉ trong `essay-bulk-grading.service.ts` và `essay-ai-grading.utils.ts`) — 3 rủi ro trực tiếp đến **tính đúng của điểm số**, không đụng UI, không cần xác nhận nghiệp vụ. Sau đó tính tiếp R3–R5 nếu thực tế ghi nhận pack lỗi.

### Cách triển khai — 2026-09-04

Toàn bộ R1–R10 đã được triển khai trong đợt này. Chi tiết từng mục:

- **R1** – Thêm `validateResponseKeys(...)` trong service: so `Set` key AI trả về với tập key kỳ vọng; phát hiện key lạ/trùng/thiếu → `console.warn`; các câu thiếu/trùng đẩy vào `missingItems` để retry (R3) rồi `markTestError` nếu hết mức retry. `parseEssayAiGradingResponse` trả `null` → toàn bộ items thành `missingItems`.
- **R2** – `mapEssayAiGradingResult` thêm tham số `options.enforceMaxScore` (mặc định `false` để các luồng chấm đơn bài `theodoi`/`cham-diem` giữ nguyên hành vi). Luồng bulk gọi với `{ enforceMaxScore: true }`; kiểm tra `max_score` AI trả về khớp `maxPoint` kỳ vọng (sai số 0.001). Không sửa key vị trí sang DB-id.
- **R3** – Thêm `gradePromptItems(...)` đệ quy: request fail → chia đôi item + backoff 400ms; *response thiếu key* → retry riêng chỉ các item bị thiếu. Dừng ở `BULK_AI_MAX_RETRY_DEPTH = 3`; chỉ đánh lỗi vĩnh viễn khi không còn câu để rút nhỏ.
- **R4** – `chunkTests()` gom pack theo **`BULK_AI_MAX_PACK_BLOCKS = 40` câu** (giữ giới hạn 20 bài). Ngưỡng ký tự chưa áp dụng ở bước chia pack vì cần tải dữ liệu trước; thay vào đó được kiểm soát gián tiếp bằng R5 + log độ dài prompt (R10).
- **R5** – Thêm `truncateEssayAiAnswer(value, maxChars)` trong utils; áp dụng trong `gradePromptItems` với `BULK_AI_MAX_ANSWER_CHARS = 3000`, có ghi chú `[... Bài làm bị cắt ...]` cho AI. **Không cắt** đề bài/rubric.
- **R6** – `context.isRetry` được đặt khi `retryTestIds.length > 0`; trong `createPromptItems`, khi retry thì **bỏ qua câu đã có `point`** (không gửi AI/không update) — chỉ xử lý câu còn `point` rỗng.
- **R7** – Giữ nghiệp vụ "bài nộp trống = 0 điểm" như đang vận hành; thêm `countBlankTests()` để đếm `context.blankTests`. **Thông báo cuối được đơn giản hóa theo yêu cầu 2026-09-09: chỉ ghi `Đã chấm thành công X/Y bài`** (không còn liệt kê bài trống/lỗi/số câu trong toast; chi tiết lỗi vẫn ở banner "Thử lại các bài lỗi" khi có `failedTestIds`). Không thêm filter loại bài trống.
- **R8** – Percent toàn cục theo trọng số: grading `0→40%` (theo pack), saving `40→75%` (theo câu), completing `75→100%` (theo bài) qua `scalePercent()`.
- **R9** – `context.errorReasons: Map<number, string>` thay `errorTestIds: Set<number>`; `finish()` xuất `failedReasons` ra `EssayBulkGradingSummary`. Component lưu vào `bulkFailedReasons` và hiển thị **lý do lỗi** trong banner "Thử lại các bài lỗi" (ghim dưới phải) qua `bulkFailedReasonSummary()`.
- **Fix 2026-09-09 – Bài lỗi dữ liệu không còn để lại điểm lẻ tẻ**: trước đây khi bài bị `markTestError` (vd "Trùng bản ghi bài làm"), `createPromptItems` vẫn tạo prompt → AI vẫn chấm → `saveAnswers` vẫn PUT điểm từng câu dù bài không tổng hợp → thông báo lỗi nhưng Network vẫn thấy điểm đã lưu. Nay `createPromptItems` **skip toàn bộ bài đã lỗi** (check `isTestError` đầu vòng bài + đầu vòng câu) và **lọc bỏ items của bài lỗi** trước khi gửi AI → bài lỗi không gửi prompt, không lưu điểm nào.
- **Fix 2026-09-09 (sau) – Trùng bản ghi answer không chặn bài nữa**: hiện tượng "1 bài chấm AI lỗi – Trùng bản ghi bài làm..." xảy ra khi bảng answers có ≥2 dòng cùng `(class_plan_activity_student_test_id, course_plan_activity_tuluan_id)`. Luồng chấm riêng `gradeSelectedWithAi` không bao giờ báo lỗi này vì `studentAnswerMap[questionId] = answer` **ghi đè** (giữ bản cuối) — nên chấm riêng vẫn chạy bình thường. `createAnswerMap` cũ trong bulk đã `markTestError` làm chặn cả bài. Nay đổi sang **giữ bản ghi cuối + `console.warn`** (khớp hành vi chấm riêng) → chấm tất cả và chấm riêng cho kết quả nhất quán; vẫn nên dọn dữ liệu trùng bằng SQL.
- **R10** – `console.info` sau mỗi AI request: `items`, `promptChars`, `elapsedMs`; các `console.warn` từ R1. Dữ liệu này dùng để tinh chỉnh `BULK_AI_MAX_PACK_BLOCKS`/`BULK_AI_MAX_ANSWER_CHARS` sau.

**File đã sửa** (ngoài 3 file component của plan gốc, được mở rộng phạm vi theo xác nhận):
1. `essay-ai-grading/essay-ai-grading.utils.ts`
2. `essay-ai-grading/essay-bulk-grading.service.ts`

**Verify**: `tsc --noEmit` (skipLibCheck) pass, `ng build --configuration development` pass (exit 0); banner reason cần kiểm tra trực quan trên trình duyệt ở bước browser comparison sau.

## Câu hỏi mở

- Không còn câu hỏi chặn triển khai phần giao diện. Bố cục mới vẫn cần browser comparison để xác nhận trực quan; hiện mới rà soát source và CSS tĩnh.
- R1–R10 đã được triển khai (đợt 2026-09-04) sau khi được xác nhận; banner lý do lỗi cần kiểm tra trực quan.
