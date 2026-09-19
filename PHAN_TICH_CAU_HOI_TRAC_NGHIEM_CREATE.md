# Cấu trúc dữ liệu câu hỏi trắc nghiệm

Hướng dẫn đọc câu hỏi dạng Word và tách thành các trường phù hợp với cấu trúc `Question` / `CourseQuestions`.

---

## A. Tổng quan các trường

| Trường | DB type | Bắt buộc | Ghi chú |
|---|---|---|---|
| `question_type` | text | ✅ | Xác định trước, quyết định toàn bộ các trường khác |
| `question_direction` | text | ✅ | Nội dung câu hỏi (HTML) |
| `answer_option` | text (JSON) | ✅ | Mảng `[{id, value}]` — các phương án trả lời |
| `answer_correct` | text | ✅ | Luôn bọc `\|...\|` — format phụ thuộc `question_type` |
| `group_id` | int | | 0 = chưa có; server gán sau |
| `question_number` | int | | Số thứ tự câu hỏi (dùng trong children) |
| `code` | text | | Part-1..Part-8 (chỉ tiếng Anh) |
| `media` | text (JSON) | | `{type:'audio', source, path, replay:1}` |
| `config` | longtext (JSON) | | `{cols, invertedAnswer}` — mặc định theo loại |
| `raw_answer` | varchar | | Chỉ dùng cho `reorder_words` |
| `note` | varchar | | Không dùng trong form — bỏ qua |
| `children` | — | | Mảng `Question[]` — câu hỏi con (Part, group, drag_drop) |

---

## B. Hai format chính: `monkhac` và `tienganh`

### monkhac (Môn khác)
- **Không có** trường `code`
- Cấu trúc **phẳng**: radio, checkbox, inputbox không có children
- Chỉ có children ở các loại group: `group-input`, `group-radio`, `drag_drop`, `grouping`
- Mỗi câu hỏi là độc lập, không có Part

### tienganh (Tiếng Anh)
- **Có** trường `code` = Part-1..Part-8 (gán cho mọi phần: `Part N`, `Passage N`, `Task N` đều → `Part-N`)
- Dùng **children** cho hầu hết loại câu hỏi (radio, checkbox, inputbox, reorder_words, arrange_paragraphs)
- **Parent** chứa:
  - `question_direction` = bài đọc/đoạn hội thoại/bối cảnh chung **(bỏ tiền tố `Part/Passage/Task N` + dấu phân cách ở đầu dòng (không phân biệt viết hoa: `Part 1:`, `PASSAGE 1 -`, `Task 2)`, `task-3`,...). Giữ nguyên phần còn lại của dòng đó và các dòng phía sau.)**
  - `code` = Part đang xử lý
  - `media` = file nghe (nếu có)
- **Mỗi child** chứa:
  - `question_number` = số thứ tự câu hỏi trong Part
  - `question_direction` = nội dung câu hỏi cụ thể
  - `answer_option` = các phương án (nếu có)
  - `answer_correct` = đáp án đúng
  - `code` = kế thừa từ parent
  - `private` = kế thừa từ parent
  - `cdr_id` = kế thừa từ parent

---

## C. question_type — Nhận biết từ Word

| Loại | Dấu hiệu trong Word |
|---|---|
| `radio` | Có A., B., C., D. và **1 đáp án đúng** duy nhất |
| `checkbox` | Có A., B., C., D. và **nhiều đáp án đúng** |
| `inputbox` | Dạng điền khuyết `____`, không có A, B, C, D |
| `group-input` | Nhiều câu điền khuyết đánh số 1), 2)... trong cùng khối |
| `group-radio` | Nhiều câu trắc nghiệm cùng khối, mỗi câu có A,B,C,D riêng |
| `drag_drop` | Dạng ghép đôi: "Nối", "Ghép", "Match" |
| `grouping` | Phân loại vào cột: "Xếp vào cột", "Phân loại" |
| `reorder_words` | Sắp xếp từ / có dấu `/` giữa các từ |
| `arrange_paragraphs` | Sắp xếp câu thành đoạn văn |

---

## D. question_direction — Nội dung câu hỏi

- `monkhac`: Lấy phần dẫn đứng trước các phương án A., B., C., D.
- `tienganh`:
  - **Parent**: bài đọc, đoạn hội thoại, bối cảnh chung của Part **(bỏ tiền tố `Part/Passage/Task N` + dấu phân cách ở đầu dòng. Giữ nguyên phần còn lại của dòng đó.)**
  - **Child**: nội dung câu hỏi cụ thể trong Part
