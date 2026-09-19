# Arrange Paragraphs Editor

> Soạn đáp án câu hỏi **sắp xếp đoạn văn** (Arrange Paragraphs). User kéo–thả reorder paragraphs; component sync `answer_correct` theo format `|id1,id2,id3,|`.
>
> **Tách `options` (component) ↔ `answer_option` (parent/child):** `optionsByQ[q.id]` là shallow copy `answer_option` của `q`. Mọi `moveItemInArray` chỉ tác động map — `answer_option` gốc **không bị mutate**, không đổi thứ tự.

## Tổng quan

| Mục | Nội dung |
| --- | --- |
| Selector | `app-arrange-paragraphs-editor` (standalone) |
| Inputs | `courseQuestion`, `av` |
| State | `course_question`, `optionsByQ`, `originalIndexByQ` |
| Format answer | `\|id1,id2,id3,\|` (giữ format cũ) |
| Cơ chế | CDK DragDrop trong 1 list (`moveItemInArray`) |
| Trạng thái | Plan updated, code migrated |

## 1. Vị trí

[arrange-paragraphs-editor/](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/arrange-paragraphs-editor/)

- [arrange-paragraphs-editor.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/arrange-paragraphs-editor/arrange-paragraphs-editor.component.ts) — `ngOnChanges`, `drop`, `syncAnswer`, `buildOptions`, `buildIndexMap`.
- [arrange-paragraphs-editor.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/arrange-paragraphs-editor/arrange-paragraphs-editor.component.html) — part-header (av=1) + `#questionTmpl` (per-child loop).
- [arrange-paragraphs-editor.component.css](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/arrange-paragraphs-editor/arrange-paragraphs-editor.component.css) — `.sentence-item`, `.order-badge`, `.custom-placeholder`, `.cdk-drag-preview`.

Imports: `CommonModule`, `DragDropModule`, `LoadMediaOnTextDirective`, `KatexImgDirective`, `SharedModule`.

## 2. Mục đích

- **Per-child list paragraphs:** mỗi câu hỏi (child trong Part, hoặc chính `course_question`) có list paragraphs riêng → reorder độc lập.
- **Đáp án đúng** = thứ tự các id sau reorder → sync `q.answer_correct` per-child, format `|id1,id2,id3,|`.
- **Không pool** — tất cả items cùng 1 list, chỉ reorder.
- **Hiển thị `s.value`** — luôn text từ `answer_option`, không nhánh readonly.
- **`order-badge`** = vị trí gốc trong `answer_option` (cố định qua reorder) — `originalIndexByQ[q.id][s.id]`.
- **`question_direction` header** — ẩn div content khi rỗng (`*ngIf="q.question_direction"`), wrapper `.question-header-section` vẫn hiển thị `q-index-tag` nếu có.

## 3. Inputs

| Input | Kiểu | Mô tả |
| --- | --- | --- |
| `courseQuestion` | `CourseQuestions \| any` | Cần `id`, `code`, `question_direction`, `answer_correct`, `children[]`. |
| `av` | `number` | `1` = môn tiếng Anh (parent = Part: hiển thị `title_part` + direction cấp part, loop children). |

**Đã bỏ `@Input() isReadOnly`** — component luôn soạn.

## 4. State

| Field | Kiểu | Mục đích |
| --- | --- | --- |
| `course_question` | `CourseQuestions` | Mirror input + enrich `title_part`. `answer_option` **không mutate**. |
| `optionsByQ` | `{ [id: string]: any[] }` | Per-question options. `ngOnChanges` build từ `children[]` (av=1) hoặc `[course_question]` (av!=1). Mọi `moveItemInArray` chỉ tác động đây. |
| `originalIndexByQ` | `{ [id: string]: { [itemId: string]: number } }` | Map `itemId → vị trí gốc 1-based` trong `answer_option` raw. `order-badge` đọc từ đây. |

## 5. Luồng xử lý

### 5.1 `ngOnChanges`

1. `course_question = courseQuestion`.
2. Build `optionsByQ` + `originalIndexByQ`:
   - Nếu `course_question.children.length > 0`: mỗi child → `optionsByQ[child.id] = buildOptions(child)`, `originalIndexByQ[child.id] = buildIndexMap(child.answer_option)`.
   - Ngược lại: `optionsByQ[course_question.id] = buildOptions(course_question)`, `originalIndexByQ[course_question.id] = buildIndexMap(...)`.
3. Sort `children` theo `question_number` (ưu tiên) hoặc `id`.
4. `title_part = code.replace(/\-/gi, ' ')`.

### 5.2 `buildOptions(q)`

Parse `q.answer_correct = |id1,id2,id3,|` → reorder `q.answer_option` theo ids đó. Items không có trong `answer_correct` append cuối (defensive). Fallback về `answer_option` raw khi `answer_correct` rỗng.

### 5.3 `buildIndexMap(answerOption)`

Build `{itemId: idx+1}` từ `answer_option` raw (không reorder).

### 5.4 `drop(event, q)`

