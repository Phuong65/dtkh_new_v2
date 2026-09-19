# Kế hoạch triển khai Dashboard Trưởng khoa

## 1. Mục tiêu

Tạo dashboard riêng cho Trưởng khoa tại `/admin/lanhdao-khoa/dashboard`.

- Không sửa `HomeBaocaoComponent` hoặc dashboard vai trò khác.
- Giữ shell, menu, phân quyền hiện tại.
- Dùng dữ liệu minh họa nhất quán; ghi rõ `Dữ liệu minh họa`.
- Chuẩn bị cấu trúc để thay mock bằng API tổng hợp sau này.
- Triển khai theo bước nhỏ; mỗi bước chỉ đọc/sửa ít file, xác minh xong mới chuyển bước.

## 2. Phạm vi file

### Tạo mới — một component, tách file để giảm context

- `src/app/modules/admin/features/home/dashboard-truong-khoa/dashboard-truong-khoa.types.ts`
- `src/app/modules/admin/features/home/dashboard-truong-khoa/dashboard-truong-khoa.mock.ts`
- `src/app/modules/admin/features/home/dashboard-truong-khoa/dashboard-truong-khoa.component.ts`
- `src/app/modules/admin/features/home/dashboard-truong-khoa/dashboard-truong-khoa.component.html`
- `src/app/modules/admin/features/home/dashboard-truong-khoa/dashboard-truong-khoa.component.scss`

### Chỉnh sửa

- `src/app/modules/admin/routings/lanhdao-khoa/lanhdao-khoa-routing.module.ts`

### Giữ nguyên

- `src/app/modules/admin/features/home/home-baocao/**`
- `src/app/modules/admin/dashboard/**`
- Dashboard vai trò khác.
- Route `/admin/bao-cao/dashboard`.
- CSS toàn cục.

## 3. Quy tắc thực hiện từng bước

1. Chỉ làm **một bước** trong mỗi lượt.
2. Chỉ đọc các file ghi tại mục **Context cần đọc** của bước đó.
3. Không đọc lại prototype đầy đủ sau Bước 1; dùng checklist trong tài liệu này.
4. Cuối mỗi bước:
   - chạy kiểm tra riêng của bước;
   - cập nhật checkbox;
   - ghi ngắn file đã đổi và lỗi còn lại;
   - dừng, không tự chuyển sang bước kế tiếp.
5. Build toàn dự án chỉ chạy tại Bước 9; tránh tiêu tốn context vì lỗi cũ quá sớm.
6. Nếu một bước phát sinh quá 2 file ngoài phạm vi, dừng và cập nhật kế hoạch trước.

## 4. Checklist triển khai chia nhỏ

### Bước 1 — Chốt cấu trúc và dữ liệu hiển thị

- [x] Hoàn thành

**Context cần đọc**

- File kế hoạch này.
- `docs/truong-khoa-dashboard-kcntt-delay-desc-harmonized.html`: chỉ phần nội dung từ `<main>`; không lấy sidebar/script canvas.
- `docs/Tong-hop-yeu-cau-Dashboard-Hieu-truong.md`: chỉ mục 1, 5, 6, 7, 8.

**Thực hiện**

- Chốt các vùng UI:
  1. Header + filter + trạng thái dữ liệu.
  2. Bốn KPI quy mô.
  3. Sức khỏe đào tạo.
  4. Cảnh báo ưu tiên + xu hướng chậm tiến độ.
  5. Người học.
  6. Giảng dạy.
  7. Đào tạo/đánh giá.
  8. Bảng hành động.
  9. Nhận định nhanh.
- Không đưa sidebar prototype, “10 nhóm chỉ số sau điều chỉnh”, footer prototype vào sản phẩm.
- Chốt filter: năm học, học kỳ, bộ môn/ngành, khóa; lớp/học phần chỉ hiện khi có dữ liệu.

**Kết quả**

- Không sửa source.
- Các bước sau dùng danh sách vùng UI trên, không cần đọc lại prototype đầy đủ.

---

### Bước 2 — Tạo types

- [x] Hoàn thành

**Context cần đọc**

- Mục API trong file kế hoạch này.
- `src/app/modules/admin/features/home/home-baocao/models/admin-dashboard-models.ts` để theo convention.

**File duy nhất sửa**

- `dashboard-truong-khoa.types.ts`

**Thực hiện**

Khai báo:

- `DashboardState = 'loading' | 'success' | 'empty' | 'error'`.
- `DashboardSeverity`, `DashboardActionStatus`, `DashboardFocusType`.
- `DashboardFilter`, `DashboardFilterOption`.
- `DashboardKpi`, `DashboardAlert`, `DashboardSeries`, `DashboardTimeSeries`.
- `DashboardActionItem`, `DashboardQuickInsight`.
- `SummaryDashboardFaculty` gồm `meta`, `availableFilters`, `overview`, `trainingHealth`, `alerts`, `students`, `teaching`, `assessment`, `actionItems`, `quickInsights`.

