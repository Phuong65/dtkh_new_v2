# Kế hoạch chức năng quản lý môn học hội đồng thẩm định

## 1. Thông tin chung

- **Chức năng:** Gán môn học và thành viên thẩm định theo từng môn cho một hội đồng thẩm định.
- **Route:** `hoidong-monhoc?code=<hoidong_id>`.
- **Component chính:** `src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/`.
- **Trạng thái kế hoạch:** Đã triển khai phần đổi nguồn danh sách thành viên và đồng bộ thành viên mới vào danh sách chung của hội đồng ngày 2026-08-05; các giai đoạn cải tiến khác chưa triển khai; chưa build/test/run.

## 2. Mục tiêu nghiệp vụ

1. Chỉ cho người có quyền truy cập đúng hội đồng.
2. Hiển thị các môn đã thuộc hội đồng, lọc theo bộ môn, tìm kiếm theo tên/mã môn.
3. Thêm một hoặc nhiều môn phù hợp vào hội đồng.
4. Xóa một hoặc nhiều môn; xóa phân công thành viên liên quan trước.
5. Phân công thành viên hội đồng cho từng môn.
6. Mỗi môn có đúng một chủ tịch trong danh sách thành viên được chọn.
7. Hiển thị rõ chủ tịch, các ủy viên, trạng thái tải, kết quả thao tác, lỗi.

## 3. Hiện trạng chức năng

### 3.1. Khởi tạo và kiểm soát truy cập

- Đọc `code` từ query params để lấy hội đồng.
- Lấy hồ sơ người dùng hiện tại song song với hội đồng.
- Xác định vai trò: `manager`, `admin`, `hoidongthi_lanhdao`, `lanhdaokhoa`, `lanhdaobomon`.
- Với lãnh đạo khoa/bộ môn không thuộc nhóm quản lý, so khớp `selectedHoidong.category_id` với `userProfile.donvi_chuyenmon_id`.
- Lãnh đạo bộ môn chỉ mặc định xem bộ môn của mình; lãnh đạo khoa và quản lý có thể đổi bộ môn.

### 3.2. Tải danh sách môn của hội đồng

Ba nguồn dữ liệu được tải bằng `forkJoin`:

1. `hoidong-thamdinh-monhoc` kèm quan hệ `course`.
2. `hoidong-thamdinh-monhoc-thanhvien` kèm quan hệ `user`.
3. Danh sách bộ môn thuộc đơn vị chuyên môn của hội đồng.

Sau khi tải:

- Chuẩn hóa tên, mã môn, người tạo kế hoạch, bộ môn.
- Đọc `course.params` để hiển thị tín chỉ và hình thức thi.
- Ghép thành viên vào từng môn theo `hoidong_thamdinh_monhoc_id`.
- Sắp chủ tịch lên trước.
- Tính số cột thành viên lớn nhất trong bảng.

### 3.3. Thêm môn học

- Lấy các khóa học thuộc `category_ids` của hội đồng.
- Lãnh đạo bộ môn chỉ lấy môn thuộc `user_bomon_id`.
- Loại các môn đã có trong hội đồng bằng `exclude`/`exclude_by=id`.
- Người dùng chọn nhiều môn trong side navigation.
- Tạo từng bản ghi `hoidong-thamdinh-monhoc`; hiển thị tiến độ.

### 3.4. Xóa môn học

- Hỗ trợ xóa một môn hoặc nhiều môn đã chọn.
- Thu thập các bản ghi `hoidong-thamdinh-monhoc-thanhvien` liên quan.
- Gọi xóa phân công thành viên và xóa môn khỏi hội đồng.
- Tải lại danh sách sau thành công.

### 3.5. Phân công thành viên theo môn

- **Hiện trạng:** Tải thành viên từ `hoidong-thamdinh-thanhvien`.
- **Thay đổi đã chốt:** Không lấy danh sách ứng viên từ thành viên hội đồng. Lấy trực tiếp hồ sơ giảng viên qua `ElngUserProfileService` với hai điều kiện:
  - `teacher = 1`.
  - `donvi_chuyenmon_id = selectedHoidong.category_id`.