- `reorder_words`: các từ dùng dấu `/` làm separator → `question_direction = từ1/từ2/...` (sẽ bị xáo trộn sau)

---

## E. answer_option — Phương án trả lời

```
[{id: "1", value: "nội dung A"}, {id: "2", value: "nội dung B"}, ...]
```

- Dòng `A.` / `A)` → `id = "1"`, B→2, C→3, D→4

Tuỳ loại:
- **radio, checkbox, group-radio:** 4 phần tử mặc định, có thể thêm/bớt
- **inputbox, group-input, reorder_words:** `[]` (rỗng)
- **drag_drop, grouping:** pool các đáp án kéo thả (id tự tạo từ 1)
- **arrange_paragraphs:** các câu (đã xáo trộn)

---

## F. answer_correct — Đáp án đúng

**Quy tắc chính:** Luôn bọc `|` hai đầu.

| Loại | Word → Cách gán | Ví dụ |
|---|---|---|
| `radio` | Chữ cái → id → `\|id\|` | "B" → `\|2\|` |
| `checkbox` | Các chữ cái → sort → `\|id1,id2\|` | "A, C, D" → `\|1,3,4\|` |
| `inputbox` | Text cách `;` → lowercase, nối `\|` → `\|t1\|t2\|` | "Ha Noi; Sai Gon" → `\|ha noi\|sai gon\|` |
| `group-input` | Giống inputbox, mỗi child một `answer_correct` | child[0]: `\|ha noi\|` |
| `group-radio` | Giống radio, mỗi child một `answer_correct` | child[0]: `\|2\|` |
| `drag_drop` | Mỗi child: `\|id_đáp_án_trong_pool\|` | child[0]: `\|1\|` |
| `grouping` | Mỗi child: `\|id1;id2\|` (cách `;`) | Cột Động vật: `\|1;2\|` |
| `reorder_words` | `\|câu hoàn chỉnh (cách SPACE)\|`. Cần `raw_answer = từ1/từ2/...` | `\|I am a student\|`, `raw_answer = "I/am/a/student"` |
| `arrange_paragraphs` | `\|id1,id2,...\|` (id theo thứ tự đúng) | `\|2,4,3,1\|` |

**Parse ngược (DB → hiển thị):**

| Loại | Parse |
|---|---|
| radio, checkbox, group-radio, arrange_paragraphs | `replace(\/\|/g, '').split(',')` |
| inputbox, group-input, reorder_words | `split("\|").filter(Boolean)` |
| drag_drop | `replace(/\D/g, '')` |
| grouping | `replace(\/\|/g, '').split(';')` |

---

## G. Các trường còn lại

| Trường | Ghi chú |
|---|---|
| `group_id` | Không tách từ Word. Mặc định 0. Sau lưu cha → gán cho children. |
| `question_number` | Số thứ tự câu trong Part (tiếng Anh) hoặc trong group. Sort theo số này. |
| `code` | Chỉ tiếng Anh. `Part N`, `Passage N`, `Task N` đều → `"Part-N"` (thay space = `-`). Duy trì đến Part mới. Cả parent và children đều có code. |
| `media` | 🔊/🎧/"Listen": `{type:'audio', source:'serverFile', path:'...', replay:1}`. null nếu không. |
| `config` | Mặc định theo loại: radio/checkbox/group-radio → `{cols:2, invertedAnswer:true}`; còn lại → `{cols:1, invertedAnswer:true}`. |
| `raw_answer` | Chỉ `reorder_words`: `"từ1/từ2/..."`. Các loại khác: `''`. |
| `note` | Không tồn tại trong interface. Bỏ qua. |

---

## H. Xử lý câu hỏi tiếng Anh — Cấu trúc Part và children

Với format `tienganh`, câu hỏi trong Word có cấu trúc phân cấp:

```
Part 1: [tên Part, bài đọc, ...]
  Question 1: nội dung + A. ... B. ... C. ... D. ...
  Question 2: nội dung + A. ... B. ... C. ... D. ...
Part 2: [bài đọc mới]
  Question 5: ...
```

Khi tách:
- **Parent** = Part: `question_direction` = bài đọc/đoạn văn/context chung, `code` = Part-1, `question_type` = loại câu hỏi của Part
- **Children** = các câu hỏi trong Part: mỗi child có `question_number`, `question_direction`, `answer_option`, `answer_correct`

**Ví dụ xử lý tiêu đề Part:**

