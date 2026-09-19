# Kế hoạch: Chức năng Soạn câu hỏi AI (Phase 1)

## Context

Tạo chức năng cho phép nhập/dán văn bản số lượng lớn câu hỏi vào CKEditor, gửi lên server cho AI phân tích, nhận về JSON string → tách/extract JSON → hiển thị kết quả thô.

**Phạm vi Phase 1:** Dừng ở mức **lấy kết quả từ AI + tách JSON ra** — chưa preview render, chưa lưu NHCH. (Bổ sung sau)

**Vị trí:** Nút `✨ Soạn câu hỏi AI` cạnh nút `[+ Thêm câu hỏi]` trong `cauhoi-tracnghiem-chitiet`, mở side drawer.

## Dữ liệu AI trả về

AI trả về JSON string, thường bị wrap trong markdown code block:

```text
Dưới đây là kết quả:
```json
[{ "question_type": "radio", ... }]
```
```

Cấu trúc mỗi item (tham khảo):
```typescript
interface AiQuestion {
  question_type: 'radio' | 'checkbox' | 'inputbox' | ...;
  question_direction: string;
  answer_option: { id: string; value: string }[];
  answer_correct: string;       // Format: "|id1|id2|" pipe-delimited
  group_id: number;
  code?: string;
  children?: AiQuestion[];
}
```

## Files

### Cần tạo mới

1. **`text-import-question/json-extract.util.ts`**
   - Hàm `extractJsonFromString(text: string): any`
   - Pattern: thử ` ```json ` → `[...]` → `{...}` → throw error

### Cần sửa

2. **`text-import-question/text-import-question.component.ts`**
   - `submitPrompt()`: gọi `extractJsonFromString()` trên response
   - Hiển thị kết quả dạng text/JSON thô (hoặc card đơn giản)
   - Parse `answer_correct` format `|id1|id2|` để hiển thị Đáp án
   - Đếm tổng số câu hỏi (kể cả children)

3. **`text-import-question/text-import-question.component.html`**
   - Header: icon `✨` + "Soạn câu hỏi AI"
   - CKEditor editor (code hiện tại)
   - Nút "🤖 Gửi đến AI" + loading
   - Kết quả: hiển thị JSON parsed hoặc card text đơn giản
   - Empty state khi chưa gửi

4. **`text-import-question/text-import-question.component.css`**
   - Style cơ bản, kế thừa code hiện tại

5. **`cauhoi-tracnghiem-chitiet.component.html`**
   - Thêm nút `✨ Soạn câu hỏi AI` (fa-sparkles, btn-info) cạnh nút Thêm câu hỏi
   - `#templateTextImportQuestion` side drawer — **giống hệt `#templateCreateQuestion`**:
     - Header: `ovic-over-right-section__head` + CDR name + stats + close button (y hệt)
     - Body: `ovic-over-right-section__body` — thay `p-tabView` bằng `<app-text-import-question>`

6. **`cauhoi-tracnghiem-chitiet.component.ts`**
   - Method `openTextImport()` — gọi `notificationService.openSideNavigationMenu({ template: this.templateTextImportQuestion, size: window.innerWidth, offsetTop: '0px' })`

## Chi tiết xử lý

### Extract JSON từ string AI

```typescript
export function extractJsonFromString(text: string): any {
  if (typeof text !== 'string') return text;

  // 1. Markdown code block ```json ... ```
  const blockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (blockMatch) {
    try { return JSON.parse(blockMatch[1].trim()); } catch {}
  }

  // 2. Array [...] hoặc Object {...}
  const arrayMatch = text.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]); } catch {}
  }
  const objectMatch = text.match(/\{[\s\S]*?\}/);
  if (objectMatch) {
    try { return JSON.parse(objectMatch[0]); } catch {}
  }

  throw new Error('Không tìm thấy JSON hợp lệ trong phản hồi từ AI');
}
```

### parse answer_correct

Format `"|1|3|"` → `["1", "3"]` → hiển thị A, C

## Tích hợp vào cauhoi-tracnghiem-chitiet

