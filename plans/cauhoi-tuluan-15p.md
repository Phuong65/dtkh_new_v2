# Kế hoạch: Tạo đề kiểm tra tự luận 15P (quản lý câu hỏi)

## Mục tiêu

Component standalone quản lý câu hỏi tự luận 15P (TH_15P).

## Vị trí

```
src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/
├── cauhoi-tuluan-15p.component.ts
├── cauhoi-tuluan-15p.component.html
└── cauhoi-tuluan-15p.component.css
```

## Services sử dụng

| Service | Mục đích |
|---|---|
| `CoursePlanActivityTuluanService` | CRUD nội dung câu hỏi tự luận |
| `CourseFormTuluan15pService` | CRUD các bản ghi cấu thành form nhập câu hỏi theo bài và CDR |
| `CoursePlanActivityTuluanTieuchichamService` | tiêu chí chấm |
| `CoursePlanTuluanCommentService` | comment / phản hồi |
| `CoursePlanActivitiesService` | load bài học |
| `ElnKhoaHocService` | (nếu cần) |
| `ElngUserProfileService` | check thành viên hội đồng |
| `AuthService` | role check |
| `HoidongThamdinhService` | hội đồng thẩm định |
| `HoidongThamdinhMonhocThanhvienService` | thành viên hội đồng |
| `CourseFormDuyetService` | form duyệt |
| `CourseCloService` | CLO (ít dùng) |

## Layout

### Cột trái — Bài học (flat)

```
Bài 1 (week=1)
Bài 2 (week=2)
Bài 3 (week=3)
```

**Click bài học** → `onSelectLesson(lesson)` → `loadCauhoi()`.

Data flow:
1. `loadLessons()` → `CoursePlanActivitiesService.getByPage()` filter `parent_id=0, week>0, week<100, order week ASC`
2. Chọn bài → `onSelectLesson(lesson)` → `selectedLesson = lesson` → `loadCauhoi()`
3. `loadCauhoi()` filter `course_id + course_plan_activity_id = selectedLesson.id`

### Cột phải — Danh sách câu hỏi dạng thẻ A4

- Search theo mã câu hỏi (input filter pipe)
- Nút "Thêm câu hỏi" → side menu với CKEditor
- Mỗi câu hỏi là 1 thẻ `.question-a4-card`:
  - **Header**: #ID, CDR, Private/Public, Trạng thái, các nút thao tác
  - **Body**: nội dung câu hỏi (render HTML với Katex + Media)
  - **Footer**: hướng dẫn chấm (nếu có, dùng Divider)
- **Thao tác** (trên header): Sao chép tiêu chí, Xem, Nhập tiêu chí chấm, Sửa, Xóa

## FormData câu hỏi

```typescript
formData = {
  ordering: ['0'],                    // mặc định 0
  course_plan_activity_id: [''],     // selectedLesson.id
  course_id: [''],                   // courseSelected.id
  type: ['QUESTION'],
  cdr: ['', Validators.required],    // Mức độ năng lực
  private: [''],
  desc: ['', Validators.required],
  status: [''],
  point: [''],                       // không bắt buộc
  note: [''],                        // Hướng dẫn ai chấm điểm
}
```

## Tóm tắt thay đổi so với kế hoạch gốc

| Item | Kế hoạch gốc | Hiện tại |
|---|---|---|
| Layout trái | `lessons` → nested `list_form` | flat `lessons`, không nhóm |
| `CourseFormTuluan15pService` | dùng để load nhóm | ✅ **Đã bỏ** — không còn nhóm |
| `forkJoin` 3 API | lessons + forms + count | 1 API đơn: lessons |
| `selectedForm` | có | ✅ **Đã bỏ** — dùng `selectedLesson` trực tiếp |
| Hiển thị câu hỏi | p-table với nhiều cột | ✅ **Thẻ A4** (`.question-a4-card`) — id, nội dung, hướng dẫn chấm, nút sửa/xóa |
| `form_tuluan_15p_id` | có trong formData | ✅ **Đã bỏ** |
| `point` trong form | `Validators.required` | ✅ **Không required**, không input trong form |
| `ordering` | required | ✅ **Mặc định '0'** |
| CDR selector | p-dropdown | ✅ **Radio button** (dạng chips) dùng `ovic-groups-radio-v2` |
| `index_` trên list_cauhoi | có (đánh số thứ tự) | ✅ **Vẫn giữ** trong `loadCauhoi()` (có thể dùng sau) |

## Kế hoạch cải tiến UI/UX theo Rule #2

### Phạm vi

- Chỉ cải tiến giao diện và trạng thái tương tác của chức năng `cauhoi-tuluan-15p`.
- Không thay đổi API, dữ liệu, phân quyền hoặc nghiệp vụ CRUD hiện tại.
- File dự kiến chỉnh sửa:
  - `cauhoi-tuluan-15p.component.html`
  - `cauhoi-tuluan-15p.component.css`
  - `cauhoi-tuluan-15p.component.ts` — chỉ bổ sung property trạng thái đã tính sẵn nếu HTML cần loading hoặc empty state.

### Bố cục và thành phần

1. **Khung chức năng**
   - Bổ sung root namespace `.cauhoi-tuluan-15p` bao toàn bộ template.
   - Dùng khoảng trắng, kích thước và phân cấp thị giác nhất quán.

2. **Header**
   - Nền gradient, accent bar bên trái, icon chức năng và tiêu đề rõ ràng.
   - Hiển thị bài học đang chọn và CTA chính “Thêm câu hỏi”.
   - Header xuống dòng, nhóm thao tác wrap tại màn hình nhỏ.

3. **Cột bài học**
   - Làm rõ trạng thái mặc định, hover, focus và bài đang chọn.
   - Mỗi bài có icon + text; vùng bấm đủ lớn.
   - Nút đóng/mở cột có icon + text hoặc nhãn hỗ trợ phù hợp khi không đủ chiều rộng.

4. **Header gọn và thao tác chính**
   - Không hiển thị khối thống kê nhanh để dành không gian cho danh sách câu hỏi.
   - Đặt ô tìm kiếm và nút “Thêm câu hỏi” cùng hàng trong header phải trên desktop/tablet; xếp dọc trên mobile.

5. **Tìm kiếm và thao tác**
   - Ô tìm kiếm có icon, placeholder rõ, focus ring màu primary.
   - Tất cả button có icon + text; trạng thái hover, focus-visible, active `scale(0.97)`, disabled rõ ràng.
   - Nút Sửa/Xóa trên thẻ A4 có nhãn text, không phụ thuộc riêng vào tooltip.

6. **Thẻ câu hỏi A4**
   - Header thẻ phân cấp rõ mã câu hỏi, CDR và thao tác.
   - Metadata dùng badge/tag dạng pill.
   - Card có radius, shadow, hover nổi nhẹ; nội dung vẫn giữ kích thước đọc gần A4.
   - “Hướng dẫn AI chấm” tách bằng divider và nền nhấn nhẹ.

7. **Empty state và loading**
   - Empty state bài học, chưa chọn bài, không có câu hỏi, không có kết quả tìm kiếm: icon lớn + title + hint text.
   - Loading danh sách bài học/câu hỏi có spinner hoặc progress bar; tránh hiển thị nhầm empty state khi đang tải.
   - Thao tác lưu/xóa có phản hồi processing, success, error và disabled khi đang xử lý.

