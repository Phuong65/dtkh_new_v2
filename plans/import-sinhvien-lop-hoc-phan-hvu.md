# Kế hoạch sửa import sinh viên lớp học phần HVU

## 1. Phạm vi

Chức năng tại:

- `src/app/modules/admin/features/lop-hoc-phan/class-details/sinh-vien/sinhvien-hvu/sinhvien-hvu.component.ts`
- `src/app/modules/admin/features/lop-hoc-phan/class-details/sinh-vien/sinhvien-hvu/sinhvien-hvu.component.html`

Không thay đổi feature đồng bộ hàng loạt `dongbo-dulieu/import-hvu/import-sinhvien-lophoc`.

## 2. Mục tiêu

1. Ngăn mã sinh viên trùng trong file/HVU tạo nhiều request import.
2. Giữ đúng trạng thái `failed`; không đổi lỗi thành `done`.
3. Chặn import hồ sơ thiếu tài khoản nội bộ ở cả luồng Excel và HVU.
4. Kiểm tra response HVU, mã sinh viên null/rỗng, lỗi đọc file.
5. Không báo thành công khi không có sinh viên đủ điều kiện import.
6. So sánh số sinh viên import với số sinh viên hiện tại; cảnh báo khi khác nhau trước xác nhận import.
7. Sắp xếp danh sách import theo tên, tên đệm, họ; lưu `ordering` theo đúng thứ tự hiển thị.

## 3. Quy tắc nghiệp vụ

### 3.1. Chuẩn hóa và trùng mã

- Chuẩn hóa mã bằng `String(value).trim().toLowerCase()` sau khi kiểm tra null/rỗng.
- Dùng `Set<string>` để nhận diện mã đã gặp.
- Chỉ giữ một dòng cho mỗi mã trong một lần import.
- Ghi nhận số dòng trùng để hiển thị cảnh báo; không gửi request cho dòng trùng.

### 3.2. Sinh viên đủ điều kiện

Một dòng chỉ được import khi có đủ:

- Hồ sơ sinh viên nội bộ.
- `student_id` hợp lệ.
- `user_id` hợp lệ.
- Tài khoản người dùng tương ứng.

Thiếu một trong các dữ liệu trên: `status_import = 'no_data'`; không đưa vào batch import.

### 3.3. Thay thế toàn bộ danh sách

Import luôn hoạt động theo chế độ thay thế toàn bộ:

1. Chặn thao tác nếu nguồn có bất kỳ sinh viên `no_data` hoặc thiếu hồ sơ/tài khoản.
2. Hiển thị xác nhận phá hủy dữ liệu, nêu rõ số sinh viên hiện tại và số sinh viên mới.
3. Xóa toàn bộ `class-students` theo `class_id`.
4. Chỉ khi xóa thành công mới thêm toàn bộ danh sách nguồn hợp lệ.
5. Nếu xóa thất bại: dừng, không thêm dữ liệu mới.
6. Nếu thêm lỗi giữa quá trình: báo import một phần; frontend không có transaction để rollback.

Bỏ checkbox “Ghi đè dữ liệu sinh viên tồn tại trong lớp” vì không còn chế độ bổ sung/cập nhật.

### 3.4. Sắp xếp trước import

- Áp dụng cho cả dữ liệu Excel và HVU sau khi đối chiếu hồ sơ/tài khoản.
- Sắp tăng dần theo tên; nếu trùng tên thì theo tên đệm; tiếp theo theo họ; cuối cùng theo mã sinh viên.
- So sánh tên theo locale tiếng Việt, phân biệt dấu nhưng không phân biệt chữ hoa/thường.
- Chuẩn hóa khoảng trắng trong họ tên trước khi tách các thành phần.
- Sau sắp xếp, gán lại `ordering = index + 1`.
- Preview và dữ liệu gửi API dùng cùng danh sách, bảo đảm thứ tự lưu đúng thứ tự hiển thị.

## 4. Thông báo thay đổi số lượng

Sau khi đối chiếu file/HVU với danh sách lớp hiện tại, tính:

- `currentStudentCount`: số sinh viên hiện tại trong lớp.
- `sourceStudentCount`: số mã duy nhất hợp lệ từ file/HVU sau chuẩn hóa.
- `eligibleImportCount`: số sinh viên đủ hồ sơ và tài khoản.
- `existingStudentCount`: số sinh viên nguồn đã có trong lớp.
- `newStudentCount`: số sinh viên nguồn chưa có trong lớp.
- `invalidStudentCount`: số dòng thiếu hồ sơ/tài khoản.
- `duplicateStudentCount`: số dòng mã trùng bị loại.

Khi `eligibleImportCount !== currentStudentCount`, dialog xác nhận phải hiển thị cảnh báo nổi bật:

```text
Số sinh viên đủ điều kiện trong dữ liệu import khác danh sách hiện tại.
Hiện tại: {currentStudentCount} sinh viên.
Đủ điều kiện import: {eligibleImportCount} sinh viên.
Chênh lệch: {differenceText}.
Sinh viên hiện tại không có trong nguồn sẽ bị xóa khỏi lớp.
```

Trong đó:

- Chênh lệch dương: `Tăng X sinh viên trong nguồn so với hiện tại`.
- Chênh lệch âm: `Giảm X sinh viên trong nguồn so với hiện tại`.
- Chỉ cảnh báo; người dùng vẫn được xác nhận import.
- Nếu số lượng bằng nhau nhưng thành phần sinh viên khác, vẫn cảnh báo: `Số lượng không đổi nhưng danh sách có thay đổi`.

Để phát hiện thay đổi thành phần:

- Tạo tập mã hiện tại đã chuẩn hóa.
- Tạo tập mã nguồn đủ điều kiện.
- Tính mã chỉ có trong nguồn và mã chỉ có trong lớp hiện tại.
- Hiển thị số `sẽ thêm` và `không có trong nguồn`; mã không có trong nguồn sẽ bị xóa khi thay thế.

## 5. Thay đổi TypeScript

### 5.1. Trạng thái so sánh

Bổ sung các trường hoặc một object tổng hợp:

```ts
importComparison = {
    currentStudentCount: 0,
    sourceStudentCount: 0,
    eligibleImportCount: 0,
    existingStudentCount: 0,
    newStudentCount: 0,
    missingFromSourceCount: 0,
    invalidStudentCount: 0,
    duplicateStudentCount: 0,
    countChanged: false,
    membershipChanged: false
};
```

Reset object khi:

- Mở form import.
- Chọn file mới.
- Tải lại từ HVU.
- Đổi lớp/component nhận `classSelected` mới nếu lifecycle hiện tại hỗ trợ.

### 5.2. Parser file/HVU

- Thay `object_duplicate[key] = false` bằng `Set<string>`.
- Kiểm tra cấu trúc workbook, sheet đầu, mã sinh viên trước khi gọi `toString()`.
- Kiểm tra `Array.isArray(_sync_student)` trước `forEach()`.
- Loại mã null/rỗng.
- Ghi nhận số dòng trùng.
- Không thay đổi cấu trúc cột Excel ngoài các kiểm tra an toàn trên.

### 5.3. Đối chiếu hồ sơ/tài khoản

- Đồng nhất luồng `loopGetStudentExist` với `loopGetStudentExistFromHvu`.
- Đánh dấu `_no_user` khi profile không có tài khoản tương ứng.
- Dòng `_no_user` nhận `status_import = 'no_data'`.
- So sánh mã đã chuẩn hóa; tránh phụ thuộc chữ hoa/thường từ API.
- Sau khi tạo `list_student_import`, tính `importComparison` từ snapshot `data_student` và danh sách nguồn.

### 5.4. Import và trạng thái lỗi

- Các hàm phân trang, đối chiếu và thêm theo batch trả về `Observable`; nối tuần tự bằng `concatMap`.
- Chỉ `subscribe` tại điểm khởi chạy ngoài cùng của luồng Excel, HVU và xóa-thêm.
- Không đặt `subscribe` trong `forEach` hoặc hàm lặp/đệ quy import.
- Không dùng `catchError(...), mergeMap(...)` khiến `failed` bị ghi đè.
- Gán `done` chỉ khi request update/add hoàn thành thành công.
- `catchError` giữ `failed` và trả kết quả có cấu trúc để batch tiếp tục.
- Nếu không có dòng đủ điều kiện cần xử lý: dừng trước `loopAddStudentClass`; đóng progress; thông báo `Không có sinh viên đủ điều kiện để import`.
- Chống bấm lặp khi đang import bằng cờ `isImporting` hoặc dùng `displayModal` kèm kiểm tra trong handler.
- Kết thúc:
  - Có lỗi: thông báo hoàn tất kèm số thành công/thất bại.
  - Không lỗi, có request thành công: toast thành công.
  - Không có request: không toast thành công.

## 6. Thay đổi HTML

Trong modal import:

- Hiển thị khối tổng hợp số lượng sau khi dữ liệu được đối chiếu.
- Khối cảnh báo màu warning khi `countChanged || membershipChanged`.
- Nội dung gồm hiện tại, nguồn hợp lệ, đã tồn tại, sẽ thêm, không có trong nguồn, không hợp lệ, trùng bị loại.
- Disable nút “Thay thế danh sách” khi:
  - Đang xử lý.
  - Không có dòng đủ điều kiện.
  - Có bất kỳ dòng không hợp lệ.

Dialog xác nhận vẫn được tạo qua `NotificationService.confirm`, nhưng nội dung phải chứa tổng hợp chênh lệch. Handler vẫn kiểm tra lại số dòng đủ điều kiện trước khi chạy.

