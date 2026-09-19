# Drag Drop Editor

> Bá»™ soáº¡n Ä‘Ã¡p Ã¡n cho cÃ¢u há»i dáº¡ng **kÃ©oâ€“tháº£ ghÃ©p Ä‘Ã´i** (Matching Drag & Drop). Pool Ä‘Ã¡p Ã¡n chung, má»—i `child` nháº­n tá»‘i Ä‘a 1 Ä‘Ã¡p Ã¡n. ÄÃ¡p Ã¡n Ä‘Ãºng = item trong `item.answer`; kÃ©o tháº£ / click tráº£ vá» pool Ä‘á»“ng bá»™ ngÆ°á»£c `child.answer_correct` theo format `|id|`.
>
> **TÃ¡ch `answer_option` (parent) â†” `pool` (component):** `pool` lÃ  shallow copy `answer_option`, lÆ°u trÃªn component field. Má»i thay Ä‘á»•i (filter / sort / push) chá»‰ tÃ¡c Ä‘á»™ng lÃªn `pool` â€” `answer_option` gá»‘c cá»§a parent **khÃ´ng bá»‹ mutate**.

## Tá»•ng quan

| Má»¥c | Ná»™i dung |
| --- | --- |
| Selector | `app-drag-drop-editor` (standalone) |
| Inputs | `courseQuestion`, `av` |
| State | `course_question` (enrich `title_part`), `pool` (clone) |
| Format answer | `\|id\|` má»—i child (thÆ°á»ng 1 id, cÃ³ thá»ƒ nhiá»u) |
| Items/zone | 1 (tá»‘i Ä‘a) |
| CDK connect | `cdkDropListGroup` trÃªn `.drag-area` â€” pool + drop zones tá»± káº¿t ná»‘i |
| Tráº¡ng thÃ¡i | Code xong, plan xong, **chÆ°a build, chÆ°a test** |

## 1. Vá»‹ trÃ­

[drag-drop-editor/](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/drag-drop-editor/)

- [drag-drop-editor.component.ts](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/drag-drop-editor/drag-drop-editor.component.ts) â€” logic CDK DragDrop, `pool`, `syncAnswer`.
- [drag-drop-editor.component.html](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/drag-drop-editor/drag-drop-editor.component.html) â€” 1 `<ng-template>` + `*ngTemplateOutlet`, pool bind `this.pool`, grid `1fr / 230-280px`.
- [drag-drop-editor.component.css](../src/app/modules/admin/features/cauhoi-tracnghiem-v2/text-import-answer-editor/drag-drop-editor/drag-drop-editor.component.css) â€” CDK drag style, `.selected-chip` (blue `#3b82f6`), `.pool-chip` dashed, responsive @media â‰¤768px.

Imports: `CommonModule`, `FormsModule`, `ReactiveFormsModule`, `DragDropModule`, `LoadMediaOnTextDirective`, `KatexImgDirective`, `SharedModule`.

## 2. Má»¥c Ä‘Ã­ch

- **Pool** (`this.pool`): chip kÃ©o Ä‘Æ°á»£c, sort theo `value`. Sau load **khÃ´ng chá»©a** Ä‘Ã¡p Ã¡n Ä‘Ã£ gÃ¡n vÃ o child.
- **Matching row** (`children`): má»—i child = 1 drop zone hiá»ƒn thá»‹ `question_direction` + drop zone chá»©a **tá»‘i Ä‘a 1 item**.
- **KÃ©o tháº£**: `dropMatching` â€” náº¿u Ä‘Ã£ cÃ³ item trong zone â†’ `pop()` tráº£ vá» pool â†’ `transferArrayItem` item má»›i vÃ o index 0.
- **Click tráº£ vá»**: `returnToPool` â€” click vÃ o `selected-chip` â†’ filter khá»i `item.answer` â†’ `push` vÃ o pool + sort.
- **LuÃ´n editable** â€” khÃ´ng cÃ²n nhÃ¡nh read-only / `getCorrectAnswer` / block "ÄÃ¡p Ã¡n Ä‘Ãºng:". ÄÃ¡p Ã¡n Ä‘Ãºng = item trong `sentence-list`.
- **Hiá»ƒn thá»‹ Ä‘Ãºng/sai** (tuá»³ chá»n): `item.showCorrectAnswer` + class `is-answer-correct` / `is-answer-wrong` trÃªn chip â€” parent set flag náº¿u cáº§n.