- Nút `✨ Soạn câu hỏi AI` cạnh nút "Thêm câu hỏi" trong `question-content-header`
- Click → gọi `openTextImport()` → `notificationService.openSideNavigationMenu(...)`
- Side drawer `#templateTextImportQuestion`:
  - **Header:** clone `#templateCreateQuestion` — CDR name + stats (biết/understand/apply...) + close button
  - **Body:** `<app-text-import-question>` (không có tab, không có `p-tabView`)
- Phase 1 KHÔNG lưu — chỉ xem kết quả AI tách được

## Changelog

### 2026-06-30 — Lần 1: Tạo kế hoạch ban đầu
**Mục đích:** Kế hoạch gốc cho component nhập text cơ bản.

### 2026-06-30 — Lần 2: Cập nhật theo dữ liệu AI thật
**Mục đích:** Bổ sung xử lý cấu trúc phân cấp, extract JSON từ string, đa loại câu hỏi.

### 2026-06-30 — Lần 3: Thay đổi vị trí tích hợp + tên nút
**Mục đích:** Chuyển từ tab → nút riêng "✨ Soạn câu hỏi AI" cạnh "Thêm câu hỏi".

### 2026-06-30 — Lần 4: Thu gọn phạm vi Phase 1
**Mục đích:** Chỉ làm đến extract JSON + hiển thị kết quả. Bỏ qua preview render, lưu NHCH. Sẽ bổ sung sau.

**Các thay đổi:**
1. **`plans/text-import-question.md`** — Thu gọn files cần sửa, bỏ các mục preview render + lưu
2. **`text-import-question/text-import-question.component.ts`** — Chỉ sửa `submitPrompt()` dùng `extractJsonFromString()`, parse cơ bản
3. **`text-import-question/json-extract.util.ts`** — File mới: hàm extract JSON
4. **`cauhoi-tracnghiem-chitiet.component.html`** — Nút + drawer
5. **`cauhoi-tracnghiem-chitiet.component.ts`** — Method `openTextImport()`

**Kết quả:** Phase 1 hoàn thành: user copy-paste text → gửi AI → xem JSON parsed.

### 2026-06-30 — Lần 5: UI/UX theo _rules.md + A4 editor
**Mục đích:** Áp dụng UI/UX rules từ `docs/_rules.md`: CSS variables, gradient header, pill badges, hover effects, scrollbar. Editor khung A4 dọc (210mm × 297mm).

**Các thay đổi:**
1. **`text-import-question/text-import-question.component.css`** — Viết lại toàn bộ: CSS variables, gradient header, A4 editor (210mm × 297mm), pill badges, hover cards, custom scrollbar
2. **`text-import-question/text-import-question.component.html`** — Header gradient + accent bar, editor wrapper A4, action bar pill button, loading spinner, error alert, question cards mới
3. **`plans/text-import-question.md`** — Ghi log lần 5

**Kết quả:** Giao diện hiện đại, đồng bộ _rules.md. Editor có kích thước A4 dọc.

### 2026-06-30 — Lần 7: Triển khai Phase 2 — Preview trực quan
**Mục đích:** Triển khai preview trực quan side-by-side với 9 question-type components + toolbar.

**Các thay đổi:**
1. **`text-import-question.component.ts`** — Thêm `@Input() selectedCourse + chuan_dau_ra`; `previewMode`; `enrichQuestion()` normalize `answer_correct` AI format; toolbar methods `togglePrivate/Invert/onCdrChange/editAgain/onDividerMouseDown`; imports 9 question-type components
2. **`text-import-question.component.html`** — Split-layout: editor panel trái (560px) + drag divider + preview panel phải với ngSwitch 9 question types. Giữ legacy single-column mode
3. **`text-import-question.component.css`** — `.split-layout` flex, `.drag-divider` col-resize, `.toolbar-btn/select` pill style, responsive <1400px
4. **`cauhoi-tracnghiem-chitiet.component.html`** — Binding `[selectedCourse] + [chuan_dau_ra]` vào `<app-text-import-question>`

### 2026-06-30 — Lần 6: Bổ sung kế hoạch Phase 2 — Preview câu hỏi
**Mục đích:** Bổ sung preview trực quan với layout side-by-side, render câu hỏi dạng radio/checkbox/inputbox thật.