8. **Form và side menu**
   - Header side menu dùng gradient; content/action có divider, padding `20-24px`.
   - Form control có focus ring primary; invalid state màu danger.
   - Validation error hiển thị icon `⚠️` + nội dung rõ ràng.
   - Giữ CKEditor và radio CDR hoạt động như hiện tại.

9. **Responsive và accessibility**
   - `992px`: header wrap; action wrap; sidebar thu gọn hợp lý.
   - `576px`: tìm kiếm và CTA xếp dọc; thẻ A4 giảm padding; side menu/form giảm padding.
   - Bảo đảm contrast, cỡ chữ, vùng bấm, label, keyboard focus và `aria-label` cho control chỉ có icon.

10. **Scrollbar**
    - Scrollbar rộng `6px`; track xám nhạt; thumb xám đậm hơn; hover rõ.

### CSS variables và cô lập phạm vi

- Khai báo CSS custom properties tại `:host`, không khai báo tại `:root` và không sửa stylesheet global.
- Dùng biến cho `--primary`, `--primary-light`, dải `--gray-*`, `--danger`, `--radius-sm/md/lg`, `--shadow-sm/md/lg`, `--transition`.
- Mọi style mới đặt dưới root namespace `.cauhoi-tuluan-15p`.
- Class mới dùng tiền tố `cauhoi-15p-*`; tránh tên tổng quát như `.header`, `.card`, `.button`.
- Không thêm selector tổng quát như `button`, `input`, `textarea`, `label`; selector reset hoặc override phải bắt đầu từ namespace chức năng.
- PrimeNG/CKEditor dùng `styleClass` riêng. Chỉ dùng `::ng-deep` khi bắt buộc và luôn neo dưới `:host .cauhoi-tuluan-15p`.
- Hạn chế `!important`; ưu tiên selector có specificity vừa đủ.
- Không chỉnh rộng các selector legacy đang dùng chung nếu chưa xác định đầy đủ phạm vi ảnh hưởng.

### Tiêu chí nghiệm thu

- Giao diện đáp ứng đủ header gọn, tìm kiếm cùng hàng CTA, button, empty state, loading, hover, form, dialog/side menu và responsive theo Rule #2.
- CSS global hiện có không làm sai giao diện mới nhờ namespace và specificity có kiểm soát.
- CSS của chức năng không rò rỉ hoặc thay đổi giao diện component khác.
- Sidebar, thẻ A4, side menu, dialog, CKEditor và PrimeNG hiển thị đúng trên desktop, tablet, mobile.
- Không phát sinh thay đổi nghiệp vụ hoặc API.
- Template không gọi method để tính trạng thái; dùng property đã tính sẵn hoặc pipe theo Rule #1.

## Kế hoạch bổ sung: Gợi ý tiêu chí chấm bằng AI trong `templateQuestion`

### Mục tiêu

- Cho phép người dùng gửi dữ liệu đang nhập trong `templateQuestion` tới `getTieuChiChamAi(prompt)`.
- Prompt luôn gồm hai phần có nhãn rõ ràng: **Nội dung câu hỏi** và **Hướng dẫn AI chấm**.
- Hiển thị kết quả AI trong form để người dùng xem xét; chỉ lưu vào câu hỏi sau khi người dùng bấm “Áp dụng”; không thay đổi tiêu chí chấm hiện có.
- Nút **“Áp dụng vào biểu mẫu”** đưa `rubricMarkdown` đã duyệt vào ô `rubric_markdown`, sau đó gọi ngay luồng lưu câu hỏi hiện có.
- Không thay đổi endpoint backend hoặc luồng yêu cầu duyệt; nút “Áp dụng vào biểu mẫu” và nút “Lưu lại” đều lưu `rubric_markdown` cùng dữ liệu câu hỏi.

### Phạm vi file dự kiến chỉnh sửa khi triển khai

1. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.ts`**
   - Import và inject `ApiAiService` từ `api-ai.service.ts`.
   - Bổ sung trạng thái `isGeneratingAiCriteria`, dữ liệu kết quả xem trước và lỗi AI.
   - Bổ sung hàm dựng prompt, hàm gọi `getTieuChiChamAi`, validate `{ rubricMarkdown, warnings }` và hàm lưu rubric vào câu hỏi.
   - Reset kết quả AI cũ khi mở form thêm/sửa câu hỏi để tránh hiển thị nhầm dữ liệu giữa hai câu hỏi.
   - Cho phép thao tác AI với cả câu hỏi mới/chưa lưu; chỉ cần form có `desc` và `note`.

2. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.html`**
   - Trong `templateQuestion`, đặt nút **“Gợi ý tiêu chí chấm bằng AI”** dưới trường “Hướng dẫn AI chấm điểm”.
   - Hiển thị spinner và khóa nút trong thời gian request.
   - Bổ sung vùng kết quả AI dạng chỉ đọc để người dùng xem xét, kèm thao tác “Tạo lại”, “Bỏ kết quả” và “Áp dụng”.
   - Không yêu cầu `selectedCauhoi.id`; câu hỏi mới có thể tạo rubric trước khi lưu.
   - Không dùng `innerHTML` trực tiếp cho nội dung AI chưa được kiểm soát.

3. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.css`**
   - Bổ sung style cho nút AI, trạng thái loading/error và vùng xem trước.
   - Mọi selector tiếp tục nằm dưới `.cauhoi-tuluan-15p`, dùng tiền tố `cauhoi-15p-*`, có focus-visible và responsive.

4. **`src/app/modules/shared/services/api-ai.service.ts`**
   - Giữ nguyên endpoint `ai-request/tao-tieu-chi-cham/`; bổ sung kiểu `AiRubricResponse` cho `getTieuChiChamAi(prompt: string)`.

### Luồng xử lý dự kiến

1. Người dùng mở form thêm hoặc sửa câu hỏi trong `templateQuestion`; không yêu cầu câu hỏi đã có ID.
2. Người dùng nhập hoặc điều chỉnh nội dung câu hỏi và hướng dẫn AI chấm.
3. Người dùng bấm **“Gợi ý tiêu chí chấm bằng AI”**.
4. Frontend kiểm tra dữ liệu tại thời điểm bấm:
   - `desc` phải có nội dung.
   - `note` phải có nội dung để tạo prompt đúng yêu cầu; điều kiện này chỉ áp dụng cho thao tác AI, không biến `note` thành trường bắt buộc khi lưu câu hỏi.
   - Dùng trực tiếp nội dung hiện có trong form; không yêu cầu dữ liệu đã lưu hoặc có ID.
5. Frontend dựng prompt theo cấu trúc ổn định:

```text
Nội dung câu hỏi:
{desc}

