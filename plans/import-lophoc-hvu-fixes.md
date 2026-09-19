# Kế hoạch xử lý lỗi import lớp học HVU

## 1. Mục tiêu

Sửa 8 vấn đề đã phát hiện trong:

- `src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-lophoc/import-lophoc.component.ts`
- `src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-lophoc/import-lophoc.component.html`

Mục tiêu chính:

- Gắn đúng giảng viên/trợ giảng.
- Không tạo lớp thiếu môn học.
- Không treo dialog khi không có request hợp lệ.
- Lưu đúng năm học theo nguồn dữ liệu.
- Khởi tạo dữ liệu phụ thuộc an toàn.
- Báo kết quả import đúng trạng thái thực tế.
- Tính đúng tiến độ và số bản ghi hoàn thành.
- Đồng bộ đúng thống kê, bộ lọc và phân trang.

## 2. Nguyên tắc triển khai

- Ưu tiên thay đổi tối thiểu trong component hiện tại.
- Không sửa service/API nếu contract hiện tại đủ dùng.
- Không thay đổi parser Excel hoặc quy tắc chuẩn hóa hiện tại nếu chưa được xác nhận.
- Không dùng `subscribe()` trong vòng lặp; giữ một outer subscription cho mỗi tiến trình import.
- Không biến lỗi thành kết quả thành công ở lớp tổng hợp.
- Luôn đóng loading/progress bằng `finalize` hoặc nhánh kết thúc rõ ràng.
- Không build/test/run cho tới khi có yêu cầu xác minh riêng.

## 3. Phạm vi file

### Dự kiến sửa

1. `src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-lophoc/import-lophoc.component.ts`
2. `src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-lophoc/import-lophoc.component.html`

### Chỉ đối chiếu, không dự kiến sửa

1. `src/app/modules/shared/models/classes.ts`
2. `src/app/modules/shared/services/classes.service.ts`
3. `src/app/modules/shared/services/elearning-khoa-hoc.service.ts`
4. `src/app/modules/shared/services/hvu-api-danhsachlophocphan.service.ts`

## 4. Kế hoạch theo vấn đề

### 4.1. Sửa sai ID giảng viên và mất thông tin trợ giảng

Trạng thái: Đã xử lý ngày 2026-08-24.

Vị trí hiện tại: khối map `_teacher.data` trong `startGetClassFromDkSys()`.

Thay đổi:

1. Khi tìm thấy người dùng, thêm `_teacher.data[index_user].id` vào `manager_ids`; không thêm `index_user`.
2. Thay `tg_info.concat(...)` bằng thao tác thực sự cập nhật mảng, dự kiến `tg_info.push(...)`.
3. Chuẩn hóa việc ghép `manager_info`:
   - Giảng viên chính có dấu `*`.
   - Các giảng viên/trợ giảng còn lại được nối theo định dạng đang dùng trong hệ thống.
4. Bảo vệ `ma_gv` và `ma_tg` trước khi gọi `split()`.
5. Loại ID trùng nếu cùng tài khoản xuất hiện ở cả hai trường.

Tiêu chí đạt:

- `manager_ids` chỉ chứa `User.id` hợp lệ.
- Không xuất hiện chỉ số mảng trong payload lớp.
- Trợ giảng tìm thấy được ghi vào `manager_info`.
- Response thiếu `ma_gv` hoặc `ma_tg` không gây exception.

### 4.2. Không để dialog treo khi không có lớp hợp lệ

Trạng thái: Đã xử lý ngày 2026-08-24.

Vị trí hiện tại: `openImportClass()` và `loopAddLopHoc()`.

Thay đổi:

1. Không khởi tạo danh sách nhóm bằng `[[]]`.
2. Chỉ tạo nhóm khi có request lớp hợp lệ.
3. Tính `totalQualified` từ số request thực tế.
4. Kiểm tra `totalQualified === 0` trước khi mở progress dialog.
5. Khi không có lớp hợp lệ:
   - Không gọi `loopAddLopHoc()`.
   - Đóng modal chọn năm.
   - Giữ `displayModal = false`.
   - Hiển thị cảnh báo rõ ràng.
6. Bổ sung guard trong `loopAddLopHoc()` để không nhận nhóm rỗng.

Tiêu chí đạt:

- Danh sách chỉ có lớp thiếu ký hiệu/mã môn không mở dialog tiến độ.
- Không gọi `forkJoin([])`.
- Người dùng luôn thao tác lại được sau cảnh báo.

### 4.3. Chặn tạo lớp khi không tìm thấy môn học

Trạng thái: Đã xử lý ngày 2026-08-24.

Vị trí hiện tại: `requestLopHoc()`.

Thay đổi:

1. Sau truy vấn môn học, kiểm tra `_course[0]`.
2. Nếu không có môn học:
   - Gán `f.status_import = -1`.
   - Ghi lý do lỗi vào trường hiển thị mới hoặc cấu trúc kết quả nội bộ.
   - Kết thúc observable lớp bằng kết quả thất bại có cấu trúc.
   - Không gọi API tìm/tạo/cập nhật lớp.
3. Chỉ tạo `data_class` hoàn chỉnh và gọi `ClassesService` khi có `course_id`, `category_id`, `nganh_bomon_id` hợp lệ theo dữ liệu môn học.

Tiêu chí đạt:

- Không phát sinh lớp mới với `course_id = 0` do không tìm thấy mã môn.
- Dòng lỗi hiển thị trạng thái thất bại.
- Lớp khác vẫn tiếp tục import.

### 4.4. Ghi đúng năm học theo nguồn dữ liệu

Trạng thái: Đã xử lý ngày 2026-08-24.

Vị trí hiện tại: `startGetClassFromDkSys()`, `startImportLophoc()`, `openImportClass()`.

Thiết kế đã triển khai:

1. Phân biệt nguồn danh sách hiện tại:
   - `excel`
   - `hvu-api`
2. Với Excel:
   - Giữ popup chọn năm học hiện tại.
   - Ghi `namhoc` bằng năm người dùng xác nhận.
3. Với HVU API:
   - Chuẩn hóa năm bắt đầu `2025` thành `2025_2026` ngay khi tạo danh sách.
   - Giữ bước xác nhận năm học; hiển thị năm học trước và năm học hiện tại như luồng Excel.
   - Payload dùng năm người dùng xác nhận theo định dạng database.
4. Trước import, kiểm tra toàn bộ dòng HVU cùng năm học đã tải; nếu không, chặn và báo dữ liệu không nhất quán.
5. Không sửa parser Excel trong hạng mục này.

Tiêu chí đạt:

- Import dữ liệu lịch sử không bị gán sang năm học hiện tại.
- Năm học trong payload phù hợp đúng request HVU đã tải.
- Luồng Excel vẫn giữ hành vi chọn năm học.

### 4.5. Làm an toàn quá trình khởi tạo role, đơn vị, giảng viên

Trạng thái: Đã xử lý ngày 2026-08-24.

Vị trí hiện tại: `getRolesPromise()` và `initLoad()`.

Thay đổi:

1. Thêm trạng thái `isInitializing` hoặc `isReferenceDataReady`.
2. Không tắt global processing trong `getRolesPromise()`; chỉ kết thúc sau toàn bộ `forkJoin` của `initLoad()`.
3. Khi tải role lỗi:
   - Không trả `null` rồi gọi `Object.keys(null)`.
   - Trả cấu trúc an toàn hoặc dừng `initLoad()` với thông báo lỗi.
4. Khởi tạo `list_donvi = []`, `list_teacher = []`.
5. Trong nhánh lỗi `forkJoin`:
   - Tắt processing.
   - Đặt trạng thái khởi tạo thất bại.
   - Hiển thị toast lỗi.
