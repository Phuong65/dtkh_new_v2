# Kế hoạch: InputboxEditor

## Mục đích

Component standalone trong luồng **Import câu hỏi từ text**, render câu hỏi dạng **input text** (tự luận ngắn / điền khuyết). User nhập câu trả lời qua `<input>` bind trực tiếp vào `q.userAnswer` của model — tương tự cách `RadioAndCheckboxEditor` đồng bộ `answer_correct`. Component đồng thời hiển thị đáp án đúng parse từ `answer_correct` dưới dạng chip khi load.

Thay thế cho `QuestionTypeInputboxComponent` (cũ, nằm trong folder `question-type-inputbox/`).

## Đường dẫn

`src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/inputbox-editor/`

| File | Vai trò |
|---|---|
| `inputbox-editor.component.ts` | Class, logic preload + đệ quy children |
| `inputbox-editor.component.html` | Template input + chip đáp án đúng + đệ quy `childQuestionTmpl` |
| `inputbox-editor.component.css` | Style input pill + chip + part-header |

## Metadata

| Thuộc tính | Giá trị |
|---|---|
| Selector | `app-inputbox-editor` |
| Class | `InputboxEditorComponent` |
| Standalone | `true` |
| Implements | `OnInit`, `OnChanges` |

## Inputs

| Input | Type | Mặc định | Mô tả |
|---|---|---|---|
| `courseQuestion` | `CourseQuestions \| any` | — | Câu hỏi cha (có thể chứa `children[]`) |
| `av` | `number` | — | `1` = môn tiếng Anh (hiển thị part-header + render children), khác `1` = render trực tiếp câu hỏi |

## State nội bộ

| Field | Type | Mô tả |
|---|---|---|
| `course_question` | `CourseQuestions` | Tham chiếu trực tiếp vào `courseQuestion` (không clone — chấp nhận mutate input để đồng bộ `userAnswer`) |

## Chức năng chi tiết

### 1. Preload UI khi load câu hỏi (`ngOnChanges`)
- Nhận `courseQuestion` → gán vào `course_question`.
- Set `title_part` từ `code` (`replace(/-/g, ' ')`).
- Gọi `getIsCorrectAns()` trên root: parse `answer_correct` theo format `|...|` (split `|` + filter rỗng) → set `new_answer_correct[]`.
- Nếu có `children[]`: sort theo `question_number` (fallback `id`) → gọi `getIsCorrectAns()` từng child.

### 2. Render template
- **`av === 1`** (môn tiếng Anh):
  - Hiển thị `part-header` (title + direction HTML + audio nếu có media).
  - Loop `course_question.children` qua `questionTmpl` (entry point).
- **`av !== 1`**: render trực tiếp `course_question` qua `questionTmpl`.
- **Bên trong `questionTmpl`:** nếu `q.children?.length` → loop qua `childQuestionTmpl`.
- **Bên trong `childQuestionTmpl`:** nếu `q.children?.length` → loop qua `childQuestionTmpl` (đệ quy đến tận leaf).

### 3. Template `questionTmpl`
- **Header:** hiển thị `q.question_number` (hoặc `Câu N` khi không phải `av===1`) + direction HTML qua `safeHtml` + directive `katex-img` + `load-media-on-text`.
- **Input area:**
  - `<input>` bind `[(ngModel)]="q.userAnswer"` — đồng bộ hai chiều ngược model.
  - Bỏ `is-answer-wrong` / `q.isWrong` (component không đánh giá đúng sai).
- **Chip đáp án đúng:**
  - Khi `q['new_answer_correct']?.length` → render block `Đáp án đúng:` + loop chip `ans-tag-correct` cho mỗi giá trị.
  - Không guard theo `isReadOnly` / `q.showCorrectAnswer` — luôn hiển thị nếu model có đáp án.

> **Phạm vi:** Inputbox chỉ 1 bậc cha-con. Children render ở block `av === 1` (loop `course_question.children`) — KHÔNG đệ quy sâu trong `questionTmpl`. Khác với `radio-and-checkbox-editor` (đệ quy đến leaf vì có `group-radio` / `group-checkbox`).

> **Đã loại bỏ:** `q.isWrong`, `q.showCorrectAnswer`, `isReadOnly`. Component chỉ làm 2 việc: cho user nhập `userAnswer` + hiển thị đáp án đúng parse sẵn.

