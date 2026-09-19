# Kế hoạch: Kiểm thử tất cả câu hỏi trong text-import-question

## Mục tiêu

Thêm tab "Kiểm thử" vào `text-import-question`, cho phép người dùng tương tác thử tất cả câu hỏi AI vừa tạo cùng lúc → bấm "Kiểm tra đáp án" → xem kết quả từng câu + tổng hợp. Hỗ trợ cả format môn khác (`av=0`) và tiếng Anh (`av=1`).

## Kiến trúc — 2 tabs

```
┌──────────────────────────────────────────────────────────────┐
│  [Soạn câu hỏi]  [Kiểm thử]                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tab "Soạn câu hỏi": giữ nguyên split-layout hiện tại       │
│  (editor A4 + preview với toolbar Public/Đảo PA/CDR)         │
│                                                              │
│  Tab "Kiểm thử": standalone component riêng                  │
│  → dùng 9 app-question-type-* components trực tiếp            │
│  → nút [Kiểm tra đáp án] + result badge + [Thử lại] + [Đóng]│
└──────────────────────────────────────────────────────────────┘
```

**Quan trọng:** Data test là **deep clone** từ responseArray gốc → thao tác trên tab Kiểm thử không ảnh hưởng tab Soạn câu hỏi.

## Files thay đổi

