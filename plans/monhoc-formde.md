# Kế hoạch chức năng: Quản lý form đề môn học

## 1. Mục tiêu
- Tài liệu hóa và hoàn thiện component điều phối form đề tại [monhoc-formde](../src/app/modules/admin/features/quanly-monhoc/monhoc-formde/).
- Bảo đảm hiển thị đúng tab, dữ liệu, quyền chỉnh sửa, trạng thái duyệt và nhận xét theo từng môn học.
- Giảm trùng lặp logic giữa các form `CC`, `DG`, `TNTX`, `TN_KTHP`.
- Giữ tương thích với các component/service hiện tại; chưa thay đổi contract API khi chưa xác nhận nghiệp vụ.

## 2. Phạm vi

### Trong phạm vi
- [monhoc-formde.component.ts](../src/app/modules/admin/features/quanly-monhoc/monhoc-formde/monhoc-formde.component.ts)
- [monhoc-formde.component.html](../src/app/modules/admin/features/quanly-monhoc/monhoc-formde/monhoc-formde.component.html)
- [monhoc-formde.component.css](../src/app/modules/admin/features/quanly-monhoc/monhoc-formde/monhoc-formde.component.css)
- Luồng tích hợp với:
  - `CoursePlanActivitiesService`
  - `CourseQuestionsService`
  - `CoursePlanBankService`
  - `CourseFormCcService`
  - `CourseFormDgService`
  - `CourseFormTxService`
  - `CourseFormDuyetService`
  - `CourseFormCommentService`
  - Các service hội đồng thẩm định
  - `FormDeKthpComponent`, `DuyetFormDeComponent`
  - Luồng tải `CourseFormTuluan15p` trực tiếp từ server và hiển thị dữ liệu tự luận 15 phút trong `MonhocFormdeComponent`

### Ngoài phạm vi
- Thay đổi schema DB hoặc contract backend.
- Thay đổi quy tắc parser/chuẩn hóa câu trả lời.
- Viết lại toàn bộ các form đề đã tách tại `duyetnoidung`.
- Thay đổi nghiệp vụ duyệt khi chưa xác nhận các câu hỏi mở.

## 3. Chức năng hiện có

### 3.1. Khởi tạo và phân quyền
- Đọc `code` từ query params để tải môn học.
- Xác định vai trò: manager/admin/phòng đào tạo, lãnh đạo khoa, lãnh đạo bộ môn, giảng viên.
- Giới hạn môn giảng viên theo `creator_plan_id`.
- Kiểm tra lãnh đạo khoa theo `category_ids` và `donvi_chuyenmon_id`.
- Kiểm tra lãnh đạo bộ môn theo `nganh_bomon_id` và `bomon_id`.
- Cho phép thao tác khi thuộc khối đào tạo/lãnh đạo hoặc là người tạo kế hoạch môn.

### 3.2. Tải dữ liệu tổng
- Tải song song môn học, hồ sơ người dùng, trạng thái duyệt, thành viên hội đồng và số nhận xét.
- Gom trạng thái duyệt theo `form_type` vào `course_form_duyet`.
- Gắn danh sách comment tương ứng vào từng form duyệt.
- Lọc hội đồng loại `cauhoi`, lấy danh sách thành viên phục vụ nhận xét/duyệt.

