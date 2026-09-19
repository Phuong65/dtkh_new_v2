# Kế hoạch chức năng quản lý nhóm cho lớp học `class-group`

## Mục tiêu

Xây dựng chức năng phân nhóm sinh viên trong một lớp học phần, cho phép tạo nhiều nhóm tự động, chỉnh sửa nhóm, xóa nhóm, gán sinh viên vào nhóm và phân nhóm ngẫu nhiên cho lớp đang chọn.

## Phạm vi

- Component chính: `src/app/modules/admin/features/lop-hoc-phan/class-details/class-group/`.
- Dữ liệu lớp đầu vào lấy từ `@Input() classSelected: Classes`.
- Service liên quan:
  - `ClassGroupService`: tạo/sửa/xóa/lấy nhóm theo lớp.
  - `ClassStudentService`: lấy danh sách sinh viên trong lớp.
  - `ClassGroupMemberService`: lưu thành viên của từng nhóm.
- Chỉ tập trung vào phân nhóm sinh viên trong lớp học phần đang chọn.
- Không mở rộng sang chấm điểm, bài tập, nội dung giảng dạy, báo cáo hoặc phân quyền theo vai trò giảng viên/quản trị viên.

## Hiện trạng cần lưu ý

- `class-group.component.ts` hiện chỉ có skeleton component và `ngOnInit()` đang throw error.
- `class-group.component.html` đang trống.
- `ClassGroupMember` đang được khai báo trong service, nên nên tách sang model riêng trước hoặc trong quá trình triển khai để tránh coupling model-service.
- Các thao tác xóa nhóm/xóa toàn bộ nhóm cần kiểm tra quan hệ với `class-group-member` để tránh để lại thành viên mồ côi nếu backend không cascade.

## Luồng chức năng chính

### 1. Tải dữ liệu ban đầu

- Khi `classSelected` hợp lệ, tải:
  - Danh sách nhóm theo `class_id`.
  - Danh sách sinh viên trong lớp.
  - Danh sách `class-group-member` theo `class_id`.
- Gắn membership vào từng nhóm ở frontend dựa trên `class_group_id` để số lượng sinh viên và danh sách sinh viên trong nhóm hiển thị đúng, không phụ thuộc backend có trả `members` lồng trong API nhóm hay không.
- Tính sẵn `memberStudents`, `studentGroupName`, `selectedStudents` và `selectedStudentMap` trong component để template chỉ bind biến/property, không gọi hàm tính toán trực tiếp trong HTML.
- Nếu `classSelected` chưa có hoặc không có `id`, hiển thị trạng thái rỗng thay vì gọi API.

### 2. Tạo nhiều nhóm tự động

- Người dùng nhập số lượng nhóm cần tạo.
- Validate số lượng nhóm > 0.
- Nếu lớp đã có nhóm, yêu cầu xác nhận trước khi xóa nhóm cũ và tạo lại.
- Thao tác thực hiện tuần tự:
  1. Xóa nhóm cũ theo `class_id`.
  2. Xóa hoặc đảm bảo cleanup thành viên nhóm cũ.
  3. Tạo các nhóm `Nhóm 1`, `Nhóm 2`, ... theo số lượng đã nhập.
- Có progress UI để tránh người dùng thao tác lặp trong lúc đang xử lý.

### 3. Sửa nhóm

- Cho phép sửa tên nhóm và thứ tự.
- Validate giống tạo mới.
- Khi kiểm tra trùng tên/slug, loại trừ chính nhóm đang sửa.
- Gửi `ClassGroupService.updateClassGroup(id, data)`.

### 4. Xóa nhóm

- Có confirm trước khi xóa.
- Trước khi xóa nhóm cần xử lý thành viên:
  - Ưu tiên gọi `ClassGroupMemberService.deleteClassGroupMemberByCol(groupId, 'class_group_id')`.
  - Sau đó gọi `ClassGroupService.deleteClassGroup(groupId)`.
- Reload danh sách nhóm sau khi xóa thành công.

### 5. Gán sinh viên vào nhóm

- Khi chọn một nhóm, mở modal/drawer danh sách sinh viên của lớp.
- Hiển thị checkbox cho từng sinh viên, checked nếu sinh viên đang thuộc nhóm đó.
- Khi lưu:
  1. Xóa thành viên cũ của nhóm bằng `class_group_id`.
  2. Xóa membership cũ của các sinh viên được chọn trong cùng lớp nếu các sinh viên đó đang thuộc nhóm khác.
  3. Tạo lại các bản ghi `ClassGroupMember` cho sinh viên được chọn, dùng `student_id = ClassStudent.student_id`.
