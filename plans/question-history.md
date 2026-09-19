# Kế hoạch: Lịch sử sửa câu hỏi trắc nghiệm

## Bối cảnh

Khi giảng viên sửa câu hỏi:
1. Câu gốc (A) → `status = -3` (ẩn, không sử dụng)
2. Tạo câu mới (A') với nội dung đã sửa, `question_root_id = A.id`
3. Nếu sửa tiếp: A' → `status = -3`, tạo A'' có `question_root_id = A'.id`
4. Chuỗi: `A → A' → A'' → A'''...`

**Câu hiện tại** (đang được duyệt) là nút cuối cùng trong chuỗi. Truy ngược `question_root_id` → lịch sử.

## Mục tiêu

Cho phép người duyệt **xem lịch sử sửa** ngay trên giao diện `duyet-cauhoi-tn-detail`:
- Biết câu hỏi đã qua bao nhiêu lần sửa
- So sánh nội dung các phiên bản trước
- Thao tác tối ưu: 1 click mở, không rời trang, không popup nặng
- Hiển thị đầy đủ snapshot cha/con của từng phiên bản; mọi course đều phải kiểm tra câu con, không dùng `course.av` để quyết định có tải `children` hay không

## Cấu trúc file mới

```text
src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-tn-detail/
  question-history/
    question-history.component.ts
    question-history.component.html
    question-history.component.css
```

## Thiết kế UX

### Vị trí hiển thị

**Cột trái** (dưới card "Nội dung câu hỏi"), chỉ hiện khi `selectedQuestion['question_root_id'] !== 0`:

```
┌────────────────────────────────────┐
│ 📝 Nội dung câu hỏi               │  ← Card hiện tại
│ (question content...)              │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 🕐 Lịch sử sửa (3 lần)   [Thu gọn ▲]│  ← Card mới
│                                    │
│  v3 (hiện tại) ● ── 2024-06-04    │
│                │                   │
│  v2           ○ ── 2024-05-20     │
│                │                   │
│  v1 (gốc)    ○ ── 2024-05-01     │
│                                    │
│  [Xem chi tiết v2]  [Xem v1]      │
└────────────────────────────────────┘
```

### Tương tác

1. **Mặc định**: Card thu gọn, chỉ hiện tiêu đề + số lần sửa
2. **Click mở**: Hiện timeline dọc với các phiên bản
3. **Click "Xem chi tiết vX"**: Expand inline hiện nội dung câu hỏi phiên bản đó (read-only, dùng lại component `app-question-type-*`)
4. **Không popup/modal**: mọi thứ inline trong card → giảm cognitive load

### UX theo _rules

| Tiêu chí | Áp dụng |
|-----------|---------|
| Clarity | Timeline rõ ràng, version number, ngày tháng, icon phân biệt hiện tại vs cũ |
| Consistency | Dùng card pattern giống các card khác trong col-left |
| Efficiency | 1 click mở timeline, 1 click xem nội dung → tối đa 2 thao tác |
| Feedback | Loading spinner khi fetch lịch sử, empty state khi không có |
| Accessibility | Contrast đủ, font size chuẩn, icon + text |
| Emotion | Timeline UI hiện đại, animation nhẹ khi expand |

## Thiết kế kỹ thuật

### 1. Cách truy vết chuỗi lịch sử

#### Quy tắc cha/con

- Với `course.av === 1`, cha/con là rule chung của toàn hệ thống.
- Với `course.av !== 1`, vẫn luôn truy vấn xem từng câu cha có câu con hay không.
- Không dùng `course.av` làm điều kiện quyết định tải `children`.
- Sau khi tải mỗi phiên bản cha, truy vấn các bản ghi có `group_id = parent.id`, sắp xếp theo `question_number` nếu có, fallback theo `id`, rồi gắn vào `parent.children`.
- Phiên bản hiện tại loại children `status === -3`; phiên bản lịch sử giữ nguyên children `-3` vì đây là trạng thái lưu vết sau khi clone.
- Không có câu con: gắn `children = []`.
- Mỗi phiên bản lịch sử phải dùng đúng tập con thuộc chính phiên bản đó; không lấy children của phiên bản hiện tại gắn cho phiên bản cũ.
- Áp dụng cùng quy tắc cho `currentQuestion` trước khi render để dữ liệu cha/con nhất quán ở toàn timeline.

Từ câu hiện tại (A'''), truy ngược:
```
A''' → question_root_id → A''.id
A'' → question_root_id → A'.id  
A' → question_root_id → A.id
A → question_root_id === 0 (gốc)
```

**Giải pháp**: Query tuần tự từ `selectedQuestion.question_root_id` cho đến khi gặp `question_root_id === 0`.

### 2. API calls

```typescript
// Pseudo-code
async loadHistory(currentQuestion: CourseQuestions): Promise<CourseQuestions[]> {
    const history: CourseQuestions[] = [];
    let rootId = currentQuestion['question_root_id'];
    
    while (rootId && rootId !== 0) {
        const parent = await firstValueFrom(
            this.courseQuestionsService.getCourseQuestionsByCol('id', rootId)
        );
        if (!parent || !parent.length) break; // dữ liệu lỗi → dừng
        const question = parent[0];
        const children = await firstValueFrom(
            this.courseQuestionsService.getCourseQuestionsByCol('group_id', question.id)
        );
        const isCurrentVersion = question.id === currentQuestion.id;
        question.children = (children || [])
            .filter(child => !isCurrentVersion || child.status !== -3)
            .sort((a, b) => {
                const questionNumberA = Number(a.question_number);
                const questionNumberB = Number(b.question_number);
                if (questionNumberA !== questionNumberB) {
                    if (!questionNumberA) return 1;
                    if (!questionNumberB) return -1;
                    return questionNumberA - questionNumberB;
                }
                return Number(a.id) - Number(b.id);
            });
        history.push(question);
        rootId = question['question_root_id'];
        if (history.length >= 20) break; // safety limit
    }
    
    return history.reverse(); // [A(v1), A'(v2), A''(v3)] — cũ → mới
}
```

### 3. Component `QuestionHistoryComponent`

```typescript
@Component({
    selector: 'app-question-history',
    standalone: true,
    imports: [CommonModule, /* question-type components */],
    templateUrl: './question-history.component.html',
    styleUrls: ['./question-history.component.css']
})
export class QuestionHistoryComponent implements OnChanges {
    @Input() currentQuestion: CourseQuestions | null = null;
    @Input() av: number = 0;

    historyItems: HistoryItem[] = [];
    isExpanded = false;
    loadingHistory = false;
    expandedVersion: number | null = null;
}

interface HistoryItem {
    question: CourseQuestions;
    version: number;
    isCurrent: boolean;
}
```

### 4. Tích hợp vào `duyet-cauhoi-tn-detail`

**HTML** (sau card question-card, trong col-left):
```html
<app-question-history 
    *ngIf="selectedQuestion && selectedQuestion['question_root_id'] !== 0"
    [currentQuestion]="selectedQuestion"
    [av]="courseSelected?.av">
</app-question-history>
```

**TS**: Import `QuestionHistoryComponent` trong `imports` array.

### 5. Tối ưu hiệu năng

- **Lazy load**: Chỉ fetch lịch sử khi user click mở (không load sẵn)
- **Cache**: Lưu kết quả trong component, không re-fetch khi toggle collapse/expand
- **Limit depth**: Giới hạn truy vết tối đa 20 cấp (phòng loop lỗi dữ liệu)

## Luồng hoạt động

```
User mở detail câu hỏi A'''
  → Component check: A'''['question_root_id'] !== 0
  → Hiện card "Lịch sử sửa" (thu gọn)
  
User click mở card
  → loadingHistory = true
  → Fetch A'' → Fetch A' → Fetch A (dừng khi question_root_id === 0)
  → Xây timeline: [A(v1), A'(v2), A''(v3), A'''(v4-hiện tại)]
  → Hiện timeline UI