### 3.3. Điều phối tab
- `CC`: Luyện tập tại nhà.
- `DG`: Kiểm tra 15 phút; không hiển thị với cấu hình HVU/DTTX hiện tại.
- `TNTX`: Kiểm tra trắc nghiệm thường xuyên hoặc giữa kỳ tùy cấu hình.
- `TN_KTHP`: Hiển thị khi `selectedCourse.params.exam_format === 'TRACNGHIEM'`.
- `TL15P` không dùng tab riêng; `CourseFormTuluan15p` được tải trực tiếp từ server và gộp vào `formDeDg`, đặt dưới đúng bài theo `week`.
- UI chỉ đọc và hiển thị các bản ghi `CourseFormTuluan15p` server trả về; không tự dựng dòng từ `CoursePlanActivityTuluan` hoặc nguồn khác. Không có bản ghi server thì không hiển thị dòng tự luận.
- `Số câu lấy` và `Điểm/1 câu` của tự luận chỉ hiển thị, không cho chỉnh sửa trong `formDeDg`; nút lưu DG không ghi, xóa hoặc tạo lại `CourseFormTuluan15p`.
- Mỗi bài hiển thị thành một card: bảng **Câu hỏi trắc nghiệm** phía trên, bảng **Câu hỏi tự luận** phía dưới.
- Bảng tự luận dùng 5 cột: STT, CDR, Số câu lấy, Điểm/1 câu, Tổng điểm; header hiển thị tổng số câu lấy và tổng điểm của phần tự luận.
- Cuối mỗi bài hiển thị tổng số câu lấy chung bằng số câu trắc nghiệm public + private + số câu tự luận; không hiển thị tổng điểm tại dòng tổng này.
- Header tab hiển thị trạng thái: chờ duyệt, đã duyệt, chưa đạt, đã sửa; kèm số nhận xét.

### 3.4. Form CC
- `av = 0/2`: cấu hình số câu lấy theo bài, activity CDR và mức CDR.
- `av = 1`: cấu hình theo part/group câu hỏi tiếng Anh.
- Đối chiếu `CoursePlanBank` với `bank_type = CC` để xác định `canEdit` và trạng thái đã có đề.
- Kiểm tra số câu lấy không vượt số câu khả dụng trước khi lưu.

### 3.5. Form DG
- `av = 0/2`: cấu hình theo CDR, tách câu hỏi public/private.
- `av = 1`: cấu hình theo part, tách public/private.
- Đối chiếu `CoursePlanBank` với `bank_type = DG`.
- Tính tổng số câu lấy, số câu khả dụng và đánh dấu dòng vượt giới hạn.

### 3.6. Form TNTX
- Tải các activity loại `THUONGXUYEN_TRACNGHIEM`.
- Cho phép chọn/bỏ bài tham gia từng bài kiểm tra.
- `av = 0`: cấu hình tổng số câu public/private theo bài.
- `av = 1`: cấu hình theo part và activity, tách public/private.
- `av = 2`: cấu hình theo CDR và activity, tách public/private.
- Đối chiếu `CoursePlanBank` với `bank_type = TX` để khóa chỉnh sửa khi đã có đề, trừ manager.

### 3.7. Duyệt và nhận xét
- Mở/đóng panel nhận xét dùng chung bằng `DuyetFormDeComponent`.
- Truyền môn học, thành viên hội đồng và `typeForm` tương ứng.
- Khi form đã duyệt, ẩn vùng lưu/chỉnh sửa theo điều kiện template hiện tại.

### 3.8. Trải nghiệm nhập liệu
- Phím `Tab` chuyển focus sang input số tiếp theo, quay lại input đầu khi hết danh sách.
- Có dialog tiến trình khi xóa và ghi lại nhiều bản ghi.
- Có side navigation để chọn bài cho từng bài kiểm tra TNTX.

## 4. Vấn đề cần xử lý

### Ưu tiên P0 — tính đúng dữ liệu
1. **Lưu theo kiểu xóa rồi thêm có thể tạo dữ liệu dở dang**
   - Các form xóa toàn bộ/cụm dữ liệu trước, sau đó thêm tuần tự.
   - Một request thêm thất bại có thể để form thiếu dữ liệu.
   - Cần ưu tiên API transaction/bulk replace; nếu backend chưa hỗ trợ, phải xác định chiến lược phục hồi hoặc báo lỗi rõ ràng.

2. **Không lưu được một số trường hợp request ít**
   - Nhiều hàm chỉ chạy khi `request.length > 1`.
   - Trường hợp chỉ có một request thêm, hoặc chỉ có request xóa để làm rỗng form, có thể không thực thi.
   - Chuẩn hóa điều kiện chạy khi `request.length > 0`; phân biệt rõ “không có thay đổi” và “xóa toàn bộ cấu hình”.