### 2026-06-30 — Lần 8: Side-by-side luôn bật, preview centered
**Mục đích:** Fix 3 vấn đề: (1) luôn ở dạng side-by-side trên ≥1400px kể cả khi chưa nhập; (2) preview card `margin: 0 auto`; (3) bỏ `.preview-card__direction` trùng với `question_direction` trong question-type component (giống `question-content-mid`).

**Các thay đổi:**
1. **`text-import-question.component.html`** — Bỏ `*ngIf="previewMode && responseData"` trên split-layout; bỏ `.preview-card__direction` (question-type component tự render)
2. **`text-import-question.component.css`** — `.preview-card` thêm `margin: 0 auto`; media query `≥1400px` ẩn single-column, `<1399px` ẩn split-layout
3. **`plans/text-import-question.md`** — Ghi log lần 8

### 2026-07-03 — Lần 9: Triển khai preview dùng các `*-editor` component (hướng tiết kiệm)
**Mục đích:** Render preview trực quan bằng cách tái sử dụng 8 `app-*-editor` component có sẵn trong `text-import-answer-editor/`, thay vì tạo `TextImportPreviewComponent` riêng (hướng A — hoãn).

**Quyết định:** Hướng A (component chuyên biệt) **chưa triển khai** — chờ đánh giá thêm. Hướng B hiện đang chạy: dùng editor components có sẵn.

**Các thay đổi:**
1. **`text-import-question.component.html`** — `[ngSwitch]` 8 `app-*-editor` (radio-and-checkbox, inputbox, group-input, grouping, drag-drop, group-radio, reorder-words, arrange-paragraphs), phân nhánh theo `selectedCourse.av`:
   - `av=0` (6 type): radio/checkbox/inputbox/group-input/grouping/drag_drop/group-radio
   - `av=1` (7 type): radio/checkbox/inputbox/grouping/drag_drop/reorder_words/arrange_paragraphs
   - `*ngSwitchDefault`: alert "Loại câu hỏi chưa được hỗ trợ"
2. **`text-import-question.component.ts`** — Import 8 `*EditorComponent`; `enrichQuestion()` gán defaults (private, config, cdr, `_text`, `_answers`, `_correctAnswerLabel`, `_typeLabel`, `_cdrLabel`, `_hasChildren`)
3. **`plans/text-import-question.md`** — Ghi log lần 9

**Ghi chú kỹ thuật:**
- Import `QuestionTypeGroupRadioComponent` (từ `question-types-view/`) hiện **đang thừa** — không dùng trong template
- `_answers` / `_correctAnswerLabel` chỉ phục vụ **single-column mode** (legacy fallback <1400px), không dùng ở split-layout
- CDR UI: dropdown (`selectCdr.week === 100` + `listCdr`) **+** badge `_cdrLabel` — hiển thị song song

### 2026-07-15 — Lần 10: Đồng bộ plan ↔ code thực tế
**Mục đích:** Sửa plan cho khớp với implementation.

**Các cập nhật:**
1. Preview render: `ngSwitch` 8 `app-*-editor` — KHÔNG phải `TextImportPreviewComponent` (hướng A hoãn)
2. Nhánh `av`: `av=0` (6 type) / `av=1` (7 type, thêm reorder_words + arrange_paragraphs)
3. CDR UI: dropdown (KTHP) + badge `_cdrLabel` (Bloom)
4. Tab "Kiểm thử": placeholder, chưa triển khai `TextImportTestPreviewComponent`
5. Single-column fallback <1400px vẫn giữ legacy `_answers` cards

---

## Phase 2: Preview trực quan (giống question-content-mid)

**Sau Phase 1** (AI → extract JSON → card text) → Phase 2 thay thế hoàn toàn khu vực preview bên phải, render câu hỏi **dùng chính component `question-type-*`** đã có (tái sử dụng từ `question-content-mid`), kèm thanh công cụ chỉnh sửa nhanh (toolbar).

> **Nguyên tắc:** Preview dùng lại `app-question-type-radio-and-checkbox`, `app-question-type-inputbox`, ... giống hệt `question-content-mid`. **Không tự render thủ công** radio/checkbox — dùng component có sẵn.

### Bố cục tổng thể — Side-by-side (vì không mobile)