User click "Xem chi tiết v2"
  → expandedVersion = index
  → Hiện nội dung câu A' inline (read-only)
```

## Trường hợp đặc biệt

1. **Câu gốc** (`question_root_id === 0`): Không hiện card lịch sử
2. **Chỉ sửa 1 lần** (`A → A'`): Timeline 2 mục (gốc + hiện tại)
3. **Dữ liệu lỗi** (id không tồn tại): Dừng truy vết, hiện những gì đã tìm được
4. **Câu có children**: Mọi course đều truy vấn `group_id`; mỗi phiên bản hiển thị đúng children tương ứng
5. **Câu không có children**: Gắn `children = []`, hiển thị nội dung cha bình thường
6. **Children `status === -3`**: Loại ở phiên bản hiện tại; giữ ở phiên bản lịch sử vì đó là snapshot trước khi clone
7. **`course.av === 1`**: Bắt buộc tuân thủ rule cha/con chung toàn hệ thống
8. **`course.av !== 1`**: Vẫn kiểm tra children, không mặc định câu độc lập

## Trạng thái triển khai

- Đã tạo component riêng `question-history/` và tích hợp vào `duyet-cauhoi-tn-detail`.
- Đã truy ngược chuỗi `question_root_id`, chống lặp và giới hạn 20 cấp.
- Đã luôn query `group_id = parent.id` cho phiên bản cũ và hiện tại, không rẽ nhánh theo `course.av`.
- Đã giữ children `status === -3` ở phiên bản lịch sử, loại ở phiên bản hiện tại; sắp xếp theo `question_number`, fallback `id`, gắn `children = []` khi không có.
- Đã hiển thị timeline, nội dung phiên bản cũ inline bằng các question-type component read-only.
- Đã tải số lần sửa khi nhận câu hỏi; nội dung chi tiết vẫn tải khi mở card và được cache trong component.
- Đã đặt card trong cột trái, ngay dưới card nội dung câu hỏi.
- Đã dùng `updated_at || created_at` và bổ sung điều khiển bàn phím/ARIA bằng button.
- Model `CourseQuestions` đã có `children`, `question_root_id`, `created_at`, `updated_at`.
- Chưa build/test/run; chờ kiểm thử thủ công khi được phép.