- Danh sách phân công hiện có của môn vẫn lấy từ `hoidong-thamdinh-monhoc-thanhvien` để đánh dấu thành viên đã chọn và chủ tịch.
- Cho phép chọn nhiều giảng viên, chọn một người làm chủ tịch.
- Khi lưu:
  - Tạo phân công mới trong `hoidong-thamdinh-monhoc-thanhvien`.
  - Chỉ sau khi tạo phân công theo môn thành công, tạo tiếp thành viên chung trong `hoidong-thamdinh-thanhvien` với `hoidong_thamdinh_id` và `user_id` tương ứng.
  - Không kiểm tra trùng thành viên chung ở frontend; server `hoidong-thamdinh-thanhvien` chịu trách nhiệm kiểm tra trùng.
  - Cập nhật phân công còn tồn tại.
  - Xóa phân công bị bỏ chọn; không xóa thành viên khỏi danh sách chung của hội đồng.
- Tải lại danh sách môn sau thành công.

## 4. API và dữ liệu liên quan

| Resource | Mục đích | Thao tác hiện dùng |
|---|---|---|
| `hoidong-thamdinh` | Lấy hội đồng theo `id` | GET danh sách có điều kiện |
| `hoidong-thamdinh-monhoc` | Quan hệ hội đồng - môn học | GET, POST, DELETE |
| `hoidong-thamdinh-monhoc-thanhvien` | Phân công thành viên theo môn | GET, POST, PUT, DELETE |
| `hoidong-thamdinh-thanhvien` | Danh sách thành viên chung của hội đồng; nhận thêm thành viên sau khi tạo phân công theo môn thành công | POST; server kiểm tra trùng |
| Khóa học | Danh sách môn có thể thêm | GET theo đơn vị/bộ môn, kèm `creatorPlan` |
| Chuyên mục/bộ môn | Bộ lọc môn học | GET theo `donvi_chuyenmon_id` |
| `ElngUserProfileService` | Kiểm tra hồ sơ người dùng hiện tại; lấy danh sách giảng viên có thể phân công | GET theo `user_id`; GET theo `teacher = 1` và `donvi_chuyenmon_id = selectedHoidong.category_id` |

Quan hệ xóa bắt buộc:

1. Xóa `hoidong-thamdinh-monhoc-thanhvien`.
2. Sau khi bước 1 hoàn tất, xóa `hoidong-thamdinh-monhoc`.

## 5. Vấn đề cần xử lý

### P0 — Đúng nghiệp vụ và an toàn dữ liệu

1. **Hội đồng không tồn tại:** mã hiện tại vẫn gọi tải môn khi API không trả hội đồng; có thể truy cập `selectedHoidong.id` khi chưa có dữ liệu.
2. **Ma trận quyền chưa đầy đủ:** nút thêm, xóa, phân công luôn hiển thị; chưa dùng `userCanAdd`, `userCanEdit`, `userCanDelete` như màn quản lý hội đồng.
3. **Xóa cha-con đang chạy đồng thời:** `forkJoin` kích hoạt xóa thành viên và môn cùng lúc, chưa bảo đảm xóa con hoàn tất trước khi xóa cha.
4. **Lưu khi chưa chọn môn:** `selectedMonhocForHoidong` có thể chưa khởi tạo; gọi `forEach` có thể lỗi.
5. **Dữ liệu `params` không hợp lệ:** `JSON.parse` chưa được bảo vệ; một bản ghi sai có thể làm hỏng toàn bộ màn hình.

### P1 — Tính ổn định và tính nhất quán

1. Chuỗi thông tin có thể hiển thị `undefined` khi thiếu `params`, hình thức thi hoặc quan hệ `course`.
2. Thao tác chọn chủ tịch vẫn có thể được kích hoạt trên hàng chưa chọn.
3. Chưa xác định/thể hiện thứ tự ủy viên dù model phân công có trường `ordering`.
4. Một số lỗi tải dữ liệu chỉ tắt loading, không báo lỗi cho người dùng.
5. Luồng thêm môn dùng gọi API đệ quy, trái quy tắc chung “không gọi API trong đệ quy”.
6. Chưa ngăn nhấn lưu/xóa lặp khi request đang xử lý.
7. Một số state không được reset rõ sau đóng/mở dialog hoặc sau thao tác thành công.