```
┌──────────── EDITOR PANEL ────────────┬─────────── PREVIEW PANEL ────────────┐
│  (giữ nguyên Phase 1)                │  Toolbar mỗi card:                   │
│                                      │  [Public/Private] [Đảo PA] [CDR ▼]  │
│  [CKEditor A4]                       ├──────────────────────────────────────┤
│                                      │  Card hiển thị giống question-mid:   │
│  [🤖 Gửi đến AI]                     │  ┌─ question-header ──────────────┐  │
│                                      │  │ (bỏ id, bỏ status)             │  │
│                                      │  │ [Public|Private] [Đảo] [CDR ▼] │  │
│                                      │  └────────────────────────────────┘  │
│                                      │  ┌─ question-item-content ────────┐  │
│                                      │  │ <app-question-type-radio-...>  │  │
│                                      │  │   (tương tác được:             │  │
│                                      │  │    chọn đáp án, kéo thả,       │  │
│                                      │  │    nhập input)                 │  │
│                                      │  └────────────────────────────────┘  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Breakpoint

| Màn hình | Layout |
|---|---|
| **≥1400px** | Editor 560px fixed + Preview `calc(100% - 560px)` |
| **<1400px** | Editor 45% + Preview 55% |

**Divider:** Thanh kéo (drag handle) giữa 2 panel — user tự resize.

### Kích thước preview

| Khoản mục | Giá trị |
|---|---|
| Card max-width | 980px (giống `fade-in` ở question-content-mid) |
| Card padding | 16px (giống `question-header`) |
| Font đáp án | 14px (giống `question-item-content`) |
| Gap giữa card | 16px |

### Tính năng trên preview

Mỗi card preview có **toolbar riêng** ở header:

| Tính năng | Mô tả | UX |
|---|---|---|
| **Public / Private** | Chuyển trạng thái `private: 0 ↔ 1` | Nút toggle: `[Public]` / `[Private]` — click để chuyển |
| **Đảo phương án** | Bật/tắt `config.invertedAnswer` | Nút toggle: `[Đảo PA: Bật]` / `[Đảo PA: Tắt]` — click để chuyển |
| **CDR (chuẩn đầu ra)** | Chọn cdr từ danh sách `chuan_dau_ra` | Dropdown select hiện label Bloom. Giống `{{parent_q.cdr \| showlabel : chuan_dau_ra: 'id' : 'label'}}` |
| **Tương tác đáp án** | Chọn/kéo thả/nhập để xác định đáp án đúng | Component `question-type-*` đã có sẵn tương tác. **KHÔNG editor nội dung phương án** — chỉ thao tác chọn đáp án |

### Loại bỏ khỏi card preview

- **Bỏ** `#{{id}}` (question-code)
- **Bỏ** toàn bộ dòng trạng thái: `<div [ngSwitch]="parent_q.status">` (Đạt / Chờ duyệt / Yêu cầu sửa)

### Các component tái sử dụng

| `question_type` | Component | Import |
|---|---|---|
| `radio` | `app-question-type-radio-and-checkbox` | `QuestionTypeRadioAndCheckboxComponent` |
| `checkbox` | `app-question-type-radio-and-checkbox` | `QuestionTypeRadioAndCheckboxComponent` |
| `inputbox` | `app-question-type-inputbox` | `QuestionTypeInputboxComponent` |
| `reorder_words` | `app-question-type-reorder-words` | `QuestionTypeReorderWordsComponent` |
| `arrange_paragraphs` | `app-question-type-arrange-paragraphs` | `QuestionTypeArrangeParagraphsComponent` |
| `drag_drop` | `app-question-type-drag-drop` | `QuestionTypeDragDropComponent` |
| `group-input` | `app-question-type-group-input` | `QuestionTypeGroupInputComponent` |
| `group-radio` | `app-question-type-group-radio` | `QuestionTypeGroupRadioComponent` |
| `grouping` | `app-question-type-grouping` | `QuestionTypeGroupingComponent` |

### UX flow