| File | Thay đổi |
|---|---|
| **text-import-test-preview/** | **MỚI** — 3 files: .ts / .html / .css — standalone component chứa toàn bộ logic test |
| **text-import-question.component.html** | Thêm `p-tabView` 2 tab; tab 2 = `<app-text-import-test-preview>` với binding `[testFormat]` |
| **text-import-question.component.ts** | Import `TextImportTestPreviewComponent`; thêm `activeTab`, `testTotalCount`, `testResponseArray`; proxy events `onTestCheckComplete()` / `onTestRetry()` |

## Cấu trúc TextImportTestPreviewComponent

### Inputs

| Input | Type | Mô tả |
|---|---|---|
| `responseArray` | `any[]` | Dữ liệu câu hỏi (deep clone riêng, ko mutate parent) |
| `av` | `number` | Khóa học (0 = monkhac, 1 = tienganh) |
| `testTotalCount` | `number` | Tổng số câu (từ parent, chỉ để hiển thị) |
| `testFormat` | `'monkhac' \| 'tienganh'` | Phân nhánh template render (mặc định `'monkhac'`) |

### Outputs

| Output | Payload | Mô tả |
|---|---|---|
| `checkComplete` | `{ correctCount: number; totalCount: number }` | Khi user bấm "Kiểm tra đáp án" |
| `retryRequested` | `void` | Khi user bấm "Thử lại" |
| `close` | `void` | Khi user bấm "Đóng" → parent chuyển tab về 0 |

### Internal state

- `initialData: any[]` — deep clone giữ lại trạng thái ban đầu để retry
- `testChecked: boolean` — đã check đáp án chưa
- `testCorrectCount: number`

### Lifecycle

```typescript
ngOnChanges(changes): void {
  if (changes['responseArray'] && this.responseArray?.length > 0) {
    this.initialData = this.cloneData(this.responseArray);  // snapshot cho retry
    this.resetAllState();
  }
}
```

### Data flow

```
text-import-question
  ↓ tạo deep clone: syncTestData() → JSON.parse(JSON.stringify(responseArray))
  ↓ pass riêng: [responseArray]="testResponseArray"
text-import-test-preview
  ↓ ngOnChanges → clone vào initialData
  ↓ User tương tác với 9 question-type components
  ↓ checkAllAnswers() → evaluate từng câu → set highlight flags
  ↓ retryAll() → restore từ initialData → clone lại → reset state
```

## Template

```
┌──────────────────────────────────────────────────────────────┐
│  ┌── Scrollable body ───────────────────────────────────┐     │
│  │  ┌── A4 card 1 ──────────────────────────────────┐   │     │
│  │  │  [app-question-type-*] tương ứng question_type │   │     │
│  │  └────────────────────────────────────────────────┘   │     │
│  │  ┌── A4 card N ──────────────────────────────────┐   │     │
│  │  │  [app-question-type-*]                        │   │     │
│  │  └────────────────────────────────────────────────┘   │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌── Result badge (khi testChecked) ───────────────────┐     │
│  │  ✅ Kết quả: 7/10 câu đúng   (green/red bg)       │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌── Footer ───────────────────────────────────────────┐     │
│  │  [Đóng]  [🔄 Thử lại] (khi đã check)  [🧪 Kiểm tra] │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

Result badge nằm **giữa body và footer** (không sticky top) — tránh che mất câu hỏi khi scroll.

### Template phân nhánh

```
*ngIf="testFormat !== 'tienganh'" → monkhac types (dùng question-type components)
*ngIf="testFormat === 'tienganh'" → tienganh types (dùng question-type components)
```

Hiện tại cả 2 nhánh đều render cùng 11 components — tất cả `*ngSwitchCase` trong 1 `*ngFor`.

Danh sách đầy đủ: radio, checkbox, inputbox, group-input, group-radio, drag_drop, grouping, reorder_words, arrange_paragraphs.
Trước đây drag_drop + grouping tách riêng thành section step-through (1 câu 1 lần) do conflict CDK ID. Sau khi dùng `cdkDropListGroup`, chúng render đồng loạt như các loại khác.

### A4 card highlight

```html
<div *ngFor="let question of responseArray"
     [class.is-correct]="testChecked && question.isCorrect && !question.children"
     [class.is-wrong]="testChecked && question.isWrong && !question.children">
```

## 9 question-type components

| question_type | Component |
|---|---|
| radio | `app-question-type-radio-and-checkbox` |
| checkbox | `app-question-type-radio-and-checkbox` |
| inputbox | `app-question-type-inputbox` |
| group-input | `app-question-type-group-input` |
| group-radio | `app-question-type-group-radio` |
| drag_drop | `app-question-type-drag-drop` |
| grouping | `app-question-type-grouping` |
| reorder_words | `app-question-type-reorder-words` |
| arrange_paragraphs | `app-question-type-arrange-paragraphs` |

Tất cả `[isReadOnly]="false"`.

### Lưu ý drag_drop + grouping — cdkDropListGroup

2 component này dùng `@angular/cdk/drag-drop`. Ban đầu dùng `id` cứng + `dropListIds` để nối pool với drop zones → conflict global ID registry khi render nhiều instance cùng view.

**Fix:** Wrap pool + drop zones trong `cdkDropListGroup` (thuộc tính directive, không cần ID). CDK tự động nối tất cả `cdkDropList` con trong group.

**Trước:**
```html
<!-- TS gán: q['dropListIds'] = ['pool', 'drop-0', 'drop-1', ...] -->
<div cdkDropList id="pool" [cdkDropListConnectedTo]="q.dropListIds">...</div>
<div cdkDropList [id]="'drop-' + i" [cdkDropListConnectedTo]="q.dropListIds">...</div>
```

**Sau:**
```html
<div cdkDropListGroup>
  <div cdkDropList>...</div>                     <!-- pool -->
  <div cdkDropList>...</div>                     <!-- drop zone -->
</div>
```

Không cần `dropListIds`, `_qid`, `_fallbackUid` trong TS nữa.

## Logic checkAllAnswers

```typescript
checkAllAnswers(): void {
  let correctCount = 0;
  this.responseArray.forEach(q => {
    this.resetQuestionState(q);
    // Case 1: Pure children (no answer_option)
    if (q.children?.length && !q.answer_option?.length) {
      let childOk = 0;
      q.children.forEach(child => {
        this.resetQuestionState(child);
        if (this.evaluateQuestionCorrectness(child)) childOk++;
      });
      q.showCorrectAnswer = true;
      q.isCorrect = childOk === q.children.length;
      q.isWrong = !q.isCorrect;
      correctCount += childOk;
    }
    // Case 2: Group types with children
    else if (q.children?.length && ['group-input','group-radio','drag_drop','grouping'].includes(q.question_type)) {
      this.evaluateQuestionCorrectness(q);  // evaluate cả parent group
      const childCorrectCount = q.children.filter((c: any) => c.isCorrect).length;
      q.showCorrectAnswer = true;
      q.isCorrect = childCorrectCount === q.children.length;
      q.isWrong = !q.isCorrect;
      correctCount += childCorrectCount;
    }
    // Case 3: Single question
    else {
      if (this.evaluateQuestionCorrectness(q)) correctCount++;
    }
  });
  this.testCorrectCount = correctCount;
  this.testChecked = true;
  this.checkComplete.emit({ correctCount, totalCount: this.countTestableQuestions() });
}
```

Lưu ý: Case 2 gọi `evaluateQuestionCorrectness(q)` — không có method `evaluateGroupQuestion` riêng. Mỗi evaluate method tự xử lý children bên trong nó.

### Evaluate theo từng type

| Type | Logic | children handling |
|---|---|---|
| **radio** | `answer_option[].isSelected` so với `answer_correct` parsed IDs (1 ID) | Nếu có children → evaluate từng child, set `child.isCorrect/isWrong` |
| **checkbox** | Set selected IDs === set correct IDs (exact match) | Nếu có children → evaluate từng child |
| **inputbox** | `userAnswer` trim+lowercase match với `answer_correct` split by `\|` | Nếu có children → evaluate từng child |
| **group-input** | Từng child: `child.answer` (ko phải userAnswer) trim+lowercase vs `child.answer_correct` | Set `child['new_answer_correct']` để component hiển thị "Đáp án đúng:" |
| **group-radio** | Từng child: `child.answer_option[].isSelected` vs `child.answer_correct` | Mark green cho correct IDs, red cho selected-sai |
| **drag_drop** | Từng child: `child.answer[0]?.id` vs `answer_correct` (parse digits) | Set `child.correct_id` để component highlight |
| **grouping** | Từng child: `child.answer[].id` set match vs `answer_correct` (parse `;`) | Mark isCorrect/isWrong trên từng answer item |
| **reorder_words** | Join `child.userSentence[]` → string match với `answer_correct` split by `\|` | so sánh cả câu, ko so từng từ |
| **arrange_paragraphs** | So thứ tự `answer_option[].id` theo index với `answer_correct` parsed IDs (tuần tự) | Có thể target children hoặc chính q |

### Parse helpers

| Helper | Input | Output | Dùng cho |
|---|---|---|---|
| `parseCorrectAnswerIds()` | `"1,2,3"` | `["1","2","3"]` (bỏ `\|`) | radio, checkbox, arrange_paragraphs |
| `parseCorrectAnswerIdsSemicolon()` | `"1;2;3"` | `["1","2","3"]` (bỏ `\|`) | grouping |
| `parseCorrectAnswerIdDigits()` | `"abc123def"` | `"123"` (extract digits) | drag_drop |
| `parseCorrectAnswerValues()` | `"a\|b\|c"` | `["a","b","c"]` (split `\|`) | inputbox, group-input |

### Highlight flags

- `q.showCorrectAnswer = true` — bật hiển thị đáp án đúng
- `q.isCorrect` / `q.isWrong` — trạng thái đúng/sai
- `ans.isCorrect = true` — answer_option đúng (green)
- `ans.isWrong = true` — answer_option user chọn nhưng sai (red)
- `child.isCorrect` / `child.isWrong` — cho group types
- Template CSS class: `.is-correct` / `.is-wrong` trên A4 card

### Retry

```typescript
retryAll(): void {
  if (!this.initialData?.length) return;
  this.responseArray = this.cloneData(this.initialData);  // restore từ snapshot
  this.resetAllState();                                    // reset flags + counts
  this.retryRequested.emit();
}
```

Clone priority: `structuredClone` → fallback `JSON.parse(JSON.stringify(...))`.

### Đếm tổng số câu

```typescript
countTestableQuestions(): number {
  let count = 0;
  for (const item of this.responseArray) {
    if (item.children?.length && !item.answer_option?.length) {
      count += item.children.length;        // Pure children — đếm children
    } else if (item.children?.length && ['group-input','group-radio','drag_drop','grouping'].includes(item.question_type)) {
      count += item.children.length;        // Group — đếm children
    } else {
      count++;                              // Single — đếm 1
    }
  }
  return count;
}
```

Đồng bộ với `countAllQuestions()` trong parent component.

## CSS

### Layout classes

| Class | Vai trò |
|---|---|
| `.test-preview-container` | Flex column, full height, max-height 90vh, bg `#eef1f5` |
| `.test-preview-body` | flex: 1, overflow auto, center A4 cards với gap 24px |
| `.test-preview-a4-page` | 794px width, white bg, box-shadow, padding 24px |
| `.test-preview-result` | Result badge container, border-top, white bg |
| `.result-badge` | Inline-flex badge, rounded 6px, font-weight 600 |
| `.result-correct` | Green bg `#d4edda`, text `#155724` |
| `.result-wrong` | Red bg `#f8d7da`, text `#721c24` |
| `.test-preview-footer` | Flex end, gap 8px, border-top, bg `#f8f9fa` |

### Answer highlight (`::ng-deep`)

Dùng `:host ::ng-deep` để penetrate encapsulation của child question-type components (specificity `(0,1,1)` > child `(0,1,0)`):

| Selector | Hiệu ứng |
|---|---|
| `.is-answer-correct` | Green bg `#d4edda`, border `#28a745`, text `#155724` |
| `.is-answer-correct .ans-label` | Label green `#28a745` |
| `.is-answer-wrong` | Red bg `#f8d7da`, border `#dc3545`, text `#721c24` |
| `.is-answer-wrong .ans-label` | Label red `#dc3545` |
| `.is-answer-wrong.word-chip.active` | Cho reorder words chips |
| `.is-answer-wrong.word-btn` | Cho reorder words buttons |
| `.sentence-box.is-answer-wrong` | Cho reorder words sentence box |
| `input.is-answer-wrong` | Input fields red |
| `.form-control.is-answer-wrong` | Form controls red |
| `.state-active.is-answer-wrong` | **Override** state-active (xanh) khi đáp án sai — cần thiết vì state-active có `!important` |

Note: `.test-preview-header`, `.test-preview-direction`, `.test-preview-media` defined trong CSS nhưng **không dùng** trong template hiện tại — có thể remove nếu muốn clean.

## Parent integration (text-import-question)

### Thêm vào component.ts

```typescript
// State cho tab Kiểm thử
activeTab: number = 0;
testTotalCount: number = 0;
testResponseArray: AiQuestion[] = [];  // deep clone riêng

// Clone data khi responseArray thay đổi
private syncTestData(): void {
  this.testResponseArray = this.responseArray.length > 0
    ? JSON.parse(JSON.stringify(this.responseArray))
    : [];
}

// Đếm số câu testable (đồng bộ với child)
private countAllQuestions(data: AiQuestion[]): number { ... }

// Proxy events
onTestCheckComplete(event: { correctCount: number; totalCount: number }): void {
  this.testTotalCount = event.totalCount;
}
onTestRetry(): void { /* child tự xử lý data */ }
```

### Template binding

```html
<p-tabView [(activeIndex)]="activeTab">
  <p-tabPanel header="Soạn câu hỏi"> ... </p-tabPanel>
  <p-tabPanel header="Kiểm thử">
    <app-text-import-test-preview
      [responseArray]="testResponseArray"
      [av]="selectedCourse?.av || 0"
      [testTotalCount]="testTotalCount"
      [testFormat]="selectedCourse?.av === 1 ? 'tienganh' : 'monkhac'"
      (checkComplete)="onTestCheckComplete($event)"
      (retryRequested)="onTestRetry()"
      (close)="activeTab = 0">
    </app-text-import-test-preview>
  </p-tabPanel>