## 7. Trình tự triển khai

1. Bổ sung state/reset cho thống kê import.
2. Sửa khử trùng mã ở Excel và HVU.
3. Bổ sung validation response/file/mã rỗng.
4. Đồng nhất kiểm tra tài khoản giữa hai nguồn.
5. Tính chênh lệch số lượng và thành phần danh sách.
6. Hiển thị tổng hợp/cảnh báo trong modal.
7. Bổ sung nội dung chênh lệch vào xác nhận import.
8. Sửa pipeline trạng thái `done`/`failed`.
9. Chặn batch rỗng; sửa thông báo kết thúc.
10. Review tĩnh; chỉ build/test/run khi có yêu cầu riêng.

## 8. Kịch bản kiểm tra chấp nhận

- File có mã trùng: chỉ một dòng được xử lý; hiển thị số trùng bị loại.
- HVU trả mã null/rỗng: bỏ dòng; không exception.
- HVU trả dữ liệu sai cấu trúc: báo tải thất bại; không mở import với dữ liệu cũ.
- Profile tồn tại nhưng thiếu tài khoản: `no_data`; không gửi add/update.
- Update/add lỗi: dòng giữ `failed`; tổng kết không báo thành công hoàn toàn.
- Toàn bộ dòng `no_data`: không chạy batch; báo không có dữ liệu đủ điều kiện.
- Toàn bộ dòng đã tồn tại nhưng hợp lệ: vẫn xóa danh sách cũ và thêm lại toàn bộ theo nguồn.
- Số hợp lệ khác số hiện tại: hiện cảnh báo cùng chênh lệch.
- Số lượng bằng nhau nhưng mã sinh viên khác: hiện cảnh báo thành phần thay đổi.
- Sinh viên hiện tại không có trong nguồn: hiển thị `không có trong nguồn`; không nói sẽ bị xóa.
- Có sinh viên mới: hiển thị đúng `sẽ thêm`.
- Danh sách khác tên: preview và dữ liệu lưu tăng dần theo tên.
- Trùng tên: sắp tiếp theo tên đệm, họ, mã sinh viên; `ordering` liên tục từ 1.

## 9. Không thực hiện trong thay đổi này

- Không thay đổi backend/API.
- Không bổ sung transaction hoặc rollback phía backend.
- Không sửa parser/chuẩn hóa ngoài các kiểm tra null, trim, lowercase, trùng mã đã nêu.
- Không build/test/run khi chưa có yêu cầu riêng.

## 10. Trạng thái triển khai

Đã triển khai ngày 2026-08-25:

- Dùng `Set<string>` loại mã trùng ở luồng Excel và HVU.
- Bổ sung kiểm tra file, sheet, response HVU, mã null/rỗng.
- Đồng nhất kiểm tra hồ sơ và tài khoản; dòng thiếu dữ liệu bị khóa import.
- Bổ sung thống kê danh sách hiện tại, nguồn hợp lệ, đã tồn tại, sẽ thêm, không có trong nguồn, không hợp lệ, trùng bị loại.
- Cảnh báo khi số lượng hoặc thành phần sinh viên thay đổi.
- Thông báo rõ sinh viên không có trong nguồn sẽ bị xóa khi thay thế.
- Chặn import khi không có dòng đủ điều kiện hoặc đang xử lý.
- Giữ trạng thái `failed`; không ghi đè bằng `done`.
- Tổng kết đúng số thành công/thất bại; không báo thành công cho batch rỗng.
- Import luôn xóa danh sách cũ theo `class_id`, sau đó thêm toàn bộ danh sách mới.
- Chặn xóa khi còn sinh viên nguồn không hợp lệ.
- Bỏ checkbox ghi đè; thay bằng nút “Thay thế danh sách”.
- Sắp xếp preview theo tên, tên đệm, họ và mã sinh viên; gán lại `ordering` trước khi import.
- Refactor phân trang, đối chiếu hồ sơ và thêm theo batch thành chuỗi `Observable` tuần tự.
- Không còn `subscribe` trong các hàm lặp/đệ quy import; mỗi luồng Excel, HVU và xóa-thêm chỉ subscribe tại điểm khởi chạy ngoài cùng.

Chưa thực hiện:

- Chưa build/test/run theo quy tắc xác minh tĩnh của dự án.

## 11. Câu hỏi mở

Không còn câu hỏi chặn triển khai. Mặc định áp dụng:

- Chênh lệch chỉ cảnh báo, không chặn import.
- Sinh viên hiện tại không có trong nguồn bị xóa khi thay thế.
- Có bất kỳ dòng không hợp lệ sẽ chặn toàn bộ, không xóa danh sách cũ.
- So sánh dựa trên mã sinh viên đã chuẩn hóa.