```
1. User nhập text → click [🤖 Gửi đến AI]
2. AI trả về → tách JSON → editor bên trái mờ đi (disabled)
3. Preview bên phải tự động render:
   - Card giống question-content-mid
   - Toolbar: [Public/Private] [Đảo PA] [CDR ▼]
   - Câu hỏi dùng component question-type-* (tương tác được)
4. User có thể:
   - Click chọn đáp án đúng (radio/checkbox)
   - Kéo thả từ (reorder)
   - Nhập đáp án (inputbox)
   - Bật/tắt Public/Private
   - Bật/tắt Đảo phương án
   - Chọn CDR
5. Nút [✏️ Chỉnh sửa lại] → editor active lại, preview ẩn
```

### Files đã sửa (sau khi thay 8 question-type components → TextImportPreviewComponent)

| File | Thay đổi |
|---|---|
| **`text-import-question.component.ts`** | Import `TextImportPreviewComponent` thay 8 `QuestionType*Component` imports. `enrichQuestion()` thu gọn: chỉ gán defaults (private, config, cdr), không normalize answer — `TextImportPreviewComponent` tự xử lý |
| **`text-import-question.component.html`** | Thay `[ngSwitch]` 9 `app-question-type-*` bằng `<app-text-import-preview>` duy nhất |
| **`text-import-question.component.css`** | `.split-layout { display: flex }`, `.editor-panel { width: 560px; flex-shrink: 0 }`, `.preview-panel { flex: 1; overflow: hidden }`, `.drag-divider { cursor: col-resize; width: 6px }`, `.toolbar-btn`, `.toolbar-select`, responsive <1400px |
| **`text-import-preview/text-import-preview.component.ts`** | **Mới.** Component preview chuyên biệt (xem mô tả bên dưới) |
| **`text-import-preview/text-import-preview.component.html`** | **Mới.** 9 templates (simpleChoice, inputbox, reorderWords, arrangeParagraphs, dragDrop, groupInput, grouping) |
| **`text-import-preview/text-import-preview.component.css`** | **Mới.** Style đồng bộ CSS variables, ans-card click chọn, drag-drop, chip tags |
| **`cauhoi-tracnghiem-chitiet.component.html`** | Truyền `[selectedCourse]` + `[chuan_dau_ra]` vào `<app-text-import-question>` |
| **`cauhoi-tracnghiem-chitiet.component.ts`** | (Không cần sửa) |

## Chi tiết xử lý bổ sung

### CDR Dropdown trong preview-card__header

Thay thế CDR badge (`getCdrLabel`) bằng dropdown chọn CDR cho mỗi question card trong preview panel, giống pattern từ `cauhoi-tracnghiem-create-form`.

**HTML trong `preview-card__header` (phần `preview-card__header-right`):**
```html
<!-- CDR dropdown thay badge -->
<div class="toolbar-cdr-dropdown" *ngIf="chuan_dau_ra && chuan_dau_ra.length">
    <p-dropdown [baseZIndex]="1099" scrollHeight="400px" appendTo="body"
        styleClass="w-100 custom-dropdown" [filter]="true" 
        [options]="chuan_dau_ra" [(ngModel)]="question.cdr" 
        optionLabel="label" optionValue="id"
        placeholder="CDR">
    </p-dropdown>
</div>
```

**Thay đổi trong `text-import-question.component.ts`:**
1. Import `DropdownModule` từ `primeng/dropdown` (vì component standalone)
2. Thêm method `onCdrChange(question: any, cdrId: number)` — cập nhật `question.cdr` (có thể không cần nếu dùng `[(ngModel)]`)
3. Import `FormsModule` đã có sẵn
4. Bỏ `private enrichQuestion` auto-set `q.cdr = this.activeLevelId || 0` — vì CDR do user chọn qua dropdown (giữ giá trị AI trả về hoặc để user chọn)

**Thay đổi trong `text-import-question.component.html`:**
- Trong `preview-card__header-right`: thay `<span class="header-pill toolbar-cdr-badge" *ngIf="question.cdr">{{ getCdrLabel(question.cdr) }}</span>`
bằng `<p-dropdown>` như trên

**Thay đổi trong `text-import-question.component.css`:**
- Style `.toolbar-cdr-dropdown` — kích thước nhỏ gọn, đồng bộ với các toolbar-btn khác
- Override `p-dropdown` trong preview card: nhỏ hơn, không border, hover hiện border

## Liên kết

- **TextImportPreviewComponent** — Xem plan riêng: [`plans/text-import-preview.md`](text-import-preview.md)