### 4. Quản lý đáp án đúng (UI edit/add/remove)

Inputbox cho phép **nhiều đáp án đúng** (chuỗi `|a|b|c|`). Mỗi câu hỏi render block `answer-correct-block` ngay sau `<input>` `userAnswer`:

```
Đáp án đúng:  [ Paris          ] [x]
              [ London         ] [x]
              [ Berlin         ] [x]
              [ + Thêm đáp án  ]
```

**Cấu trúc state trên component** (không mutate model khi đang gõ):
- `newAnswerInput: { [qId: string]: string }` — text đang nhập cho ô "Thêm đáp án".
- `editingAnswer: { [key: string]: string }` — text đang sửa cho từng đáp án đã có; key = `${q.id}|${index}`.

**Các method chính:**
| Method | Trigger | Hành động |
|---|---|---|
| `onEditInputChange(q, i, value)` | `(ngModelChange)` trên input sửa | Ghi vào `editingAnswer` — KHÔNG sync model ngay |
| `onEditCommit(q, i)` | Enter hoặc blur trên input sửa | Trim → nếu rỗng `splice(index, 1)`, ngược lại gán `q.new_answer_correct[i]`; xóa entry trong `editingAnswer`; gọi `syncAnswerCorrect` |
| `onNewInputChange(q, value)` | `(ngModelChange)` trên input thêm | Ghi vào `newAnswerInput[q.id]` — KHÔNG commit ngay |
| `onNewCommit(q)` | Enter hoặc blur trên input thêm | Trim → nếu không rỗng `push` vào `q.new_answer_correct`; reset input; gọi `syncAnswerCorrect` |
| `removeAnswer(q, i)` | click nút `x` | `splice` khỏi `q.new_answer_correct`; xóa entry editing tại vị trí đó; gọi `syncAnswerCorrect` |
| `syncAnswerCorrect(q)` | gọi từ 3 method trên | Build `q.answer_correct = '\|' + arr.join('\|') + '\|'` |

**Sync timing:**
- Sync `answer_correct` chỉ chạy trên Enter hoặc blur — tránh ghi model rác khi user đang gõ dở.
- `getEditingValue(q, i)` fallback về `q.new_answer_correct[i]` nếu không có entry trong map editing (cho phép Angular render giá trị cũ trước khi user chạm vào).

### 5. Logic đồng bộ `userAnswer`
- `[(ngModel)]="q.userAnswer"` tự đồng bộ mỗi keystroke vào `q.userAnswer` của model.
- Khác với đáp án đúng: `userAnswer` không rebuild string, chỉ gán primitive → bind trực tiếp OK.

### 6. Helpers
| Method | Mô tả |
|---|---|
| `getIsCorrectAns(question: CourseQuestions)` | Parse `question.answer_correct` bằng `split("\|").filter((m: string) => m && m !== '')` → gán `new_answer_correct`. Khởi tạo `[]` nếu `answer_correct` rỗng (để block quản lý luôn render). Gọi trên root + mọi child. |
| `editKey(q, index)` | Tạo key unique cho `editingAnswer` map. |
| `getEditingValue(q, index)` | Lấy giá trị hiện đang sửa, fallback về model. |
| `syncAnswerCorrect(q)` | Rebuild `q.answer_correct = '\|a\|b\|c\|'` từ `new_answer_correct[]`. |

## Format `answer_correct`

- Chuỗi các đáp án được chấp nhận, phân tách bằng ký tự `|`.
- Khi đọc: split `|` + filter rỗng → mảng chuỗi đáp án.

| Trạng thái | Format | Ví dụ |
|---|---|---|
| 1 đáp án duy nhất | `\|<ans>\|` | `\|abc\|` → `["abc"]` |
| Nhiều đáp án chấp nhận | `\|<ans1>\|<ans2>\|...` | `\|abc\|xyz\|` → `["abc", "xyz"]` |
| Không có đáp án | `''` hoặc `\|\|` | `[]` |

## Quan hệ với hệ thống

