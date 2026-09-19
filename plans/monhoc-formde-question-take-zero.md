# Kế hoạch: Cho phép sửa `question_take` khi số câu khả dụng bằng 0

## 1. Bối cảnh

Form TNTX `av = 2` hiển thị `Số câu lấy / Số câu khả dụng` theo từng CDR, tách Public và Private.

Tình huống lỗi:

1. Form đã lưu `question_take = 2`, số câu khả dụng ban đầu là `3` (`2/3`).
2. Các câu hỏi bị xóa hoặc chuyển Public ↔ Private.
3. Số câu khả dụng của phía cũ trở thành `0` (`2/0`).
4. Template hiện chỉ hiển thị input khi số câu khả dụng lớn hơn `0`.
5. Input biến mất; người dùng không thể sửa `2` thành `0`.
6. Cấu hình cũ không thể được xóa qua luồng lưu hiện tại.

Mục tiêu: vẫn hiển thị input khi còn cấu hình đã lưu, kể cả `2/0`; cho phép sửa về `0/0`, lưu và xóa cấu hình cũ an toàn.

## 2. Phạm vi

### Trong phạm vi

- TNTX `av = 2`: Public/Private theo từng CDR.
- TNTX `av = 1`: Public/Private theo từng Part.
- CC và DG: áp dụng cùng quy tắc cho các input theo CDR/Part đang có.
- Hiển thị input khi số câu khả dụng bằng `0` nhưng vẫn còn cấu hình đã lưu.
- Validation khi số câu lấy vượt số câu khả dụng, gồm mẫu số `0`.
- Lưu trường hợp chỉ còn một request xóa.
- Thông báo “Không có thay đổi” khi không phát sinh request.
- Tải lại dữ liệu sau lưu để UI phản ánh trạng thái server.

### Ngoài phạm vi

- Thay đổi API hoặc schema DB.
- Thay đổi quy tắc phân loại Public/Private.
- Tự động chuyển số câu lấy giữa Public và Private; người dùng phải tự nhập.
- Thay đổi quyền `row['canEdit']`, `test['canEdit']` hoặc trạng thái duyệt.
- TNTX `av = 0`, trừ khi review triển khai xác nhận cùng lỗi và cần xử lý đồng nhất.
- Build/test/run khi chưa có yêu cầu riêng.

## 3. Quy tắc nghiệp vụ

### 3.1. Quy tắc hiển thị

Input Public được hiển thị khi:

```text
số câu Public khả dụng > 0
HOẶC
`question_take` còn key của CDR tương ứng
```

Input Private được hiển thị khi:

```text
số câu Private khả dụng > 0
HOẶC
`question_take_private` còn key của CDR tương ứng
```

Phải kiểm tra **key tồn tại**, không kiểm tra giá trị truthy. Giá trị `0` vẫn phải giữ input trong phiên chỉnh sửa hiện tại.

### 3.2. Quy tắc validation

```text
question_take > số câu khả dụng: lỗi
question_take <= số câu khả dụng: hợp lệ
```

Mọi số câu khả dụng null/undefined được chuẩn hóa thành `0` khi so sánh.

Kết quả bắt buộc:

- `2/0`: input hiện, dòng báo lỗi, không cho lưu.
- `0/0`: input hiện trong phiên chỉnh sửa, hết lỗi, cho phép lưu.
- Sau khi lưu và tải lại: không còn cấu hình đã lưu; nếu số khả dụng vẫn `0`, input được ẩn.

### 3.3. Quy tắc lưu

- Giá trị `0` không tạo bản ghi mới.
- Nếu có dữ liệu cũ, request xóa vẫn phải chạy dù không có request thêm.
- Điều kiện thực thi batch là `request.length > 0`, không phải `request.length > 1`.
- Nếu `request.length === 0`, không gọi API và hiển thị thông báo “Không có thay đổi”.

## 4. Thiết kế đề xuất

### 4.1. Tách trạng thái hiển thị khỏi số câu khả dụng

Trong quá trình dựng view model TNTX `av = 2`, sau khi đã tải cả:

- Số câu khả dụng Public/Private.
- `question_take`/`question_take_private` đã lưu.

Tạo hai map hiển thị trên từng `child`:

```text
show_question_take[cdrId]
show_question_take_private[cdrId]
```

Giá trị mỗi flag được tính một lần từ điều kiện ở mục 3.1.

Lý do chọn map view model thay vì gọi hàm từ template:

- Không gọi hàm lặp lại trong mỗi chu kỳ change detection.
- Điều kiện HTML ngắn, dễ đọc.
- Giữ input hiển thị sau khi người dùng sửa `2` thành `0`; key cấu hình vẫn tồn tại đến khi reload.
- Không trộn trạng thái UI vào các map đếm câu hỏi khả dụng.

### 4.2. Sửa điều kiện template

Thay điều kiện dựa trực tiếp vào:

```text
child.cdr_cauhoi[cdr.id]
child.cdr_cauhoi_private[cdr.id]
```

bằng các flag hiển thị đã dựng.

Ô CDR bao ngoài hiển thị khi Public hoặc Private cần hiển thị và CDR không bị `disabled`.

Mẫu số luôn render an toàn với giá trị mặc định `0`.

Giữ nguyên:

- `[(ngModel)]` hiện tại.
- `[disabled]="!test['canEdit']"`.
- Các event cập nhật tổng và điều hướng bằng bàn phím.
- Class màu Public/Private và class báo lỗi hiện có.

### 4.3. Chuẩn hóa validation

Cập nhật `setNumberCdrCauhoi()`:

- Chuẩn hóa số lấy và số khả dụng bằng `Number(...)`.
- Giá trị thiếu hoặc không chuyển được thành số dùng `0` trong phép so sánh/tính tổng phù hợp với nghiệp vụ hiện tại.
- Truy cập Public/Private null-safe.
- Tiếp tục gắn `child['require_cdr']` và tính tổng cha như hiện tại.

Không thay đổi cấu trúc payload API.

### 4.4. Cho phép xóa cấu hình cuối cùng

Trong `saveFormTxType2()`:

- Giữ request xóa dữ liệu cũ đứng trước các request thêm lại.
- Bỏ qua các giá trị `0` khi tạo payload thêm.
- Thực thi khi `request.length > 0`.
- Sau thành công, gọi lại luồng tải TNTX hiện có.

Lưu ý kiến trúc: luồng xóa rồi thêm hiện chưa có transaction. Thay đổi này chỉ sửa trường hợp request xóa duy nhất; không mở rộng sang thiết kế bulk replace trong phạm vi này.

## 5. File cần chỉnh sửa khi triển khai

1. [monhoc-formde.component.ts](../src/app/modules/admin/features/quanly-monhoc/monhoc-formde/monhoc-formde.component.ts)
   - Dựng flag hiển thị từ số câu khả dụng và key cấu hình đã lưu cho CC, DG, TNTX `av = 1/2`.
   - Chuẩn hóa các hàm tính số lấy theo CDR/Part tương ứng.
   - Đổi điều kiện thực thi request từ `> 1` thành `> 0` tại các hàm lưu thuộc phạm vi.
   - Thông báo “Không có thay đổi” khi không phát sinh request.
   - Không tự động chuyển số lấy giữa Public và Private.

2. [monhoc-formde.component.html](../src/app/modules/admin/features/quanly-monhoc/monhoc-formde/monhoc-formde.component.html)
   - Dùng flag view model để hiển thị input CDR/Part Public/Private.
   - Render mẫu số thiếu thành `0`.
   - Loại bỏ các truy cập trực tiếp không an toàn trong các vùng được xử lý.

Không dự kiến sửa CSS hoặc service/API.

## 6. Trình tự triển khai

1. Xác định chính xác khối dựng `children` cho TNTX `av = 2`.
2. Khởi tạo hai map hiển thị cho từng `child`.
3. Nạp dữ liệu `question_take` và `question_take_private` đã lưu như hiện tại.
4. Tính flag hiển thị từ hợp của “có câu khả dụng” và “có key cấu hình”.
5. Thay các `*ngIf` tương ứng trong template.
6. Chuẩn hóa phép so sánh/tính tổng trong `setNumberCdrCauhoi()`.
7. Đổi `request.length > 1` thành `request.length > 0` riêng tại `saveFormTxType2()`.
8. Review tĩnh: null safety, quyền sửa, trạng thái duyệt, payload Public/Private, thứ tự xóa/thêm.
9. Chỉ build/test/run khi người dùng yêu cầu riêng.

## 7. Ma trận nghiệm thu

