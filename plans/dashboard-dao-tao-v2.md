# Plan: Dashboard Đào Tạo V2 (Hoàn toàn mới)

## Mục tiêu
Xây dựng dashboard mới cho Phòng Đào tạo (`routerDaotao`) tập trung 3 nhóm chính: **CTĐT**, **Môn học**, **Lớp học phần**. Dùng PrimeNG Chart (`chart.js` đã có trong project).

## Role
- Phòng Đào tạo — nhìn toàn bộ trường, lọc theo khoa/đơn vị, năm học, học kỳ.

## Cấu trúc folder
```
dashboard-dao-tao/
├── dashboard-dao-tao.component.ts      (rewrite)
├── dashboard-dao-tao.component.html    (rewrite)
├── dashboard-dao-tao.component.css     (rewrite)
```

---

## Layout tổng quan (3 sections)

### Section 1: Filter Bar + Summary Cards
- **Bộ lọc**: Đơn vị (Khoa), Năm học, Học kỳ
- **6 Summary Cards** (2 hàng x 3 cột):
  | Card | Dữ liệu | API |
  |------|----------|-----|
  | Tổng CTĐT | `recordsFiltered` | `CtdtService.getCtdtByPageNew` |
  | Tổng Môn học | `recordsFiltered` | `ElnKhoaHocService.getKhoaHocByPageNew_2` |
  | Tổng Lớp HP | `recordsFiltered` | `ClassesService.getClassesByPageNew` |
  | SV đăng ký (tổng) | `sum(sosv_dangky)` | Lấy data classes rồi sum |
  | Lớp đã chốt điểm | count where `locked_score = 1` | `ClassesService.getClassesByPageNew` |
  | CTĐT theo ngành | count unique `nganh_id` | Lấy data CTĐT rồi count |

### Section 2: Charts (3 biểu đồ)
- **Bar Chart — Phân bố theo Khoa/Đơn vị**: 
  - X-axis: Tên các Khoa (đơn vị con)
  - Y-axis: Số lượng CTĐT, Môn học, Lớp HP (grouped bar)
  - Dùng PrimeNG `<p-chart type="bar">`

- **Doughnut Chart — Môn học theo hình thức thi**:
  - Slices: Trắc nghiệm, Thực hành, Tự luận, Đồ án, Dự án, Vấn đáp...
  - Dữ liệu từ `ElnKhoaHoc.params.exam_type`
  - Dùng PrimeNG `<p-chart type="doughnut">`

- **Line Chart — Trend số Lớp HP & SV qua các kỳ**:
  - X-axis: Học kỳ (VD: HK1 2023-2024, HK2 2023-2024, ...)
  - Y-axis dual: Số lớp HP (line 1), Tổng SV đăng ký (line 2)
  - Dùng PrimeNG `<p-chart type="line">`
  - Dữ liệu: group classes by `hocky + namhoc`, sum `sosv_dangky`

### Section 3: Bảng chi tiết (Table) + Export
- **Bảng thống kê theo Khoa** (dùng PrimeNG `p-table`):
  | Khoa | CTĐT | Môn học | Lớp HP | SV đăng ký | Lớp chốt điểm |
  - Sortable columns
  - Footer tổng cộng
  - **Nút Export Excel**: xuất bảng ra file `.xlsx` (dùng `file-saver` + `xlsx` hoặc build CSV thủ công — project đã có `file-saver`)

---

## Services sử dụng
| Service | Method | Mục đích |
|---------|--------|----------|
| `DonViService` | `getDonViByCols` | Lấy danh sách Khoa con |
| `CtdtService` | `getCtdtByPageNew` | Đếm/lấy CTĐT |
| `ElnKhoaHocService` | `getKhoaHocByPageNew_2` | Đếm/lấy Môn học |
| `ClassesService` | `getClassesByPageNew`, `getClassesByCols` | Đếm/lấy Lớp HP, năm học, học kỳ |
| `AuthService` | user info | `donvi_id` gốc |
| `HttpParamsHeplerService` | `paramsConditionBuilder` | Build query |

---

## Logic chi tiết

### 1. `ngOnInit()` → `loadInitData()`
- Lấy danh sách đơn vị con (`parent_id = auth.user.donvi_id`)
- Lấy danh sách năm học (groupby namhoc từ classes)
- Lấy danh sách học kỳ (groupby hocky từ classes)
- Set filter mặc định → gọi `loadDashboardData()`

### 2. `loadDashboardData()` — tổng quan
- Gọi song song 3 API count (limit=1 lấy recordsFiltered):
  - CTĐT (filter by namhoc nếu có, filter by category_id nếu chọn khoa)
  - Môn học (filter by category_ids)
  - Lớp HP (filter by namhoc, hocky, category_id)