## Quyết định đã chốt

1. **Field thời gian**: Có `created_at` / `updated_at` → dùng hiện ngày trên timeline.
2. **Hiển thị**: Chỉ ngày + nội dung câu hỏi, không cần tên người sửa.
3. **Phạm vi**: Chỉ trang hội đồng (`duyet-cauhoi-tn-detail`), không áp dụng cho cấp trường.
4. **Rule cha/con**: `course.av === 1` là rule chung toàn hệ thống; `course.av !== 1` vẫn phải kiểm tra câu con.
5. **Cách tải children**: Luôn query `group_id = parent.id` cho từng phiên bản; không rẽ nhánh theo `av`.
6. **Snapshot lịch sử**: Mỗi phiên bản dùng children của chính phiên bản đó; giữ children `status === -3` ở bản lịch sử, chỉ loại ở phiên bản hiện tại.
7. **Vị trí card**: Trong cột trái, ngay dưới card "Nội dung câu hỏi".
8. **Ngày hiển thị**: Dùng `updated_at || created_at`.
9. **Accessibility**: Header và nút mở phiên bản hỗ trợ bàn phím, `aria-expanded`, `aria-controls`.

## Tiêu chí hoàn thành bổ sung

1. Mở lịch sử của course `av === 1`: mỗi phiên bản cha hiển thị đủ children tương ứng.
2. Mở lịch sử của course `av !== 1` có children: children vẫn được tải và hiển thị đầy đủ.
3. Course không có children: timeline hoạt động bình thường với `children = []`.
4. Phiên bản hiện tại không hiện children `status === -3`; phiên bản cũ vẫn giữ children `-3` để thể hiện đúng snapshot trước khi clone.
5. Không có children của phiên bản hiện tại bị gắn nhầm vào phiên bản cũ.
6. Card nằm trong cột trái, dưới nội dung câu hỏi.
7. Ngày ưu tiên `updated_at`, fallback `created_at`.
8. Card và từng phiên bản thao tác được bằng chuột và bàn phím.

## Không còn câu hỏi mở