Hướng dẫn AI chấm:
{note}
```

6. Gọi `getTieuChiChamAi(prompt)` một lần; chặn bấm lặp khi request đang chạy.
7. Thành công: lưu `rubricMarkdown` và `warnings` vào state xem trước, hiển thị ngay trong `templateQuestion`; chưa lưu khi chỉ vừa nhận response.
8. Người dùng bấm **“Áp dụng vào biểu mẫu”**:
   - Đưa `rubricMarkdown` vào control `rubric_markdown`, sau đó gọi `saveCauhoi()`.
   - Nếu biểu mẫu hợp lệ, lưu ngay câu hỏi và rubric bằng luồng thêm/sửa hiện có.
   - Nếu biểu mẫu chưa hợp lệ, giữ rubric trong textarea, đánh dấu các trường lỗi và không gọi API.
   - Không parse Markdown thành `CoursePlanActivityTuluanTieuchicham[]`.
   - Không mở màn hình “Tạo tiêu chí chấm” và không thay đổi danh sách tiêu chí chấm hiện có.
9. Thất bại khi tạo rubric: bỏ trạng thái loading, giữ nguyên form, hiển thị thông báo lỗi và cho phép thử lại.
10. Khi đóng hoặc chuyển sang form câu hỏi khác: xóa state kết quả/lỗi AI cũ.

### Nguyên tắc dữ liệu và an toàn

- Lấy `desc` và `note` từ `formData.getRawValue()` tại thời điểm người dùng bấm nút.
- Không gửi `course_id`, user ID, dữ liệu phân quyền hoặc thông tin ngoài hai trường được yêu cầu.
- Không log prompt hoặc response AI ra console.
- Nội dung AI mặc định hiển thị bằng text binding; chỉ render HTML nếu backend có contract rõ ràng và qua cơ chế sanitize hiện có.
- Không tự động tin hoặc lưu kết quả AI; người dùng phải xem xét trước.
- Không làm mất kết quả nhập hiện tại khi API lỗi.

### Xử lý response

- Contract thực tế của `res.data`:
  ```typescript
  {
    rubricMarkdown: string;
    warnings: string[];
  }
  ```
- `rubricMarkdown` là nguồn rubric đầy đủ dùng cho AI chấm; không parse Markdown thành danh sách tiêu chí bằng regex hoặc heuristic.
- Hiển thị `rubricMarkdown` bằng text binding trong vùng xem trước; không dùng `innerHTML`.
- Hiển thị từng phần tử `warnings` để giảng viên kiểm tra trước khi áp dụng.
- Nút “Áp dụng vào biểu mẫu” cập nhật control `rubric_markdown` rồi gọi ngay luồng lưu câu hỏi hiện có.
- Response thiếu/rỗng `rubricMarkdown` được coi là lỗi có thể thử lại; không ghi đè kết quả hợp lệ cũ khi “Tạo lại” thất bại.

### Trạng thái UI

- **Câu hỏi mới:** cho phép thao tác AI ngay khi `desc` và `note` có nội dung; không cần lưu trước.
- **Mặc định:** nút AI khả dụng; hàm gọi kiểm tra `desc` và `note` từ form rồi mới gửi request.
- **Loading:** spinner, nhãn “AI đang tạo tiêu chí...”, khóa nút tạo và tạo lại.
- **Thành công:** vùng xem trước chỉ đọc hiển thị rubric Markdown và cảnh báo AI; bật nút “Áp dụng”.
- **Áp dụng:** đưa `rubricMarkdown` vào ô `rubric_markdown`, gọi ngay luồng lưu câu hỏi; nếu validation thất bại thì giữ form để người dùng sửa.
- **Lỗi:** thông báo ngắn gọn, giữ dữ liệu form, cho phép gọi lại.
- **Reset:** xóa kết quả khi mở câu hỏi khác; không để kết quả của câu hỏi trước xuất hiện trong form mới.

### Tiêu chí nghiệm thu

- Prompt gửi tới `getTieuChiChamAi` chứa đúng `desc` và `note` đã lưu, phân tách bằng nhãn rõ ràng.
- Không gọi API nếu thiếu `desc` hoặc `note`; không yêu cầu câu hỏi có ID hoặc dữ liệu đã được lưu.
- Mỗi lần bấm hợp lệ chỉ tạo một request trong lúc loading.
- Kết quả AI hiển thị trong `templateQuestion` để duyệt, không tự lưu ngay sau khi nhận response.
- Nút “Áp dụng vào biểu mẫu” điền `rubric_markdown` và gọi ngay API thêm/sửa qua luồng `saveCauhoi()` hiện có.
- Danh sách tiêu chí chấm hiện có không bị thêm, sửa hoặc xóa bởi luồng rubric AI.
- Lỗi API không đóng side menu, không xóa form, không làm kẹt trạng thái loading.
- Kết quả cũ được reset đúng khi chuyển giữa thao tác thêm/sửa hoặc câu hỏi khác.
- Nội dung response không tạo lỗ hổng XSS.
- Giao diện hoạt động trên desktop/mobile, hỗ trợ keyboard focus và trạng thái disabled rõ ràng.
- Không đổi endpoint backend, phân quyền hoặc nghiệp vụ duyệt; chỉ gõ kiểu response trong `api-ai.service.ts`.

### Trình tự triển khai

1. Gọi kiểm tra endpoint bằng dữ liệu mẫu không nhạy cảm hoặc quan sát response thật khi người dùng thao tác; xác nhận kiểu và field của `res.data` trước khi viết mapper.
2. Bổ sung import/injection, state, kiểm tra nội dung form, hàm dựng prompt và hàm request trong component TypeScript.
3. Bổ sung mapper object response theo contract đã xác nhận; không suy đoán hoặc parse Markdown bằng heuristic.
4. Bổ sung nút tạo AI, loading, error, warnings, vùng xem trước và nút “Áp dụng” trong `templateQuestion`.
5. Nút “Áp dụng vào biểu mẫu” cập nhật control `rubric_markdown`, sau đó gọi `saveCauhoi()`; validation thất bại thì giữ form để chỉnh sửa.
6. Bổ sung CSS có namespace cho UI mới.
7. Rà soát tĩnh luồng thêm/sửa/reset/lỗi/áp dụng/lưu hỗn hợp và cập nhật lịch sử kế hoạch.
8. Chỉ build/test/run hoặc gọi endpoint thật khi người dùng yêu cầu riêng.

## Kế hoạch bổ sung: Form nhập câu hỏi theo từng bài

### Mục tiêu và quyết định nghiệp vụ

- Mỗi bài học có đúng **một form nhập câu hỏi tự luận** về mặt nghiệp vụ.
- Một form không phải một bản ghi duy nhất: form là tập hợp nhiều bản ghi `CourseFormTuluan15p` cùng `course_id`, `course_plan_activity_id` và `week`.
- Mỗi bản ghi trong form đại diện cho đúng một chuẩn đầu ra `cdr`; trong cùng một form, `cdr` không được lặp.
- Người dùng phải chủ động tạo và lưu form trên server trước; chỉ khi bài đang chọn có form hợp lệ mới được thêm câu hỏi.
- Nội dung câu hỏi tiếp tục CRUD qua `CoursePlanActivityTuluanService`; không chuyển nội dung câu hỏi sang `CourseFormTuluan15pService`.
- Câu hỏi thuộc một bản ghi form bằng khóa nghiệp vụ `course_id + course_plan_activity_id + week + cdr`; không dùng `form_tuluan_15p_id` trong luồng bổ sung này.

### Cấu trúc dữ liệu server

Mỗi dòng dùng interface `CourseFormTuluan15p`:

```typescript
interface CourseFormTuluan15p {
  id?: number;
  course_id: number;
  week: number;
  cdr: number;
  ordering: number;
  question_take: number;
  point: number;
  course_plan_activity_id: number;
}
```

Quy ước:

- Khóa nhận diện form: `course_id + course_plan_activity_id + week`.
- Khóa nhận diện bản ghi trong form: `course_id + course_plan_activity_id + week + cdr`.
- `ordering`: thứ tự CDR trong form, bắt đầu từ `1`, không lấy thứ tự câu hỏi.
- `question_take`: luôn là số nguyên lớn hơn `0`; không phụ thuộc số lượng câu hỏi hiện có.
- `point`: điểm cho một câu thuộc CDR; bắt buộc lớn hơn `0`.
- Ràng buộc bắt buộc trên frontend: không cho trùng `cdr` trong cùng bài.
- Backend chưa có unique constraint. Frontend dùng `course_id + course_plan_activity_id + week + cdr` làm điều kiện tải và ánh xạ câu hỏi đúng bản ghi form; phải kiểm tra trùng trước từng request thêm.

### Phạm vi mã nguồn dự kiến

1. **`cauhoi-tuluan-15p.component.ts`**
   - Import/inject `CourseFormTuluan15pService`; import model `CourseFormTuluan15p`.
   - Bổ sung state: `lessonFormRows`, `hasLessonForm`, `isLoadingLessonForm`, `isSavingLessonForm` và dữ liệu form đang chỉnh sửa.
   - Khi chọn bài, tải song song form của bài và danh sách câu hỏi để xác định form hợp lệ và các CDR đã có câu hỏi.
   - Bổ sung các hàm mở form, thêm/xóa dòng CDR cục bộ, kiểm tra hợp lệ, lưu form và nạp lại dữ liệu từ server.
   - Chặn `openAddCauhoi()` và chặn lại trong `saveCauhoi()` nếu bài chưa có form hợp lệ, tránh bypass từ UI.
   - Khi thêm câu hỏi, giới hạn `cdr` theo các bản ghi đã lưu của form bài đang chọn.
   - Sau CRUD câu hỏi, tải lại danh sách để cập nhật trạng thái CDR đã có câu hỏi; không cập nhật metadata đếm câu.

2. **`cauhoi-tuluan-15p.component.html`**
   - Header bài đang chọn hiển thị trạng thái “Chưa có form” hoặc “Đã có form”.
   - Bài chưa có form: thay CTA thêm câu hỏi bằng CTA chính **“Tạo form nhập câu hỏi”**; nút **“Thêm câu hỏi”** disabled hoặc không hiển thị.
   - Bài có form: hiển thị **“Chỉnh sửa form”** và mở khóa **“Thêm câu hỏi”**.
   - Bổ sung side menu/dialog form gồm các dòng: CDR, thứ tự, điểm, số câu lấy; có nút thêm/xóa dòng và cảnh báo trùng CDR.
   - Empty state giải thích rõ: phải tạo ít nhất một dòng CDR hợp lệ và lưu thành công trước khi nhập câu hỏi.
   - CDR của form câu hỏi chỉ cho chọn trong tập CDR đã lưu của form bài.

3. **`cauhoi-tuluan-15p.component.css`**
   - Bổ sung style có namespace cho badge trạng thái form, CTA tạo/chỉnh sửa form, bảng dòng CDR, lỗi từng dòng, loading và responsive.
   - Tiếp tục đặt mọi selector dưới `.cauhoi-tuluan-15p`, dùng tiền tố `cauhoi-15p-*`; không sửa stylesheet global.

4. **`course-form-tuluan-15p.service.ts`**
   - Tái sử dụng `getByPage()`, `add()`, `update()` và `delete()` hiện có.
   - Không đổi endpoint `course-form-tuluan-15p/` nếu backend đã hỗ trợ đủ CRUD.
   - Chỉ bổ sung kiểu tham số/trả về nếu cần tăng type safety; không thay đổi contract server trong phạm vi frontend.

### Luồng tải khi chọn bài

1. `onSelectLesson(lesson)` reset state của bài trước, gán `selectedLesson`.
2. Tải các bản ghi `CourseFormTuluan15p` với điều kiện:
   - `course_id = selectedCourse.id`;
   - `course_plan_activity_id = selectedLesson.id`;
   - `week = selectedLesson.week`;
   - `limit = -1`, sắp xếp `ordering ASC`.
3. Tải câu hỏi hiện tại bằng `course_id + course_plan_activity_id` như luồng đang có.
4. Đối chiếu câu hỏi theo `cdr` để xác định dòng form đã có câu hỏi, phục vụ khóa xóa/đổi CDR.
5. `hasLessonForm = true` khi server trả ít nhất một bản ghi hợp lệ, mọi CDR duy nhất và các khóa bài khớp; ngược lại coi là chưa có form hoặc form lỗi cần sửa.
6. Chỉ hiển thị empty state sau khi cả dữ liệu form và câu hỏi tải xong.
7. Dùng token/request identity hoặc hủy subscription cũ nếu người dùng chuyển bài nhanh, tránh response bài trước ghi đè state bài mới.

### Luồng tạo form chủ động

1. Người dùng chọn bài chưa có form.
2. UI hiển thị CTA **“Tạo form nhập câu hỏi”**; “Thêm câu hỏi” chưa khả dụng.
3. Mở form rỗng với một dòng mặc định; người dùng chọn CDR, nhập `point`, `question_take`; `ordering` tự tính theo vị trí.
4. Mỗi CDR chỉ xuất hiện một lần; CDR đã chọn ở dòng khác phải disabled hoặc bị validation từ chối.
5. Frontend dựng từng payload `CourseFormTuluan15p` bằng khóa bài đang chọn; không tin dữ liệu khóa do control tự do cung cấp.
6. Validate toàn bộ trước khi gửi:
   - có ít nhất một dòng;
   - tất cả CDR hợp lệ, không trùng;
   - `point > 0`;
   - `question_take` luôn là số nguyên lớn hơn `0`;
   - bài/course/week vẫn trùng selection hiện tại.
7. Gửi từng bản ghi bằng `CourseFormTuluan15pService.add()`; khóa nút trong lúc lưu.
8. Chỉ đặt `hasLessonForm = true` sau khi toàn bộ request thành công và dữ liệu được tải lại từ server có `id`.
9. Nếu lưu một phần thất bại: không mở khóa thêm câu hỏi; tải lại trạng thái thật từ server, thông báo form chưa hoàn tất và cho phép sửa/lưu tiếp. Không giả định rollback nếu backend không hỗ trợ transaction.

### Luồng chỉnh sửa form

1. Nạp bản sao các bản ghi server vào form chỉnh sửa; giữ `id` cho dòng đã lưu.
2. Dòng có `id`: gọi `update(id, payload)` khi thay đổi.
3. Dòng mới: gọi `add(payload)`.
4. Dòng bị xóa: chỉ gọi `delete(id)` sau xác nhận nếu chưa có câu hỏi thuộc `course_id + course_plan_activity_id + week + cdr`.
5. Nếu CDR đã có bất kỳ câu hỏi nào, cấm xóa dòng và cấm đổi CDR; người dùng chỉ được sửa `point`, `question_take` hoặc các field không phá ánh xạ.
6. Không dùng chiến lược xóa toàn bộ form rồi insert lại vì có thể tạo khoảng trống, mất ID và mở khóa sai khi một request thất bại.
7. Backend không có transaction/bulk endpoint. Frontend lưu tuần tự hoặc theo lô request độc lập; nếu lỗi một phần phải dừng khi phù hợp, tải lại trạng thái server và cho người dùng tiếp tục sửa.
8. Sau lưu: tải lại form và câu hỏi, kiểm tra CDR không trùng, rồi mới cập nhật trạng thái UI.

### Luồng thêm và tìm câu hỏi

- Điều kiện cho phép thêm: bài/course hợp lệ, form đã tải xong, `hasLessonForm === true`, không đang lưu form.
- `openAddCauhoi()` kiểm tra điều kiện; nếu không đạt, hiển thị cảnh báo “Vui lòng tạo và lưu form nhập câu hỏi cho bài này trước”.
- `saveCauhoi()` kiểm tra lại form còn tồn tại trên state đã tải; CDR được chọn phải có bản ghi form tương ứng.
- Payload câu hỏi vẫn giữ `course_id`, `course_plan_activity_id`, `cdr`, `desc`, `note`, `rubric_markdown` và các field hiện tại.
- Tìm câu hỏi của một bản ghi form bằng:

```text
question.course_id = form.course_id
question.course_plan_activity_id = form.course_plan_activity_id
selectedLesson.week = form.week
question.cdr = form.cdr
```

- Vì model câu hỏi không có `week`, `week` lấy từ bài đang chọn và được kiểm tra với `form.week`; không bổ sung field `week` vào câu hỏi nếu backend hiện không có contract này.
- Khi sửa câu hỏi, CDR hiện tại phải còn thuộc form. Nếu đổi CDR, CDR đích phải có dòng form hợp lệ.

### Trạng thái CDR đã có câu hỏi

- Không lưu hoặc sử dụng trường đếm tổng số câu trong `CourseFormTuluan15p`.
- Danh sách `CoursePlanActivityTuluan` theo bài và CDR chỉ dùng để xác định dòng form đã có câu hỏi.
- Sau thêm/xóa/đổi CDR câu hỏi: tải lại dữ liệu để cập nhật trạng thái khóa xóa/đổi CDR.
- `question_take` chỉ cần là số nguyên lớn hơn `0`; không bị giới hạn bởi số câu hiện có.

### Trạng thái UI/UX

- **Đang tải form:** khóa CTA tạo/chỉnh sửa/thêm câu hỏi; hiển thị spinner riêng.
- **Chưa có form:** badge cảnh báo, empty state hướng dẫn, CTA tạo form nổi bật.
- **Form đang lưu:** khóa đóng/lưu lặp; hiển thị tiến trình.
- **Form hợp lệ:** badge thành công; mở khóa thêm câu hỏi.
- **Form lỗi/trùng CDR:** badge lỗi; khóa thêm câu hỏi; mở form chỉnh sửa để khắc phục.
- **Lỗi tải form:** không coi là chưa có form; khóa thêm câu hỏi và cung cấp thao tác tải lại.
- **Chuyển bài:** đóng hoặc reset form chỉnh sửa, câu hỏi đang nhập và state AI của bài trước sau xác nhận phù hợp; không để dữ liệu chéo bài.

### Tiêu chí nghiệm thu

- Mỗi bài được biểu diễn bởi tối đa một tập bản ghi form theo khóa `course_id + course_plan_activity_id + week`.
- Trong tập đó không có hai bản ghi cùng `cdr`; frontend phải kiểm tra vì backend chưa có unique constraint.
- Bài chưa có bản ghi form trên server không thể mở hoặc lưu câu hỏi mới.
- Tạo form chỉ được công nhận sau khi server trả dữ liệu lưu thành công có `id`.
- Mỗi dòng hợp lệ phải có `point > 0`; `question_take` luôn là số nguyên lớn hơn `0`.
- Nội dung câu hỏi vẫn CRUD qua `CoursePlanActivityTuluanService`.
- Câu hỏi được ánh xạ đúng vào dòng form bằng `course_id + course_plan_activity_id + week + cdr`.
- CDR khi thêm/sửa câu hỏi chỉ lấy từ các CDR của form bài hiện tại.
- Cấm xóa hoặc đổi CDR nếu dòng đã có ít nhất một câu hỏi; không tạo câu hỏi mồ côi.
- Form không hiển thị, gửi hoặc đồng bộ metadata tổng số câu.
- Chuyển bài nhanh không làm response cũ ghi đè dữ liệu form/câu hỏi hiện tại.
- Lỗi tải khác với trạng thái chưa có form; mọi lỗi đều không mở khóa thêm câu hỏi sai.
- UI có loading, disabled, validation, error, empty state, keyboard focus và responsive.
- Không thay đổi luồng AI/rubric, duyệt, phân quyền hoặc endpoint hiện có ngoài việc thêm điều kiện form.

### Trình tự triển khai dự kiến

1. Xác nhận backend hỗ trợ filter đồng thời `course_id`, `course_plan_activity_id`, `week`, `cdr`.
2. Bổ sung service/model imports, state và hàm tải form theo bài.
3. Tích hợp tải form với `onSelectLesson()`/`loadCauhoi()`, xử lý chuyển bài nhanh và lỗi độc lập.
4. Bổ sung UI trạng thái form, CTA tạo/chỉnh sửa và side menu form nhiều dòng CDR.
5. Triển khai validation `point > 0`, `question_take > 0`, CDR không trùng và kiểm tra trạng thái server trước khi thêm.
6. Triển khai diff add/update/delete bằng request độc lập; khi lỗi một phần tải lại trạng thái server vì không có transaction/bulk endpoint.
7. Cấm xóa/đổi CDR đã có câu hỏi; chỉ cho sửa field không phá ánh xạ.
8. Khóa `openAddCauhoi()`/`saveCauhoi()`; lọc CDR câu hỏi theo form đã lưu.
9. Tải lại trạng thái CDR đã có câu hỏi sau CRUD.
10. Bổ sung CSS namespace, responsive và accessibility.
11. Rà soát tĩnh theo tiêu chí nghiệm thu; chỉ gọi endpoint/build/test/run khi người dùng yêu cầu riêng.

### Câu hỏi mở

- Không còn câu hỏi nghiệp vụ cho phạm vi hiện tại.
- Trước triển khai chỉ cần xác minh kỹ thuật: backend có hỗ trợ filter đồng thời `course_id`, `course_plan_activity_id`, `week`, `cdr` hay không.

## Lịch sử chỉnh sửa

### 2026-08-06 — Lần 1: Bổ sung kế hoạch cải tiến UI/UX

**Mục đích:** Chuẩn hóa giao diện chức năng theo Rule #2 và bảo đảm CSS được cô lập.

**Các thay đổi:**
1. **`plans/cauhoi-tuluan-15p.md`** — Bổ sung phạm vi, hạng mục UI/UX, responsive, accessibility, quy tắc CSS scope và tiêu chí nghiệm thu.

**Kết quả:** Đã có kế hoạch UI/UX; chưa triển khai thay đổi mã nguồn, chưa build/test/run.

### 2026-08-06 — Lần 2: Triển khai cải tiến UI/UX

**Mục đích:** Hiện đại hóa giao diện quản lý câu hỏi, tăng phản hồi trạng thái và cô lập CSS trong phạm vi chức năng.

**Các thay đổi:**
1. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.html`** — Bổ sung header gradient, sidebar bài học, stat cards, tìm kiếm có icon, thẻ câu hỏi mới, button icon + text, loading/empty state, validation và form side menu.
2. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.css`** — Bổ sung biến CSS tại `:host`, namespace `.cauhoi-tuluan-15p`, class tiền tố `cauhoi-15p-*`, hover/focus/active, scrollbar và responsive `992px`/`576px`.
3. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.ts`** — Bổ sung trạng thái tải/lưu/xóa, phản hồi lỗi, validation touched và tổng điểm tiêu chí tính sẵn.
4. **`plans/cauhoi-tuluan-15p.md`** — Cập nhật trạng thái triển khai.

