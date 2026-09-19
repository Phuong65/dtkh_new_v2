# Kế hoạch chức năng: duyet-cauhoi-v2

## 1. Mục tiêu

Tạo chức năng `duyet-cauhoi-v2` là phiên bản UX/UI mới của màn hình duyệt câu hỏi, mapping nghiệp vụ từ chức năng hiện tại tại [duyet-cauhoi](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/), nhưng tổ chức lại trải nghiệm để giảm thao tác người dùng và dễ kiểm soát tiến độ duyệt.

## 2. Phạm vi

- Chức năng mới: `duyet-cauhoi-v2`.
- Route v2 chạy song song với route cũ, đề xuất `cauhoi-v2`; không thay thế route `cauhoi` trong giai đoạn đầu.
- Folder đề xuất: [duyet-cauhoi-v2](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/).
- Mapping nguồn nghiệp vụ: [duyet-cauhoi](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/).
- Tất cả component, sub-component, model/view-model cục bộ, helper cục bộ, stylesheet/template liên quan đến chức năng mới phải nằm trong một folder `duyet-cauhoi-v2`.
- Không refactor trực tiếp chức năng cũ trong giai đoạn đầu; dùng chức năng cũ làm baseline để đối chiếu nghiệp vụ.
- Component con của v2 phải tạo mới trong folder `duyet-cauhoi-v2`; không dùng lại trực tiếp component cũ nếu component cũ đã tồn tại, chỉ mapping nghiệp vụ/props để triển khai lại theo UX/UI v2.

## 2.1. Quyết định đã chốt

- Route: chạy song song bằng route mới `cauhoi-v2`, giữ route cũ `cauhoi` để đối chiếu/nghiệm thu.
- Duyệt hàng loạt: được phép triển khai trong v2, nhưng phải có xác nhận trạng thái, loading, disabled state và phản hồi lỗi rõ ràng.
- Phạm vi UI phase đầu: redesign màn tổng điều phối trước; các component con tạo mới và redesign ở phase sau.

## 3. Quy tắc bắt buộc

Tuân thủ [docs/_rules.md](docs/_rules.md):

1. **Template binding**
   - Không gọi method tính trạng thái trong HTML.
   - Trạng thái hiển thị phải được tính sẵn thành property/map/view-model trong TypeScript.
   - Template chỉ bind property, form control, map/object đã tính sẵn, pipe, hoặc trackBy function reference.

2. **UI/UX**
   - Header có gradient, accent bar, icon chức năng.
   - Nút có icon + text, hover/active rõ ràng.
   - Có loading, empty state, error state đầy đủ.
   - Dùng CSS variables cho màu, radius, shadow, transition.
   - Responsive tại 992px và 576px.

3. **Hiệu quả thao tác**
   - Giảm số click trong luồng duyệt chính.
   - Ưu tiên thao tác hàng loạt, quick action, auto chọn mục cần xử lý tiếp theo.
   - Tăng phản hồi trạng thái sau mỗi thao tác: loading/success/error/disabled.

4. **Kế hoạch/changelog**
   - Mọi lần chỉnh sửa lớn cho chức năng phải cập nhật changelog trong file kế hoạch này.

## 4. Mapping nghiệp vụ từ chức năng cũ

### 4.1. Dữ liệu đầu vào

Giữ logic nguồn từ [duyet-cauhoi.component.ts](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/duyet-cauhoi.component.ts):

- Lấy `code` từ query param.
- Tải hội đồng thẩm định môn học theo `id = code`, kèm `course`.
- Tải danh sách thành viên hội đồng theo `hoidong_thamdinh_monhoc_id`, kèm `user`.
- Chặn người dùng không thuộc hội đồng và không có role quản trị/khảo thí phù hợp.
- Parse `course.params` để xác định cấu hình hình thức thi.
- Gán feature secondary: `Duyệt Câu hỏi` hoặc tên mới tương ứng.

### 4.2. Vai trò/quyền

Mapping từ chức năng cũ:

- `admin`, `manager`: được truy cập.
- `hoidongthi_lanhdao`: được truy cập.
- Thành viên có trong danh sách hội đồng: được truy cập.
- Thành viên chủ tịch hội đồng: cần hiển thị thêm quyền/nhãn điều phối nếu nghiệp vụ duyệt có khác biệt.
- Không đủ quyền: chuyển `/admin/content-none` và hiển thị thông báo phù hợp.

### 4.3. Nhóm duyệt cần hiển thị

Mapping từ `CoursePlanActivities` và dữ liệu câu hỏi hiện tại:

1. **Bài học/tuần thường**
   - `type = PLAN`, `parent_id = 0`, `week > 0`, `week < 100`.
   - Hiển thị số câu đã duyệt/tổng câu theo tuần.

2. **KTTX - Thực hành / tự luận**
   - Có activity `type = THUONGXUYEN_TULUAN`.
   - Mapping vào item tuần đặc biệt `week = 1000` nếu tồn tại.
   - Count từ `course-plan-activity-tuluan` theo các activity liên quan.

3. **Dự án**
   - Có activity `type = THUONGXUYEN_DUAN`, `ordering = 0`.
   - Count từ `course-plan-activity-tuluan` theo activity dự án.

4. **KTHP - Trắc nghiệm**
   - Parent plan có `week = 100`.
   - Render luồng duyệt trắc nghiệm KTHP.

5. **KTHP - Thực hành**
   - Khi `course.params.exam_format = THUCHANH`.
   - Tạo item ảo `id = 0`, `week = 100`, title `KTHP - <hình thức thi>`.
   - Count từ `course-plan-activity-tuluan` với `course_plan_activity_id = 0`.

6. **Cấu trúc đề**
   - Tạo item ảo `id = -1000`, `week = 100`, `type = FORM`, title `Cấu trúc đề`.

## 5. Đề xuất UX/UI mới

### 5.1. Bố cục tổng thể

Thay sidebar cũ bằng layout tập trung vào tiến độ và thao tác nhanh:

1. **Hero header**
   - Tên chức năng: `Duyệt câu hỏi v2`.
   - Thông tin môn học, mã môn/lớp nếu có.
   - Badge hình thức thi.
   - Badge vai trò người dùng: Quản trị / Khảo thí / Chủ tịch / Thành viên.
   - CTA nhanh: `Mục cần duyệt tiếp theo`, `Làm mới`, `Thu gọn danh sách`.

2. **Summary cards**
   - Tổng câu hỏi.
   - Đã duyệt.
   - Chờ duyệt.
   - Chưa đạt/cần sửa.
   - Tỷ lệ hoàn thành.

3. **Smart worklist**
   - Danh sách nhóm duyệt dạng card/tabs thay cho menu trái nhiều thao tác.
   - Mỗi item có: title, loại, số đã duyệt/tổng, progress bar, trạng thái, CTA `Duyệt ngay`.
   - Có quick filters: `Tất cả`, `Cần xử lý`, `Đã hoàn tất`, `KTHP`, `KTTX`, `Cấu trúc đề`.

4. **Review workspace**
   - Khu vực nội dung chính render theo item đang chọn.
   - Sticky action bar cho thao tác duyệt nhanh nếu component con hỗ trợ.
   - Empty state khi chưa chọn: gợi ý item cần xử lý tiếp theo.

5. **Right insight panel hoặc collapsible panel**
   - Hiển thị hội đồng, người đang duyệt, tiến độ theo nhóm.
   - Có thể thu gọn để tăng không gian làm việc.

### 5.2. Giảm thao tác người dùng

- Auto chọn item đầu tiên có câu chờ duyệt sau khi load dữ liệu.
- Nút `Mục cần duyệt tiếp theo` nhảy tới nhóm có `questions_duyet < questions_tong`.
- Quick filters tính sẵn, không gọi hàm trong template.
- Search/filter nhóm duyệt theo title/type/status nếu số lượng lớn.
- Giữ trạng thái item đang chọn trên query param hoặc local state để reload không mất ngữ cảnh.
- Sau khi hoàn tất một nhóm, gợi ý chuyển sang nhóm tiếp theo.
- Cho phép duyệt hàng loạt trong phạm vi nghiệp vụ an toàn:
  - Chọn nhiều câu hỏi hoặc nhiều item đủ điều kiện.
  - Có bước xác nhận trước khi áp dụng.
  - Hiển thị số lượng bản ghi bị ảnh hưởng.
  - Disable action khi đang xử lý hoặc khi không có item hợp lệ.
  - Sau khi hoàn tất phải refresh count/summary/worklist.
  - Nếu lỗi một phần, hiển thị rõ item thành công/thất bại; không được im lặng fallback.

## 6. Kiến trúc folder đề xuất

Tất cả nằm trong một folder:

```text
src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/
  duyet-cauhoi-v2.component.ts
  duyet-cauhoi-v2.component.html
  duyet-cauhoi-v2.component.css
  components/
    duyet-cauhoi-v2-header/
      duyet-cauhoi-v2-header.component.ts
      duyet-cauhoi-v2-header.component.html
      duyet-cauhoi-v2-header.component.css
    duyet-cauhoi-v2-summary/
      duyet-cauhoi-v2-summary.component.ts
      duyet-cauhoi-v2-summary.component.html
      duyet-cauhoi-v2-summary.component.css
    duyet-cauhoi-v2-worklist/
      duyet-cauhoi-v2-worklist.component.ts
      duyet-cauhoi-v2-worklist.component.html
      duyet-cauhoi-v2-worklist.component.css
    duyet-cauhoi-v2-workspace/
      duyet-cauhoi-v2-workspace.component.ts
      duyet-cauhoi-v2-workspace.component.html
      duyet-cauhoi-v2-workspace.component.css
    duyet-cauhoi-v2-insights/
      duyet-cauhoi-v2-insights.component.ts
      duyet-cauhoi-v2-insights.component.html
      duyet-cauhoi-v2-insights.component.css
    question-types/
      duyet-cauhoi-v2-trac-nghiem/
        duyet-cauhoi-v2-trac-nghiem.component.ts
        duyet-cauhoi-v2-trac-nghiem.component.html
        duyet-cauhoi-v2-trac-nghiem.component.css
      duyet-cauhoi-v2-tu-luan/
        duyet-cauhoi-v2-tu-luan.component.ts
        duyet-cauhoi-v2-tu-luan.component.html
        duyet-cauhoi-v2-tu-luan.component.css
      duyet-cauhoi-v2-du-an/
        duyet-cauhoi-v2-du-an.component.ts
        duyet-cauhoi-v2-du-an.component.html
        duyet-cauhoi-v2-du-an.component.css
      duyet-cauhoi-v2-thuc-hanh-kthp/
        duyet-cauhoi-v2-thuc-hanh-kthp.component.ts
        duyet-cauhoi-v2-thuc-hanh-kthp.component.html
        duyet-cauhoi-v2-thuc-hanh-kthp.component.css
      duyet-cauhoi-v2-form-de/
        duyet-cauhoi-v2-form-de.component.ts
        duyet-cauhoi-v2-form-de.component.html
        duyet-cauhoi-v2-form-de.component.css
  models/
    duyet-cauhoi-v2.models.ts
  utils/
    duyet-cauhoi-v2-mapper.ts
```

Ghi chú:
- Phase đầu vẫn có thể bắt đầu với component tổng điều phối và sub-component điều phối như header/summary/worklist/workspace/insights.
- Các component con theo loại câu hỏi phải tạo mới trong `components/question-types/`, kể cả khi chức năng cũ đã có component tương ứng.
- Component con v2 được phép mapping logic/contract từ component cũ, nhưng không import trực tiếp component cũ làm UI chính của v2.
- Không đặt component con ở folder dùng chung nếu chỉ phục vụ chức năng này.

## 7. View-model cần chuẩn bị

Tạo view-model để template không gọi hàm:

```ts
interface DuyetCauhoiV2WorkItem {
  id: number;
  sourceId: number;
  title: string;
  subtitle: string;
  type: 'LESSON' | 'KTTX_TULUAN' | 'DUAN' | 'KTHP_TN' | 'KTHP_THUCHANH' | 'FORM_DE';
  renderTarget: 'TRAC_NGHIEM' | 'TU_LUAN' | 'DU_AN' | 'THUC_HANH_KTHP' | 'FORM_DE';
  approvedCount: number;
  totalCount: number;
  pendingCount: number;
  progressPercent: number;
  statusKey: 'empty' | 'pending' | 'done';
  statusLabel: string;
  statusClass: string;
  icon: string;
  badgeLabel: string;
  originalActivity: CoursePlanActivities;
}
```

Các map/property tính sẵn:

- `workItems: DuyetCauhoiV2WorkItem[]`.
- `filteredWorkItems: DuyetCauhoiV2WorkItem[]`.
- `selectedWorkItem?: DuyetCauhoiV2WorkItem`.
- `summaryVm` gồm tổng/đã duyệt/chờ duyệt/tỷ lệ.
- `roleVm` gồm label/class/icon quyền hiện tại.
- `emptyStateVm`, `loadingState`, `errorState`.
- `filterOptions` và `activeFilterKey`.

## 8. Luồng xử lý dữ liệu

1. `ngOnInit`
   - Subscribe query params.
   - Nếu thiếu `code`: báo lỗi và điều hướng `content-none`.
   - Nếu có `code`: gọi `loadInitialData(code)`.