</p-tabView>
```

## Changelog

### 2026-07-07 — Lần 1: Tạo kế hoạch
Thêm tab "Kiểm thử" trong text-import-question, dùng chung TextImportPreviewComponent với testMode.

### 2026-07-07 — Lần 2: Thiết kế 2 tabs
Chuyển từ inline toggle → 2 tabs rõ ràng (Soạn câu hỏi / Kiểm thử), dùng p-tabView.

### 2026-07-07 — Lần 3: Đồng bộ với code thực tế
Thay đổi design từ "dùng lại TextImportPreviewComponent với testMode" → "standalone component TextImportTestPreviewComponent render question-type components trực tiếp".

### 2026-07-08 — Lần 4: Bổ sung CSS highlight và fix 4 bugs
1. Thêm `::ng-deep .is-answer-correct` / `.is-answer-wrong` CSS
2. Thêm `.state-active.is-answer-wrong` selector để override state-active
3. Fix av binding: `[av]="0"` → `[av]="av"`
4. Fix deep clone trong prepareTestData — tránh mutate data tab 1

### 2026-07-20 — Lần 5: Tối ưu plan khớp code thực tế
1. Thêm `testFormat` input + template phân nhánh monkhac/tienganh
2. Thêm `close` output + nút Đóng
3. Sửa data flow: dùng `ngOnChanges` thay `prepareTestData()`, clone bằng `structuredClone` fallback `JSON.parse`
4. Sửa `checkAllAnswers()` logic: không có `evaluateGroupQuestion`, tất cả qua `evaluateQuestionCorrectness()`
5. Sửa vị trí result bar: giữa body và footer (ko sticky top)
6. Sửa `retryAll()`: dùng `cloneData()` thay `JSON.parse` + không có `enrichTestData`
7. Bổ sung CSS layout classes thực tế
8. Ghi chú CSS dead code có thể clean

### 2026-07-20 — Lần 6: Bỏ step-through drag/grouping, dùng cdkDropListGroup
1. Thay `id` cứng + `dropListIds` bằng `cdkDropListGroup` — auto-connect pool/drop zones, tránh conflict global ID registry
2. Xóa drag-step state: `dragStepTypes`, `dragCurrentIndex`, `backupDragState()`, `restoreDragState()`, `dragPrev/Next/GoTo()`
3. drag_drop + grouping render đồng loạt trong `*ngFor` cùng các loại khác

### 2026-07-20 — Lần 7: Fix crash + group-input not showing correct answer
1. **Fix `q.answer.forEach is not a function`:** Thêm `Array.isArray(q.answer)` guard trong `resetQuestionState()` — tránh crash khi `q.answer` là string (group-input dùng `[(ngModel)]="child.answer"` → string)
2. **Fix group-input không hiển thị đáp án đúng:** Đổi thứ tự case trong `checkAllAnswers()` — group types (group-input, group-radio, drag_drop, grouping) được check trước pure children. Trước đây group-input rơi vào pure-children case → child không có `question_type` → evaluate default false → không set `new_answer_correct` → template không hiển thị "Đáp án đúng:"