### Được sử dụng bởi
- Wrapper `TextImportPreviewComponent` (`text-import-question/text-import-preview/`) — render qua `*ngSwitchCase="'inputbox'"`.
- Truyền `[courseQuestion]` + `[av]` lấy từ `selectedCourse?.av`.

### Tham chiếu kế hoạch
- [[plans/radio-and-checkbox-editor.md]] — pattern đồng bộ model + đệ quy children + format `|...|` cùng áp dụng.
- [[plans/text-import-preview.md]] — kế hoạch tổng thể luồng import + lịch sử tách folder `text-import-answer-editor/`.

## Trạng thái

- [x] Đổi tên folder `question-type-inputbox` → `inputbox-editor`.
- [x] Đổi tên file `question-type-inputbox.component.{ts,html,css}` → `inputbox-editor.component.{ts,html,css}`.
- [x] Đổi tên class `QuestionTypeInputboxComponent` → `InputboxEditorComponent`.
- [x] Đổi selector `app-question-type-inputbox` → `app-inputbox-editor`.
- [x] Cập nhật `templateUrl` / `styleUrls` theo đường dẫn mới.
- [x] Sửa implicit-any trên `getIsCorrectAns(question: CourseQuestions)`.
- [x] Bỏ `@Input() isReadOnly` + mọi guard `isReadOnly` trong template.
- [x] Bỏ `q.isWrong` + `q.showCorrectAnswer` khỏi template.
- [x] **Bỏ** đệ quy `childQuestionTmpl` — inputbox chỉ 1 bậc cha-con (không có `group-inputbox`).
- [x] Wire vào `text-import-question` (ts import + html tag cho `av === 0` / `av === 1`).
- [x] **Thêm** quản lý đáp án đúng: edit/add/remove, sync `answer_correct` theo format `|a|b|c|`.
- [x] **Lint fix** `(m: string)` trong `getIsCorrectAns`.
- [ ] Build check end-to-end sau khi các type component khác cùng folder xong.
- [ ] Verify runtime: load câu inputbox → nhập text → `q.userAnswer` cập nhật đúng.

## Changelog

### 2026-07-14 — Fix bug focus → blur ngay làm mất đáp án

**Bug**: `onEditCommit` dùng `(this.editingAnswer[key] ?? '').trim()` — khi user click vào ô rồi blur ngay mà chưa gõ gì, `ngModelChange` chưa chạy → key chưa tồn tại trong map → fallback `''` → rỗng → `splice` xóa đáp án.

**Fix**: thêm guard đầu method — chỉ commit khi key đã xuất hiện trong `editingAnswer` (tức user đã thực sự gõ):

```typescript
onEditCommit(q: any, index: number): void {
    const key = this.editKey(q, index);

    // Chưa chỉnh sửa gì → không xóa, không sync (tránh mất đáp án khi focus rồi blur ngay)
    if (!(key in this.editingAnswer)) {
        return;
    }

    const raw = this.editingAnswer[key].trim();
    // ... phần còn lại giữ nguyên
}
```

**Behavior giữ nguyên:**
- Focus → blur ngay không gõ → đáp án giữ nguyên.
- Focus → gõ → blur/Enter → commit.
- Focus → gõ → xóa hết → blur → vẫn xóa (key đã tồn tại).
- Focus → gõ → xóa hết → Enter → vẫn xóa.

**File**: [inputbox-editor.component.ts](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/inputbox-editor/inputbox-editor.component.ts) — method `onEditCommit`.

**Cùng bug đã sửa ở** [group-input-editor.component.ts](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/group-input-editor/group-input-editor.component.ts).

### 2026-07-14 — Thêm quản lý đáp án đúng (edit/add/remove + sync answer_correct)

**State mới trên component**
- `newAnswerInput: { [qId]: string }` — text đang nhập ô "Thêm đáp án".
- `editingAnswer: { [key]: string }` — text đang sửa đáp án đã có; key = `${q.id}|${index}`.
- Không mutate model khi user đang gõ — chỉ sync khi Enter/blur.

**UI mới trong template**
- Bỏ loop chip read-only `*ngFor="let ans of q['new_answer_correct']"`.
- Thay bằng block `answer-correct-list` chứa:
  - `*ngFor="let ans of q['new_answer_correct']; let i = index"` → `<input>` bind `getEditingValue(q, i)` + nút `x` xóa.
  - 1 row `answer-row-add` cuối cùng → `<input>` placeholder "+ Thêm đáp án đúng" bind `newAnswerInput[q.id]`.
