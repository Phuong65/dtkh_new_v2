# Kế hoạch chức năng & UI/UX - question-types-view

## Phạm vi

Chức năng: [question-types-view](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/)

Component chính:

- [question-type-radio-and-checkbox.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-radio-and-checkbox/question-type-radio-and-checkbox.component.ts)
- [question-type-group-radio.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-group-radio/question-type-group-radio.component.ts)
- [question-type-inputbox.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-inputbox/question-type-inputbox.component.ts)
- [question-type-group-input.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-group-input/question-type-group-input.component.ts)
- [question-type-reorder-words.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-reorder-words/question-type-reorder-words.component.ts)
- [question-type-arrange-paragraphs.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-arrange-paragraphs/question-type-arrange-paragraphs.component.ts)
- [question-type-drag-drop.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-drag-drop/question-type-drag-drop.component.ts)
- [question-type-grouping.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-grouping/question-type-grouping.component.ts)

## Mục tiêu

1. Hiển thị/làm thử câu hỏi theo từng loại dữ liệu trong `CourseQuestions`.
2. Giữ contract dữ liệu/API hiện tại, không đổi model nghiệp vụ.
3. Hỗ trợ `isReadOnly = true` để khóa thao tác/xem đáp án đúng, `isReadOnly = false` để làm thử.
4. Hỗ trợ học phần tiếng Anh (`av === 1`) với part/nhóm câu hỏi và câu hỏi con.
5. Render CKEditor/media/công thức/ảnh nhúng qua `safeHtml`, `appLoadMediaOnText`, `appKatexImg`.
6. Sắp xếp câu hỏi con theo `question_number`, fallback `id`.
7. Tính đáp án đúng từ `answer_correct` và gắn vào object hiển thị.
8. Đồng bộ UI giữa part header, question block, answer/card/tag/drag area.
9. Phân biệt rõ 3 tầng nội dung: parent/part, nội dung câu hỏi, vùng đáp án.
10. Giảm nhiễu thị giác: không dùng khung ngoài nặng, không dùng border dày.

## Nguyên tắc UI/UX đã chốt

1. `.quiz-viewport` chỉ là vùng chứa layout:
   - không background;
   - không border;
   - không border-radius.
2. Parent/part dùng nền xám xanh rất nhẹ để tạo tầng cao hơn.
3. Nội dung câu hỏi dùng nền xanh rất nhạt, spacing rõ, border 1px nhẹ nếu cần.
4. Vùng đáp án dùng nền trắng, indent/spacing nhẹ, border 1px nhạt nếu cần.
5. Radius chuẩn hóa `6px` cho card/input/chip/drag item/drop zone/preview/nút.
6. Tránh border > 2px vì gây rối mắt khi nhiều câu hỏi xuất hiện liên tiếp.
7. Readonly không tạo affordance giống có thể click.
8. Mobile: đáp án về 1 cột, nút thao tác full width khi cần.

## Hiện trạng logic theo code

### Input và trạng thái chung

- Các component nhận `courseQuestion`, `av`, `isReadOnly`; radio/checkbox và group-radio có thêm `buttonKiemtra`.
- `course_question` đang gán trực tiếp từ `@Input() courseQuestion`, sau đó thêm dynamic property như `title_part`, `new_answer_correct`, `isCorrect`, `dropListIds`, `answer`, `correct_id`, `correct_ids`, `shuffledWords`, `userSentence`.
- `title_part` tạo từ `course_question.code.replace(/\-/gi, ' ')`.
- Children được sort theo `question_number` nếu có, fallback `id`.

### Radio / checkbox

- [question-type-radio-and-checkbox.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-radio-and-checkbox/question-type-radio-and-checkbox.component.ts) luôn render dạng part có `children`.
- [question-type-group-radio.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-group-radio/question-type-group-radio.component.ts) render part + children khi `av === 1`, render trực tiếp `course_question` khi `av !== 1`.
- `answer_correct` parse bằng cách bỏ `|`, split `,`, rồi set `ans.isCorrect`.
- `getColClass()` đọc `q.config.cols` để map 1/2/3/4 cột; fallback `col-6`.
- Không readonly: `radio` chọn 1 đáp án và clear đáp án khác; `checkbox` toggle nhiều đáp án.
- Readonly: đáp án đúng highlight qua `ans.isCorrect`.
- Nút “Xem đáp án” đã lấy đáp án theo đúng `q` đang render qua `getAnsCorrect(q)`.

### Inputbox / group-input