### P2 — Chất lượng mã và UI/UX

1. Có import, property, `ViewChild`, biến cục bộ và khối HTML comment không còn dùng.
2. Logic chuẩn hóa thông tin môn bị lặp; có điều kiện lồng trùng.
3. Template gọi `.concat()` và `[].constructor(...)`, không đúng quy tắc không gọi method trong binding.
4. CSS gần như trống; phần lớn layout dùng inline style.
5. Nút xóa chỉ có icon; thiếu text/tooltip/aria-label nhất quán.
6. Empty state chỉ có text; chưa có icon, tiêu đề, gợi ý.
7. Chưa có trạng thái rỗng rõ cho bảng chính, danh sách thành viên, danh sách môn có thể thêm.
8. Chưa tối ưu responsive và khả năng tiếp cận bàn phím.

## 6. Phạm vi triển khai đề xuất

### Trong phạm vi

- Củng cố kiểm tra hội đồng và quyền thao tác.
- Chuẩn hóa dữ liệu hiển thị.
- Sửa trình tự xóa cha-con.
- Sửa luồng thêm nhiều môn không đệ quy.
- Ổn định luồng chọn/lưu thành viên và chủ tịch.
- Làm sạch TypeScript/template.
- Nâng cấp UI/UX theo `docs/_rules.md`.
- Bổ sung kiểm thử cho logic trọng yếu nếu hạ tầng test hiện tại hỗ trợ.

### Ngoài phạm vi mặc định

- Thay đổi schema/database.
- Viết endpoint batch/transaction mới ở backend.
- Thay đổi nghiệp vụ thành viên chung của hội đồng.
- Thay đổi quy trình duyệt nội dung sau khi phân công.
- Chuyển toàn bộ danh sách sang server-side pagination nếu chưa được xác nhận.

## 7. Kế hoạch triển khai

### Giai đoạn 1 — Giữ nguyên nghiệp vụ và quyền hiện tại

1. Không bổ sung `chuyenvien_pdt` vào `isManager`.
2. Không áp dụng thêm `userCanAdd`, `userCanEdit`, `userCanDelete`; giữ nguyên cách hiển thị CTA hiện tại.
3. Không giới hạn số thành viên; khi lưu phải có một chủ tịch. UI chỉ cho chọn một chủ tịch.
4. Chủ tịch đứng đầu; ủy viên giữ thứ tự API trả về, không dùng `ordering`.
5. Môn được lọc theo `category_ids`; lãnh đạo bộ môn lọc thêm `nganh_bomon_id`; loại các môn đã thuộc hội đồng. Không bổ sung bộ lọc trạng thái.
6. Giữ client-side pagination với tùy chọn 50/100 bản ghi.

**Kết quả:** Mọi cải tiến kỹ thuật và UI không làm thay đổi nghiệp vụ đang vận hành.

### Giai đoạn 2 — Củng cố khởi tạo và state

1. Nếu thiếu `code`, hội đồng không tồn tại hoặc người dùng không có quyền: dừng luồng, tắt loading, điều hướng `content-none`.
2. Khởi tạo các mảng selection bằng `[]`; reset state khi đóng/mở form.
3. Tách các trạng thái `isLoading`, `isSaving`, `isDeleting` hoặc dùng cơ chế processing hiện có nhất quán.
4. Disable CTA trong khi request chạy.
5. Quản lý subscription theo vòng đời component nếu cần.

**File chính:**
- `hd-thamdinh-monhoc.component.ts`

### Giai đoạn 3 — Chuẩn hóa dữ liệu môn và cột thành viên

