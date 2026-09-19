# Reorder Words Editor

> Bộ soạn đáp án cho câu hỏi dạng **sắp xếp từ thành câu** (Sentence Building). Người dùng click từ trong pool để ghép câu (`userSentence`), click từ đã chọn để trả về pool. Đáp án đúng = `userSentence` — component tự sync vào `answer_correct` theo format `|từ1|từ2|từ3|`.
>
> **Pool (`shuffledWords`) tách khỏi `question_direction`:** component parse `question_direction.split('/')` → `shuffledWords`. Không mutate `question_direction` gốc.

## Tổng quan

| Mục | Nội dung |
| --- | --- |
| Selector | `app-reorder-words-editor` (standalone) |
| Inputs | `courseQuestion`, `av` |
| State | `course_question` (enrich `title_part`, `shuffledWords`, `userSentence`) |
| Format answer | `\|từ1\|từ2\|từ3\|` (giữ format hiện tại) |
| Từ lấy từ | `question_direction` split `/` → `shuffledWords` |
| Cơ chế | Click add/remove (không CDK DragDrop) |
| Trạng thái | Cần migrate theo pattern `group-radio-editor` / `drag-drop-editor` (bỏ `isReadOnly`, sync `answer_correct`) |

## 1. Vị trí

[reorder-words-editor/](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/reorder-words-editor/)

- [reorder-words-editor.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/reorder-words-editor/reorder-words-editor.component.ts) — logic `addWord`, `removeWord`, `isWordUsed`, `getIsCorrectAns`, `syncAnswer`.
- [reorder-words-editor.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/reorder-words-editor/reorder-words-editor.component.html) — `#questionTmpl`, pool `.word-btn`, sentence `.word-chip.active`, correct answer block.
- [reorder-words-editor.component.css](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/reorder-words-editor/reorder-words-editor.component.css) — chips, sentence-box, correct-box, mode-switch (cần dọn).

Imports: `CommonModule`, `ReactiveFormsModule`, `FormsModule`, `LoadMediaOnTextDirective`, `KatexImgDirective`, `SharedModule`.

## 2. Mục đích

- **Pool** (`shuffledWords`): list từ gốc từ `question_direction`, có thể có duplicate. `isWordUsed` so sánh count `usedCount >= poolCount` để disable button khi đã dùng hết.
- **Sentence** (`userSentence`): click từ trong pool → `push` vào `userSentence`. Click từ trong sentence → `splice` trả về pool.
- **Đáp án đúng** = `userSentence`. Sau migrate, sync `answer_correct` mỗi khi `userSentence` đổi.
- **Luôn editable** — bỏ `isReadOnly`, bỏ nhánh "Đáp án đúng:" block riêng.

## 3. Inputs

| Input | Kiểu | Mô tả |
| --- | --- | --- |
| `courseQuestion` | `CourseQuestions \| any` | Cần `id`, `code`, `question_direction`, `answer_correct`, `children[]`. `answer_correct` format `\|word1\|word2\|...\|` để populate `userSentence` lúc load. |
| `av` | `number` | `1` = môn tiếng Anh (hiển thị `title_part` + direction cấp parent, wrap trong `part-container`). |

Sau migrate: **bỏ `@Input() isReadOnly`** — component luôn soạn (giống `drag-drop-editor`, `group-radio-editor`).

## 4. State

| Field | Kiểu | Mục đích |
| --- | --- | --- |
| `course_question` | `CourseQuestions` | Mirror input + enrich `title_part`. |
| `shuffledWords` | `string[]` | Trên mỗi question/child — parse `question_direction.split('/')`. |
| `userSentence` | `string[]` | Câu người dùng ghép — populate từ `answer_correct` lúc load. |

Sau migrate: **bỏ `new_answer_correct`** — không cần computed field vì block "Đáp án đúng:" đã gỡ.

## 5. Luồng xử lý

### 5.1 `ngOnChanges`

1. `course_question = courseQuestion`.
2. `getIsCorrectAns(course_question)`.
3. Sort `children` theo `question_number` (ưu tiên) hoặc `id`.
4. `getIsCorrectAns(child)` cho từng child.
5. `title_part = code.replace(/\-/gi, ' ')`.

### 5.2 `getIsCorrectAns(question)` — **cập nhật**

Hiện tại:
- `new_answer_correct = answer_correct.split('|').filter(m => m)` → giữ để tương thích parse cũ.
- `shuffledWords = question_direction.split('/').map(trim).filter(m => m)`.
- `userSentence = question.userSentence || []` (luôn rỗng lúc load).

Sau migrate:
- `userSentence` populate từ `answer_correct` lúc load: `String(answer_correct || '').split('|').map(trim).filter(m => m)`.
- **Bỏ `new_answer_correct`** — không dùng nữa.
- `shuffledWords` giữ nguyên (parse từ `question_direction`).

### 5.3 `addWord(q, word)`

- `q.userSentence.push(word)`.
- Gọi `syncAnswer(q)`.

Sau migrate: bỏ guard `if (this.isReadOnly) return`.

### 5.4 `removeWord(q, index)`

- `q.userSentence.splice(index, 1)`.
- Gọi `syncAnswer(q)`.

Sau migrate: bỏ guard `if (this.isReadOnly || !q.userSentence) return`.