- Inputbox hiển thị câu hỏi nhập text đơn hoặc danh sách children tùy `av`.
- Group-input hiển thị nhóm nhiều dòng nhập trong `children`.
- `answer_correct` split theo `|`, filter rỗng, lưu vào `new_answer_correct`.
- Không readonly: input bind `q.userAnswer` hoặc `child.answer` bằng `ngModel`.
- Readonly: đáp án đúng hiển thị dạng tag.

### Reorder words

- Dùng `question_direction.split('/')` làm pool từ bị xáo trộn.
- Đáp án đúng lấy từ `answer_correct.split('|')`, lưu `new_answer_correct`.
- Không readonly: bấm từ để thêm vào `userSentence`, bấm chip để xóa.
- `isWordUsed()` đếm số lần dùng để hỗ trợ từ trùng nhau.
- Readonly: hiển thị `new_answer_correct`.

### Arrange paragraphs

- Dùng `answer_option` làm danh sách đoạn cần kéo thả.
- Đáp án đúng lấy từ `answer_correct`, bỏ `|`, split `,`, lưu `new_answer_correct`.
- Không readonly: kéo thả đổi thứ tự `q.answer_option` bằng `moveItemInArray()`.
- Readonly: template lặp `new_answer_correct` và map id sang value bằng pipe `showlabel`.

### Drag drop matching

- Tạo `dropListIds = ['pool', ...children.map(drop-i)]`.
- Mỗi child có `answer = []` và `correct_id` parse từ `answer_correct`.
- Không readonly: pool chứa `q.answer_option`; mỗi drop zone giữ 1 đáp án; khi thay đáp án, đáp án cũ trả về pool; click đáp án trong drop zone trả lại pool.
- Readonly: `getCorrectAnswer()` tìm đáp án đúng trong pool hoặc trong `child.answer`, so sánh id bằng `String(...)`.

### Grouping

- Tạo `dropListIds` giống drag-drop.
- `answer_option` được sort theo `value` trước khi render pool.
- Mỗi child có `answer = []` và `correct_ids` parse từ `answer_correct`.
- Không readonly: người dùng kéo nhiều option vào từng nhóm.
- Readonly: `getCorrectAnswers()` lọc `q.answer_option` theo `correct_ids`, chuẩn hóa id về string, sort theo `value`, render danh sách value đúng.

## Đã thực hiện

- Bỏ modern skin dạng card/glass nặng khỏi `.quiz-viewport`.
- Bỏ background/border/border-radius của `.quiz-viewport`.
- Áp dụng UI phân tầng mềm cho 8 component CSS trong `question-types-view`.
- Chuẩn hóa radius `6px` cho card, input, chip, drag item, drop zone, preview, nút.
- Tránh border/left-border dày > 2px trong lớp UI mới.
- Bỏ inline style nút “Xem đáp án” ở radio/checkbox và group-radio; dùng `answer-action-bar`.
- Thêm `state-readonly` để readonly không gợi ý có thể click.
- Chỉnh answer card hover/selected/correct nhất quán hơn.
- Responsive mobile: đáp án về 1 cột, nút “Xem đáp án” full width.
- Xóa comment chết trong template radio/checkbox và group-radio.
- Sửa radio/checkbox và group-radio để nút “Xem đáp án” lấy `answer_correct` theo đúng câu hỏi đang render.
- Guard `answer_correct` rỗng cho drag-drop và grouping.
- Chuẩn hóa so sánh id về string trong drag-drop và grouping khi lookup đáp án đúng.
- Xóa `console.log` debug trong group-radio và grouping.

## Vấn đề còn lại theo review tĩnh

### P1 - Logic/correctness