1. Tạo view model hoặc hàm chuẩn hóa duy nhất trong TypeScript:
   - Tên/mã môn an toàn.
   - Tên người tạo kế hoạch.
   - Tín chỉ lý thuyết/thực hành.
   - Hình thức thi có fallback.
   - Bộ môn.
   - Chuỗi hiển thị hoàn chỉnh, không `undefined`.
2. Parse `params` bằng helper an toàn; bản ghi lỗi dùng fallback thay vì làm hỏng trang.
3. Bỏ logic lặp và biến không dùng.
4. Tính sẵn `memberColumns` trong TypeScript; template chỉ lặp property.
5. Dùng `ordering` nếu nghiệp vụ xác nhận; nếu chưa có, dùng thứ tự ổn định: chủ tịch trước, sau đó theo tên hoặc id.

**File chính:**
- `hd-thamdinh-monhoc.component.ts`
- Có thể thêm `hd-thamdinh-monhoc.types.ts` trong cùng feature nếu view model đủ lớn.

### Giai đoạn 4 — Hoàn thiện thêm môn

1. Giữ điều kiện đơn vị chuyên môn và bộ môn theo quyền.
2. Loại môn đã thuộc hội đồng.
3. Validation selection trước lưu; nút lưu disabled nếu chưa chọn.
4. Thay `loopAddForm()` đệ quy bằng RxJS tuần tự (`from(...).pipe(concatMap(...))`) để giữ progress và dừng rõ khi lỗi.
5. Hiển thị tiến độ theo số bản ghi hoàn tất.
6. Thành công: đóng side navigation, reset selection, tải lại dữ liệu, toast.
7. Thất bại: dừng progress, giữ thông tin đủ để người dùng thử lại; xác định cách xử lý trường hợp đã thêm một phần.

**File chính:**
- `hd-thamdinh-monhoc.component.ts`
- `hd-thamdinh-monhoc.component.html`

### Giai đoạn 5 — Hoàn thiện xóa một/nhiều môn

1. Kiểm tra quyền xóa và selection.
2. Xác nhận xóa có nêu số môn và dữ liệu phân công liên quan.
3. Thực hiện tuần tự:
   - Xóa toàn bộ phân công thành viên liên quan.
   - Chỉ khi thành công mới xóa quan hệ môn khỏi hội đồng.
4. Dùng một helper dùng chung cho xóa đơn và xóa nhiều.
5. Khi lỗi: dừng loading, báo bước thất bại, tải lại trạng thái nếu có khả năng xóa một phần.
6. Xóa selection sau thành công.

**File chính:**
- `hd-thamdinh-monhoc.component.ts`
- `hd-thamdinh-monhoc.component.html`

### Giai đoạn 6 — Hoàn thiện phân công thành viên

**Trạng thái:** Đã hoàn thành bước 1-4 và phần đồng bộ thành viên chung tại bước 9-11; các bước cải tiến còn lại chưa triển khai.

1. [x] Thay nguồn `list_thanhvien`: bỏ truy vấn `HoidongThamdinhThanhvienService` trong luồng mở danh sách thành viên.
2. [x] Truy vấn trực tiếp `ElngUserProfileService` với điều kiện kết hợp:
   - `teacher = 1`.
   - `donvi_chuyenmon_id = selectedHoidong.category_id`.
   - `limit = -1`, `page = null` để lấy toàn bộ giảng viên phù hợp.
3. [x] Chuẩn hóa mỗi hồ sơ thành dữ liệu hiển thị/chọn: `user_id`, `display_name`, `email`; giữ tương thích payload `hoidong-thamdinh-monhoc-thanhvien`.
4. [x] Đối chiếu `user_id` với phân công hiện có trong `selectedMonhoc.thanhvien` để khôi phục selection và trạng thái chủ tịch.
5. Chỉ cho chọn chủ tịch trên giảng viên đã được chọn.
6. Validation trước lưu:
   - Có ít nhất một thành viên.
   - Có đúng một chủ tịch.
   - Chủ tịch nằm trong danh sách đã chọn.