- Không cho lưu nếu chưa chọn nhóm hoặc danh sách sinh viên chưa tải xong.

### 6. Phân nhóm ngẫu nhiên

- Chỉ cho chạy khi lớp đã có ít nhất một nhóm.
- Confirm trước khi thực hiện vì thao tác sẽ thay đổi toàn bộ phân nhóm.
- Lấy toàn bộ sinh viên trong lớp.
- Xóa toàn bộ thành viên nhóm hiện tại của lớp hoặc từng nhóm.
- Chia sinh viên vào các nhóm theo vòng tròn hoặc random cân bằng để số lượng mỗi nhóm chênh lệch tối đa 1.
- Lưu thành viên nhóm bằng `ClassGroupMemberService.addClassGroupMember()`.

## UI đề xuất

- Header: tên chức năng và thông tin lớp hiện tại.
- Khu vực thao tác:
  - Nút `Tạo nhiều nhóm`.
  - Nút `Phân nhóm ngẫu nhiên`.
  - Nút `Tải lại`.
- Bảng danh sách nhóm:
  - STT/thứ tự.
  - Tên nhóm.
  - Số sinh viên.
  - Danh sách sinh viên rút gọn hoặc nút xem chi tiết.
  - Hành động: sửa, gán sinh viên, xóa.
- Modal/drawer:
  - Form sửa nhóm.
  - Form tạo nhiều nhóm.
  - Danh sách checkbox sinh viên để gán nhóm; trạng thái checked và tên nhóm hiện tại lấy từ biến/map đã tính sẵn trong component thay vì gọi hàm trong template.
  - Khi chọn nhóm để gán sinh viên, hiển thị vùng tóm tắt sinh viên hiện đang thuộc nhóm ở đầu dialog.
- Progress dialog cho thao tác nhiều request.
- Layout ngoài cùng của component có padding để tách khỏi mép container cha.
- CSS của component không khai báo `font-family` riêng; kế thừa font từ CSS tổng/toàn cục của ứng dụng.
- Button trong component dùng `line-height: 1` để giảm chiều cao hiển thị.

## Ràng buộc dữ liệu

- `ClassGroup` cần tối thiểu: `class_id`, `name`, `ordering`.
- `ClassGroupMember` cần tối thiểu: `class_id`, `class_group_id`, `student_id`.
- `student_id` trong `ClassGroupMember` là `ClassStudent.student_id`.
- Mỗi sinh viên chỉ thuộc một nhóm trong cùng một lớp; khi gán vào nhóm mới phải xóa membership cũ của sinh viên trong lớp đó trước hoặc đảm bảo thao tác lưu thay thế toàn bộ membership liên quan.
- Các thao tác batch cần chạy tuần tự hoặc dùng `forkJoin` có kiểm soát lỗi để tránh trạng thái lưu dở.

## Thứ tự triển khai

1. Hoàn thiện model/type:
   - Tách `ClassGroupMember` sang model riêng nếu cần.
   - Đảm bảo `ClassGroup.members` import từ model, không import từ service.
2. Hoàn thiện component state:
   - loading flags, selected group, modal state, form state, progress state.
3. Implement tải dữ liệu nhóm và sinh viên theo `classSelected.id`.
4. Implement sửa/xóa nhóm.
5. Implement tạo nhiều nhóm.
6. Implement gán sinh viên vào nhóm.
7. Implement phân nhóm ngẫu nhiên cân bằng.
8. Hoàn thiện HTML/CSS và trạng thái rỗng/loading/error.
9. Frontend chủ động xóa `class-group-member` trước khi xóa nhóm hoặc tạo lại nhóm để tránh orphan membership.

## Kiểm thử cần thực hiện sau khi code

- Tải màn hình khi `classSelected` hợp lệ.
- Tải màn hình khi lớp chưa có nhóm.
- Không hiển thị chức năng tạo từng nhóm thủ công.
- Không cho tạo nhóm trùng tên trong cùng lớp.
- Sửa tên/thứ tự nhóm.
- Xóa nhóm có thành viên.
- Tạo nhiều nhóm khi lớp chưa có nhóm.
- Tạo nhiều nhóm khi lớp đã có nhóm và xác nhận xóa cũ.
- Gán một hoặc nhiều sinh viên vào nhóm.
- Bỏ toàn bộ sinh viên khỏi một nhóm.
- Phân nhóm ngẫu nhiên với số sinh viên chia hết và không chia hết cho số nhóm.
- Kiểm tra reload sau mỗi thao tác không hiển thị dữ liệu cũ.

## Quyết định kỹ thuật