3. **Điều kiện template truy cập trạng thái chưa an toàn**
   - Nhiều vị trí dùng `course_form_duyet[typeTest]['status']` khi object tổng không rỗng nhưng key hiện tại có thể chưa tồn tại.
   - Thay bằng kiểm tra key/optional access tương thích phiên bản Angular của dự án.

4. **Sai loại form nhận xét tại tab KTHP**
   - Template `TN_KTHP` đang truyền `typeForm = 'CC'` cho `DuyetFormDeComponent`.
   - Xác nhận và đổi thành `TN_KTHP` nếu đúng nghiệp vụ.

### Ưu tiên P1 — luồng và trạng thái
1. Chuẩn hóa `changeTabView()` theo `selectTab.key`, tránh phụ thuộc index cố định khi danh sách tab thay đổi theo server/cấu hình.
2. Reset `show_test_tx` trước mỗi lần tải; tránh giữ trạng thái `true` từ lần tải trước.
3. Mọi nhánh lỗi phải tắt loading/dialog và hiển thị `toastError`.
4. Sửa các nhánh xóa đang hiển thị `toastSuccess("Xoá thất bại...")`.
5. Bỏ `console.log(this.selectedTestTx)` khỏi luồng chọn tuần.
6. Xác định cách cập nhật ngay header tab sau khi trạng thái duyệt/comment thay đổi.
7. Quản lý subscription query params theo vòng đời component nếu component có thể được tạo/hủy nhiều lần.

### Ưu tiên P2 — cấu trúc và bảo trì
1. Tách các model view động đang dùng `any`/index signature thành interface rõ ràng cho tab, tuần, activity, CDR, part.
2. Gom helper tính tổng public/private, kiểm tra vượt giới hạn và tạo payload lưu.
3. Giảm logic trùng giữa `av = 0`, `av = 1`, `av = 2` nhưng không làm thay đổi quy tắc nghiệp vụ.
4. Xóa code comment cũ và hàm migration `loadAllCourseType0()` khỏi component giao diện nếu không còn được dùng; chuyển sang công cụ quản trị riêng nếu vẫn cần.
5. Di chuyển inline style lặp lại sang CSS; bổ sung responsive thay cho `min-width: 1024px` cứng nếu màn hình nhỏ thuộc phạm vi hỗ trợ.
6. Gộp dữ liệu tự luận 15 phút trực tiếp vào `formDeDg`; loại bỏ import/template `TL15P` riêng sau khi luồng gộp hoàn tất.

## 5. Kế hoạch triển khai

### Giai đoạn 1 — Chốt nghiệp vụ
- Lập bảng ánh xạ `keyServer`, `isDttx`, `exam_format`, `av` sang danh sách tab.
- Chốt tên và ý nghĩa chính xác của `CC`, `DG`, `TNTX`, `TN_KTHP`, `TL15P`.
- Chốt quy tắc quyền xem, quyền sửa, quyền duyệt theo từng router/vai trò.
- Chốt quy tắc khóa sửa khi `CoursePlanBank` đã tồn tại.
- Chốt quy tắc public/private và trạng thái câu hỏi được tính là khả dụng.

### Giai đoạn 2 — Ổn định điều phối tab và quyền
- Tạo kiểu dữ liệu cho tab.
- Sinh tab bằng cấu hình rõ ràng, không phụ thuộc index.
- Tải form dựa trên `selectTab.key`.
- Bảo vệ mọi truy cập `course_form_duyet[formType]`.
- Đồng bộ trạng thái duyệt/comment về header tab.
- Không tạo tab `TL15P`; tải `CourseFormTuluan15p` từ server rồi chèn đúng các bản ghi trả về dưới từng bài của `formDeDg`; không tự dựng dòng từ dữ liệu kế hoạch.