7. So sánh snapshot cũ/mới để tạo ba nhóm: `create`, `update`, `delete`.
8. Chỉ gửi update khi `chutich` thay đổi; không bổ sung nghiệp vụ `ordering`.
9. [x] Với từng thành viên mới của môn, thực hiện tuần tự:
   - Gọi `HoidongThamdinhMonhocThanhvienService.addHoidongThamdinhMonhocThanhvien()` trước.
   - Chỉ khi request trên thành công, gọi `HoidongThamdinhThanhvienService.addHoidongThamdinhThanhvien()` với payload `{ hoidong_thamdinh_id, user_id }`.
   - Không gọi API thành viên chung nếu tạo phân công theo môn thất bại.
   - Không truy vấn hoặc kiểm tra trùng ở frontend; server đã xử lý trùng `hoidong-thamdinh-thanhvien`.
10. [x] Thành viên đã có phân công theo môn chỉ update phân công hiện tại; không cần gọi lại API thành viên chung. Thành viên bị bỏ khỏi môn chỉ bị xóa khỏi `hoidong-thamdinh-monhoc-thanhvien`, không bị xóa khỏi `hoidong-thamdinh-thanhvien`.
11. [x] Giữ cách gửi từng request; không bổ sung API batch/transaction. Chấp nhận thành công một phần giữa các thành viên; không rollback phân công theo môn nếu request thêm thành viên chung thất bại.
12. Sau thành công: đóng modal, reset state, tải lại danh sách, toast.
13. Sau lỗi: thông báo rõ, tải lại dữ liệu server để tránh state cục bộ sai.

**File chính:**
- `hd-thamdinh-monhoc.component.ts`
- `hd-thamdinh-monhoc.component.html`
- `src/app/modules/shared/models/hoidong-thamdinh-monhoc-thanhvien.ts` nếu cần chuẩn hóa kiểu `ordering`/`chutich`.

### Giai đoạn 7 — Nâng cấp UI/UX và accessibility

1. Tạo header rõ chức năng, mô tả ngắn, số môn/thành viên nếu phù hợp.
2. Gom bộ lọc bộ môn, tìm kiếm, thêm, xóa thành toolbar responsive.
3. Nút có icon + text; icon-only chỉ dùng khi không gian bắt buộc, kèm tooltip và `aria-label`.
4. Bảng có zebra row, hover, sticky header nếu phù hợp, cột hành động rõ.
5. Empty state có icon, title, hint, CTA phù hợp.
6. Side navigation/dialog có header, body, footer nhất quán; hiển thị số mục đã chọn.
7. Loading rõ cho tải danh sách và thao tác lưu/xóa.
8. Chuyển inline style sang CSS; dùng CSS custom properties, focus ring, responsive breakpoint 992px/576px.
9. Loại `.concat()` và các method call khỏi template.
10. Bổ sung nhãn truy cập, vùng bấm đủ lớn, focus keyboard, độ tương phản.

**File chính:**
- `hd-thamdinh-monhoc.component.html`
- `hd-thamdinh-monhoc.component.css`

### Giai đoạn 8 — Dọn mã và đồng bộ kiểu dữ liệu

1. Xóa import `request`, `data` và import không dùng khác.
2. Xóa `templatePmsGiangvien`, khối HTML comment, property/method không dùng.
3. Đổi tên state sang convention nhất quán nếu phạm vi diff cho phép.
4. Hạn chế `any`; bổ sung interface view model/event.
5. Thêm dấu chấm phẩy/format theo style hiện có; không refactor service ngoài phạm vi.

### Giai đoạn 9 — Xác minh

#### Kiểm tra tĩnh

- Không còn method call trong template binding.
- Không còn import/property/template dead code.
- Không gọi API trong vòng lặp bằng `subscribe` hoặc trong đệ quy.
- Xóa child hoàn tất trước parent.
- Mọi nhánh success/error đều kết thúc loading hợp lệ.
- Mọi CTA thay đổi dữ liệu đều có kiểm tra quyền, validation, disabled khi processing.

#### Kịch bản chức năng