2. `loadInitialData(code)`
   - Bật loading.
   - `forkJoin` tải hội đồng môn học và thành viên.
   - Validate quyền.
   - Parse `course.params` an toàn bằng helper cục bộ, tránh crash khi JSON lỗi.
   - Gọi `loadReviewPlan()`.

3. `loadReviewPlan()`
   - Tải `CoursePlanActivities` theo `course_id`.
   - Lấy ids cần thống kê.
   - Tải các nguồn count câu hỏi.
   - Map sang `workItems`.
   - Tính `summaryVm`, `filterOptions`, `nextActionVm`.
   - Auto select item cần xử lý tiếp theo.
   - Tắt loading.

4. `selectWorkItem(item)`
   - Gán `selectedWorkItem`.
   - Tính `workspaceVm` nếu cần.
   - Không gọi logic tính toán từ template.

5. `goToNextPendingItem()`
   - Dựa trên `workItems` đã tính sẵn.
   - Nếu không còn pending: hiển thị success/empty completion state.

## 9. Render mapping trong workspace

Mapping render target:

- `TRAC_NGHIEM` → tạo mới `DuyetCauhoiV2TracNghiemComponent`, mapping nghiệp vụ từ component trắc nghiệm cũ.
- `TU_LUAN` → tạo mới `DuyetCauhoiV2TuLuanComponent`, mapping nghiệp vụ từ component tự luận cũ.
- `DU_AN` → tạo mới `DuyetCauhoiV2DuAnComponent`, mapping nghiệp vụ từ component dự án cũ.
- `THUC_HANH_KTHP` → tạo mới `DuyetCauhoiV2ThucHanhKthpComponent`, mapping nghiệp vụ từ component thực hành KTHP cũ.
- `FORM_DE` → tạo mới `DuyetCauhoiV2FormDeComponent`, mapping nghiệp vụ từ component cấu trúc đề cũ.

Phase đầu có thể dùng placeholder/contract cho component con v2 nếu chưa redesign chi tiết, nhưng không dùng trực tiếp component cũ làm UI chính.

Template nên dùng `ngSwitch` theo property `selectedWorkItem.renderTarget`, không gọi method.

## 10. Lộ trình triển khai

### Giai đoạn 1 — Tạo shell v2 và route

- Tạo folder [duyet-cauhoi-v2](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/).
- Tạo standalone component chính.
- Thêm route mới `cauhoi-v2`, chạy song song route cũ `cauhoi` để nghiệm thu và đối chiếu.
- Tạo các component điều phối v2: header, summary, worklist, workspace, insights.
- Tạo skeleton/contract cho các component con v2 trong `components/question-types/` nếu workspace cần render đủ target ngay từ đầu.

### Giai đoạn 2 — Mapping dữ liệu và view-model

- Port logic load dữ liệu từ chức năng cũ.
- Tách mapper cục bộ để map `CoursePlanActivities` + count sources → `DuyetCauhoiV2WorkItem[]`.
- Tính summary/filter/next pending trong TypeScript.
- Bổ sung xử lý lỗi thiếu `code`, không tìm thấy môn học, parse params lỗi, load plan lỗi.

### Giai đoạn 3 — UX/UI mới cho tổng điều phối

- Xây hero header, summary cards, smart worklist, workspace, insight panel.
- Thêm loading/empty/error state.
- Thêm responsive CSS theo rules.
- Đảm bảo nút có icon + text, hover/active đầy đủ.
- Phase này tập trung redesign màn tổng điều phối trước; component con chỉ cần contract/skeleton đủ để tích hợp nếu chưa redesign chi tiết.

### Giai đoạn 4 — Hoàn thiện component con nghiệp vụ v2

- Triển khai nghiệp vụ thật cho từng component con v2, vẫn giữ toàn bộ file trong `duyet-cauhoi-v2/components/question-types/`:
  - `DuyetCauhoiV2TracNghiemComponent`: mapping nghiệp vụ từ màn duyệt trắc nghiệm cũ, hiển thị danh sách câu hỏi theo work item, trạng thái duyệt và action duyệt/không đạt nếu nghiệp vụ hỗ trợ.
  - `DuyetCauhoiV2TuLuanComponent`: mapping nghiệp vụ tự luận/thực hành KTTX, load dữ liệu theo `course_plan_activity_id` tương ứng.
  - `DuyetCauhoiV2DuAnComponent`: mapping nghiệp vụ dự án, phân biệt activity dự án `THUONGXUYEN_DUAN` và trạng thái duyệt.
  - `DuyetCauhoiV2ThucHanhKthpComponent`: mapping nghiệp vụ KTHP thực hành với `course_plan_activity_id = 0`.
  - `DuyetCauhoiV2FormDeComponent`: mapping nghiệp vụ cấu trúc đề từ màn cũ.
