# Grouping Editor

> Bộ soạn đáp án cho câu hỏi nhóm dạng **kéo–thả ghép nhóm** (Drag and Drop matching). Pool đáp án phía trên, nhiều drop zone (mỗi `child` = 1 nhóm). Đáp án đúng = chính các item trong drop zone; kéo thả / click trả về pool đồng bộ ngược `child.answer_correct` theo format `|id1;id2;id3|`. Luôn soạn.
>
> **Tách `answer_option` (parent) ↔ `pool` (component):** `pool` là shallow copy `answer_option`, lưu trên component field. Mọi thay đổi (filter / sort / push) chỉ tác động lên `pool` — `answer_option` gốc của parent **không bị mutate**.

## Tổng quan

| Mục | Nội dung |
| --- | --- |
| Selector | `app-grouping-editor` (standalone) |
| Inputs | `courseQuestion`, `av` |
| State | `course_question`, `pool` (clone) |
| Format answer | `\|id1;id2\|` mỗi child |
| Trạng thái | Code xong, plan xong, **chưa build, chưa test** |

## 1. Vị trí

[grouping-editor/](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/grouping-editor/)

- [grouping-editor.component.ts](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/grouping-editor/grouping-editor.component.ts) — logic (CDK DragDrop, `pool`, `syncAnswer`).
- [grouping-editor.component.html](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/grouping-editor/grouping-editor.component.html) — 1 `<ng-template>` + `*ngTemplateOutlet`, pool bind `this.pool`.
- [grouping-editor.component.css](src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/grouping-editor/grouping-editor.component.css) — CDK drag style.

Imports: `DragDropModule`, `LoadMediaOnTextDirective`, `KatexImgDirective`, `SharedModule`.

## 2. Mục đích

- **Tiêu đề phần** (`av === 1`): `code` thay `-` → space.
- **Hướng dẫn** (`question_direction`): `safeHtml` + Katex + audio (nếu có `media`).
- **Pool** (`this.pool`): chip kéo được, sort theo `value`. Sau load **không chứa** đáp án đã gán vào nhóm.
- **Nhóm con** (`children`): mỗi child = 1 drop zone hiển thị `question_direction` + `sentence-list` chứa đáp án đúng.

> Không có block "Đáp án đúng:" riêng — chính các item trong `sentence-list` là đáp án đúng.

## 3. Inputs

| Input | Kiểu | Mô tả |
| --- | --- | --- |
| `courseQuestion` | `CourseQuestions \| any` | Cần `id`, `code`, `question_direction`, `answer_option[]`, `children[]`. |
| `av` | `number` | `1` = tiếng Anh (part-header + audio + số theo `question_number`); khác = thường. |

Đã bỏ `@Input() isReadOnly` — component luôn soạn.

## 4. State

| Field | Kiểu | Mục đích |
| --- | --- | --- |
| `course_question` | `CourseQuestions` | Mirror input + enrich `dropListIds`, `title_part`. **`answer_option` KHÔNG bị mutate**. |
| `pool` | `Answers[]` | **Component field** — shallow copy `answer_option` lúc `ngOnChanges`, sort theo `value`. Mọi thay đổi (filter / push) chỉ tác động đây. |
| `CourseQuestionDragDrop` | `interface` | Mở rộng `CourseQuestions` thêm `answer?: Answers[]`. |

## 5. Luồng xử lý

### 5.1 `ngOnChanges`

1. `course_question = courseQuestion`.
2. Build `dropListIds` — có `children` → `['pool', ...children.map((_, i) => 'drop-' + i)]`; không → `['pool']`.
3. Clone → `this.pool = sort([...answer_option], 'value')`. **Không mutate `answer_option`.**
4. `getIsCorrectAns(course_question)`.
5. `title_part = code.replace(/\-/gi, ' ')`.

### 5.2 `getIsCorrectAns(question)`

- Sort `children` theo `question_number` (ưu tiên) hoặc `id`.
- Mỗi child: `c['answer'] = []`; parse `answer_correct` (strip `|`, split `;`, ép `String`) → `correctIds`. Với mỗi `opt` trong `this.pool`, nếu id thuộc `correctIds` → `matched.push(opt)` + loại khỏi `pool`. `c['answer'] = sort(matched, 'value')`.

### 5.3 `syncAnswer(item)`

`item.answer_correct = '|' + item.answer.map(a => a.id).join(';') + '|'`. Rỗng → `''`.

### 5.4 `dropMatching(event, q, item?)`