1. Truy cập không có `code`.
2. `code` không tồn tại.
3. Quản lý truy cập và đổi bộ môn.
4. Lãnh đạo khoa đúng/sai đơn vị chuyên môn.
5. Lãnh đạo bộ môn chỉ thấy môn thuộc bộ môn của mình.
6. Hội đồng chưa có môn.
7. Thêm một môn, nhiều môn, không chọn môn, API lỗi giữa chừng.
8. Xóa một môn không có thành viên.
9. Xóa một môn có thành viên; xác nhận thứ tự xóa.
10. Xóa nhiều môn, selection rỗng, lỗi xóa child/parent.
11. Chọn thành viên mới và chủ tịch; xác nhận tạo phân công theo môn trước, sau đó mới thêm thành viên chung của hội đồng.
12. API tạo phân công theo môn lỗi; xác nhận không gọi API thêm thành viên chung.
13. API tạo phân công theo môn thành công nhưng API thêm thành viên chung lỗi; giữ phân công đã tạo, báo lỗi, không rollback.
14. Chọn người đã thuộc danh sách thành viên chung; server xử lý trùng, frontend không truy vấn kiểm tra trước.
15. Đổi chủ tịch hoặc giữ thành viên đã phân công; không gọi thêm thành viên chung.
16. Bỏ thành viên khỏi môn; chỉ xóa phân công theo môn, giữ thành viên chung của hội đồng.
17. Course thiếu quan hệ, thiếu `params`, `params` JSON lỗi.
18. Responsive desktop/tablet/mobile; điều hướng bàn phím; tooltip/aria-label.

#### Lệnh chạy

Chỉ chạy build/test/dev-server khi người dùng yêu cầu riêng. Phiên lập kế hoạch này không chạy lệnh xác minh.

## 8. Thứ tự file dự kiến chỉnh sửa

1. `src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.ts`
2. `src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.html`
3. `src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.css`
4. `src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.types.ts` — chỉ tạo nếu cần view model riêng.
5. `src/app/modules/shared/models/hoidong-thamdinh-monhoc.ts` và `hoidong-thamdinh-monhoc-thanhvien.ts` — chỉ sửa khi cần chuẩn hóa type dùng chung.
6. Service liên quan — chỉ sửa khi cần endpoint batch hoặc type response; không mặc định thay đổi.

## 9. Tiêu chí hoàn thành

- Người không đủ quyền không xem hoặc thao tác được dữ liệu ngoài phạm vi.
- Hội đồng/môn/params thiếu hoặc lỗi không làm component crash.
- Thêm nhiều môn có progress, không dùng API đệ quy.
- Xóa môn bảo đảm xóa phân công trước.
- Phân công thành viên luôn có đúng một chủ tịch.
- Thành viên mới chỉ được thêm vào `hoidong-thamdinh-thanhvien` sau khi tạo `hoidong-thamdinh-monhoc-thanhvien` thành công; frontend không kiểm tra trùng.
- Không gửi request thừa cho bản ghi không đổi.
- Loading, success, warning, error đầy đủ; không còn trạng thái treo.
- UI responsive, rõ ràng, có empty/loading state, hỗ trợ keyboard cơ bản.
- Template không gọi method để tính trạng thái/hiển thị.
- Không còn dead code đã xác định.
- Kế hoạch được cập nhật changelog sau mỗi đợt triển khai.

## 10. Rủi ro và phương án giảm thiểu

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| Backend không hỗ trợ transaction/batch | Thêm/xóa/lưu nhiều bản ghi có thể thành công một phần | Thực hiện tuần tự, báo lỗi rõ, tải lại dữ liệu server; đề xuất endpoint batch nếu cần tính nguyên tử |
| Quyền route và vai trò xung đột | Lộ hoặc khóa nhầm thao tác | Chốt ma trận quyền; kiểm tra cả route permission và phạm vi đơn vị |
| Dữ liệu cũ có `params` sai | Crash hoặc hiển thị sai | Safe parse, fallback, ghi nhận dữ liệu lỗi để xử lý backend |
| Danh sách tải toàn bộ quá lớn | Chậm và tốn bộ nhớ | Đánh giá số lượng thực tế; chuyển server-side pagination khi vượt ngưỡng |
| Thứ tự ủy viên chưa thống nhất | Cột hiển thị thay đổi giữa các lần tải | Chốt và lưu `ordering`, có fallback ổn định |