1. [question-type-arrange-paragraphs.component.ts:65-69](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/question-types-view/question-type-arrange-paragraphs/question-type-arrange-paragraphs.component.ts#L65-L69): đã guard `answer_correct`, nhưng chưa reset `new_answer_correct` khi dữ liệu mới không có đáp án. Có thể giữ stale data nếu parent tái sử dụng object cũ.
2. Radio/checkbox và group-radio đang so sánh `answer_correct.includes(f.id)`; nếu `answer_correct` là string id còn `f.id` là number, có thể không highlight đúng. Cần chuẩn hóa `String(f.id)`.
3. Reorder words/inputbox/group-input cần rà guard `answer_correct` rỗng và trạng thái stale khi đổi câu hỏi.
4. Drag-drop/grouping đang giả định `children` tồn tại khi tạo `dropListIds`; nếu API trả câu hỏi không children có thể crash.

### P2 - Maintainability

1. Nhiều component mutate trực tiếp `@Input() courseQuestion`; có thể gây state phụ nếu parent tái sử dụng object giữa preview/edit.
2. Logic sort children/title_part/parse đáp án lặp lại ở nhiều component.
3. Một số template drag-drop/grouping/group-input còn inline style; nên chuyển dần sang class khi chỉnh UI tiếp.
4. `getCorrectAnswer()` trong grouping còn tồn tại nhưng luồng readonly chính dùng `getCorrectAnswers()`; cần xác nhận có còn dùng trong template không trước khi xóa.

### P3 - UX/consistency

1. `isReadOnly = true` hiện thường đồng nghĩa “hiện đáp án đúng”, nhưng radio/checkbox có thêm nút “Xem đáp án”. Cần chốt nghiệp vụ để thống nhất.
2. Cần kiểm tra UI thực tế với dữ liệu dài/ngắn/mixed media để cân spacing.
3. Cần kiểm tra contrast/focus state/keyboard affordance cho drag-drop và answer card.

## Kế hoạch triển khai tiếp

### Giai đoạn 1 - Chốt tính đúng đáp án

- Chuẩn hóa compare id về string cho radio/checkbox, group-radio, arrange-paragraphs.
- Reset field UI (`new_answer_correct`, `answer`, `correct_id`, `correct_ids`) khi dữ liệu thiếu đáp án để tránh stale state.
- Guard `children` trước khi tạo `dropListIds` ở drag-drop/grouping.
- Đảm bảo câu hỏi thiếu `answer_correct` không crash preview; readonly hiển thị rỗng hoặc placeholder nhẹ.

### Giai đoạn 2 - Chuẩn hóa view-model nhẹ

- Hạn chế mutate trực tiếp `@Input()` nếu scope cho phép.
- Tách helper nhỏ hoặc private method trong từng component cho:
  - sort children theo `question_number`/`id`;
  - tạo `title_part`;
  - parse đáp án đúng theo delimiter `|`, `,`, `;`.
- Không đổi contract `CourseQuestions`/API.

### Giai đoạn 3 - Đồng bộ readonly / xem đáp án

- Chốt `isReadOnly = true` là “khóa thao tác + hiện đáp án” hay chỉ “khóa thao tác”.
- Nếu dùng nút “Xem đáp án”, thống nhất giữa radio/checkbox, inputbox, reorder words, drag-drop, grouping, arrange paragraphs.
- Giữ trạng thái readonly không click/toggle/drag được ở mọi loại câu hỏi.

### Giai đoạn 4 - Dọn UI ít rủi ro

- Chuyển inline style còn lại trong drag-drop/grouping/group-input sang class.
- Giữ hệ phân tầng mềm: parent nền xám xanh nhẹ, question nền xanh rất nhạt, answer nền trắng.
- Giữ radius `6px`, border tối đa 1px trong UI mới.
- Không tạo shared CSS file mới nếu chưa cần refactor thật sự.

### Giai đoạn 5 - Kiểm thử thủ công khi được phép chạy app

- Kiểm tra từng loại: radio, checkbox, group-radio, inputbox, group-input, reorder-words, arrange-paragraphs, drag-drop, grouping.
- Với component có nhánh riêng, kiểm tra cả `av === 1` và `av !== 1`.
- Kiểm tra dữ liệu có/không có `children`, có/không có `answer_correct`, id string/number.
- Kiểm tra nội dung có media, CKEditor HTML, KaTeX/image embed.
- Kiểm tra responsive mobile.

## Tiêu chí hoàn thành

- Mỗi loại câu hỏi render readonly không crash khi thiếu `answer_correct` hoặc thiếu `children`.
- Đáp án đúng hiển thị đúng theo câu hỏi đang render, đặc biệt câu hỏi con.
- Lookup đáp án đúng ổn định dù id API là string hoặc number.
- Không thao tác được khi `isReadOnly = true`.
- UI phân biệt rõ parent/question/answer mà không dùng border dày.
- `.quiz-viewport` không còn background/border/border-radius.
- Không còn `console.log` debug trong component.
- Không chạy build/test/dev-server trong review tĩnh; chỉ chạy khi có yêu cầu riêng.

## Quyết định đã chốt

1. `isReadOnly = true` khóa thao tác, đồng thời hiển thị đáp án đúng.
2. Logic đọc đáp án hiện tại đang đúng theo dữ liệu hiện có; nếu muốn học theo/chuẩn hóa cách viết này hoặc đổi parser đáp án trong tương lai thì phải hỏi trước khi làm.
3. Tương tác UI chỉ là tạm thời, chưa cần lưu đáp án người dùng.
4. Các template hiện tại mặc định có `children`, nhưng component vẫn cần guard để không crash khi thiếu `children`.
5. Giữ tách file theo từng question type để giảm rủi ro.