## 3. Inputs

| Input | Kiá»ƒu | MÃ´ táº£ |
| --- | --- | --- |
| `courseQuestion` | `CourseQuestions \| any` | Cáº§n `id`, `code`, `question_direction`, `answer_option[]`, `children[]`. `children[].answer_correct` (format `\|id\|` hoáº·c `\|id1;id2\|`) Ä‘á»ƒ populate `item.answer` lÃºc load. |
| `av` | `number` | `1` = mÃ´n tiáº¿ng Anh (hiá»ƒn thá»‹ `title_part` + `question_direction` cáº¥p parent, wrap trong `part-container`). |

ÄÃ£ bá» `@Input() isReadOnly` â€” component luÃ´n soáº¡n.

## 4. State

| Field | Kiá»ƒu | Má»¥c Ä‘Ã­ch |
| --- | --- | --- |
| `course_question` | `CourseQuestions` | Mirror input + enrich `title_part`. **`answer_option` KHÃ”NG bá»‹ mutate**. |
| `pool` | `Answers[]` | **Component field** â€” shallow copy `answer_option` lÃºc `ngOnChanges`, sort theo `value`. Má»i thay Ä‘á»•i (filter / push) chá»‰ tÃ¡c Ä‘á»™ng Ä‘Ã¢y. |
| `CourseQuestionDragDrop` | `interface` | Má»Ÿ rá»™ng `CourseQuestions` thÃªm `answer?: Answers[]`. |

## 5. Luá»“ng xá»­ lÃ½

### 5.1 `ngOnChanges`

1. `course_question = courseQuestion`.
2. Clone â†’ `this.pool = sort([...answer_option], 'value')` (reset in-place `pool.length = 0` + push Ä‘á»ƒ giá»¯ CDK reference). **KhÃ´ng mutate `answer_option`.**
3. `getIsCorrectAns(course_question)`.
4. `title_part = code.replace(/\-/gi, ' ')`.

> KhÃ´ng cÃ²n enrich `dropListIds` â€” CDK connect qua `cdkDropListGroup` trÃªn template.

### 5.2 `getIsCorrectAns(question)`

- Sort `children` theo `question_number` (Æ°u tiÃªn) hoáº·c `id`.
- Má»—i child: parse `answer_correct` (strip `|`, split `;`, Ã©p `String`) â†’ `correctIds`. Vá»›i má»—i `opt` trong `this.pool`, náº¿u id thuá»™c `correctIds` â†’ `matched.push(opt)` + loáº¡i khá»i `pool`. `c['answer'] = sort(matched, 'value')`.

### 5.3 `syncAnswer(item)`

`item.answer_correct = item.answer?.length ? '|' + item.answer.map(a => a.id).join(';') + '|' : ''`. Rá»—ng â†’ `''`.

### 5.4 `dropMatching(event, q, item?)`

CDK bind `cdkDropListData` cho `pool` (= `this.pool`) hoáº·c `item.answer`. **KhÃ´ng dÃ¹ng** `cdkDropListConnectedTo` â€” káº¿t ná»‘i qua `cdkDropListGroup` á»Ÿ template.

- **CÃ¹ng list** â†’ `moveItemInArray`. CÃ³ `item` (zone) â†’ `syncAnswer(item)`.
- **KhÃ¡c list + drop vÃ o child zone** (`item` !== undefined):
  - Náº¿u `item.answer.length > 0` â†’ `pop()` tráº£ vá» `this.pool` (cÃ³ guard `some` chá»‘ng duplicate).
  - `transferArrayItem(pool â†’ item.answer, 0)`.
  - `syncAnswer(item)`.
  - Náº¿u nguá»“n lÃ  zone khÃ¡c (`previousContainer.id` báº¯t Ä‘áº§u `'drop-'`) â†’ parse index â†’ `syncAnswer(q.children[idx])`.