| Word gốc | `question_direction` (sau loại bỏ tiền tố) | `code` |
|---|---|---|
| `PART 1: PRONUNCIATION (Phát âm)\nMark the letter A, B, C, or D...` | `PRONUNCIATION (Phát âm)\nMark the letter A, B, C, or D...` | `Part-1` |
| `Part 3 - Listening\nListen to the conversation and choose...` | `Listening\nListen to the conversation and choose...` | `Part-3` |
| `PASSAGE 1: Read the passage...` | `Read the passage...` | `Part-1` |
| `Task 2: Complete the sentences...` | `Complete the sentences...` | `Part-2` |

**Quy tắc:** Dòng đầu tiên mỗi Part/Passage/Task, bỏ tiền tố `Part`/`Passage`/`Task` + số + dấu phân cách ở đầu (`PART 1:`, `PASSAGE 2 -`, `Task 3)`, `task-4`,... không phân biệt viết hoa hay dấu gì). Giữ nguyên phần còn lại của dòng đó + các dòng phía sau làm `question_direction`. Nếu không còn gì thì để `""`. Đồng thời gán `code = "Part-N"` cho cả `Passage N` và `Task N`.

Lưu ý khi upload:
- Parent được lưu trước → trả về id
- Mỗi child được gán `group_id = parent.id`, `code = parent.code`, `private = parent.private`, `cdr_id = parent.cdr_id`
- `question_inserted.private/public` được cộng dồn theo số lượng children (không phải số lượng parent)

---

## I. Các ví dụ

### radio (monkhac — phẳng, không code, không children)

```json
{
  "question_type": "radio",
  "question_direction": "Thủ đô của Việt Nam là?",
  "answer_option": [
    {"id":"1","value":"Hà Nội"},
    {"id":"2","value":"Hồ Chí Minh"},
    {"id":"3","value":"Đà Nẵng"},
    {"id":"4","value":"Cần Thơ"}
  ],
  "answer_correct": "|1|",
  "config": {"cols":2, "invertedAnswer":true},
  "children": []
}
```

### radio (tienganh — Part 2, có children)

Word:
```
PART 2: READING COMPREHENSION
Read the passage and answer
[passage]
Question 1: What is the main idea?
A. Topic A   B. Topic B   C. Topic C   D. Topic D
Question 2: What can be inferred?
A. Inf A     B. Inf B     C. Inf C     D. Inf D
Answer: 1-B, 2-D
```

```json
{
  "question_type": "radio",
  "question_direction": "READING COMPREHENSION\nRead the passage and answer [passage]",
  "answer_option": [],
  "answer_correct": "",
  "code": "Part-2",
  "config": {"cols":2, "invertedAnswer":true},
  "media": {"type":"audio","source":"serverFile","path":"file123","replay":1},
  "children": [
    {
      "question_number": 1,
      "question_direction": "What is the main idea?",
      "answer_option": [
        {"id":"1","value":"Topic A"}, {"id":"2","value":"Topic B"},
        {"id":"3","value":"Topic C"}, {"id":"4","value":"Topic D"}
      ],
      "answer_correct": "|2|",
      "children": []
    },
    {
      "question_number": 2,
      "question_direction": "What can be inferred?",
      "answer_option": [
        {"id":"1","value":"Inf A"}, {"id":"2","value":"Inf B"},
        {"id":"3","value":"Inf C"}, {"id":"4","value":"Inf D"}
      ],
      "answer_correct": "|4|",
      "children": []
    }
  ]
}
```

### checkbox (tienganh — Part 4, children)

```json
{
  "question_type": "checkbox",
  "question_direction": "Listen to the conversation and choose the correct options",
  "answer_option": [],
  "answer_correct": "",
  "code": "Part-4",
  "config": {"cols":2, "invertedAnswer":true},
  "media": {"type":"audio","source":"serverFile","path":"file456","replay":1},
  "children": [
    {
      "question_number": 5,
      "question_direction": "Which subjects does the student mention?",
      "answer_option": [
        {"id":"1","value":"Math"}, {"id":"2","value":"History"},
        {"id":"3","value":"English"}, {"id":"4","value":"Art"}
      ],
      "answer_correct": "|1,3|",
      "children": []
    }
  ]
}
```

### inputbox (monkhac — phẳng)

```json
{
  "question_type": "inputbox",
  "question_direction": "Thủ đô Việt Nam là ______",
  "answer_option": [],
  "answer_correct": "|hà nội|",
  "config": {"cols":1, "invertedAnswer":true},
  "children": []
}
```

### inputbox (tienganh — Part 7, children)