- Mỗi row: `<input>` + nút `x` (trừ row "Thêm" không có nút xóa).

**Method mới trong TS**
- `editKey(q, index)` → tạo key cho `editingAnswer`.
- `getEditingValue(q, index)` → lấy giá trị đang sửa, fallback về model.
- `onEditInputChange(q, i, value)` → ghi vào map editing (không sync).
- `onEditCommit(q, i)` → Enter/blur: trim → splice nếu rỗng hoặc gán; sync.
- `onNewInputChange(q, value)` → ghi vào `newAnswerInput` (không sync).
- `onNewCommit(q)` → Enter/blur: trim → push nếu không rỗng; sync.
- `removeAnswer(q, i)` → splice + sync.
- `syncAnswerCorrect(q)` → build `q.answer_correct = '\|a\|b\|c\|'`.

**Lint fix**
- TS `getIsCorrectAns`: `(m: string) => m && m !== ''` — tắt hint TS7044.

**CSS mới**
- `.answer-input-chip` — input đáp án đúng (border 1px, radius 10px).
- `.answer-input-add` — border dashed + placeholder italic (ô "Thêm").
- `.btn-remove-answer` — nút tròn đỏ 28px với icon `pi pi-times`.
- `.answer-correct-list` — flex column gap 6px.
- Bỏ hoàn toàn `.ans-tag-correct` (không còn render chip read-only).

### 2026-07-14 — Tổng hợp refactor lần 3 (preview = editor + đệ quy children)

**Đổi tên folder + class + selector**
- Folder: `question-type-inputbox/` → `inputbox-editor/`.
- File: `question-type-inputbox.component.{ts,html,css}` → `inputbox-editor.component.{ts,html,css}`.
- Class: `QuestionTypeInputboxComponent` → `InputboxEditorComponent`.
- Selector: `app-question-type-inputbox` → `app-inputbox-editor`.
- Cập nhật `templateUrl` / `styleUrls` theo đường dẫn mới.

**Loại bỏ `isReadOnly`**
- Xóa `@Input() isReadOnly` khỏi TS.
- Template: bỏ `[class.is-readonly]="isReadOnly"`, `[readonly]="isReadOnly"`, mọi guard `*ngIf="isReadOnly || ..."` trên block chip đáp án đúng.
- Parent html (`text-import-question`): bỏ `[isReadOnly]="false"` ở 2 vị trí gọi `<app-inputbox-editor>`.

**Sync `userAnswer` vào model qua `[(ngModel)]`**
- Bỏ mọi `q.isWrong` + `q.is-answer-wrong` (component không đánh giá đúng/sai).
- Input bind trực tiếp `[(ngModel)]="q.userAnswer"` — mỗi keystroke đồng bộ ngược model, đúng pattern "preview = editor" của radio-and-checkbox.

**Đệ quy children đến leaf**
- Bổ sung block `ng-container *ngIf="q.children && q.children.length"` trong `questionTmpl` → loop qua chính `questionTmpl` (đệ quy). Không cần `childQuestionTmpl` riêng vì `questionTmpl` đã đủ generic.

**Chip đáp án đúng**
- Render không cần điều kiện `isReadOnly` / `q.showCorrectAnswer` — chỉ cần `q['new_answer_correct']?.length`.
- Mỗi phần tử trong mảng là 1 đáp án được chấp nhận → render 1 chip.

**Wire parent `text-import-question`**
- TS: thêm `import { InputboxEditorComponent }` + vào `@Component.imports`.
- HTML: bỏ comment 2 block `<app-question-type-inputbox>`, thay bằng `<app-inputbox-editor>`, bỏ `[isReadOnly]="false"`.

**Dọn CSS**
- Bỏ dead rules từ `.mode-switch` / `.switch-knob` / `.readonly-on` / `.text-mode` / `.is-readonly .answer-input` (theo pattern radio-and-checkbox).
- Chuẩn hóa `.answer-input` border-radius 12px, focus border `#6366f1`.
- Giữ `.ans-tag-correct` (margin-bottom 5px) cho chip multi-line khi nhiều đáp án.