6. Khóa thao tác chọn Excel/tải HVU/bắt đầu import tới khi dữ liệu tham chiếu sẵn sàng.
7. Các hàm map giảng viên vẫn dùng fallback mảng rỗng để tránh exception.

Tiêu chí đạt:

- Lỗi role không gây `Object.keys(null)`.
- Chọn file sớm không gây `undefined.findIndex`.
- Loading luôn kết thúc ở cả nhánh thành công và lỗi.
- Người dùng nhận được thông báo lỗi thay vì lỗi bị nuốt.

### 4.6. Báo kết quả import theo trạng thái thật

Trạng thái: Đã xử lý ngày 2026-08-24.

Vị trí hiện tại: callback hoàn tất trong `openImportClass()` và các `catchError()` của `requestLopHoc()`.

Thay đổi:

1. Mỗi request lớp trả kết quả có cấu trúc, tối thiểu:
   - `status: 'success' | 'failed' | 'skipped'`
   - tham chiếu dòng lớp
   - lý do lỗi nếu có
2. `catchError` cấp lớp vẫn cô lập lỗi, nhưng trả kết quả `failed`; không trả `null` mơ hồ.
3. Sau khi outer stream hoàn tất, tổng hợp:
   - Thành công.
   - Thất bại.
   - Chưa đủ điều kiện/bị bỏ qua.
4. Chỉ gọi `toastSuccess` khi mọi request hợp lệ thành công và không có dòng thất bại.
5. Nếu có thất bại hoặc bỏ qua, dùng thông báo hoàn tất kèm cảnh báo và số liệu.
6. Đóng progress dialog bằng `finalize`, không phụ thuộc riêng callback `next`.

Tiêu chí đạt:

- Một lớp lỗi không tạo toast “thành công” cho toàn bộ tiến trình.
- Số liệu thông báo khớp `status_import` trên bảng.
- Lỗi một lớp không dừng lớp kế tiếp.

### 4.7. Tính đúng tiến độ và số lượng hoàn thành

Trạng thái: Đã xử lý ngày 2026-08-24.

Vị trí hiện tại: `returnValueWaiting()` và `loopAddLopHoc()`.

Thay đổi:

1. Thêm `totalImportItems` bằng tổng số request hợp lệ.
2. Không dùng `list_lophoc.length` làm mẫu số khi có dòng bị bỏ qua.
3. Không tăng progress trước khi nhóm request kết thúc.
4. Sau mỗi `forkJoin(group_obs[key])`:
   - Cộng `group_obs[key].length` vào `import_return`.
   - Tính `progressValue = import_return / totalImportItems * 100`.
5. Giới hạn progress trong khoảng `0..100`.
6. Khi hoàn tất, đặt chính xác `progressValue = 100`.
7. Reset `progressValue`, `import_return`, `totalImportItems` trước mỗi lượt mới.

Tiêu chí đạt:

- 5 lớp luôn hiển thị tối đa `5/5`, không thành `9/5`.
- Progress chỉ tăng sau khi request thực sự hoàn tất.
- Nhóm cuối đưa progress về đúng 100%.

### 4.8. Đồng bộ thống kê, bộ lọc và phân trang

Trạng thái: Đã xử lý ngày 2026-08-24.

Vị trí hiện tại: `getStatusObject()`, phần bảng và `p-paginator` trong template.

Thay đổi:

1. Gọi `getStatusObject()` sau mọi lần gán hoặc reset `list_lophoc`, gồm cả tải từ HVU API.
2. Tạo một nguồn dữ liệu đã lọc dùng chung cho:
   - `p-table`.
   - `p-paginator.totalRecords`.
3. Tổng paginator phải là số dòng sau tìm kiếm và lọc trạng thái, không phải tổng danh sách gốc.
4. Reset `pageImport = 0` khi:
   - Nạp danh sách mới.
   - Đổi từ khóa tìm kiếm.
   - Đổi bộ lọc trạng thái.