```json
{
  "question_type": "inputbox",
  "question_direction": "Fill in the blanks with the correct words",
  "answer_option": [],
  "answer_correct": "",
  "code": "Part-7",
  "config": {"cols":1, "invertedAnswer":true},
  "children": [
    {
      "question_number": 35,
      "question_direction": "I ______ a student.",
      "answer_option": [],
      "answer_correct": "|am|",
      "children": []
    },
    {
      "question_number": 36,
      "question_direction": "She ______ to school every day.",
      "answer_option": [],
      "answer_correct": "|goes|",
      "children": []
    }
  ]
}
```

### reorder_words (tienganh — Part 5, có code, có children)

Word:
```
Part 5: Reorder the words to make sentences
Question 1: I / am / a / student
Question 2: She / is / a / teacher
Answer: 1. I am a student, 2. She is a teacher
```

```json
{
  "question_type": "reorder_words",
  "question_direction": "",
  "answer_option": [],
  "answer_correct": "",
  "code": "Part-5",
  "config": {"cols":1, "invertedAnswer":true},
  "children": [
    {
      "question_number": 1,
      "question_direction": "I/am/a/student",
      "answer_option": [],
      "answer_correct": "|I am a student|",
      "raw_answer": "I/am/a/student",
      "code": "Part-5",
      "children": []
    },
    {
      "question_number": 2,
      "question_direction": "She/is/a/teacher",
      "answer_option": [],
      "answer_correct": "|She is a teacher|",
      "raw_answer": "She/is/a/teacher",
      "code": "Part-5",
      "children": []
    }
  ]
}
```

### drag_drop (tienganh — Part 1, children)

```json
{
  "question_type": "drag_drop",
  "question_direction": "Match the questions with the correct answers",
  "answer_option": [
    {"id":"1","value":"Blue"},
    {"id":"2","value":"4"},
    {"id":"3","value":"Water"}
  ],
  "answer_correct": "",
  "code": "Part-1",
  "config": {"cols":1, "invertedAnswer":true},
  "children": [
    {
      "question_number": 1,
      "question_direction": "What color is the sky?",
      "answer_option": [],
      "answer_correct": "|1|",
      "children": []
    },
    {
      "question_number": 2,
      "question_direction": "How many legs does a dog have?",
      "answer_option": [],
      "answer_correct": "|2|",
      "children": []
    },
    {
      "question_number": 3,
      "question_direction": "Where do fish live?",
      "answer_option": [],
      "answer_correct": "|3|",
      "children": []
    }
  ]
}
```

### arrange_paragraphs (tienganh — Part 6, children)

```json
{
  "question_type": "arrange_paragraphs",
  "question_direction": "Arrange the sentences to form a complete paragraph",
  "answer_option": [],
  "answer_correct": "",
  "code": "Part-6",
  "config": {"cols":1, "invertedAnswer":true},
  "children": [
    {
      "question_number": 3,
      "question_direction": "",
      "answer_option": [
        {"id":"1","value":"He went to school."},
        {"id":"2","value":"He woke up early."},
        {"id":"3","value":"He had breakfast."},
        {"id":"4","value":"He brushed his teeth."}
      ],
      "answer_correct": "|2,4,3,1|",
      "code": "Part-6",
      "children": []
    }
  ]
}
```

### grouping (monkhac — không code, có children)

```json
{
  "question_type": "grouping",
  "question_direction": "Xếp các từ vào cột đúng",
  "answer_option": [
    {"id":"1","value":"dog"}, {"id":"2","value":"cat"},
    {"id":"3","value":"rose"}, {"id":"4","value":"lotus"}
  ],
  "answer_correct": "",
  "config": {"cols":1, "invertedAnswer":true},
  "children": [
    {
      "question_direction": "Động vật",
      "answer_correct": "|1;2|",
      "children": []
    },
    {
      "question_direction": "Thực vật",
      "answer_correct": "|3;4|",
      "children": []
    }
  ]
}
```

### group-radio (monkhac — không code, có children)

```json
{
  "question_type": "group-radio",
  "question_direction": "Đọc đoạn văn và trả lời",
  "answer_option": [
    {"id":"1","value":"A"}, {"id":"2","value":"B"},
    {"id":"3","value":"C"}, {"id":"4","value":"D"}
  ],
  "answer_correct": "",
  "config": {"cols":2, "invertedAnswer":true},
  "children": [
    {
      "question_direction": "Câu hỏi 1?",
      "answer_option": [
        {"id":"1","value":"ĐA1"}, {"id":"2","value":"ĐA2"},
        {"id":"3","value":"ĐA3"}, {"id":"4","value":"ĐA4"}
      ],
      "answer_correct": "|2|",
      "children": []
    },
    {
      "question_direction": "Câu hỏi 2?",
      "answer_option": [
        {"id":"1","value":"ĐA1"}, {"id":"2","value":"ĐA2"},
        {"id":"3","value":"ĐA3"}, {"id":"4","value":"ĐA4"}
      ],
      "answer_correct": "|4|",
      "children": []
    }
  ]
}
```

