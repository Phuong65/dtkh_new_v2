# Kế hoạch: Form tự luận 15 phút

**Trạng thái:** Phase 1 ✅ — Phase 2 chưa triển khai

---

## Phase 1: Cấu trúc đề (Row Group theo bài) ✅

Component `form-de-tuluan-15p` hiển thị cấu trúc câu hỏi theo bài — 1 bảng duy nhất, row group mode.

- Selector: `app-form-de-tuluan-15p`
- Dùng trong: `monhoc-formde.component.html` (`[_course]="selectedCourse"`)
- Layout: 1 bảng (không còn 2 cột)

### Data flow

```
ngOnInit()
  → loadAllData()
    → forkJoin: CoursePlanActivitiesService + CourseFormTuluan15pService (song song)
      → mergeMap: getCoursePlanActivityTuluanByPageNew() theo lesson ids
        → buildRows(): flatten CDR → CdrRow[], merge saved point/questionTake
          → render p-table rowGroupMode="subheader" groupRowsBy="lessonWeek"
```

### Lưu dữ liệu (onSave)

1. Kiểm tra `hasErrors()` — tổng điểm bài > 10 hoặc số câu lấy > tổng số câu → chặn + toast
2. Lọc dòng hợp lệ: `point > 0 && questionTake > 0` (bỏ qua dòng 0)
3. `deleteByCol(course_id, 'course_id')` — xoá hết dữ liệu cũ
4. `forkJoin` insert lại tất cả dòng hợp lệ
5. Thành công → `loadAllData()` reload + `save.emit()`

### Validation & Highlight

- `onTakeChange`: không clamp, cho nhập > tổng số câu → `isTakeError()` đỏ dòng
- `isLessonScoreError(week)`: tổng điểm bài > 10 → đỏ header bài
- `hasErrors()`: kiểm tra cả 2, chặn lưu nếu có lỗi
- CSS: `.row-take-error td` (đỏ dòng CDR), `.lesson-score-error td` (đỏ header bài)

### Cấu trúc bảng

```
Bài 1 ──────────────────────────────────────────────────────────
STT | Mức độ/trình độ năng lực (CDR) | Tổng số câu | Điểm | Số câu lấy | Tổng điểm
1   | CDR1 – Nhận biết                | 5           | 2    | 3          | 6
2   | CDR2 – Thông hiểu               | 3           | 2    | 2          | 4
───── Bài 1 tổng: 8 câu, 5 lấy, 10 điểm ────────────────────────
Bài 2 ──────────────────────────────────────────────────────────
...
Footer cố định: [Lưu] (không scroll)
```

### Files đã sửa

- `form-de-tuluan-15p.component.ts` — loadAllData dùng forkJoin lồng mergeMap, onSave xoá cũ insert mới, validation, isTakeError/isLessonScoreError/hasErrors
- `form-de-tuluan-15p.component.html` — layout flex-column, scrollable table + footer cố định, [ngClass] highlight lỗi
- `form-de-tuluan-15p.component.css` — style group header, row-take-error, lesson-score-error

### Thay đổi từ phiên trước

| Item | Cũ (2 cột) | Mới (Row Group) |
|------|-------------|-----------------|
| Layout | 2 cột — trái bài / phải CDR | 1 bảng — tất cả bài + CDR |
| Chọn bài | Click chọn → load API | Load tất cả ngay từ đầu (forkJoin) |
| selectedWeek/selectedLessonId | Có | Xóa |
| selectLesson() | Có | Xóa |
| cdrSummaries | Array cho 1 bài | Không — dùng cdrRows (flat) |
| Load saved data | mergeMap 3 tầng | forkJoin lessons + saved → mergeMap tuluans |
| Lưu dữ liệu | update/add từng dòng | deleteAll → insertAll |
| Validation | Không | Đỏ dòng khi lỗi + chặn lưu |

---

## Phase 2: Quản lý câu hỏi tự luận (Kế hoạch cũ, chưa triển khai)

Tạo component `CauhoiTuluan15pComponent` để quản lý câu hỏi tự luận cho từng nhóm câu hỏi 15P.

### Vị trí
```
src/app/modules/admin/features/quanly-monhoc/cauhoi-tuluan-15p/
├── cauhoi-tuluan-15p.component.ts
├── cauhoi-tuluan-15p.component.html
└── cauhoi-tuluan-15p.component.css
```

### Input
`@Input() courseSelected: ElnKhoaHoc`

### Layout — 2 cột

**Cột trái:** Nested layout
```
Bài 1 (week=1)
  ├── Nhóm 1 (ordering=1)
  ├── Nhóm 2 (ordering=2)
Bài 2 (week=2)
  └── Nhóm 1 (ordering=1)
```

Data flow:
1. `loadLessons()` → `CoursePlanActivitiesService` (parent_id=0, week>0, week<100, order week)
2. Click bài → `selectLesson(week)` → `loadForm(week)`
3. Click nhóm → `onChangeForm(form)` → `loadCauhoi()`

**Cột phải:** Hiển thị danh sách câu hỏi dạng khổ A4 (card layout, không phải bảng) — đã triển khai trong phiên làm việc trước.