### 5.5 `isWordUsed(q, word): boolean`

`userSentence.filter(w => w === word).length >= shuffledWords.filter(w => w === word).length`.

Giữ nguyên — handle duplicate words đúng.

### 5.6 `syncAnswer(q)` — **thêm mới**

```ts
syncAnswer(q: any) {
    q.answer_correct = q.userSentence?.length
        ? '|' + q.userSentence.join('|') + '|'
        : '';
}
```

Format: `|word1|word2|word3|` (giữ nguyên format hiện tại, parse cũ tương thích).

## 6. Format `answer_correct`

Hiện tại parse `split('|')` → `['', 'word1', 'word2', '', 'word3', '']` filter → `['word1', 'word2', 'word3']`. Mỗi từ wrap trong cặp pipe riêng.

Sau migrate: sync cùng format `|word1|word2|word3|` — không cần migrate dữ liệu cũ.

> **Lưu ý:** nếu từ có chứa `|` thì parse/sync sai. Edge case hiếm — ghi nhận để xử lý sau nếu phát sinh.

## 7. Template — `#questionTmpl`

**Hiện tại:**
- Pool `.word-btn` — `*ngIf="!isReadOnly && q.shuffledWords"`, `[disabled]="isWordUsed(q, word)"`, click `addWord`.
- Sentence `.sentence-box` — `*ngIf="!isReadOnly"`, `.word-chip.active` click `removeWord`.
- Correct block — `*ngIf="(isReadOnly || q.showCorrectAnswer) && q['new_answer_correct']?.length"` — **cần bỏ**.

**Sau migrate:**
- Pool luôn hiển thị — bỏ `*ngIf="!isReadOnly"`.
- Sentence luôn hiển thị — bỏ `*ngIf="!isReadOnly"`.
- **Bỏ toàn bộ block "Đáp án đúng:"** + `.answer-label-correct` + `.ans-tag.ans-tag-correct`.
- Bỏ block `.mode-switch` đã comment (đã có sẵn trong comment HTML).

## 8. CSS

Dọn các class không còn dùng:
- `.mode-switch`, `.switch-knob`, `.text-mode`, `.readonly-on` — bỏ.
- `.correct-box`, `.label-ans`, `.text-ans` — bỏ (nếu block correct đã gỡ).
- `.ans-tag`, `.ans-tag-correct` — bỏ.

Giữ: `.word-chip`, `.word-btn`, `.sentence-box`, `.sentence-box.is-active`, `.placeholder-txt`, `.question-block`, `.part-header`, `.question-header-section`.

## 9. Khác biệt với các editor khác

| Aspect | reorder-words-editor | drag-drop-editor | group-radio-editor |
| --- | --- | --- | --- |
| Pool | `string[]` (words) — có duplicate | `Answers[]` (objects) — unique | `Answers[]` — unique |
| Cơ chế | Click add/remove | CDK DragDrop | Click select/deselect |
| Answer format | `\|word1\|word2\|word3\|` | `\|id1;id2\|` | `\|id\|` |
| `isWordUsed` | So sánh count (handle duplicate) | N/A (unique) | N/A |
| Sentence | 1 sentence per question | Nhiều items matching | Nhiều choices |
| `answer_option` | Không có (không pool object) | Có | Có |
| Read-only mode | **Đã bỏ** (planned) | Đã bỏ | Đã bỏ |

## 10. Các bước migrate

1. **Bỏ `@Input() isReadOnly`** trong TS.
2. **Bỏ guard `isReadOnly`** trong `addWord` / `removeWord`.
3. **Thêm `syncAnswer(q)`** — ghi `|word1|word2|...|` vào `answer_correct`.
4. **Gọi `syncAnswer(q)`** sau `addWord` và `removeWord`.
5. **`getIsCorrectAns`**: thay `userSentence = question.userSentence || []` → populate từ `answer_correct` split `|`. Bỏ `new_answer_correct`.
6. **Template**: bỏ `*ngIf="!isReadOnly"` ở pool + sentence. Bỏ block "Đáp án đúng:" + `*ngIf showCorrectAnswer`.
7. **CSS**: dọn `.mode-switch`, `.correct-box`, `.ans-tag-correct` nếu không còn dùng.

## 11. Mở

- **Edge case từ chứa ký tự `|`:** parse/sync sai. Hiếm gặp nhưng cần nhận diện nếu dữ liệu thực tế có.
- **Định dạng answer:** giữ `|word1|word2|word3|` (match parse cũ) hay migrate sang `|word1;word2;word3|` (match `drag-drop-editor`)? → **đề xuất giữ pipe-format** để không phải migrate dữ liệu cũ.
- **Hiển thị từ đúng/sai khi parent set flag:** giống drag-drop `.is-answer-correct/wrong` — chưa có trong code, parent có thể thêm sau nếu cần.
- **`title_part` enrichment:** vẫn giữ `code.replace(/\-/gi, ' ')` — không thay đổi.

## 12. Lịch sử

- **2026-07-15**
  - Tạo plan từ code analysis.
  - Xác định scope migrate theo pattern `drag-drop-editor` / `group-radio-editor`.

## 13. Trạng thái

- Plan created.
- Code chưa sửa.
- Chưa build, chưa test.