- `moveItemInArray(this.optionsByQ[q.id], event.previousIndex, event.currentIndex)`.
- `syncAnswer(q)`.

### 5.5 `syncAnswer(q)`

```ts
q.answer_correct = list?.length
    ? '|' + list.map(o => o.id).join(',') + '|'
    : '';
```

## 6. Format `answer_correct`

Format cũ: `replace(/\|/g, '').split(",")` → `['id1', 'id2', 'id3']`. Pipe-wrap, separator `,`.

> **Khác biệt format:** các editor khác dùng `;` (vd `drag-drop-editor`). `arrange-paragraphs-editor` giữ `,` để không phải migrate data cũ.

## 7. Template

### Part header (av === 1)
Hiển thị `title_part`, `question_direction`, `media` của parent (`course_question`).

### `#questionTmpl`

- Loop `child_q` từ `course_question.children` (av=1) hoặc `course_question` (av!=1) → bind `q`.
- `.question-header-section`: `q-index-tag` (nếu có `question_number`) + div `question_direction` với `*ngIf="q.question_direction"` (ẩn content khi rỗng).
- `.drag-area` > `.sentence-list` (cdkDropList) loop `optionsByQ[q.id]`:
  - `order-badge` = `originalIndexByQ[q.id][s.id]` (vị trí gốc, cố định).
  - `s.value` (text).
  - `cdkDrag` mọi item — không có `[cdkDragDisabled]`.

## 8. CSS

Giữ: `.sentence-item`, `.order-badge`, `.custom-placeholder`, `.cdk-drag-preview`, `.question-block`, `.part-header`, `.question-header-section`.

Dọn: `.mode-switch`, `.switch-knob`, `.text-mode`, `.readonly-on`, `.correct-box-list`, `.label-ans`, `.step-check`, `.step-text`, `.answer-label-correct`.

## 9. Khác biệt với các editor khác

| Aspect | arrange-paragraphs-editor | drag-drop-editor | reorder-words-editor |
| --- | --- | --- | --- |
| Items/zone | Nhiều (1 list duy nhất) | 1 (tối đa) | Nhiều (pool + sentence) |
| Pool | Không | Có (clone riêng) | Có (parse `question_direction`) |
| Cơ chế | CDK DragDrop (reorder) | CDK DragDrop (kéo pool → zone) | Click add/remove |
| Answer format | `\|id1,id2,id3,\|` | `\|id1;id2\|` | `\|word1\|word2\|word3\|` |
| Separator | `,` | `;` | `\|` |
| Per-question | Có (`optionsByQ`, `originalIndexByQ`) | Có (pool chung, `q.children[i].answer`) | Có |
| Read-only | Đã bỏ | Đã bỏ | Đã bỏ |

## 10. Steps migrate

1. ✅ Bỏ `@Input() isReadOnly`.
2. ✅ Bỏ field `new_answer_correct` + method `getIsCorrectAns`.
3. ✅ Thêm `optionsByQ` (per-q map, clone `answer_option`).
4. ✅ `ngOnChanges` build map cho `children[]` (av=1) hoặc `[course_question]` (av!=1).
5. ✅ `drop(event, q)` dùng `optionsByQ[q.id]`.
6. ✅ `syncAnswer(q)` ghi per-q.
7. ✅ `buildOptions(q)` parse `answer_correct` → initial order đúng đáp án.
8. ✅ `originalIndexByQ` + `order-badge` dùng vị trí gốc.
9. ✅ Template: loop `optionsByQ[q.id]`, `drop($event, q)`, `*ngIf="q.question_direction"` trên content div.
10. ⏳ CSS: dọn class không dùng (`.mode-switch`, `.correct-box-list`, `.answer-label-correct`).

## 11. Mở

_(đã chốt:)_
- ✅ Per-child options map (`optionsByQ[q.id]`).
- ✅ Initial order theo `answer_correct` (`buildOptions`).
- ✅ `order-badge` = vị trí gốc trong `answer_option` raw (`originalIndexByQ`).
- ✅ `question_direction` rỗng → ẩn content div, wrapper giữ lại cho `q-index-tag`.
- ✅ Bỏ `isReadOnly`, `getIsCorrectAns`, `new_answer_correct`.
- ✅ `answer_option` không mutate.

Còn:
- CSS cleanup (step 10) — chưa verify.
- Format separator `,` — giữ để không migrate data cũ.

## 12. Lịch sử

- **2026-07-22** — Tạo plan từ code analysis. Scope ban đầu single-question.
- **2026-07-23** — Phát hiện bug "không có dữ liệu" ở `av === 1`: `options` là 1 mảng duy nhất từ parent, mỗi child render cùng list rỗng. Migrate per-child: `optionsByQ` + `originalIndexByQ` + `buildOptions` parse `answer_correct` để initial order đúng đáp án. Thêm `*ngIf="q.question_direction"` ẩn content rỗng.

## 13. Trạng thái

- Plan updated.
- Code migrated.
- Chưa build, chưa test.