### group-input (monkhac — không code, có children)

```json
{
  "question_type": "group-input",
  "question_direction": "Điền từ thích hợp vào chỗ trống",
  "answer_option": [],
  "answer_correct": "",
  "config": {"cols":2, "invertedAnswer":true},
  "children": [
    {
      "question_direction": "Thủ đô Việt Nam là ______",
      "answer_option": [],
      "answer_correct": "|hà nội|",
      "children": []
    },
    {
      "question_direction": "Thủ đô Nhật Bản là ______",
      "answer_option": [],
      "answer_correct": "|tokyo|",
      "children": []
    }
  ]
}
```

---

## J. Quy trình tách (10 bước)

1. Đọc toàn bộ văn bản → xác định `question_type`
2. Xác định format: có "Part" không? → `tienganh` / `monkhac`
3. Xác định Part (nếu tiếng Anh) → `code = "Part-N"`, duy trì đến Part mới
4. Tách phần dẫn chung (parent) → `question_direction`
5. Kiểm tra file nghe → `media` (null nếu không)
6. Tách từng câu hỏi con (trong Part hoặc trong group) → mỗi child:
   - Số thứ tự → `question_number`
   - Nội dung câu hỏi → `question_direction`
   - Các phương án A., B., C., D... → `answer_option`
   - Đáp án đúng → `answer_correct` (bọc `|`, đúng format theo loại)
   - Kế thừa `code` từ parent
7. Nếu format monkhac và không có children → gán thẳng vào parent
8. Gán `config` mặc định theo loại
9. Gán `raw_answer` (nếu là `reorder_words`) hoặc `''`
10. Kiểm tra: `answer_correct` phải bọc `|...|` ở mọi loại

### Kết quả đầu ra

Kết quả tách câu hỏi phải được trả về dưới dạng JSON array với syntax highlighting.

**Mỗi câu hỏi là 1 phần tử độc lập trong mảng — không có câu hỏi cha chứa tất cả các câu hỏi khác làm children.**

- `tienganh`: mỗi **Part** là 1 phần tử trong mảng. Riêng câu hỏi con bên trong Part mới nằm ở `children` của Part đó.
- `monkhac`: mỗi câu hỏi độc lập là 1 phần tử trong mảng. Các dạng group (group-input, group-radio, drag_drop, grouping) có children riêng của group đó.

````md
```json
[
  {
    "question_type": "...",
    "question_direction": "...",
    ...
  }
]
```
````

Luôn bọc kết quả trong <code>```json ... ```</code> để dễ đọc và kiểm tra.
Nếu chỉ có 1 câu hỏi thì mảng vẫn có 1 phần tử.

---

## K. Xử lý HTML khi đọc từ DB (hiển thị)

Khi đọc/dịch ngược dữ liệu từ DB lên để hiển thị ở cả `question_direction` và `answer_option[*].value`:

**Giữ nguyên** các thẻ HTML có class sau (không xoá, không parse lại nội dung bên trong):

| Class | Ý nghĩa | Giữ nguyên |
|---|---|---|
| `latex-ictu-img` | Công thức LaTeX dạng `<span class="latex-ictu-img" data-latex="...">` | Toàn bộ thẻ `<span>` + attribute `data-latex` + mọi child (thẻ `<img>` loading) |
| `image_online_https` | Ảnh từ nguồn HTTP online không upload được | Thẻ `<img class="image_online_https">` + thẻ `<a>` bao ngoài (nếu có) |
| `image_resized` | Ảnh đã resize trong CKEditor, thường trong `<figure class="image ... image_resized">` | Toàn bộ `<figure>` + `<img>` bên trong + attribute `data-org` |

**Quy tắc chung:**
- Nếu một thẻ HTML có bất kỳ class nào kể trên ⇒ giữ nguyên thẻ đó và tất cả child/descendant, không tách, không thay đổi attribute, không loại bỏ.
- Nếu luồng xử lý có bước parse/split HTML (tách câu hỏi từ Word, sanitize, strip tag), phải **loại trừ (skip)** các thẻ này khỏi bước xử lý.
- Các thẻ HTML khác không thuộc 3 class trên vẫn xử lý bình thường theo quy tắc riêng của từng trường.