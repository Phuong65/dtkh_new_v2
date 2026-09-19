# Kế hoạch chức năng - Form thêm/sửa câu hỏi trắc nghiệm

## Phạm vi

Chức năng: [cauhoi-tracnghiem-create-form](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/cauhoi-tracnghiem-create-form/)

File chính:

- [cauhoi-tracnghiem-create-form.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/cauhoi-tracnghiem-create-form/cauhoi-tracnghiem-create-form.component.ts)
- [cauhoi-tracnghiem-create-form.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/cauhoi-tracnghiem-create-form/cauhoi-tracnghiem-create-form.component.html)
- [cauhoi-tracnghiem-create-form.component.css](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-create/cauhoi-tracnghiem-create-form/cauhoi-tracnghiem-create-form.component.css)

Component được mở từ [cauhoi-tracnghiem-chitiet.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/cauhoi-tracnghiem-chitiet/cauhoi-tracnghiem-chitiet.component.html#L302-L307) trong drawer thêm/sửa câu hỏi.

## Mục tiêu chức năng

1. Tạo mới hoặc cập nhật câu hỏi theo CDR/level đang chọn từ màn hình chi tiết.
2. Hỗ trợ 2 format học phần:
   - `monkhac`: câu hỏi thường, một số loại có children.
   - `tienganh`: câu hỏi theo part/nhóm, thường lưu nhiều câu hỏi con.
3. Hỗ trợ các loại câu hỏi hiện có: `radio`, `checkbox`, `inputbox`, `group-input`, `group-radio`, `drag_drop`, `grouping`, `reorder_words`, `arrange_paragraphs`.
4. Giữ contract dữ liệu/API `CourseQuestions`: parent có thể có `children`, child dùng `group_id`, `cdr_id`, `code`, `private`, `week` kế thừa từ parent.
5. Kiểm soát validate trước khi lưu: nội dung câu hỏi, đáp án, câu hỏi con, CDR bắt buộc ở tuần 100, Part bắt buộc với tiếng Anh.
6. Upload media audio cho phần direction, giới hạn số lượt nghe từ 1 đến 10; media đã chọn có thể chọn lại/thay thế hoặc xóa khỏi form ở cả mode create/update. Xóa khỏi form không xóa file nguồn.
7. Khi cập nhật câu hỏi đã/đang duyệt, tạo bản ghi mới và đánh dấu bản cũ `status = -3`.
8. Cập nhật counter local sau khi lưu để drawer/parent phản hồi nhanh.
9. Giữ UI editor cùng hệ question-type editor/view hiện tại, không đổi parser đáp án khi chưa hỏi lại.

## Hiện trạng chức năng theo code

### Input/output và mode

- `unLimitQuestion` quyết định có đóng form khi đủ quota sau khi lưu hay không.
- `dataCdr` flatten cây CDR, bỏ `week === 100`, dùng cho dropdown chọn CDR khi đang thêm câu hỏi thuộc tuần 100.
- `CdrSelected` mở mode create, gọi `fillForm()`, set `level`, reset loại câu hỏi theo `testFormat`.
- `update` mở mode update, gán `question`, set `questionTypeSection.active`, reset form bằng dữ liệu câu hỏi đang sửa.
- `testFormat` đổi giữa `monkhac` và `tienganh`, gọi `changesTestType()` để lọc loại câu hỏi được phép.
- `close` emit về parent để đóng drawer và reload danh sách.

### Loại câu hỏi và dữ liệu mặc định

- `resetQuestion` tạo object `Question` mặc định theo từng `IctuQuestionType`.
- `radio`, `checkbox`, `group-radio` mặc định có 4 `answer_option`.
- `group-input` mặc định có 4 children dạng input.
- `arrange_paragraphs` khi thêm child sẽ tạo 4 option, shuffle, và set `answer_correct` theo thứ tự id.
- `matching` đang trả `null` nhưng vẫn có trong filter `tienganh`; nếu chọn được sẽ có rủi ro null question.

### Lọc loại câu hỏi

- `monkhac`: `inputbox`, `grouping`, `drag_drop`, `radio`, `checkbox`, `group-radio`, `group-input`.
- `tienganh`: `inputbox`, `drag_drop`, `reorder_words`, `radio`, `matching`, `arrange_paragraphs`.
- Dropdown loại câu hỏi ẩn khi update, không cho đổi type trong mode sửa.

### Validate trước khi lưu

- Validate tách theo `testFormat` và `question_type`.
- Hầu hết type yêu cầu `question_direction` parent không rỗng.
- `monkhac`:
  - `radio`/`checkbox`: cần answer option, chọn đáp án đúng, option có value.
  - `inputbox`: cần đáp án đúng ở children.
  - `grouping`/`drag_drop`/`group-radio`/`group-input`: cần children, child có nội dung và đáp án đúng.
- `tienganh`:
  - nhiều type yêu cầu children và đáp án đúng ở child.
  - `arrange_paragraphs` yêu cầu children, nội dung child, answer option, đáp án đúng.
  - `checkbox`, `group-radio`, `group-input`, `grouping` hiện validate tối thiểu direction.

### Lưu dữ liệu

- `saveQuestion(send = false)` chạy validate, bật loading, set `old_status/status` từ form.
- Nếu update và đổi `private`, ghi nhận `changePrivate` để cập nhật counter.
- Nếu câu hỏi có `id` và `status` hoặc `old_status` khác 0, gọi `updateStatusQuestion()` rồi xóa `id` để tạo bản ghi mới, giữ `question_root_id`.
- Parent nhận `question_direction`, `cdr_id`, `week`, `private`, `code`.
- Tuần 100 bắt buộc chọn `cdr_id`, tự ép `private = 1`.
- Tiếng Anh bắt buộc chọn `code`/Part.
- Upload parent trước, sau đó set metadata cho children và upload children bằng nhiều lớp `mergeMap/forkJoin` chia batch.
- `filterNecessaryFieldsForUpdate()` chỉ gửi các field cần thiết lên API, reference luôn là `course_plan_activities`.
- Sau lưu create, counter `pending/private/public` tăng theo `testFormat`; tiếng Anh tăng theo `children.length`.
- Sau lưu update, nếu đổi private thì điều chỉnh public/private theo hướng mới.

### Xóa câu hỏi con

- Nếu child đã có `id`, hỏi confirm rồi gọi `deleteCourseQuestions([id])`.
- Nếu child chưa lưu, chỉ remove khỏi mảng local.

### Media và kiểm thử

- `btnImportQuestionMedia()` mở file manager, chỉ chọn `mp3`, gắn media audio vào `question.media`.
- Đã bổ sung thao tác chọn lại/thay thế media và xóa media khỏi form ở cả mode create/update; hủy chọn giữ media cũ, xóa chỉ bỏ liên kết trên form và không xóa file nguồn.
- Khi chọn lại, form chỉ nhận một file MP3 hợp lệ và giữ số lượt nghe hiện tại; khi xóa, `question.media` cùng form control `media` được reset về `null` để payload cập nhật loại media cũ.
- `validateInputMediaReplay()` ép replay về số trong khoảng 1-10.
- `openKiemThu()` bật dialog preview, nhưng nút mở hiện đang comment trong template.
- Dialog kiểm thử vẫn còn template render các question-types-view với `isReadOnly=false`.

## Rủi ro/điểm cần xử lý

### P1 - Correctness

1. `filterQuestionType.tienganh` chứa `matching`, nhưng `resetQuestion.matching()` trả `null`; nếu dropdown cho chọn matching thì `question.children`, `question.question_type` có thể crash.
2. Template kiểm tra media dùng `f['question_type'].value === 'drag-drop'` trong khi type thực tế là `drag_drop`; nhánh media cho `drag_drop` format `monkhac` có thể không hiện như kỳ vọng.
3. `availableToSave` chỉ dựa vào `question_direction.valueChanges`; khi mở update có sẵn nội dung, nút lưu có thể vẫn disabled cho tới khi người dùng sửa direction.
4. `btnImportQuestionMedia()` đọc `file[0]` không guard mảng rỗng; hủy chọn file có thể throw rồi bị catch rỗng, không báo gì.
5. `saveQuestion()` chia upload children bằng 4 block `mergeMap` gần giống nhau; với số children thay đổi, cần xác nhận không bỏ sót hoặc upload trùng trong edge case retry/state `__uploaded`.
6. Counter sau create tiếng Anh tăng `pending` chỉ `++` nhưng private/public tăng theo `children.length`; cần xác nhận `pending` nghiệp vụ tính parent hay child.
7. Khi update câu hỏi có status duyệt và tạo bản ghi mới, child cũ được xử lý theo `question.status/old_status` của parent; cần kiểm tra dữ liệu child có status riêng không.

### P2 - Maintainability

1. Component đang gom nhiều trách nhiệm: reset model, validate, media, upload, counter, UI mode.
2. Validate lặp nhiều logic reduce children giữa các type và format.
3. CSS có block comment lớn, comment tiếng Việt dày, duplicate `width/margin` trong `.question-content`, nhiều style có thể rút gọn.
4. Import cũ/không dùng cần rà lại khi được phép chạy static lint/build; không tự xóa nếu chưa xác minh.
5. Có các method upload cũ `_startSaveQuestion()` và `questionUploader()` không thấy được gọi từ template/code chính; cần xác nhận trước khi xóa.

### P3 - UX/UI

1. Form cố định `.question-content { width: 1024px; }`, có rủi ro tràn ở màn nhỏ/drawer hẹp.
2. Empty state chỉ là text “Chọn loại câu hỏi”, chưa phân biệt chưa có CDR/level/format hay chưa chọn type.
3. Nút kiểm thử bị comment, nhưng dialog vẫn tồn tại; cần quyết định giữ, bật lại, hoặc bỏ khỏi scope.
4. Xóa child trong update gọi API ngay; nếu lỗi mạng thì UI giữ lại, nhưng không có disable loading riêng cho từng child.
5. Các thông báo validate còn vài lỗi chính tả/diễn đạt, ví dụ “Vui nhập”.

## Kế hoạch triển khai đề xuất

### Giai đoạn 1 - Chốt tính đúng và tránh crash

- Loại `matching` khỏi `filterQuestionType.tienganh` nếu chưa có editor/model reset tương ứng, hoặc implement `resetQuestion.matching()` đầy đủ trước khi cho chọn.
- Sửa điều kiện template `drag-drop` thành `drag_drop` để khớp enum hiện có.
- Khi vào update mode, set `availableToSave = !!question_direction` sau khi reset form.
- Guard `btnImportQuestionMedia()` khi file manager trả rỗng hoặc file không hợp lệ; catch không nên im lặng nếu là lỗi người dùng cần biết.
- Cho phép mở lại file manager để thay thế media hiện tại; chỉ cập nhật media khi người dùng chọn file hợp lệ, giữ media cũ nếu hủy chọn.
- Bổ sung thao tác xóa media khỏi form bằng cách reset dữ liệu media liên quan; áp dụng create/update, không gọi API xóa file nguồn.
- Trước khi lưu, guard `this.question` tồn tại để tránh click lưu khi state chưa sẵn sàng.

### Giai đoạn 2 - Làm rõ validate theo từng format

- Chuẩn hóa helper private cho validate children:
  - có children hay không;
  - child có `question_direction`;
  - child có `answer_correct`;
  - child có `answer_option` và option có `value`.
- Giữ nguyên cách parse/ghi `answer_correct`; không đổi normalization/parser nếu chưa hỏi lại.
- Rà các type tiếng Anh đang validate tối thiểu (`checkbox`, `group-radio`, `group-input`, `grouping`) và xác nhận nghiệp vụ trước khi siết validate.
- Sửa text toast sai chính tả trong phạm vi an toàn.

### Giai đoạn 3 - Đơn giản hóa upload children

- Thay 4 block upload children lặp bằng một helper upload theo batch hoặc upload toàn bộ `children.filter(!__uploaded)` bằng `forkJoin` có kiểm soát.
- Giữ thứ tự: upload parent trước, set `group_id` cho child, upload child sau.
- Không đổi API payload trong `filterNecessaryFieldsForUpdate()` nếu chưa có yêu cầu nghiệp vụ.
- Đảm bảo error trong bất kỳ child upload nào dừng loading và báo lỗi rõ, không báo thành công khi còn child chưa upload.

### Giai đoạn 4 - Counter và refresh parent

- Xác nhận `pending` với tiếng Anh tính theo parent hay child.
- Nếu parent đã reload danh sách sau close, ưu tiên giảm cập nhật local phức tạp hoặc chỉ giữ local counter phục vụ quota tức thời.
- Với update đổi private, bảo vệ phép cộng/trừ không xuống âm khi `children.length` khác số câu đã tính trước đó.
- Giữ rule tuần 100: câu hỏi private, bắt buộc chọn CDR.

### Giai đoạn 5 - UI/UX form

- Đổi `.question-content` sang `width: min(100%, 1024px)` và giữ margin/padding hợp lý để tránh tràn drawer.
- Dọn CSS comment chết/duplicate, nhưng không refactor toàn bộ style nếu chỉ sửa bug.
- Làm rõ empty state:
  - chưa chọn loại câu hỏi;
  - chưa có selected CDR/level;
  - format chưa hợp lệ.
- Quyết định số phận dialog kiểm thử: bật lại nút, giữ ẩn, hoặc xóa cả dialog nếu không dùng.
- Giữ visual language hiện tại: PrimeNG, Bootstrap utility, card nền trắng/xám nhẹ.

### Giai đoạn 6 - Kiểm thử thủ công khi được phép chạy app

- Create/update từng type trong `monkhac`: radio, checkbox, inputbox, group-input, group-radio, drag_drop, grouping.
- Create/update từng type trong `tienganh`: radio, inputbox, drag_drop, reorder_words, arrange_paragraphs.
- Kiểm tra case tuần 100 bắt buộc chọn CDR và private tự bằng 1.
- Kiểm tra case tiếng Anh không chọn Part thì không lưu.
- Kiểm tra update câu hỏi có status duyệt/yêu cầu duyệt tạo bản ghi mới đúng.
- Kiểm tra xóa child đã lưu/chưa lưu.
- Kiểm tra audio upload, replay rỗng/sai kiểu/>10/<1.
- Kiểm tra chọn lại media thay thế media cũ ở cả create/update; hủy file manager phải giữ media cũ.
- Kiểm tra xóa media khỏi form ở cả create/update; xác nhận không phát sinh API xóa file nguồn và payload lưu không còn media đã xóa.
- Kiểm tra layout ở drawer 1366px, 1024px, dưới 768px nếu mobile nằm trong scope.

## Trạng thái triển khai bổ sung media

- Đã hoàn thành chọn một file MP3, chọn lại/thay thế và xóa media khỏi form ở cả create/update.
- Chọn lại giữ số lượt nghe hiện tại; hủy file manager giữ nguyên media cũ.
- Xóa media reset `question.media` và form control `media` về `null`; không gọi API xóa file nguồn.
- Đã rà tĩnh và chạy `git diff --check`; chưa build/test/chạy app theo quy ước kiểm tra tĩnh.

## Tiêu chí hoàn thành

- Không chọn được loại câu hỏi chưa có reset/editor hợp lệ.
- Form update có thể lưu khi dữ liệu hợp lệ mà không cần sửa lại direction chỉ để enable nút.
- `drag_drop` hiển thị đúng media theo rule hiện có.
- Không crash khi hủy chọn file media.
- Media đã chọn có thể được thay thế hoặc xóa khỏi form ở cả create/update; hủy chọn giữ nguyên media cũ, xóa khỏi form không xóa file nguồn.
- Payload lưu phản ánh đúng media hiện tại; không gửi lại media đã xóa khỏi form.
- Validate trả thông báo đúng ngữ cảnh, không đổi parser đáp án hiện tại.
- Parent và children lưu đúng `course_id`, `reference_id`, `group_id`, `cdr`, `cdr_id`, `code`, `private`, `week`, `status`.
- Loading luôn tắt ở cả success/error; không báo thành công khi child upload lỗi.
- Counter sau lưu không gây quota sai rõ ràng.
- Layout form không tràn ngang trong drawer thông dụng.
- Không chạy build/test/dev-server trong review tĩnh; chỉ chạy khi có yêu cầu riêng.

## Câu hỏi mở

1. `matching` có còn nằm trong scope tạo câu hỏi tiếng Anh không, hay phải ẩn cho tới khi có editor đầy đủ?
2. Với tiếng Anh, `pending` nên tính theo parent question hay theo số children giống public/private?
3. Các type tiếng Anh `checkbox`, `group-radio`, `group-input`, `grouping` có cần validate chặt như `radio`/`arrange_paragraphs` không?
4. Dialog “Kiểm thử câu hỏi” nên được bật lại, giữ ẩn, hay xóa khỏi create-form?
5. Sau update câu hỏi đã duyệt, child có status riêng cần clone theo từng child hay chỉ theo parent?
6. Mobile dưới 768px có phải phạm vi hỗ trợ chính cho form quản trị này không?