**Kiểm tra riêng**

- Không dùng `any`.
- Tỷ lệ dùng thang `0–100`.
- Thời gian dùng ISO 8601.
- Không import Angular/PrimeNG vào file types.

---

### Bước 3 — Tạo một bộ mock nhất quán

- [x] Hoàn thành

**Context cần đọc**

- `dashboard-truong-khoa.types.ts`.
- Các con số cần thiết trong prototype; không đọc CSS/script.

**File duy nhất sửa**

- `dashboard-truong-khoa.mock.ts`

**Thực hiện**

- Export `DASHBOARD_TRUONG_KHOA_MOCK` đúng `SummaryDashboardFaculty`.
- Export cấu hình ngưỡng cảnh báo theo học kỳ/phạm vi.
- Giữ quan hệ số liệu hợp lý:
  - tổng cảnh báo khớp nhóm cảnh báo;
  - tỷ lệ và số lượng không mâu thuẫn;
  - bảng hành động liên kết được với alert bằng `type`/`targetId`;
  - filter có dữ liệu tương ứng.
- `meta.isDemo = true`.

**Kiểm tra riêng**

- Không sinh số ngẫu nhiên.
- Không dùng ngày “hiện tại” cố định như dữ liệu thật.
- Không trộn response API thật với mock.

---

### Bước 4 — Tạo component controller tối thiểu

- [x] Hoàn thành

**Context cần đọc**

- `dashboard-truong-khoa.types.ts`.
- `dashboard-truong-khoa.mock.ts`.
- `home-baocao.component.ts`: chỉ decorator và cách gọi `AuthService.setFeatureSecondary()`.

**File duy nhất sửa**

- `dashboard-truong-khoa.component.ts`

**Thực hiện**

- Standalone component.
- Import `CommonModule`, `FormsModule`, `ChartModule`.
- Dùng `templateUrl`, `styleUrls`; không nhúng template/style vào TypeScript.
- State ban đầu `success` với mock; giữ nhánh `loading`, `empty`, `error`.
- Tạo các hàm nhỏ:
  - `loadDashboard()`;
  - `applyFilters()`;
  - `refresh()`;
  - `selectFocus(type, id?)`;
  - `clearFocus()`;
  - `printReport()`.
- `ngOnInit()` gọi `AuthService.setFeatureSecondary('Dashboard Trưởng khoa')`.
- Dựng cấu hình Chart.js từ view-model, không thao tác canvas trực tiếp.

**Kiểm tra riêng**

- Không gọi API chưa tồn tại.
- Không truy cập DOM bằng `document.querySelector()`.
- Không sao chép logic từ `HomeBaocaoComponent`.

---

### Bước 5 — Tạo khung template và trạng thái

- [x] Hoàn thành

**Context cần đọc**

- `dashboard-truong-khoa.component.ts`.
- `dashboard-truong-khoa.types.ts`.

**File duy nhất sửa**

- `dashboard-truong-khoa.component.html`

**Thực hiện**

- Tạo state `loading`, `empty`, `error`, `success`.
- Trong success chỉ dựng:
  - header;
  - filter row;
  - bốn KPI quy mô;
  - sức khỏe đào tạo;
  - cảnh báo ưu tiên;
  - placeholder section cho các phần còn lại.
- Control có `<label>` hoặc accessible name.
- Nút Làm mới/Xuất báo cáo gọi method thật.
- Cảnh báo là `<button>`, không dùng `<div>` clickable.

**Kiểm tra riêng**

- Không có sidebar/menu lồng.
- Không dùng inline `onclick` hoặc inline style động.
- Template chỉ tham chiếu property/method tồn tại.

---

### Bước 6 — Hoàn thiện biểu đồ theo từng nhóm

- [ ] Hoàn thành

**Context cần đọc**

- `dashboard-truong-khoa.component.ts`.
- `dashboard-truong-khoa.component.html`.
- `dashboard-truong-khoa.mock.ts`.

**File sửa**

- `dashboard-truong-khoa.component.ts`.
- `dashboard-truong-khoa.component.html`.

**Thực hiện theo thứ tự nhỏ**

1. Xu hướng chậm tiến độ: line + đường ngưỡng nét đứt, cùng đơn vị.
2. Quy mô ngành và tiến độ khóa: bar/stacked bar.
3. Chuyên cần và kết quả: line/bar.
4. Phân bố học lực: doughnut, tối đa 6 nhóm.
5. Tải giảng, phổ điểm, tốt nghiệp: bar.
6. CLO/PLO, học liệu, sẵn sàng đánh giá: horizontal bar.

**Quy tắc biểu đồ**

