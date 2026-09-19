# Kế hoạch chức năng `theodoi-kiemtra-tuluan15p`

> Clone từ `theodoi-kiemtra-daugio`, sửa service + hiển thị bài làm SV tự luận.

## Vị trí

```
src/app/modules/admin/features/lop-hoc-phan/class-details/theodoi-kiemtra-tuluan15p/
```

## Trạng thái hiện tại ✅ Hoàn thành

### 1. Copy & khởi tạo
- [x] Tạo folder + copy 3 files từ `theodoi-kiemtra-daugio`
- [x] Đổi tên component class, selector, template, style paths
- [x] Đăng ký lazy-load routes (4 routing files)

### 2. Thay service + data type
- [x] `CourseQuestions` → `CoursePlanActivityTuluan`
- [x] `CourseQuestionsService` → `CoursePlanActivityTuluanService`
- [x] `getCourseQuestionsByPageNew()` → `getCoursePlanActivityTuluanByPageNew()`
- [x] Thêm condition `order = ASC`, `orderby = ordering`
- [x] Giữ `forkJoin` load cả `list_question` + `list_aws`

### 3. openViewTest — hiển thị bài làm SV
- [x] Xóa method `getStudentAnswer()` (không gọi hàm trong template — Rule 1)
- [x] `studentAnswerMap: { [questionId: number]: string }` — pre-computed lookup
- [x] Build map từ `list_aws` theo `course_question_id`
- [x] Template dùng `studentAnswerMap[question.id]` thay hàm

### 4. Khôi phục giao diện chính
- [x] Toolbar, table, filter, warning card, violation dialog — giống `theodoi-kiemtra-daugio` 100%
- [x] CSS main layout — giống daugio (`.kt-daugio-*`)
- [x] Giữ thêm `.point-editor`, `.point-input`, `.point-save-btn`

### 5. viewStudentTest — A4 Portrait Layout
- [x] Template `#viewStudentTest` với `.view-test-*` classes
- [x] A4: `width: 210mm`, `min-height: 297mm`, `margin: 24px auto`
- [x] Nội dung: câu hỏi (số thứ tự + điểm + desc) + bài làm SV
- [x] CSS scoped: `.view-test-body.ovic-over-right-section__body` (ko ::ng-deep)
- [x] Empty state: icon + text

### 6. Cải tiến UI viewStudentTest
- [x] Font system-ui hiện đại
- [x] Số câu hỏi badge xanh `#1a73e8`
- [x] Điểm pill badge `#e8f0fe` + icon 📌
- [x] Answer section bo góc 10px, nền `#f7f9fc`
- [x] Empty answer box riêng
- [x] Scrollbar tùy chỉnh + hover

### 7. Cải tiến logic (từ bản gốc)
- [x] Lưu điểm tuần tự: `from()` + `concatMap()`, progress bar, toast tổng kết
- [x] Giữ điểm đã nhập khi chuyển trang: `savedEditingPoints{}` + Map dedup
- [x] Tab/Enter focus ô điểm tiếp theo: `@ViewChildren` + `onPointKeydown()`

## Kiến trúc

```
theodoi-kiemtra-tuluan15p.component.ts
├── Inject: coursePlanActivityTuluanService, …
├── openViewTest()
│   ├── getCoursePlanActivityTuluanByPageNew(…) → list_question
│   ├── getStudentAnswerByPageNew(…) → list_aws
│   ├── build studentAnswerMap từ list_aws
│   └── mở overlay viewStudentTest
├── saveAllPoints() — sequential + progress bar
├── onPointKeydown() — Tab/Enter jump
└── other methods giống daugio

theodoi-kiemtra-tuluan15p.component.html
├── Toolbar + table + filter — giống daugio
└── ng-template #viewStudentTest — A4 Q&A view
    ├── .view-test-content (A4)
    ├── question loop: số + điểm + desc
    ├── answer section: studentAnswerMap[question.id]
    └── empty state

theodoi-kiemtra-tuluan15p.component.css
├── Main layout (giống daugio)
├── .point-editor / .point-input / .point-save-btn
└── View Student Test CSS (scoped)
```

## Khác biệt với bản gốc `theodoi-kiemtra-daugio`

| Item | daugio | tuluan15p |
|---|---|---|
| Service | `CourseQuestionsService` | `CoursePlanActivityTuluanService` |
| API | `getCourseQuestionsByPageNew` | `getCoursePlanActivityTuluanByPageNew` |
| Sort | mặc định | `ordering ASC` |
| Question type | trắc nghiệm | tự luận |
| Answer display | không có | `studentAnswerMap` + answer section |
| Template rule | gọi hàm | pre-computed map (Rule 1) |
| View overlay | không có | `#viewStudentTest` A4 layout |

## Câu hỏi mở

1. Route path hiện tại là `theodoi-kiemtra-tuluan15p` — có cần đổi không?
2. Có cần thêm menu / breadcrumb riêng?
3. Có cần phân quyền riêng không? (Hiện tại dùng chung routing module với daugio)