### Giai đoạn 3 — Ổn định tải và biến đổi dữ liệu
- Chuẩn hóa trạng thái loading/error cho tất cả nhánh CC, DG, TNTX.
- Tách hàm dựng view model theo từng `av`.
- Giữ riêng public/private; tính tổng từ cùng một nguồn dữ liệu.
- Reset các biến danh sách/trạng thái trước mỗi lần tải.
- Kiểm tra dữ liệu null/thiếu `params`, `cdr_cauhoi`, `children`, `parts`.

### Giai đoạn 4 — An toàn lưu/xóa
- Sửa điều kiện thực thi request cho trường hợp một request và xóa toàn bộ.
- Ưu tiên endpoint bulk replace có transaction cho từng form/test.
- Nếu phải giữ API hiện tại: lưu snapshot, thực thi có thứ tự, dừng đúng lỗi, tải lại trạng thái server và thông báo dữ liệu có thể chưa hoàn chỉnh.
- Chuẩn hóa xác nhận xóa, loading, toast và reload.
- Ngăn lưu khi bất kỳ số câu lấy nào âm, không nguyên hoặc vượt số khả dụng.

### Giai đoạn 5 — Dọn cấu trúc/UI
- Tách phần tab manager, bảng CC, bảng DG, bảng TNTX thành component chuyên trách nếu việc chỉnh sửa tiếp tục mở rộng.
- Chuyển inline style lặp lại sang CSS.
- Chuẩn hóa nhãn Public/Private, tổng câu lấy/tổng câu hỏi, trạng thái đã có đề.
- Giữ focus bằng `Tab`; xác định hành vi tại input disabled/hidden.
- Bổ sung empty state cho form không có bài, activity, CDR hoặc part.

### Giai đoạn 6 — Xác minh
- Review tĩnh trước: template binding, điều kiện null, mapping API, quyền, payload.
- Chỉ build/test/run khi có yêu cầu riêng.
- Kiểm thử thủ công theo ma trận ở mục 6 sau khi được phép chạy ứng dụng.

## 6. Ma trận nghiệm thu

### Cấu hình môn
- `av = 0`, `av = 1`, `av = 2`.
- `exam_format = TRACNGHIEM`, hình thức khác.
- `keyServer = hvu`, `ictu`, server mặc định.
- `isDttx = true/false`.

### Vai trò
- Admin/manager/phòng đào tạo.
- Giảng viên là người tạo kế hoạch.
- Giảng viên không sở hữu môn.
- Lãnh đạo khoa đúng/sai đơn vị chuyên môn.
- Lãnh đạo bộ môn đúng/sai bộ môn.
- Thành viên hội đồng và người không thuộc hội đồng.

### Dữ liệu
- Không có form duyệt; có một phần form duyệt; đủ form duyệt.
- Trạng thái `0`, `1`, `-1`, `-2`.
- Không có câu hỏi; chỉ public; chỉ private; có cả hai.
- Số câu lấy bằng, nhỏ hơn, lớn hơn số khả dụng.
- Chỉ một bản ghi cần lưu.
- Xóa hết cấu hình hiện tại.
- API tải/lưu/xóa thất bại giữa chừng.
- Đã có ngân hàng đề và chưa có ngân hàng đề.

### Tiêu chí đạt
- Tab hiển thị đúng cấu hình môn; đổi tab tải đúng form.
- Không có lỗi template khi thiếu trạng thái duyệt của một form.
- Tổng public/private và tổng chung chính xác.
- Không cho lưu dữ liệu vượt giới hạn hoặc dữ liệu số không hợp lệ.
- Lưu một bản ghi, nhiều bản ghi, xóa toàn bộ đều hoạt động đúng.
- Không mất dữ liệu âm thầm khi request giữa chuỗi thất bại.
- Loading luôn kết thúc; lỗi luôn dùng thông báo lỗi.
- Nhận xét và trạng thái duyệt gắn đúng `form_type`.
- Quyền xem/sửa/duyệt đúng vai trò và phạm vi đơn vị.