5. Nếu sau cập nhật trạng thái trang hiện tại vượt số trang, đưa về trang hợp lệ đầu/cuối theo quy ước hiện có.
6. Giữ số “Tổng” và ba nhóm trạng thái dựa trên toàn bộ danh sách; chỉ paginator dùng số dòng đã lọc.

Tiêu chí đạt:

- Tải HVU xong hiển thị đúng số “Chưa import”.
- Tìm kiếm/lọc làm số trang thay đổi đúng.
- Không xuất hiện trang rỗng do giữ page index cũ.
- STT trên bảng tiếp tục đúng theo trang.

## 5. Thứ tự triển khai

1. Bổ sung type trạng thái nguồn và kết quả import nội bộ.
2. Sửa khởi tạo dữ liệu tham chiếu, khóa thao tác khi chưa sẵn sàng.
3. Sửa map giảng viên/trợ giảng từ HVU.
4. Tách cách xác định năm học theo nguồn sau khi chốt định dạng.
5. Sửa điều kiện môn học bắt buộc trong `requestLopHoc()`.
6. Sửa tạo nhóm request, trường hợp không có lớp hợp lệ.
7. Sửa kết quả có cấu trúc, thông báo tổng hợp, đóng dialog.
8. Sửa bộ đếm tiến độ.
9. Sửa thống kê, nguồn dữ liệu lọc và paginator.
10. Review tĩnh toàn bộ luồng Excel và HVU API.
11. Cập nhật mục trạng thái triển khai trong plan này.
12. Chỉ build/test/run khi người dùng yêu cầu riêng.

## 6. Kịch bản kiểm tra chấp nhận

### Khởi tạo

- Role API lỗi: không crash, loading đóng, thao tác import bị khóa, có thông báo.
- Teacher API lỗi: không crash, không cho import dữ liệu thiếu map giảng viên.
- Người dùng bấm chọn file khi đang khởi tạo: nút bị khóa hoặc handler từ chối an toàn.

### Map giảng viên

- Một giảng viên: payload chứa đúng `User.id`, tên có dấu `*`.
- Một giảng viên và một trợ giảng: cả hai ID đúng; cả hai tên xuất hiện.
- Trùng tài khoản ở `ma_gv` và `ma_tg`: không lặp ID.
- `ma_gv`/`ma_tg` null: không exception.

### Điều kiện import

- Không tìm thấy môn học: không gọi create/update lớp; dòng thất bại.
- Không có dòng đủ điều kiện: không mở progress dialog; có cảnh báo.
- Có 1, 2, 3, 5 lớp hợp lệ: nhóm chạy tuần tự đúng giới hạn hiện tại.
- Một lớp lỗi: lớp sau vẫn chạy.

### Năm học

- Excel: năm học lấy từ popup xác nhận.
- HVU API lịch sử: payload giữ đúng năm học của request, không dùng năm hiện tại.
- Dữ liệu HVU không nhất quán năm học: chặn import.

### Kết quả và tiến độ

- Toàn bộ thành công: toast thành công.
- Có ít nhất một lỗi: thông báo cảnh báo, không toast thành công sai.
- 5 lớp chia nhiều nhóm: tiến độ lần lượt tăng theo số lớp hoàn thành, kết thúc `5/5`, 100%.
- Request lỗi: dialog vẫn đóng.

### Bộ lọc và phân trang

- Tải HVU xong: thống kê “Chưa import” đúng.
- Tìm kiếm giảm danh sách: paginator dùng số dòng đã lọc.
- Đổi trạng thái lọc từ trang sau: tự về trang đầu, không hiện bảng rỗng sai.
- Import xong: thống kê thành công/thất bại cập nhật đúng.

## 7. Rủi ro và giới hạn