- **KhÃ¡c list + drop vÃ o pool**:
  - `transferArrayItem(zone â†’ this.pool, currentIndex)`.
  - `this.pool = sort(this.pool, 'value')`.
  - Parse `event.previousContainer.id` â†’ `idx` â†’ `syncAnswer(q.children[idx])`.

### 5.5 `returnToPool(q, item, answer)`

1. `item.answer = item.answer.filter(a => a.id !== answer.id)`.
2. Tráº£ vá» `this.pool`: náº¿u chÆ°a cÃ³ `answer.id` â†’ `push` + `sort`.
3. `syncAnswer(item)`.

## 6. Format `answer_correct` (má»—i child)

`|id|` (thÆ°á»ng 1 id) hoáº·c `|id1;id2|` â€” strip pipe, split `;`. Rá»—ng â†’ `''`. Äá»“ng bá»™ format vá»›i `grouping-editor`.

## 7. Template â€” `#questionTmpl`

Nháº­n `q` + `idx`. Hai nhÃ¡nh theo `av`:

- **`av === 1`** â€” `.part-container` (`.part-header`: title + direction + audio) â†’ gá»i láº¡i `#questionTmpl` cho `course_question`.
- **`av !== 1`** â€” gá»i tháº³ng `#questionTmpl` cho `course_question`.

**BÃªn trong:**
- `.question-header-section` (khi `av !== 1`): `CÃ¢u {{ q.question_number }}:` + `q.question_direction`.
- `.drag-area` (`cdkDropListGroup` â€” tá»± káº¿t ná»‘i pool + drop zones, khÃ´ng cáº§n `cdkDropListConnectedTo`):
  - **Pool** (`cdkDropList id="pool"`, `[cdkDropListData]="pool"`): flex-wrap, dashed border.
  - **Drop zones** (`.matching-row` grid `1fr / 230-280px` Ã— `children.length`): má»—i zone = `.sentence-list.drop-zone` `cdkDropList id="drop-{i}"` chá»©a `.sentence-item.selected-chip` (click â†’ `returnToPool`) + `.custom-placeholder`.

> KhÃ´ng cÃ³ block "ÄÃ¡p Ã¡n Ä‘Ãºng:" riÃªng â€” chÃ­nh item trong `.sentence-list` lÃ  Ä‘Ã¡p Ã¡n Ä‘Ãºng (Ä‘Ã£ sync `answer_correct`).

## 8. CSS

Font **14px**, no-shadow, no-outline. Border-radius **6â€“14px**. Indigo `#4f46e5`/`#6366f1`, selected-chip xanh `#3b82f6`, Ä‘Ã¡p Ã¡n Ä‘Ãºng xanh `#22c55e`.

Class CDK quan trá»ng: `.custom-placeholder` (dashed, 44px), `.cdk-drag-preview` (`z-index: 10000`), `.cdk-drag-animating`, `.cdk-drop-list-dragging`, `.cdk-drag-placeholder` (opacity 0.35), `.is-answer-correct` / `.is-answer-wrong`.

Mobile â‰¤768px: `.pool-header`, `.matching-row` â†’ `display: block`.

## 9. KhÃ¡c biá»‡t vá»›i grouping-editor

| Aspect | drag-drop-editor | grouping-editor |
| --- | --- | --- |
| Items/zone | **1** (tá»‘i Ä‘a, `pop()` náº¿u Ä‘Ã£ cÃ³) | Nhiá»u |
| Format answer | `\|id\|` hoáº·c `\|id1;id2\|` | `\|id1;id2;id3\|` |
| Pool | Clone `pool` riÃªng, KHÃ”NG mutate parent | Clone `pool` riÃªng, KHÃ”NG mutate parent |
| Sync ngÆ°á»£c | `syncAnswer()` â†’ `\|id\|` | `syncAnswer()` â†’ `\|id1;id2\|` |
| "ÄÃ¡p Ã¡n Ä‘Ãºng" row | **ÄÃ£ bá»** (item trong zone = Ä‘Ã¡p Ã¡n Ä‘Ãºng) | KhÃ´ng cÃ³ |
| Read-only mode | **ÄÃ£ bá»** â€” luÃ´n editable | ÄÃ£ bá» â€” luÃ´n editable |
| Tráº£ láº¡i pool | click chip â†’ filter + push + sync | click chip â†’ filter + push + sync |