## 7. Liên kết kế hoạch liên quan
- [form-de-manager.md](form-de-manager.md)
- [form-de-luyentap.md](form-de-luyentap.md)
- [form-de-dg.md](form-de-dg.md)
- [form-de-tn-tx.md](form-de-tn-tx.md)
- [form-de-tn-kthp.md](form-de-tn-kthp.md)
- [duyet-form-de.md](duyet-form-de.md)

## 8. Câu hỏi mở
1. `CC` được gọi chính thức là “Luyện tập tại nhà” hay “Chuyên cần”?
2. `DG` là “Kiểm tra 15 phút”, “Kiểm tra đầu giờ” hay tên khác?
3. Đã chốt: `TL15P` không dùng tab riêng; gộp dưới từng bài của `formDeDg` ở chế độ chỉ đọc. Nút lưu chỉ xử lý dữ liệu DG trắc nghiệm.
4. `TN_KTHP` có đúng phải dùng `typeForm = TN_KTHP` khi nhận xét/duyệt?
5. Manager có được sửa cấu trúc sau khi đã sinh đề, hay chỉ được xem/duyệt?
6. Form được duyệt (`status = 1`) có khóa chỉnh sửa với mọi vai trò không?
7. Câu hỏi `status != -3` đều được tính khả dụng, hay chỉ câu đã duyệt `status = 1`?
8. Câu hỏi private áp dụng cho CC hay chỉ DG/TNTX/KTHP?
9. Backend có endpoint bulk replace/transaction cho CC, DG, TNTX không?
10. Khi người dùng xóa hết số câu lấy, hệ thống phải xóa toàn bộ cấu hình đã lưu chứ?
11. Một môn có thể có nhiều hội đồng loại `cauhoi` không; nếu có, chọn hội đồng nào?
12. Lãnh đạo khoa/bộ môn có cần đồng thời là thành viên hội đồng mới được duyệt không?

## 9. Trạng thái
- Đã đọc toàn bộ component TS/HTML/CSS.
- Đã đối chiếu các kế hoạch form đề liên quan.
- Đã triển khai gộp câu hỏi tự luận vào `formDeDg`:
  - `CourseFormTuluan15p` được tải trực tiếp từ server; UI hiển thị đúng các bản ghi server trả về.
  - Đã bỏ request `CoursePlanActivityTuluan` khỏi luồng tải `formDeDg`; không tự dựng dòng tự luận từ câu hỏi hoặc nguồn khác.
  - Server không trả bản ghi thì không hiển thị dòng tự luận; dữ liệu trả về được ghép đúng bài theo `course_plan_activity_id` và `week`, sắp xếp theo `ordering`.
  - Với mọi cấu hình `av`, mỗi bài hiển thị thành một card riêng.
  - Bảng **Câu hỏi trắc nghiệm** nằm phía trên: `av = 0/2` theo CDR, `av = 1` theo Part.
  - Bảng **Câu hỏi tự luận** nằm phía dưới, dùng 5 cột và chỉ hiển thị dữ liệu của bài tương ứng.
  - Header tự luận hiển thị `Số câu lấy (n)` và `Tổng điểm (n)`; cột điểm dùng nhãn `Điểm/ 1 Câu`.
  - `Số câu lấy` và `Điểm/1 câu` tự luận hiển thị dạng text; không có input chỉnh sửa.
  - Cuối bài hiển thị `Tổng số câu lấy`, tính bằng câu trắc nghiệm public + private + câu tự luận; không hiển thị tổng điểm tại dòng này.
  - Nút `Lưu lại` chỉ xử lý DG trắc nghiệm; không xóa/thêm/cập nhật `CourseFormTuluan15p`.
  - Đã bổ sung empty state, màu lỗi, viền và khoảng cách riêng cho từng card.
- Đã kiểm tra tĩnh các thay đổi liên quan; chưa build, test hoặc chạy ứng dụng.