- Mỗi component con phải có contract input rõ ràng: `workItem`, `context`, trạng thái loading/error/empty cục bộ và event báo thay đổi count về component cha nếu cần.
- Không import trực tiếp component cũ làm UI chính; chỉ được tham khảo logic, service, condition và contract dữ liệu.
- Sau mỗi thao tác duyệt ở component con, phải refresh count/summary/worklist hoặc emit event để component cha refresh đúng phạm vi.
- Mỗi component con cần có empty state riêng khi không có câu hỏi/cấu hình tương ứng.

### Giai đoạn 5 — Giảm thao tác, search và giữ ngữ cảnh

- Auto select item cần duyệt đầu tiên sau khi load dữ liệu đã có ở shell; cần hoàn thiện thêm các trường hợp:
  - Nếu URL/local state có selected item hợp lệ thì ưu tiên khôi phục item đó.
  - Nếu selected item không còn trong danh sách sau refresh/filter thì chọn item pending tiếp theo.
  - Nếu không còn pending thì hiển thị completion state rõ ràng.
- Bổ sung search worklist theo title/type/status/badge label nếu số lượng item lớn:
  - Search text phải được lưu trong property/form control.
  - `filteredWorkItems` phải được tính trong TypeScript, không gọi method filter trực tiếp từ template.
- Cân nhắc lưu selected item vào query param, ví dụ `?code=<id>&item=<workItemId>`, nếu không gây xung đột route hiện tại.
- Nút `Mục cần duyệt tiếp theo` phải bỏ qua nhóm empty/done và chuyển focus tới nhóm pending kế tiếp.
- Sau khi hoàn tất một nhóm, workspace hiển thị gợi ý chuyển nhóm tiếp theo thay vì để người dùng tự tìm.

### Giai đoạn 6 — Summary đầy đủ và trạng thái chưa đạt/cần sửa

- Hoàn thiện `revisionQuestions` trong `summaryVm`, không để hard-code `0` nếu UI vẫn hiển thị card này.
- Xác định rõ mapping status cho nhóm “Chưa đạt/cần sửa” theo dữ liệu hiện có:
  - Trắc nghiệm: đối chiếu status câu hỏi cũ, ví dụ trạng thái chưa đạt/đã sửa nếu có.
  - Tự luận/dự án/KTHP thực hành: đối chiếu status trong `course-plan-activity-tuluan`.
  - Form đề: xác định nguồn dữ liệu riêng nếu có.
- Nếu chưa có nguồn dữ liệu đáng tin cậy cho `revisionQuestions`, tạm ẩn card “Chưa đạt/cần sửa” hoặc hiển thị nhãn “Sẽ bổ sung” thay vì số 0 gây hiểu nhầm.
- Progress và count của mỗi work item phải dùng cùng một nguồn dữ liệu với component con để tránh summary khác danh sách chi tiết.

### Giai đoạn 7 — Duyệt hàng loạt an toàn

- Thiết kế phạm vi duyệt hàng loạt theo từng loại work item trước khi code:
  - Loại nào được phép duyệt hàng loạt.
  - Status nào được phép chọn.
  - Role nào được phép thực hiện.
  - Có cho phép thao tác “không đạt hàng loạt” hay chỉ “duyệt đạt hàng loạt”.
- UI bắt buộc có:
  - chọn nhiều bản ghi đủ điều kiện;
  - hiển thị số lượng bản ghi bị ảnh hưởng;
  - bước xác nhận trước khi áp dụng;
  - loading và disabled state trong lúc xử lý;
  - thông báo thành công/thất bại rõ ràng.
- Nếu lỗi một phần:
  - hiển thị số thành công/thất bại;
  - không fallback im lặng;
  - giữ lại các item thất bại để người dùng xử lý tiếp.
- Sau batch action phải refresh count/summary/worklist/workspace hiện tại.
- Batch action phải nằm trong component con hoặc service/helper cục bộ của `duyet-cauhoi-v2`, không làm thay đổi component cũ.

### Giai đoạn 8 — Kiểm tra tĩnh và hoàn thiện

- Kiểm tra template không gọi method tính trạng thái.
- Kiểm tra dead code trong component.
- Đối chiếu mapping item v2 với danh sách item cũ.
- Cập nhật changelog trong kế hoạch.
- Chỉ chạy build/test khi có yêu cầu riêng.