## 11. Quyết định đã chốt

Nguyên tắc chung: chức năng hiện tại đang vận hành thế nào thì giữ nguyên nghiệp vụ như vậy.

1. **Vai trò `chuyenvien_pdt`:** Không được xem là `isManager` trong component này.
2. **Quyền CTA:** Không bổ sung kiểm tra `userCanAdd`, `userCanEdit`, `userCanDelete`; giữ cách hiển thị và thao tác hiện tại.
3. **Số thành viên:** Không giới hạn tối thiểu/tối đa. Khi lưu phải có chủ tịch; UI chỉ cho chọn một chủ tịch.
4. **Thứ tự thành viên:** Chủ tịch đứng trước; ủy viên giữ thứ tự API trả về. Không áp dụng trường `ordering`.
5. **Điều kiện thêm môn:** Lọc theo `category_ids`; lãnh đạo bộ môn lọc thêm `nganh_bomon_id`; loại môn đã được thêm. Không bổ sung lọc trạng thái khác.
6. **Lỗi khi thêm nhiều môn:** Giữ các môn đã thêm thành công; không rollback.
7. **Cách gọi API:** Không bổ sung API batch/transaction; tiếp tục gửi từng request theo hành vi hiện tại.
8. **Phân trang:** Giữ client-side pagination 50/100 bản ghi.
9. **Xóa dữ liệu:** Chỉ xử lý phân công thành viên theo môn và quan hệ môn-hội đồng; không bổ sung kiểm tra/xóa dữ liệu duyệt hoặc nhận xét khác.
10. **Nguồn danh sách thành viên:** Đổi từ thành viên chung của hội đồng sang `ElngUserProfileService`; chỉ lấy hồ sơ có `teacher = 1` và `donvi_chuyenmon_id = selectedHoidong.category_id`.
11. **Đồng bộ thành viên chung:** Với thành viên mới của môn, tạo `hoidong-thamdinh-monhoc-thanhvien` trước; chỉ sau khi thành công mới POST thành viên đó vào `hoidong-thamdinh-thanhvien`. Frontend không kiểm tra trùng vì server đã xử lý. Lỗi bước sau không rollback phân công theo môn. Bỏ thành viên khỏi môn không xóa thành viên chung.

## 12. Câu hỏi mở

Không còn câu hỏi mở.

## 13. Lịch sử chỉnh sửa

### 2026-08-05 — Lần 1: Khởi tạo kế hoạch từ chức năng hiện tại

**Mục đích:** Ghi nhận nghiệp vụ, luồng dữ liệu, vấn đề và lộ trình củng cố chức năng quản lý môn học hội đồng thẩm định.

**Các thay đổi:**
1. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Tạo phân tích hiện trạng, phạm vi, kế hoạch 9 giai đoạn, tiêu chí hoàn thành, rủi ro và câu hỏi mở.

**Kết quả:** Có kế hoạch triển khai; chưa thay đổi mã nguồn; chưa build/test/run.

### 2026-08-05 — Lần 2: Chốt giữ nguyên nghiệp vụ hiện tại

**Mục đích:** Loại bỏ các điểm chưa xác định; bảo đảm cải tiến không thay đổi hành vi chức năng đang vận hành.

**Các thay đổi:**
1. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Chốt vai trò, quyền CTA, thành viên/chủ tịch, thứ tự hiển thị, điều kiện môn, lỗi từng phần, cách gọi API, phân trang và phạm vi xóa.
2. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Chuyển toàn bộ câu hỏi mở thành quyết định; xác nhận không còn câu hỏi mở.

**Kết quả:** Kế hoạch giữ nguyên nghiệp vụ hiện tại; chưa thay đổi mã nguồn; chưa build/test/run.

### 2026-08-05 — Lần 3: Đổi nguồn danh sách thành viên theo môn