- Không dual-axis.
- Từ hai series phải có legend.
- Tooltip bật cho mọi chart.
- Không hiện số trên mọi điểm.
- Màu theo entity cố định, không đổi khi filter.
- Mỗi chart có bảng dữ liệu thay thế bằng `<details>`.

**Kiểm tra riêng**

- Mỗi lần chỉ thêm tối đa 2 chart rồi kiểm tra template/type.
- Không có chart chỉ để trang trí.

---

### Bước 7 — Thêm bảng hành động và tương tác focus

- [ ] Hoàn thành

**Context cần đọc**

- Ba file component/types/mock.

**File sửa**

- `dashboard-truong-khoa.component.ts`.
- `dashboard-truong-khoa.component.html`.

**Thực hiện**

- Bảng gồm: đối tượng, phụ trách, nguyên nhân, chỉ số, mức cảnh báo, trạng thái.
- Click KPI/cảnh báo đặt `activeFocus`, lọc hàng liên quan, cuộn đến bảng.
- Có nút `Xóa lọc`.
- Severity luôn có icon + nhãn; không phụ thuộc màu.
- Empty state riêng khi focus không có bản ghi.

**Kiểm tra riêng**

- Dùng keyboard được.
- Bảng nằm trong container `overflow-x: auto`.
- Focus không làm mất dữ liệu gốc.

---

### Bước 8 — Hoàn thiện SCSS, responsive, print

- [ ] Hoàn thành

**Context cần đọc**

- `dashboard-truong-khoa.component.html`.
- Prototype: chỉ CSS cần đối chiếu trực quan.

**File duy nhất sửa**

- `dashboard-truong-khoa.component.scss`

**Thực hiện**

- Scope toàn bộ bằng `:host`/class root.
- Desktop-first; breakpoint 1280, 1024, 768, 480.
- Card, filter, chart, bảng không gây body scroll ngang.
- `:focus-visible` rõ.
- `@media print`: ẩn filter/action, bỏ shadow, tránh cắt card.
- `prefers-reduced-motion` tắt animation không thiết yếu.
- `forced-colors` giữ outline/status rõ.

**Palette cố định**

- Series: `#2a78d6`, `#eb6834`, `#1baf7a`, `#eda100`, `#e87ba4`, `#008300`, `#4a3aa7`, `#e34948`.
- Status: good `#0ca30c`, warning `#fab219`, serious `#ec835a`, critical `#d03b3b`.
- Không dùng status color làm series.

**Kiểm tra riêng**

```bash
node "C:/Users/phuong/AppData/Local/Temp/claude/bundled-skills/2.1.241/cf755bea2f85f5b6356379cb6c25509f/dataviz/scripts/validate_palette.js" "#2a78d6,#eb6834,#1baf7a,#eda100,#e87ba4,#008300,#4a3aa7,#e34948" --mode light
```

Nếu đường dẫn skill thay đổi, tìm lại `dataviz/scripts/validate_palette.js`; không bỏ qua validator.

---

### Bước 9 — Chuyển route

- [ ] Hoàn thành

**Context cần đọc**

- `dashboard-truong-khoa.component.ts`.
- `lanhdao-khoa-routing.module.ts`: chỉ route `dashboard`.

**File duy nhất sửa**

- `src/app/modules/admin/routings/lanhdao-khoa/lanhdao-khoa-routing.module.ts`

**Thay đổi**

```ts
{
    path: 'dashboard',
    loadComponent: () => import('@modules/admin/features/home/dashboard-truong-khoa/dashboard-truong-khoa.component')
        .then(c => c.DashboardTruongKhoaComponent),
}
```

**Kiểm tra riêng**

- `/admin/lanhdao-khoa/dashboard` dùng component mới.
- `/admin/bao-cao/dashboard` vẫn dùng `HomeBaocaoComponent`.
- Không đổi route khác.

---

### Bước 10 — Build và sửa lỗi tối thiểu

- [ ] Hoàn thành

**Context cần đọc**

- Chỉ file được compiler báo lỗi.

**Thực hiện**

```bash
npm run build
```

- Sửa theo từng lỗi compiler.
- Không refactor ngoài phạm vi.
- Chạy lại đến khi build xanh hoặc xác định rõ lỗi nền có sẵn.

**Kiểm tra tùy môi trường**

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

Nếu ChromeHeadless không có, ghi rõ đã bỏ qua; không coi là pass.

---

### Bước 11 — Kiểm tra trực quan và hồi quy

- [ ] Hoàn thành

**Context cần đọc**

- Không đọc lại source trừ khi phát hiện lỗi.

**Kiểm tra**