- Gọi thêm:
  - Lớp HP full data (limit=-1) để sum `sosv_dangky`, count `locked_score`
  - Môn học data (limit=-1) để đếm `params.exam_type`

### 3. `loadBreakdownByDonvi()` — chart + table
- Với mỗi đơn vị con: gọi count CTĐT, Môn, Lớp HP (filter `category_id = donvi.id`)
- Build data cho bar chart + table rows

### 4. `onFilterChange()` — khi thay đổi bộ lọc
- Gọi lại `loadDashboardData()` + `loadBreakdownByDonvi()`

---

## Data models

```typescript
interface DashboardSummary {
  totalCtdt: number;
  totalMonhoc: number;
  totalLopHP: number;
  totalSVDangky: number;
  totalLopChotDiem: number;
  totalNganh: number;
}

interface DonviRow {
  donviId: number;
  donviName: string;
  ctdt: number;
  monhoc: number;
  lopHP: number;
  svDangky: number;
  lopChotDiem: number;
}

interface ChartData {
  barChart: any; // PrimeNG chart format
  doughnutChart: any;
}
```

---

## Imports cần dùng
```typescript
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
```

---

## UI Style
- Clean, professional, data-focused
- Color palette: Blue primary (#2563eb), subtle gray backgrounds
- Cards: rounded corners, subtle shadows, accent border-left theo loại
- Responsive: 3 cols → 2 cols → 1 col

---

## Câu hỏi mở — ĐÃ TRẢ LỜI
1. ✅ Có Line chart (trend LHP + SV qua các kỳ)
2. ✅ Có export Excel
3. ❌ Không navigate khi click card/row

---

## Bugfix — Logic Review (2026-06-10)

### 🔴 Lỗi nghiêm trọng

| # | Vấn đề | Dòng | Fix |
|---|--------|------|-----|
| 1 | `buildCondition` thêm `namhoc`/`hocky` filter cho Môn học nhưng `ElnKhoaHoc` không có field này → API lỗi ngầm hoặc trả 0 | 165 | Tách `buildConditionMonhoc()` riêng — chỉ filter `category_ids` + `status`, bỏ `namhoc`/`hocky` |
| 2 | `buildCondition` thêm `namhoc`/`hocky` filter cho CTĐT nhưng `Ctdt` cũng không có field này | 164 | Tách `buildConditionCtdt()` riêng — chỉ filter `category_id` + `status`, bỏ `namhoc`/`hocky` |
| 3 | `page: null` gán cho interface `page: string` — type mismatch | 169-176 | Sửa interface `ConditionOption.page` thành `string \| null` |
| 4 | Summary cards filter theo đơn vị đã chọn nhưng bảng breakdown luôn hiển thị TẤT CẢ đơn vị | 214 | Khi `selectedDonvi` có giá trị → `scopeDonvi` chỉ chứa đơn vị đã chọn |
| 5 | Line chart sort sai chronological (`HK1 2023 < HK2 2022` lexically sai) | 384 | Sort theo `namhoc` trước rồi `hocky` sau |
| 6 | 3 request count thừa (limit=1), vì request full (limit=-1) cũng trả `recordsFiltered` | 178-184 | Xóa 3 request count, dùng `recordsFiltered` từ full request |
| 7 | Doughnut chart rỗng vẫn render (object truthy) | 348-368 | Check `labels.length === 0` → gán `null` |
| 8 | `loadBreakdownByDonvi` — `catFilter` dùng chung cho cả CTĐT lẫn Classes nhưng chỉ Classes có `namhoc`/`hocky` | 234-238 | Tách `catFilterCtdt`, `catFilterMonhoc`, `catFilterClasses` riêng — chỉ push `namhoc`/`hocky` vào Classes |

### Thứ tự fix (ĐÃ HOÀN THÀNH ✅)
1. ✅ Fix #6 — Xóa request thừa, dùng recordsFiltered từ full
2. ✅ Fix #1 — Tách condition Môn học riêng (bỏ namhoc/hocky)
3. ✅ Fix #2 — Tách condition CTĐT riêng (bỏ namhoc/hocky)
4. ✅ Fix #4 — Breakdown table filter theo đơn vị đã chọn
5. ✅ Fix #5 — Sort line chart đúng chronological
6. ✅ Fix #7 — Doughnut chart rỗng → null
7. ✅ Fix #3 — Type `page: null` (convention project)
8. ✅ Fix #8 — Breakdown tách filter riêng cho CTĐT/Monhoc/Classes