**Mục đích:** Mở rộng nguồn ứng viên phân công từ toàn bộ giảng viên thuộc đơn vị chuyên môn, không phụ thuộc danh sách thành viên chung của hội đồng.

**Các thay đổi:**
1. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Chốt lấy `list_thanhvien` trực tiếp qua `ElngUserProfileService`.
2. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Chốt điều kiện `teacher = 1` và `donvi_chuyenmon_id = selectedHoidong.category_id`.
3. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Cập nhật API, luồng đối chiếu phân công hiện có, giai đoạn triển khai và tiêu chí dữ liệu.

**Kết quả:** Kế hoạch đã ghi nhận thay đổi nguồn thành viên; chưa thay đổi mã nguồn; chưa build/test/run.

### 2026-08-05 — Lần 4: Triển khai nguồn giảng viên theo đơn vị chuyên môn

**Mục đích:** Thực hiện phần bổ sung đã chốt; danh sách ứng viên phân công không phụ thuộc thành viên chung của hội đồng.

**Các thay đổi:**
1. **`src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.ts`** — Đổi truy vấn trong `openLoadThanhVien()` sang `ElngUserProfileService.getUserProfileByPageNewV2()`.
2. **`src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.ts`** — Thêm điều kiện `teacher = 1`, `donvi_chuyenmon_id = selectedHoidong.category_id`, `limit = -1`, `with = user`.
3. **`src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.ts`** — Chuẩn hóa hồ sơ sang dữ liệu hiển thị; đối chiếu `user_id` với phân công hiện có để khôi phục selection/chủ tịch; bỏ dependency `HoidongThamdinhThanhvienService` khỏi component.
4. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Đánh dấu phần bổ sung nguồn thành viên đã triển khai.

**Kết quả:** Đã triển khai mã nguồn và rà soát tĩnh bằng đọc/diff; chưa build/test/run theo quy ước dự án.

### 2026-08-05 — Lần 5: Bổ sung kế hoạch đồng bộ thành viên chung

**Mục đích:** Bảo đảm giảng viên mới được phân công theo môn cũng thuộc danh sách thành viên chung của hội đồng.

**Các thay đổi:**
1. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Chốt trình tự tạo phân công `hoidong-thamdinh-monhoc-thanhvien` trước, chỉ sau khi thành công mới tạo `hoidong-thamdinh-thanhvien`.
2. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Chốt frontend không kiểm tra trùng thành viên chung; server chịu trách nhiệm xử lý trùng.
3. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Chốt không rollback phân công theo môn khi bước thêm thành viên chung lỗi; bỏ thành viên khỏi môn không xóa thành viên chung.
4. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Bổ sung API, kịch bản lỗi và tiêu chí hoàn thành tương ứng.

**Kết quả:** Kế hoạch đã cập nhật; phần đồng bộ mã nguồn được triển khai ở lần 6; chưa build/test/run.

### 2026-08-05 — Lần 6: Triển khai đồng bộ thành viên chung

**Mục đích:** Sau khi tạo thành công phân công thành viên mới theo môn, thêm chính thành viên đó vào danh sách thành viên chung của hội đồng.

**Các thay đổi:**
1. **`src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.ts`** — Khôi phục dependency `HoidongThamdinhThanhvienService` cho luồng ghi dữ liệu.
2. **`src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.ts`** — Nối tuần tự bằng `mergeMap`: POST `hoidong-thamdinh-monhoc-thanhvien` thành công mới POST `{ hoidong_thamdinh_id, user_id }` vào `hoidong-thamdinh-thanhvien`.
3. **`src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-monhoc/hd-thamdinh-monhoc.component.ts`** — Không thêm kiểm tra trùng frontend; giữ update/xóa phân công hiện có và không xóa thành viên chung.
4. **`plans/quan-ly-mon-hoc-hoi-dong-tham-dinh.md`** — Đánh dấu phần đồng bộ hoàn thành.

**Kết quả:** Đã triển khai và rà soát tĩnh; chưa build/test/run theo quy ước dự án.