## 11. Tiêu chí hoàn thành

### 11.1. Tiêu chí shell và tổng điều phối

- Route v2 `cauhoi-v2` chạy song song route cũ `cauhoi`, không thay thế route cũ ở phase đầu.
- Người dùng hợp lệ thấy đúng môn học, hội đồng, vai trò, danh sách nhóm duyệt.
- Người không đủ quyền bị chặn như chức năng cũ.
- Summary và progress khớp dữ liệu count hiện tại.
- Auto chọn nhóm cần xử lý tiếp theo sau khi load.
- Có loading, empty, error state rõ ràng ở màn tổng điều phối.
- HTML không gọi method tính trạng thái; mọi trạng thái hiển thị được tính trong TypeScript/view-model.
- Tất cả file riêng của chức năng nằm trong folder `duyet-cauhoi-v2`.

### 11.2. Tiêu chí component con nghiệp vụ

- Mỗi nhóm duyệt hiển thị đúng component con v2 theo mapping nghiệp vụ.
- Component con v2 phải load/hiển thị dữ liệu chi tiết từ cùng nguồn nghiệp vụ với chức năng cũ.
- Không import trực tiếp component con cũ làm UI chính của v2; component con v2 phải được tạo mới trong folder `duyet-cauhoi-v2`.
- Mỗi component con có loading, empty, error state cục bộ.
- Sau thao tác duyệt trong component con, summary/worklist/workspace được refresh hoặc cập nhật lại rõ ràng.

### 11.3. Tiêu chí giảm thao tác và giữ ngữ cảnh

- Quick filters hoạt động theo view-model đã tính sẵn.
- Search worklist theo title/type/status/badge label nếu danh sách đủ nhiều để cần search.
- Có cơ chế giữ hoặc khôi phục selected item bằng query param/local state nếu không xung đột route hiện tại.
- Nút `Mục cần duyệt tiếp theo` bỏ qua item empty/done và chọn đúng item pending kế tiếp.
- Khi hoàn tất một nhóm, màn hình gợi ý chuyển sang nhóm tiếp theo.

### 11.4. Tiêu chí summary và trạng thái chưa đạt/cần sửa

- `revisionQuestions` không được hard-code `0` nếu card “Chưa đạt/cần sửa” vẫn hiển thị như dữ liệu thật.
- Mapping status cho “Chưa đạt/cần sửa” được xác định rõ cho trắc nghiệm, tự luận/dự án/KTHP thực hành và form đề nếu có nguồn dữ liệu.
- Nếu chưa xác định được nguồn dữ liệu đáng tin cậy, UI phải ẩn/ghi chú card này thay vì hiển thị số gây hiểu nhầm.

### 11.5. Tiêu chí duyệt hàng loạt

- Có thiết kế phạm vi duyệt hàng loạt theo loại câu hỏi/item, trạng thái và role được phép.
- Có chọn nhiều bản ghi đủ điều kiện.
- Có xác nhận trước khi áp dụng và hiển thị số lượng bản ghi bị ảnh hưởng.
- Có loading/disabled state trong lúc xử lý.
- Có phản hồi thành công/thất bại rõ ràng; lỗi một phần phải hiển thị số thành công/thất bại.
- Sau batch action phải refresh count/summary/worklist/workspace.
- Batch action không làm thay đổi component cũ.

## 12. Rủi ro / câu hỏi mở

1. `course.params.exam_type` và `course.params.exam_format` ưu tiên theo logic cũ đã đúng chưa?
2. Khi `course.params` không phải JSON hợp lệ, nên chặn màn hình hay fallback sang `{}` và cảnh báo?
3. Quy tắc nghiệp vụ chi tiết cho duyệt hàng loạt: được duyệt hàng loạt theo nhóm nào, trạng thái nào, và role nào được phép?

## 13. Changelog

### 2026-06-01 — Lần 1: Tạo kế hoạch duyet-cauhoi-v2
**Mục đích:** Lập kế hoạch tạo chức năng duyệt câu hỏi v2 với UX/UI mới, mapping từ chức năng cũ và tuân thủ rules dự án.

**Các thay đổi:**
1. **`plans/duyet-cauhoi-v2.md`** — Tạo kế hoạch phạm vi, mapping nghiệp vụ, UX/UI mới, kiến trúc folder, view-model, lộ trình triển khai, tiêu chí hoàn thành và câu hỏi mở.

**Kết quả:** Sẵn sàng để xác nhận phạm vi trước khi triển khai code.