**Kết quả:** Hoàn tất triển khai tĩnh theo kế hoạch. CSS mới được scope dưới namespace chức năng; không chỉnh stylesheet global. Đã kiểm tra định dạng diff; chưa build/test/run theo quy ước review tĩnh.

### 2026-08-06 — Lần 3: Gia cố CSS trước stylesheet global

**Mục đích:** Ngăn các selector global `button`, `input`, `textarea`, `.btn`, `.ovic-input-field` và `.ovic-over-right-section__foot-btn` làm sai giao diện mới.

**Các thay đổi:**
1. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.html`** — Gỡ class legacy khỏi control UI mới; thêm contract riêng cho radio CDR và CKEditor.
2. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.css`** — Bổ sung override có namespace cho thuộc tính global đang dùng `!important`; giới hạn `::ng-deep` dưới `.cauhoi-tuluan-15p` và class child riêng.

**Kết quả:** CSS global không còn thắng các thuộc tính kích thước, padding, radius, shadow và focus của control UI mới. Component dùng `ViewEncapsulation.Emulated` mặc định; CSS chức năng không rò sang component khác. Không chỉnh stylesheet global. Đã rà soát tĩnh; chưa build/test/run.

### 2026-08-06 — Lần 4: Tinh gọn khu vực đầu trang