| Dữ liệu đã lưu | Public khả dụng | Private khả dụng | Kỳ vọng |
|---|---:|---:|---|
| Public `2` | 3 | 0 | Hiện Public `2/3`; Private ẩn |
| Public `2` | 0 | 0 | Hiện Public `2/0`, báo lỗi |
| Public sửa thành `0` | 0 | 0 | Hiện Public `0/0`, hết lỗi, cho lưu |
| Private `2` | 0 | 3 | Hiện Private `2/3`; Public ẩn |
| Private `2` | 0 | 0 | Hiện Private `2/0`, báo lỗi |
| Private sửa thành `0` | 0 | 0 | Hiện Private `0/0`, hết lỗi, cho lưu |
| Public chuyển sang Private | 0 | 3 | Public cũ vẫn hiện để sửa về `0`; Private hiện theo số khả dụng |
| Private chuyển sang Public | 3 | 0 | Private cũ vẫn hiện để sửa về `0`; Public hiện theo số khả dụng |
| Không có cấu hình cũ | 0 | 0 | Không hiện input |
| Đã sửa `0/0` và lưu | 0 | 0 | Request xóa chạy; reload xong input ẩn |
| `test.canEdit = false` | Bất kỳ | Bất kỳ | Input có thể hiện nhưng bị disabled như hiện tại |

## 8. Kiểm tra tĩnh bắt buộc

- Không còn điều kiện hiển thị chỉ phụ thuộc mẫu số trong vùng TNTX `av = 2`.
- Không truy cập map Public/Private khi map chưa tồn tại.
- `2/0` đặt `require_cdr = true`.
- `0/0` đặt `require_cdr = false`.
- Request xóa duy nhất được thực thi.
- Giá trị `0` không tạo request thêm.
- Payload Public giữ `private` mặc định; payload Private giữ `private: 1`.
- Không thay đổi khóa input theo `test['canEdit']` và trạng thái duyệt.

## 9. Kiểm thử thủ công khi được phép chạy

1. Tạo cấu hình Public `2/3`, lưu.
2. Chuyển hoặc xóa ba câu Public để số khả dụng thành `0`.
3. Mở lại form; xác nhận input Public hiển thị `2/0` và báo lỗi.
4. Sửa thành `0`; xác nhận hiển thị `0/0`, hết lỗi.
5. Lưu; xác nhận thông báo thành công và reload.
6. Xác nhận cấu hình Public cũ đã bị xóa, input không còn hiển thị nếu vẫn không có câu khả dụng.
7. Lặp lại toàn bộ với Private.
8. Lặp lại hai chiều chuyển Public ↔ Private.

## 10. Rủi ro và kiểm soát

- **Mất dữ liệu khi chuỗi xóa/thêm lỗi giữa chừng:** giữ nguyên rủi ro hiện hữu; cần bulk replace/transaction ở kế hoạch riêng.
- **Flag hiển thị bị tính trước khi nạp form cũ:** chỉ tính sau khi ghép xong dữ liệu khả dụng và dữ liệu đã lưu.
- **Giá trị chuỗi làm sai tổng:** chuẩn hóa `Number` trước khi cộng.
- **Input biến mất ngay khi nhập `0`:** flag view model không được tính lại theo truthiness của giá trị input trong phiên hiện tại.
- **Mở rộng ngoài phạm vi:** đã giới hạn triển khai theo quyết định nghiệp vụ: CC, DG và TNTX `av = 1/2`; TNTX `av = 0` không thay đổi.

## 11. Quyết định nghiệp vụ đã chốt

1. Khi `request.length === 0`, hiển thị thông báo “Không có thay đổi”; không gọi API.
2. Khi câu hỏi chuyển Public ↔ Private, không tự chuyển số câu lấy; người dùng phải tự nhập cho phía mới và sửa phía cũ về `0`.
3. Áp dụng cùng quy tắc “có cấu hình cũ thì vẫn hiện input” cho CC, DG và TNTX `av = 1/2`.

## 12. Trạng thái

- Đã triển khai cho CC, DG và TNTX `av = 1/2`.
- Đã thêm flag hiển thị để giữ input khi còn cấu hình cũ nhưng số câu khả dụng bằng `0`.
- Đã giữ các Part/CDR chỉ còn trong dữ liệu form đã lưu để người dùng sửa về `0`.
- Đã chuẩn hóa validation CDR/Part với giá trị số và mẫu số thiếu mặc định `0`.
- Đã cho phép chạy request xóa duy nhất; trường hợp không phát sinh request hiển thị “Không có thay đổi”.
- Đã review tĩnh và chạy `git diff --check`; không phát hiện lỗi khoảng trắng.
- Chưa build, test hoặc chạy ứng dụng theo phạm vi đã thống nhất.
