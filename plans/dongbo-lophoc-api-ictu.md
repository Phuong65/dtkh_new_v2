# Kế hoạch: Đồng bộ lớp học từ API ICTU

## Mô tả

Thêm nút "Đồng bộ ICTU" vào component `import-lophoc` hiện tại. Khi click → mở modal nhập năm học (dropdown) + học kỳ (input) + đợt (input) → gọi `getClassesByIctu()` → tra cứu thông tin môn học từ `ElnKhoaHocService` (batch 20 mã, concatMap tuần tự) → convert → gán vào `list_lophoc`, dùng chung luồng import hiện có.

---

## Kiến trúc

### Component sửa đổi
- `import-lophoc.component.ts` — thêm state & methods mới
- `import-lophoc.component.html` — thêm nút + modal `#templateSyncIctu`

### API sử dụng
| API | Mục đích |
|---|---|
| `ClassesService.getClassesByIctu(Nam_hoc, Hoc_ky, Dot)` | Tải lớp học phần từ ICTU |
| `ElnKhoaHocService.getElnKhoaHocByCols(params)` | Tra thông tin môn học theo mã (include_by=maso) |

### Luồng xử lý

```
Click "Đồng bộ ICTU"
  → modal nhập năm học (dropdown) + học kỳ (input) + đợt (input)
  → getClassesByIctu()
    → lọc LopTH === 'LT', dedup theo slug
    → gom mã môn học unique
    → from(batches).pipe(concatMap(...)):
        batch 20 mã → getElnKhoaHocByCols(include=maso)
        → build courseMap<maso, ElnKhoaHoc>
        → cập nhật progressValue (% batches done)
    → complete → convertIctuData(filtered, courseMap)
      → map từng lớp: course.category_ids → DonVi.title (khoa_bomon)
      → parse MaGV (GV chính) + MaTG (trợ giảng) → manager_ids, manager_info
      → sync_class_id = ID_LopHP
      → course_id = course.id, course_info = {title}
    → gán list_lophoc
    → import
      → data từ ICTU: bỏ qua chọn năm + confirm, import ngay
      → chỉ import nếu (kyhieu && course_id && manager_ids)
      → progress: current_value đếm số lớp thực import (totalImportItems)
      → gán vào Classes.course_id + course_info (JSON.stringify)
    → complete → setTimeout → popup modal kết quả:
      ✅ Đã import X/Y, ❌ Thất bại Z, ⏸️ Chưa import W
      → yêu cầu kiểm tra danh sách bên dưới
```

### Mapping dữ liệu

| `data_lophoc` | Nguồn từ `LOPHOCPHAN_ICTU` |
|---|---|
| `name` | `TenHP` |
| `mahp` | `MaMonhoc` |
| `kyhieu` | Parse từ `MaLopHP` — phần trong ngoặc đơn |
| `sotinchi` | `SOTC.toString()` |
| `slug` | `helperService.slugVietnamese(TenHP)` |
| `manager_ids` | `MaGV` + `MaTG` → tách `;` → email trước `_` → tìm `list_teacher` → format `\|id1\|id2\|` |
| `manager_info` | `display_name` nối bằng `, `; GV đầu tiên của MaGV có `*` suffix |
| `khoa` | `Khoa_hoc` (khóa SV) |
| `dothoc` | `Dot` |
| `hocky` | `Hocky.toString()` |
| `namhoc` | `Namhoc` → `-` → `_` (2025-2026 → 2025_2026) |
| `mahp_slug` | `MaMonhoc` |
| `name_giaovien` | Tên GV nối bằng `, `; không có MaGV/MaTG → 'Chưa có giảng viên'; có data nhưng không tìm thấy → 'GV không có trên hệ thống (tên)' (màu đỏ) |
| `khoa_bomon` | `ElnKhoaHoc.category_ids` → `DonVi.title`; không tìm thấy course → 'Không tìm thấy môn học này trên hệ thống (MaMonhoc)' (màu đỏ) |
| `sync_class_id` | `ID_LopHP.toString()` |
| `course_id` | `course.id` |
| `course_info` | `{ title: course.title }` (object, khi gán vào Classes thì JSON.stringify) |
| `status_import` | 0 |

### Các quyết định
- **Điều kiện import**: chỉ import nếu có (`kyhieu && course_id && manager_ids`) — thiếu 1 trong 3 thì bỏ qua
- **Không tìm thấy môn học** (`ElnKhoaHoc` rỗng) → `khoa_bomon` = 'Không tìm thấy môn học này trên hệ thống (mã)' (màu đỏ); không import
- **Không tìm thấy GV** → không gán `manager_ids`; có data → 'GV không có trên hệ thống (tên)'; không có data → 'Chưa có giảng viên' (màu đỏ)
- **Không tìm thấy DonVi** → `khoa_bomon` để trống
- **`sync_class_id`** mặc định `'0'` nếu không có
- **`manager_ids`** format string `|id1|id2|` (giống import Excel)
- **`manager_info`** GV chính từ MaGV có suffix `*`, trợ giảng từ MaTG, cách `, `
- **`namhoc`** chuyển `-` → `_` (phù hợp format hệ thống)
- **Popup kết quả**: dùng `notificationService.popup()` (modal bắt buộc tắt) hiển thị import X/Y, thất bại Z, chưa import W + yêu cầu kiểm tra
- Tích hợp inline vào component `import-lophoc`, không tạo component riêng

---

## Trạng thái: ĐÃ TRIỂN KHAI