**Mục đích:** Tăng diện tích hiển thị danh sách câu hỏi và gom thao tác chính vào một khu vực.

**Các thay đổi:**
1. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.html`** — Bỏ khối thống kê nhanh; chuyển ô tìm kiếm vào header phải, cùng hàng với nút “Thêm câu hỏi”.
2. **`src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/cauhoi-tuluan-15p.component.css`** — Thu nhỏ chiều cao, padding và cỡ tiêu đề của header trái/phải; bổ sung bố cục responsive cho nhóm tìm kiếm/CTA; xóa CSS thống kê và toolbar không còn dùng.
3. **`plans/cauhoi-tuluan-15p.md`** — Đồng bộ kế hoạch với giao diện tinh gọn.

**Kết quả:** Header hai cột gọn hơn; tìm kiếm và CTA cùng hàng trên desktop/tablet, xếp dọc trên mobile. Không chỉnh TypeScript, nghiệp vụ hoặc stylesheet global. Đã rà soát tĩnh; chưa build/test/run.

### 2026-08-07 — Lần 5: Lập kế hoạch gợi ý tiêu chí chấm bằng AI

**Mục đích:** Bổ sung thiết kế tích hợp `getTieuChiChamAi` vào `templateQuestion` với prompt gồm nội dung câu hỏi và hướng dẫn AI chấm.

**Các thay đổi:**
1. **`plans/cauhoi-tuluan-15p.md`** — Bổ sung phạm vi, data flow, trạng thái UI, xử lý response, nguyên tắc an toàn, tiêu chí nghiệm thu và trình tự triển khai.

**Quyết định ban đầu:** Kết quả AI hiển thị để duyệt; phương án bản nháp tiêu chí đã được thay thế ở Lần 7 sau khi xác nhận endpoint trả rubric Markdown. Câu hỏi phải được lưu trước; form có thay đổi chưa lưu phải lưu trước khi gọi AI.

**Kết quả:** Hoàn tất kế hoạch; chưa chỉnh mã nguồn, chưa gọi endpoint thật, chưa build/test/run.

### 2026-08-07 — Lần 6: Triển khai gợi ý tiêu chí chấm bằng AI

**Mục đích:** Tích hợp `getTieuChiChamAi` vào `templateQuestion`, cho phép duyệt kết quả rồi áp dụng dưới dạng bản nháp.

**Các thay đổi:**
1. **`cauhoi-tuluan-15p.component.ts`** — Bổ sung trạng thái/request AI, kiểm tra câu hỏi đã lưu và nội dung chưa thay đổi, mapper mảng response, hủy request khi đóng/chuyển form, áp dụng bản nháp sau khi tải tiêu chí hiện có, lưu hỗn hợp update/add và xóa bản nháp không gọi API.
2. **`cauhoi-tuluan-15p.component.html`** — Bổ sung nút tạo AI, trạng thái loading/lỗi, vùng duyệt kết quả, Tạo lại, Bỏ kết quả và Áp dụng.
3. **`cauhoi-tuluan-15p.component.css`** — Bổ sung giao diện AI có namespace, focus/disabled và responsive.

**Contract frontend ban đầu:** Chấp nhận `res.data` là mảng tiêu chí. Contract này đã được thay thế sau khi nhận response thực tế.

**Kết quả:** Hoàn tất triển khai ban đầu; chưa build/test/run.

### 2026-08-07 — Lần 7: Đồng bộ contract rubric Markdown thực tế

**Mục đích:** Hoàn thiện chức năng theo response thực tế `{ rubricMarkdown, warnings }` từ `getTieuChiChamAi`.

**Các thay đổi:**
1. **`api-ai.service.ts`** — Khai báo `AiRubricResponse`; gõ kiểu response của `getTieuChiChamAi`.
2. **`cauhoi-tuluan-15p.component.ts`** — Validate object response, giữ nguyên Markdown, hiển thị warnings; nút Áp dụng lưu `rubricMarkdown` vào câu hỏi. Gỡ mapper mảng và luồng bản nháp tiêu chí AI không còn phù hợp.
3. **`cauhoi-tuluan-15p.component.html`** — Xem trước Markdown dưới dạng text an toàn, hiển thị cảnh báo và trạng thái lưu.
4. **`cauhoi-tuluan-15p.component.css`** — Style vùng Markdown/cảnh báo có namespace.

**Kết quả:** Frontend dùng đúng contract thực tế; không parse Markdown bằng heuristic; danh sách tiêu chí chấm hiện có không bị thay đổi. Đã review tĩnh; chưa build/test/run.

### 2026-08-07 — Lần 8: Cho phép giảng viên chỉnh sửa rubric

**Mục đích:** Hiển thị `rubric_markdown` trong form câu hỏi, cho phép giảng viên hiệu chỉnh trước khi lưu.

**Các thay đổi:**
1. **`cauhoi-tuluan-15p.component.ts`** — Thêm control `rubric_markdown`, nạp dữ liệu khi sửa câu hỏi; “Áp dụng vào biểu mẫu” chỉ điền control, không gọi API.
2. **`cauhoi-tuluan-15p.component.html`** — Thêm textarea rubric có thể chỉnh sửa và cập nhật nhãn thao tác AI.
3. **`cauhoi-tuluan-15p.component.css`** — Bổ sung style textarea Markdown có namespace.

**Kết quả:** Giảng viên có thể nhập, sửa rubric thủ công hoặc dùng bản nháp AI; rubric chỉ lưu cùng câu hỏi khi bấm nút lưu. Đã review tĩnh; chưa build/test/run.

### 2026-08-07 — Lần 9: Cho phép tạo rubric trước khi lưu câu hỏi

**Mục đích:** Gửi trực tiếp nội dung hiện có trong form lên AI, không yêu cầu câu hỏi đã lưu hoặc có ID.

**Các thay đổi:**
1. **`cauhoi-tuluan-15p.component.ts`** — Gỡ kiểm tra `selectedCauhoi.id` và so sánh snapshot đã lưu; chỉ yêu cầu `desc` và `note` có nội dung. Cho phép áp dụng rubric vào cả form thêm mới.
2. **`cauhoi-tuluan-15p.component.html`** — Nút AI không còn bị khóa cho câu hỏi mới; bỏ hướng dẫn lưu câu hỏi trước.
3. **`cauhoi-tuluan-15p.component.css`** — Gỡ style hint không còn sử dụng.

**Kết quả:** Câu hỏi mới hoặc nội dung đang chỉnh sửa chưa lưu đều có thể tạo rubric AI; rubric vẫn chỉ lưu khi giảng viên bấm nút lưu câu hỏi. Đã review tĩnh; chưa build/test/run.

## Công việc còn lại

- Kiểm tra backend chấp nhận và trả lại field `rubric_markdown` trong API update/get câu hỏi.
- Kiểm tra trực quan desktop, tablet, mobile khi người dùng yêu cầu chạy ứng dụng.
- Xác nhận hiển thị side menu, CKEditor và control PrimeNG trong runtime.

## Câu hỏi mở

- Không còn câu hỏi về cấu trúc response `getTieuChiChamAi`; service trả chuỗi JSON chứa `{ rubricMarkdown, warnings }`.

### 2026-08-07 — Lần 10: Chỉ lưu rubric Markdown

**Mục đích:** Xác định `rubricMarkdown` là dữ liệu chấm duy nhất từ AI; không tách hoặc tạo bản ghi tiêu chí từ Markdown.

**Các thay đổi:**
1. **`cauhoi-tuluan-15p.component.ts`** — Đồng bộ tên state/hàm từ “criteria” sang “rubric”; tiếp tục parse chuỗi JSON, lấy nguyên `rubricMarkdown` và `warnings`.
2. **`cauhoi-tuluan-15p.component.html`** — Đổi nhãn thao tác thành “Tạo rubric chấm điểm bằng AI”.
3. **Luồng dữ liệu** — “Áp dụng vào biểu mẫu” chỉ gán `rubricMarkdown` vào `rubric_markdown`; không parse bảng Markdown, không tạo `CoursePlanActivityTuluanTieuchicham`.

**Kết quả:** Rubric Markdown chứa toàn bộ giải thích tiêu chí chấm, được giảng viên chỉnh sửa và lưu cùng câu hỏi. Danh sách tiêu chí chấm riêng không tham gia luồng AI. Đã review tĩnh; chưa build/test/run.

### 2026-08-07 — Lần 11: Lập kế hoạch form nhập câu hỏi theo bài

**Mục đích:** Bắt buộc mỗi bài có một form đã lưu trên server trước khi thêm câu hỏi; form gồm nhiều bản ghi `CourseFormTuluan15p`, mỗi CDR duy nhất.

**Quyết định:**
1. Form được nhận diện bằng `course_id + course_plan_activity_id + week`; mỗi dòng được nhận diện thêm bằng `cdr`.
2. Người dùng chủ động tạo form qua `CourseFormTuluan15pService`.
3. Nội dung câu hỏi tiếp tục lưu qua `CoursePlanActivityTuluanService`.
4. Câu hỏi ánh xạ với dòng form bằng `course_id + course_plan_activity_id + week + cdr`; không dùng `form_tuluan_15p_id`.
5. Chỉ mở khóa thêm câu hỏi sau khi form hợp lệ đã được tải lại từ server.

**Kết quả:** Đã bổ sung data contract, luồng tải/tạo/sửa form, validation, UX states, tiêu chí nghiệm thu và câu hỏi mở. Quyết định đồng bộ metadata tổng số câu tại thời điểm này đã được thay thế ở Lần 14. Chưa chỉnh mã nguồn, chưa build/test/run.

### 2026-08-07 — Lần 12: Chốt ràng buộc form nhập câu hỏi

**Quyết định:**
1. Cấm xóa hoặc đổi CDR nếu bản ghi form đã có ít nhất một câu hỏi.
2. `question_take` luôn phải là số nguyên lớn hơn `0`. Quyết định giới hạn theo metadata tổng số câu đã được thay thế ở Lần 14.
3. `point` bắt buộc lớn hơn `0`.
4. Backend chưa có unique constraint; frontend chống trùng CDR và dùng bộ khóa nghiệp vụ để tải/ánh xạ câu hỏi đúng bản ghi form.
5. Backend không có transaction/bulk endpoint; frontend xử lý request độc lập, tải lại trạng thái thật nếu lưu thất bại một phần.

**Kết quả:** Không còn câu hỏi nghiệp vụ trong phạm vi kế hoạch. Còn xác minh kỹ thuật khả năng filter đồng thời các trường trên endpoint. Chưa chỉnh mã nguồn, chưa build/test/run.

### 2026-08-07 — Lần 13: Triển khai form nhập câu hỏi theo bài

**Mục đích:** Bắt buộc bài có tập bản ghi `CourseFormTuluan15p` hợp lệ trước khi thêm câu hỏi.

**Các thay đổi:**
1. **`cauhoi-tuluan-15p.component.ts`** — Tải đồng thời form và câu hỏi theo `course_id + course_plan_activity_id + week`; chống response cũ; thêm state form, validation CDR/điểm/số câu lấy, CRUD diff tuần tự, tải lại server khi lỗi một phần, chặn thêm/lưu câu hỏi nếu thiếu form, giới hạn CDR câu hỏi theo form. Luồng đồng bộ metadata tổng số câu ban đầu đã được gỡ ở Lần 14.
2. **`cauhoi-tuluan-15p.component.html`** — Thêm badge trạng thái form, CTA tạo/chỉnh sửa/tải lại, empty/error state, side menu cấu hình nhiều dòng CDR; khóa đổi/xóa CDR đã có câu hỏi; CDR câu hỏi chỉ lấy từ form.
3. **`cauhoi-tuluan-15p.component.css`** — Thêm style namespace cho trạng thái form, bảng CDR, control, lỗi và responsive.
4. **Quy tắc bootstrap** — `question_take` luôn lớn hơn `0`. Quy tắc giới hạn và đồng bộ metadata tổng số câu đã được gỡ ở Lần 14.

**Kết quả:** Hoàn tất triển khai mã nguồn và rà soát tĩnh bằng `git diff --check`. Chưa build/test/run theo quy ước review tĩnh. Endpoint filter nhiều trường chưa được xác minh runtime.

### 2026-08-07 — Lần 14: Bỏ metadata tổng số câu khỏi form tự luận 15 phút

**Mục đích:** Loại bỏ hoàn toàn field đếm tổng số câu khỏi contract và nghiệp vụ `CourseFormTuluan15p`; tránh dữ liệu đếm bị lệch làm form tải thành công nhưng bị đánh dấu không hợp lệ.

**Các thay đổi:**
1. **Model và payload** — Xóa field đếm tổng số câu khỏi `CourseFormTuluan15p`; mọi payload add/update không còn gửi field này.
2. **Form theo bài** — Xóa cột tổng số câu, luồng tính/đồng bộ tổng và validation giới hạn trên; `question_take` chỉ cần là số nguyên lớn hơn `0`.
3. **Khóa CDR** — Vẫn tải danh sách câu hỏi và chỉ lưu boolean `hasQuestions` để cấm xóa/đổi CDR đã có câu hỏi; không lưu số đếm.
4. **Các màn hình cấu hình tự luận 15 phút** — Xóa cột/biến tổng số câu và giới hạn `question_take` theo tổng; giữ tổng điểm, số câu lấy và ánh xạ CDR.

**Kết quả:** Contract frontend không còn field đếm tổng số câu của `CourseFormTuluan15p`; không ảnh hưởng các field cùng tên thuộc chức năng trắc nghiệm hoặc thống kê khác. Rà soát tĩnh; chưa build/test/run.

### 2026-08-09 — Lần 15: Xác định có form chỉ theo bản ghi server

**Mục đích:** Tránh form đã tồn tại bị hiển thị sai thành “Form chưa hợp lệ”.

**Thay đổi:** `hasLessonForm` chỉ phụ thuộc `lessonFormRows.length > 0`. Điểm, số câu lấy, CDR trùng và câu hỏi mồ côi không còn quyết định trạng thái “Đã có form” hoặc quyền mở form thêm câu hỏi; các điều kiện dữ liệu vẫn được kiểm tra khi người dùng lưu/chỉnh sửa form.

**Kết quả:** Có ít nhất một bản ghi `CourseFormTuluan15p` của bài đang chọn thì hiển thị “Đã có form” và mở nút thêm câu hỏi. Xóa trạng thái “Form chưa hợp lệ” khỏi UI. Chưa build/test/run.

### 2026-08-09 — Lần 16: Đồng bộ điểm câu hỏi theo CDR trong form

**Mục đích:** Điểm của câu hỏi phải lấy từ dòng `CourseFormTuluan15p` có CDR tương ứng, không phụ thuộc giá trị cũ hoặc dữ liệu nhập trên form câu hỏi.

**Thay đổi:** Khi thêm hoặc sửa câu hỏi, tìm dòng form theo CDR đã chọn; nếu tồn tại thì gán `point` của payload bằng `point` của dòng form. CDR không thuộc form vẫn bị từ chối lưu.

**Kết quả:** Câu hỏi mới và câu hỏi được chỉnh sửa luôn đồng bộ điểm theo CDR trong form của bài. Chưa build/test/run.

### 2026-08-09 — Lần 17: Hiển thị điểm và lọc câu hỏi theo CDR

**Mục đích:** Giúp nhận biết điểm của từng câu hỏi và thu hẹp danh sách theo các CDR đã cấu hình trong form bài.

**Thay đổi:** Thẻ câu hỏi hiển thị `point` đã lưu của câu hỏi. Thanh công cụ bổ sung dropdown gồm “Tất cả CDR” và các CDR thuộc `CourseFormTuluan15p`; lựa chọn CDR lọc chính xác danh sách theo `question.cdr`, đồng thời vẫn kết hợp bộ tìm kiếm mã câu hỏi.

**Kết quả:** Người dùng xem được điểm ngay trên danh sách và lọc câu hỏi theo CDR trong form. Chưa build/test/run.

### 2026-08-09 — Lần 18: Làm rõ nguồn mức độ/trình độ năng lực

**Mục đích:** Giúp người nhập hiểu lựa chọn mức độ/trình độ năng lực được giới hạn theo form câu hỏi của bài.

**Thay đổi:** Đổi label thành “Mức độ/trình độ năng lực trong form câu hỏi” và đồng bộ thông báo bắt buộc tương ứng.

**Kết quả:** Form nhập câu hỏi thể hiện rõ nguồn lựa chọn. Chưa build/test/run.

### 2026-08-14 — Lần 19: Hiển thị điểm theo CDR trong form câu hỏi

**Mục đích:** Giúp giảng viên biết ngay điểm của câu hỏi khi chọn mức độ CDR trong layout thêm hoặc sửa.

**Các thay đổi:**
1. **`cauhoi-tuluan-15p.component.ts`** — Theo dõi control `cdr`, tìm dòng `CourseFormTuluan15p` tương ứng, đồng bộ `point` và dọn subscription khi component bị hủy.
2. **`cauhoi-tuluan-15p.component.html`** — Thêm thẻ điểm chỉ đọc dưới vùng chọn CDR; hiển thị trạng thái hướng dẫn trước khi chọn và nguồn “Theo form câu hỏi” sau khi có điểm.
3. **`cauhoi-tuluan-15p.component.css`** — Bổ sung giao diện thẻ điểm có namespace, phân cấp thị giác và responsive trên mobile.

**Kết quả:** Layout thêm/sửa hiển thị điểm ngay theo CDR đã chọn; điểm không cho nhập tay, tiếp tục lấy từ form câu hỏi và được dùng đúng khi tạo rubric AI/lưu câu hỏi. Rà soát tĩnh; chưa build/test/run.

### 2026-08-17 — Lần 20: Lưu câu hỏi khi áp dụng rubric AI

**Mục đích:** Giảm thao tác thủ công sau khi người dùng duyệt rubric AI.

**Thay đổi:** Nút “Áp dụng vào biểu mẫu” gán `rubricMarkdown` vào control `rubric_markdown`, sau đó gọi trực tiếp luồng `saveCauhoi()` hiện có. Validation, đồng bộ điểm theo CDR, thêm/sửa, loading và xử lý lỗi tiếp tục dùng chung luồng lưu câu hỏi.

**Kết quả:** Nếu biểu mẫu hợp lệ, rubric và câu hỏi được lưu ngay. Nếu biểu mẫu chưa hợp lệ, rubric vẫn được áp dụng vào control; câu hỏi chưa được gửi lên server và các trường lỗi được đánh dấu. Rà soát tĩnh; chưa build/test/run.

### 2026-08-17 — Lần 21: Hiển thị trạng thái rubric trong danh sách

**Mục đích:** Giúp người dùng nhận biết nhanh câu hỏi đã có `rubric_markdown` ngay trên danh sách.

**Thay đổi:** Header thẻ câu hỏi hiển thị badge xanh **“Đã có rubric”** kèm icon xác nhận khi `cauhoi.rubric_markdown` có dữ liệu. Badge dùng class có namespace riêng, không thay đổi dữ liệu hoặc nghiệp vụ.

**Kết quả:** Câu hỏi có rubric được nhận biết bằng cả icon, chữ và màu sắc; câu hỏi chưa có rubric không hiển thị badge. Rà soát tĩnh; chưa build/test/run.

### 2026-08-17 — Lần 22: Tự động cuộn sau khi AI tạo rubric

**Mục đích:** Đưa vùng kết quả rubric AI vào tầm nhìn ngay khi request hoàn tất.

**Thay đổi:** Gắn tham chiếu vào vùng cuộn của form câu hỏi. Sau khi AI trả rubric hợp lệ và Angular render vùng xem trước, cuộn mượt vùng form xuống cuối. Không cuộn khi response không hợp lệ hoặc request lỗi.

**Kết quả:** Người dùng được đưa trực tiếp đến bản nháp rubric và nhóm nút xử lý sau khi AI tạo thành công. Rà soát tĩnh; chưa build/test/run.