1. Định dạng `Classes.namhoc` chưa được thể hiện thống nhất giữa dữ liệu Excel, HVU và model; cần chốt trước khi sửa vấn đề số 4.
2. `manager_info` là chuỗi quy ước; cần giữ đúng định dạng backend/UI đang đọc.
3. Dùng slug để xác định lớp trùng có thể cập nhật nhầm nếu hai lớp khác nhau có cùng slug; không mở rộng thay đổi này trong đợt sửa 8 vấn đề nếu chưa được yêu cầu.
4. Frontend không có transaction cho chuỗi request; đợt sửa này chỉ cải thiện trạng thái và cô lập lỗi.
5. Kết quả review/triển khai ban đầu chỉ là kiểm tra tĩnh; hành vi runtime cần bước xác minh riêng.

## 8. Quyết định đã chốt

1. `Classes.namhoc` lưu theo định dạng `2025_2026`.
2. Khi teacher API lỗi, chặn toàn bộ import lớp; không import với `manager_ids = null`.
3. Lớp đã tồn tại nhưng người dùng không chọn “Ghi đè” được trả trạng thái `skipped` (Bỏ qua), không tính là thành công.
4. Hiển thị lý do lỗi trực tiếp trên từng dòng lớp, đồng thời giữ thông báo tổng hợp.
5. Giữ bước chọn năm học khi import từ HVU API. Dữ liệu HVU trả năm dạng `2025`, không phù hợp định dạng `2025_2026` đang lưu trong database; popup hiển thị năm học trước và năm học hiện tại, payload dùng năm người dùng chọn theo đúng định dạng database.

## 9. Trạng thái

- Đã lập kế hoạch ngày 2026-08-24.
- Đã xử lý mục 4.1: dùng đúng `User.id`, giữ tên trợ giảng, chống dữ liệu giảng viên rỗng, loại trùng tài khoản.
- Đã xử lý mục 4.2: chỉ tạo nhóm request hợp lệ, chặn danh sách rỗng trước dialog, thêm guard tránh `forkJoin([])`.
- Đã xử lý mục 4.3: chặn luồng tìm/tạo/cập nhật lớp khi không có môn học; đánh dấu dòng thất bại và trả kết quả lỗi có cấu trúc.
- Đã xử lý mục 4.5: khởi tạo mảng an toàn, quản lý trạng thái dữ liệu tham chiếu, xử lý đầy đủ lỗi role/đơn vị/giảng viên, khóa thao tác import khi dữ liệu chưa sẵn sàng.
- Đã xử lý mục 4.6: trả kết quả `success`/`failed`/`skipped` theo từng lớp, tổng hợp thông báo đúng thực tế, hiển thị lý do từng dòng, đóng dialog bằng `finalize`.
- Đã xử lý mục 4.7: dùng tổng request hợp lệ làm mẫu số, tăng số hoàn thành sau từng nhóm, giới hạn tiến độ trong `0..100`, kết thúc chính xác ở 100%.
- Đã xử lý mục 4.8: đồng bộ thống kê sau mọi nguồn dữ liệu, tách trạng thái bỏ qua, dùng chung danh sách đã lọc cho bảng và paginator, reset/giới hạn trang khi điều kiện lọc thay đổi.
- Đã xử lý mục 4.4: phân biệt nguồn Excel/HVU, chuẩn hóa năm HVU sang `2025_2026`, hiển thị hai năm học gần nhất để xác nhận, chặn dữ liệu HVU không nhất quán trước import.
- Đã sửa nguồn `khoa` của lớp HVU: lấy trực tiếp `f.khoa` từ API, chuẩn hóa `K23` thành `23`; không còn suy ra từ niên khóa.
- Chưa build/test/run; chỉ kiểm tra tĩnh và xem diff.
- Đã xử lý đủ mục 4.1–4.8; các quyết định nghiệp vụ liên quan đã được áp dụng.