### 2026-06-01 — Lần 2: Chốt hướng route, duyệt hàng loạt và component con v2
**Mục đích:** Cập nhật các quyết định phạm vi trước khi triển khai để tránh nhập nhằng giữa route cũ, route v2 và component con.

**Các thay đổi:**
1. **`plans/duyet-cauhoi-v2.md`** — Chốt route `cauhoi-v2` chạy song song route cũ `cauhoi`.
2. **`plans/duyet-cauhoi-v2.md`** — Bổ sung yêu cầu cho phép duyệt hàng loạt với xác nhận, loading/disabled state, refresh count và xử lý lỗi một phần.
3. **`plans/duyet-cauhoi-v2.md`** — Chốt phase đầu redesign màn tổng điều phối trước; component con tạo mới trong folder v2 và redesign sau, không dùng trực tiếp component cũ làm UI chính.

**Kết quả:** Kế hoạch đã rõ phạm vi triển khai phase đầu và ràng buộc tạo mới component con v2.

### 2026-06-01 — Lần 3: Triển khai shell v2, route và UI tổng điều phối
**Mục đích:** Thực hiện phase đầu của kế hoạch bằng cách tạo chức năng `duyet-cauhoi-v2` chạy song song với màn duyệt câu hỏi cũ.

**Các thay đổi:**
1. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/`** — Tạo folder riêng cho toàn bộ chức năng v2 gồm component chính, model, mapper, component điều phối và skeleton component con.
2. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/duyet-cauhoi-v2.component.ts`** — Port luồng tải hội đồng, kiểm tra quyền, tải kế hoạch/count câu hỏi và map sang view-model v2.
3. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/components/`** — Tạo header, summary, worklist, workspace, insights và skeleton question-types v2 theo hướng UI tổng điều phối.
4. **`src/app/modules/admin/features/duyetnoidung/duyetnoidung-routing.module.ts`** — Thêm route `cauhoi-v2`, giữ route cũ `cauhoi` để chạy song song.
5. **`plans/duyet-cauhoi-v2.md`** — Cập nhật changelog sau khi triển khai phase đầu.

**Kết quả:** Shell v2 và route `cauhoi-v2` đã được tạo; component con v2 đang ở mức skeleton/contract để phase sau redesign nghiệp vụ chi tiết.

### 2026-06-01 — Lần 4: Hoàn thiện kế hoạch sau kiểm tra độ hoàn thiện
**Mục đích:** Làm rõ phần còn thiếu sau khi đối chiếu kế hoạch với code hiện có, để các phase tiếp theo có tiêu chí triển khai/nghiệm thu cụ thể hơn.

**Các thay đổi:**
1. **`plans/duyet-cauhoi-v2.md`** — Tách roadmap còn lại thành các giai đoạn rõ hơn: component con nghiệp vụ v2, giảm thao tác/search/giữ ngữ cảnh, summary trạng thái chưa đạt/cần sửa, duyệt hàng loạt an toàn và kiểm tra tĩnh.
2. **`plans/duyet-cauhoi-v2.md`** — Bổ sung yêu cầu component con phải load/hiển thị nghiệp vụ thật, có loading/empty/error cục bộ và refresh count/summary sau thao tác.
3. **`plans/duyet-cauhoi-v2.md`** — Bổ sung yêu cầu không hard-code `revisionQuestions = 0` nếu UI hiển thị card “Chưa đạt/cần sửa”; phải xác định mapping status hoặc ẩn/ghi chú card khi chưa có nguồn dữ liệu tin cậy.
4. **`plans/duyet-cauhoi-v2.md`** — Chi tiết hóa tiêu chí duyệt hàng loạt: phạm vi theo loại item/status/role, chọn nhiều, xác nhận, loading/disabled, xử lý lỗi một phần và refresh sau thao tác.
5. **`plans/duyet-cauhoi-v2.md`** — Tách tiêu chí hoàn thành thành các nhóm: shell/tổng điều phối, component con nghiệp vụ, giảm thao tác, summary trạng thái và duyệt hàng loạt.

**Kết quả:** Kế hoạch đã phản ánh đúng mức hiện trạng: shell v2 đã có, còn các hạng mục nghiệp vụ chi tiết/batch/search/summary revision cần triển khai ở phase sau.

### 2026-06-01 — Lần 5: Bổ sung search, giữ ngữ cảnh và xử lý summary revision
**Mục đích:** Thực hiện một phần các hạng mục giảm thao tác và summary trong roadmap còn lại của `duyet-cauhoi-v2`.

**Các thay đổi:**
1. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/components/duyet-cauhoi-v2-worklist/`** — Bổ sung ô tìm kiếm worklist theo tên, loại, trạng thái và badge label; search dùng binding/property đã tính sẵn, không filter trực tiếp trong template.
2. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/duyet-cauhoi-v2.component.ts`** — Bổ sung `searchText`, lọc `filteredWorkItems` trong TypeScript và giữ/khôi phục item đang chọn bằng `localStorage` theo hội đồng/môn học.
3. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/components/duyet-cauhoi-v2-summary/`** — Ẩn card “Cần sửa” khi chưa có nguồn mapping đáng tin cậy thay vì hiển thị `0` như dữ liệu thật.
4. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/models/duyet-cauhoi-v2.models.ts`** và **`utils/duyet-cauhoi-v2-mapper.ts`** — Bổ sung `showRevisionCard`/`revisionLabel` cho `summaryVm` để điều khiển trạng thái summary rõ ràng.

**Kết quả:** Worklist đã có search, item đang chọn được giữ ngữ cảnh khi reload/refresh, và summary không còn gây hiểu nhầm về số câu “Cần sửa” trong phase chưa xác định mapping revision.

### 2026-06-01 — Lần 6: Hoàn thiện shell route và action contract
**Mục đích:** Hoàn thiện các điểm shell có độ chắc chắn cao theo kế hoạch trước khi đi sâu vào nghiệp vụ component con.

**Các thay đổi:**
1. **`src/app/modules/admin/features/duyetnoidung/duyetnoidung-routing.module.ts`** — Khôi phục route cũ `cauhoi` và thêm route mới `cauhoi-v2` để v2 chạy song song đúng quyết định đã chốt.
2. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/duyet-cauhoi-v2.component.ts`** — Bổ sung helper chọn nhóm pending kế tiếp, tránh nút “Mục cần duyệt tiếp theo” luôn quay về nhóm pending đầu tiên.
3. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/components/duyet-cauhoi-v2-workspace/`** — Bổ sung action bar có nút làm mới số liệu, nút chuyển nhóm tiếp theo và output contract để component con phase sau có thể báo cha refresh/đi tiếp.

**Kết quả:** Shell v2 bám sát kế hoạch hơn: route v2 không thay thế route cũ, workspace có đường refresh summary/worklist rõ ràng và luồng chuyển nhóm tiếp theo đã sẵn sàng cho component con nghiệp vụ. Chưa chạy build/test theo phạm vi hiện tại.

### 2026-06-02 — Lần 7: Triển khai bước đầu component trắc nghiệm v2
**Mục đích:** Tiếp tục phase component con nghiệp vụ bằng cách thay skeleton trắc nghiệm v2 bằng implementation đọc dữ liệu thật và action duyệt cơ bản.

**Các thay đổi:**
1. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/components/question-types/duyet-cauhoi-v2-trac-nghiem/duyet-cauhoi-v2-trac-nghiem.component.ts`** — Port luồng tải CDR, câu hỏi trắc nghiệm và trạng thái nhận xét hội đồng từ màn trắc nghiệm cũ sang component v2; bổ sung loading/error/empty cục bộ, chọn câu hỏi, nhận xét và kết luận duyệt cơ bản.
2. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/components/question-types/duyet-cauhoi-v2-trac-nghiem/duyet-cauhoi-v2-trac-nghiem.component.html`** — Thay template skeleton bằng UI danh sách CDR/câu hỏi và panel chi tiết trạng thái duyệt; template bind trạng thái đã tính sẵn, không gọi method tính trạng thái.
3. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/components/question-types/duyet-cauhoi-v2-trac-nghiem/duyet-cauhoi-v2-trac-nghiem.component.css`** — Bổ sung style responsive cho toolbar, state, danh sách CDR, trạng thái câu hỏi và panel action.
4. **`src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-v2/components/duyet-cauhoi-v2-workspace/duyet-cauhoi-v2-workspace.component.html`** — Nối event `changed` từ component trắc nghiệm v2 lên `refreshRequested` để component cha refresh summary/worklist sau thao tác duyệt.

**Kết quả:** Component trắc nghiệm v2 không còn là skeleton; đã có luồng load dữ liệu thật, hiển thị trạng thái nhận xét/duyệt theo CDR và có action nhận xét/kết luận duyệt cơ bản. Chưa triển khai preview đầy đủ từng loại câu hỏi và chưa làm duyệt hàng loạt. Chưa chạy build/test theo phạm vi hiện tại.