- Tạo nhiều nhóm là cách tạo nhóm duy nhất từ UI; không triển khai form/nút tạo từng nhóm thủ công.
- Frontend phải chủ động xóa `class-group-member` trước khi xóa `class-group`, không phụ thuộc vào cascade từ backend.
- Template chỉ sử dụng property/map/pipe để binding giá trị hiển thị, không gọi hàm tính trạng thái (state computation) trong `{{ }}` hay `[property]` binding.
  - Các trạng thái như form control validity dùng `groupForm.controls['name'].invalid` thay vì `groupForm.get('name')?.invalid`.
  - Trạng thái checked của checkbox dùng map `selectedStudentMap[student.student_id]` đã tính sẵn trong component.
  - Trạng thái nhóm hiện tại của sinh viên dùng map `studentGroupName[student.student_id]` đã tính sẵn trong component.
  - `trackBy` chỉ dùng function reference (không phải function call tính giá trị).
- Dead code (method không được template sử dụng) được xóa khỏi component, ví dụ `isStudentSelected()` đã được gỡ bỏ.

## Review tĩnh 2026-05-18

### Đã xử lý

1. **Cho phép bỏ toàn bộ sinh viên khỏi một nhóm từ UI**
   - Vị trí: `class-group.component.html` dialog gán sinh viên không còn disable nút lưu theo `!selectedStudents.length`.
   - Kết quả: người dùng có thể lưu trạng thái nhóm rỗng để bỏ toàn bộ sinh viên khỏi nhóm.

2. **Luồng lưu sinh viên cho một nhóm không còn thay thế toàn bộ membership của lớp**
   - Vị trí: `saveStudentsForGroup()` dùng `buildSaveGroupMemberRequests()`.
   - Kết quả: khi lưu một nhóm, frontend xóa membership của nhóm đang sửa theo `class_group_id`, xóa membership cũ của sinh viên được chọn ở nhóm khác, rồi tạo membership mới cho nhóm đang chọn. `replaceClassMembers()` chỉ còn dùng cho thao tác toàn lớp như phân nhóm ngẫu nhiên.

### Kế hoạch chỉnh sửa tiếp theo

1. Review tĩnh lại riêng luồng gán sinh viên sau khi người dùng yêu cầu.
2. Chỉ build/test khi có yêu cầu riêng.

## Lịch sử chỉnh sửa (Changelog)

### 2026-05-18 — Lần 6: Cho phép bỏ toàn bộ sinh viên khỏi nhóm
**Mục đích:** Cho phép lưu nhóm không có sinh viên và giảm phạm vi xóa membership khi chỉ sửa một nhóm.

**Các thay đổi:**
1. **`class-group.component.html`** — Nút `Lưu phân nhóm` không còn bị disable khi danh sách sinh viên đang chọn rỗng.
2. **`class-group.component.ts`** — `saveStudentsForGroup()` dùng luồng request riêng cho một nhóm qua `buildSaveGroupMemberRequests()`, không gọi `replaceClassMembers()` toàn lớp.
3. **`plans/class-group.md`** — Cập nhật review tĩnh 2026-05-18 sang trạng thái đã xử lý.

**Kết quả:** Có thể bỏ toàn bộ sinh viên khỏi nhóm; thao tác lưu một nhóm không còn xóa/recreate membership toàn lớp.

### 2026-05-14 — Lần 5: Thực thi bỏ tạo từng nhóm thủ công
**Mục đích:** Đồng bộ code `class-group` với kế hoạch mới: không còn tạo từng nhóm thủ công từ UI và giữ font kế thừa từ CSS tổng.

**Các thay đổi:**
1. **`class-group.component.html`** — Xóa nút `Tạo nhóm` khỏi header, đổi empty hint sang chỉ hướng dẫn `Tạo nhiều nhóm`, đổi comment dialog thành `Edit Group Dialog`, đổi nút submit trong bulk dialog thành `Tạo nhiều nhóm`.
2. **`class-group.component.ts`** — Xóa method `openAddGroup()`, bỏ state `isUpdated`, chuyển `saveGroup()` thành luồng chỉ cập nhật nhóm đang chọn bằng `updateClassGroup()`.
3. **`class-group.component.css`** — Kiểm tra không có khai báo `font-family`, component tiếp tục kế thừa font từ CSS tổng/toàn cục.

**Kết quả:** UI không còn đường tạo từng nhóm thủ công; tạo nhóm chỉ đi qua chức năng tạo nhiều nhóm tự động.

### 2026-05-14 — Lần 4: Cập nhật phạm vi tạo nhóm và font
**Mục đích:** Bỏ chức năng tạo từng nhóm thủ công khỏi kế hoạch và thống nhất font theo CSS tổng của ứng dụng.