- Mở `/admin/lanhdao-khoa/dashboard` bằng tài khoản Trưởng khoa.
- Dashboard nằm đúng shell; không sidebar lồng.
- Console không lỗi.
- Filter, cảnh báo, xóa focus, làm mới, print hoạt động.
- Viewport: 1440, 1024, 768, 375 px.
- Keyboard focus, label, icon + text, bảng thay thế chart.
- Mở `/admin/bao-cao/dashboard`; dashboard cũ không đổi.

---

### Bước 12 — Review cuối

- [ ] Hoàn thành

**Context cần đọc**

- Chỉ diff của 6 file thuộc phạm vi.

**Thực hiện**

- Review TypeScript/Angular: type safety, template binding, state, event handling.
- Review chart: dual-axis, legend, tooltip, color, table fallback.
- Review accessibility: label, button semantics, keyboard, focus, status.
- Chạy `git diff --check`.
- Không commit nếu chưa được yêu cầu.

## 5. API sử dụng

### API đã tồn tại

| Trạng thái | Method và path | Query chính | Mục đích | Service |
|---|---|---|---|---|
| Tham khảo | `GET summary/dashboard-teacher` | `namhoc`, `hocky` | Pattern tổng hợp; không dùng cho KPI khoa | `SummaryService.getDasboarhGiangvien()` |
| Tham khảo | `GET summary/dashboard-chunhiem` | `namhoc`, `hocky` | Pattern rủi ro; không cộng gộp | `SummaryService.getDasboarhGvcn()` |
| Cần xác nhận quyền | `GET summary/dashboard-khaothi` | `namhoc`, `hocky` | Tổng hợp khảo thí | `SummaryService.getDasboarhkhaothi()` |
| Đã có | `GET summary/khaothi-ketquathi` | `namhoc`, `hocky`, `donvi_id`, `parent_id` | Kết quả thi | `SummaryService.getKhaothiKetquathi()` |
| Đã có | `GET summary/khaothi-bieudo-phodiem` | Filter backend quy định | Phổ điểm | `SummaryService.getBietdoPhodiem()` |
| Đã có | `GET class/` | `condition`, `groupby`, `select`, `limit`, `paged` | Năm học, học kỳ, lớp | `ClassesService` |
| Đã có | `GET donvi/` | `parent_id`, `status`, `limit` | Bộ môn/đơn vị | `DonViService` |
| Đã có | `GET courses/` | `condition`, `limit`, `paged` | Học phần | `ElnKhoaHocService` |
| Đã có | `GET user-profile/` | `condition`, `teacher`, `limit`, `paged` | Giảng viên/sinh viên | `ElngUserProfileService` |
| Đã có | `GET class-students/` | `class_id`, `user_id`, `limit`, `paged` | Sinh viên lớp | `ClassStudentService` |
| Đã có | `GET diemdanh/` | lớp, sinh viên, thời gian | Chuyên cần | `ClassStudentDiemdanhService` |

### API tổng hợp cần backend bổ sung

```http
GET summary/dashboard-faculty
```

Query:

- Bắt buộc: `namhoc`, `hocky`, `donvi_id`.
- Tùy chọn: `bomon_id`, `nganh_id`, `khoa_hoc`, `class_id`, `course_id`.
- Backend phải giới hạn `donvi_id` theo quyền đăng nhập.

Response trong `Dto.data`:

```ts
interface SummaryDashboardFaculty {
    meta: DashboardMeta;
    availableFilters: DashboardAvailableFilters;
    overview: DashboardOverview;
    trainingHealth: DashboardTrainingHealth;
    alerts: DashboardAlert[];
    students: DashboardStudentMetrics;
    teaching: DashboardTeachingMetrics;
    assessment: DashboardAssessmentMetrics;
    actionItems: DashboardActionItem[];
    quickInsights: DashboardQuickInsight[];
}
```

Quy ước:

- Tỷ lệ: `0–100`.
- Thời gian: ISO 8601.
- Mọi nhóm dùng cùng filter và snapshot.
- Không tin `donvi_id` từ client nếu chưa kiểm tra quyền.

Danh sách hành động lớn có thể tách:

```http
GET summary/dashboard-faculty/action-items
```

Query bổ sung: `severity`, `status`, `type`, `search`, `paged`, `limit`, `orderby`, `order`. Response có `data`, `recordsFiltered`.

Phiên bản mock không gọi các endpoint đề xuất. Xuất báo cáo dùng `window.print()`, không cần API.

## 6. Điều kiện hoàn thành

- 12 bước đều được đánh dấu hoàn thành.
- Build xanh hoặc lỗi nền được ghi rõ bằng output.
- Route Trưởng khoa dùng component mới.
- Dashboard báo cáo cũ không đổi.
- Không gọi API chưa tồn tại.
- Không trộn mock và dữ liệu thật.
- Palette đã chạy validator.
- Dashboard responsive, dùng được bằng bàn phím, có bảng thay thế biểu đồ.