## 10. Má»Ÿ

_(Ä‘Ã£ xá»­ lÃ½: `getCorrectAnswer` dead code, `correct_id` regex, mutate `answer_option`, block "ÄÃ¡p Ã¡n Ä‘Ãºng:", nhÃ¡nh read-only.)_

## 11. Lá»‹ch sá»­

- **2026-07-14**
  - Táº¡o plan tá»« code analysis.
  - **Bá» `isReadOnly`** â€” component luÃ´n soáº¡n; bá» guard, `[cdkDragDisabled]`, nhÃ¡nh `*ngIf/else answerCorrect`.
  - **Bá» block "ÄÃ¡p Ã¡n Ä‘Ãºng:"** + class `correct-answer-row`. ÄÃ¡p Ã¡n Ä‘Ãºng = item trong `sentence-list`.
  - **Bá» `getCorrectAnswer`** (dead code) + field `correct_id` (regex `\D` fragile).
  - **`getIsCorrectAns` populate** `item.answer` tá»« pool (so sÃ¡nh `String(id)` qua parse `answer_correct` `|id1;id2|`), loáº¡i khá»i pool.
  - **ThÃªm `syncAnswer(item)`** â€” ghi `|id1;id2|` theo `item.answer`; gá»i sau má»i `dropMatching`/`returnToPool`.
  - **`dropMatching` dÃ¹ng `event.previousContainer.id`** parse `'drop-{i}'` â†’ `idx` (thay so sÃ¡nh tham chiáº¿u fragile).
  - **TÃ¡ch `pool`** â€” component field riÃªng; clone `[...answer_option]` lÃºc load, má»i thao tÃ¡c chá»‰ trÃªn `pool`. `answer_option` cá»§a parent **khÃ´ng cÃ²n bá»‹ mutate**.
  - Template: pool `[cdkDropListData]` + `*ngFor` Ä‘á»•i `q.answer_option` â†’ `pool`.
- **2026-07-15**
  - **Fix pool sort:** thÃªm `helperService.sort(pool, 'value')` sau `transferArrayItem` vá» pool (nhÃ¡nh `else` cá»§a `dropMatching`) vÃ  sau `push` trong `returnToPool`. Pool giá»¯ thá»© tá»± `value` sau má»i thao tÃ¡c kÃ©o tháº£ / click tráº£ láº¡i â€” trÆ°á»›c Ä‘Ã¢y item rÆ¡i vÃ o `currentIndex` cuá»‘i máº£ng, lá»‡ch thá»© tá»± hiá»ƒn thá»‹.
  - **Äá»•i sang `cdkDropListGroup`:** bá» `[cdkDropListConnectedTo]="q.dropListIds"` trÃªn pool + drop zones, thÃªm `cdkDropListGroup` trÃªn `.drag-area`. XoÃ¡ khá»‘i build `dropListIds` trong `ngOnChanges`. Kháº¯c phá»¥c lá»—i "chá»‰ tháº£ Ä‘Æ°á»£c vÃ o zone cuá»‘i" â€” CDK resolve connected list 1 láº§n lÃºc pool register, `*ngFor` cá»§a children chÆ°a expand ká»‹p cÃ¡c zone trÆ°á»›c nÃªn pool chá»‰ tháº¥y zone cuá»‘i. Group tá»± káº¿t ná»‘i Ä‘á»™ng, khÃ´ng phá»¥ thuá»™c thá»© tá»± DOM.

## 12. Tráº¡ng thÃ¡i

- Code Ä‘Ã£ sá»­a xong (TS + HTML).
- Plan Ä‘Ã£ tá»‘i Æ°u.
- ChÆ°a build, chÆ°a test.