**Các thay đổi:**
1. **Phạm vi chức năng** — Loại bỏ luồng, nút và form tạo từng nhóm thủ công; chỉ giữ tạo nhiều nhóm tự động là cách tạo nhóm từ UI.
2. **UI/CSS** — Bổ sung yêu cầu component không khai báo `font-family` riêng, kế thừa font từ CSS tổng/toàn cục.
3. **Kiểm thử** — Thay case tạo một nhóm mới bằng case xác nhận không hiển thị chức năng tạo từng nhóm thủ công.

**Kết quả:** Kế hoạch hiện chỉ còn tạo nhiều nhóm tự động, sửa/xóa nhóm, gán sinh viên và phân nhóm ngẫu nhiên; font được định hướng dùng theo CSS tổng.

### 2026-05-12 — Lần 1: Kiểm tra và tối ưu template binding
**Mục đích:** Loại bỏ function call tính trạng thái trong template theo đúng yêu cầu kế hoạch.

**Các thay đổi:**
1. **`class-group.component.ts`** — Xóa method `isStudentSelected()` (dead code, không được template sử dụng).
2. **`class-group.component.html`** — Thay 2 chỗ `groupForm.get('name')?.invalid/touched` và `groupForm.get('ordering')?.invalid/touched` bằng `groupForm.controls['name'].invalid/touched` và `groupForm.controls['ordering'].invalid/touched`.
3. **`plans/class-group.md`** — Bổ sung quyết định kỹ thuật về template binding và changelog này.

**Kết quả:** Template hoàn toàn không còn function call tính trạng thái, chỉ dùng property/map/pipe/trackBy reference.

### 2026-05-12 — Lần 2: Cải thiện UI/UX toàn diện
**Mục đích:** Hiện đại hóa giao diện, cải thiện trải nghiệm người dùng, thêm chức năng tìm kiếm sinh viên.

**Các thay đổi:**
1. **`class-group.component.css`** — Thiết kế lại hoàn toàn: CSS Variables, gradient header với accent bar, summary cards có icon + hover animation, table striped + hover highlight, student chips có avatar icon, form controls có focus ring, scrollbar tùy chỉnh, student search input, responsive breakpoints.
2. **`class-group.component.html`** — Thêm Material Icons cho buttons, summary layout với icon emoji, empty states có icon + title + hint, bảng có badge tròn cho STT và số SV, action buttons có tooltip, student search input, filter preview count, active row highlight, group state badge, progress dialog cải thiện.
3. **`class-group.component.ts`** — Thêm `studentSearchTerm`, `filteredStudents`, `onStudentSearchChange()`, `filterStudents()` (tìm kiếm theo tên + mã SV dùng slugVietnamese). Xóa `trackByGroupId` (dead code, không được template sử dụng).

**Kết quả:** Giao diện hiện đại, dễ nhìn, có search filter cho sinh viên, tuân thủ đúng rule template binding.

### 2026-05-12 — Lần 3: Thay thế cột danh sách sinh viên bằng dialog xem thành viên
**Mục đích:** Không hiển thị cột danh sách sinh viên trong bảng, thay vào đó có nút click để hiển thị danh sách thành viên qua dialog riêng. Fix scroll tổng cho component.

**Các thay đổi:**
1. **`class-group.component.html`** — Xoá cột "Danh sách sinh viên" khỏi p-table header và body. Cột "Số sinh viên" chuyển từ `<span>` tĩnh sang button (`.student-count-btn`) gọi `openMemberList(group)`. Thêm dialog `Member List Dialog` mới hiển thị danh sách thành viên theo nhóm: avatar chữ cái đầu (gradient tím), tên + mã SV, badge tổng số lượng, empty state khi chưa có SV.
2. **`class-group.component.ts`** — Thêm `displayMemberDialog = false`. Thêm method `openMemberList(classGroup)` gán `selectedClassGroup` và mở dialog. Cập nhật `resetState()` reset thêm `displayMemberDialog`.
3. **`class-group.component.css`** — Thêm style cho `.student-count-btn` (button trong suốt, hover scale(1.15), badge đổi màu primary + shadow). Thêm style cho `.member-list`, `.member-row`, `.member-avatar`, `.member-info`, `.member-count-badge`. Thêm `height: 100%; overflow-y: auto` vào `.class-group-wrapper` để component tự scroll khi nội dung vượt quá chiều cao.
4. **`manage-class-details.component.css`** — Không thay đổi (giữ nguyên `overflow: hidden` để không ảnh hưởng các chức năng khác).

**Kết quả:** Bảng gọn gàng hơn, không hiển thị chip sinh viên trực tiếp. Người dùng click vào số lượng SV để mở dialog xem danh sách thành viên. Component scroll độc lập không ảnh hưởng layout parent.