CDK bind `cdkDropListData` cho `pool` (= `this.pool`) hoặc `item.answer`.

- **Cùng list** → `moveItemInArray`. Nếu `item` (drop zone) → `syncAnswer(item)`.
- **Khác list** → `transferArrayItem`. Sau đó:
  - `item` = drop zone đang nhận → `syncAnswer(item)`.
  - Kéo từ drop zone về pool → parse `event.previousContainer.id` (`'drop-{i}'`) → `idx` → `syncAnswer(q.children[idx])`. Tránh match tham chiếu `m.answer === event.previousContainer.data` (fragile nếu share ref).

### 5.5 `returnToPool(q, item, answer)`

1. `item.answer = item.answer.filter(a => a.id !== answer.id)`.
2. Trả về `this.pool`: nếu chưa có `answer.id` → `this.pool = sort([...this.pool, answer], 'value')`.
3. `syncAnswer(item)`.

## 6. Format `answer_correct` (mỗi child)

`|id1;id2;id3|` — strip pipe, split `;`. Rỗng → `''`.

## 7. Template — `#questionTmpl`

Nhận `q` + `idx`. Hai nhánh theo `av`:

- **`av === 1`** — `.part-container` (`.part-header`: title + direction + audio) → gọi lại `#questionTmpl` cho `course_question`.
- **`av !== 1`** — gọi thẳng `#questionTmpl` cho `course_question`.

**Bên trong:**
- `.question-header-section` (khi `av !== 1`): `Câu {{ q.question_number }}:` + `q.question_direction`.
- `.drag-area`:
  - **Pool** (`cdkDropList id="pool"`, `[cdkDropListData]="pool"`): flex-wrap, dashed border.
  - **Drop zones** (`.row` > `.col-6` × `children.length`): mỗi zone = `.sentence-list` `cdkDropList id="drop-{i}"` chứa `.sentence-item` (click → `returnToPool`) + `.custom-placeholder`.

## 8. CSS

Font **14px**, no-shadow, no-outline. Border-radius **6–14px**. Indigo `#4f46e5`/`#6366f1`, pool xanh `#3b82f6`, đáp án xanh `#22c55e`.

Class CDK quan trọng: `.custom-placeholder` (dashed, 44px), `.cdk-drag-preview` (`z-index: 10000`), `.cdk-drag-animating`, `.cdk-drop-list-dragging`, `.cdk-drag-placeholder` (opacity 0.35).

## 9. Quan hệ

Cùng `text-import-answer-editor/`: `radio-and-checkbox-editor`, `inputbox-editor`, `drag-drop-editor`, `arrange-paragraphs-editor`, `group-input-editor`.

## 10. Mở

1. **Sort `answer_option`** — hiện sort trên `this.pool`. Có thể đẩy về parent cho nhất quán. _(chưa quyết)_

_(đã xử lý: `getCorrectAnswer` dead code, `isWrong`/`showCorrectAnswer`, fragile `findIndex`, dead branch `q-index-tag`, `console.log` trong `syncAnswer`.)_

## 11. Lịch sử

- **2026-07-14**
  - **Bỏ `isReadOnly`** — component luôn soạn; bỏ guard, `[cdkDragDisabled]`, nhánh `*ngIf/else answerCorrect`.
  - **Bỏ block "Đáp án đúng:"** + class `is-answer-correct`/`is-answer-wrong`. Đáp án đúng = item trong `sentence-list`.
  - **`getIsCorrectAns` populate** `item.answer` từ pool (so sánh `String(id)`), loại khỏi pool.
  - **Thêm `syncAnswer(item)`** — ghi `|id1;id2;|` theo `item.answer`.
  - **`dropMatching` / `returnToPool`** gọi `syncAnswer` cho mọi thay đổi.
  - **`dropMatching` dùng `event.previousContainer.id`** parse `'drop-{i}'` → `idx` (thay so sánh tham chiếu fragile).
  - **Tách `pool`** — component field riêng; clone `[...answer_option]` lúc load, mọi thao tác chỉ trên `pool`. `answer_option` của parent **không còn bị mutate**.
  - **Dọn:** xóa `getCorrectAnswer`/`getCorrectAnswers` (dead), `correct_ids` (đi qua `answer_correct` trực tiếp), `console.log` trong `syncAnswer`, dead branch `q-index-tag`.
  - Template: pool `[cdkDropListData]` + `*ngFor` đổi `q.answer_option` → `pool`.

## 12. Trạng thái

- Code đã sửa xong (TS + HTML).
- Plan đã tối ưu.
- Chưa build, chưa test.
