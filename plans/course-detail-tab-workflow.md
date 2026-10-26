# Kế hoạch tổ chức tab và thứ tự nhập liệu course-detail

- Ngày lập: 2026-10-26.
- Trạng thái: Đề xuất, chưa triển khai code.
- Nguồn nghiệp vụ: `C:\Users\phuong\Downloads\Công nghệ phát triển ứng dụng.docx`.
- Phạm vi: Chi tiết học phần, component `CourseManagementDetail`, route `/hoc-phan?code=<id>&tab=<tab-id>`.
- Mục tiêu: Phân chia công việc theo nghiệp vụ, chỉ rõ dữ liệu cần nhập trước/sau, giảm việc quay lại tab trước để tạo dữ liệu còn thiếu.

## 1. Kết luận thiết kế

Tách hai nhóm công việc:

1. **Biên soạn đề cương:** Thông tin học phần, mục tiêu/CĐR, nội dung/kế hoạch, thiết kế đánh giá, rà soát/phê duyệt/xuất.
2. **Ngân hàng câu hỏi và đề kiểm tra:** Thiết lập bài kiểm tra, phân bổ câu hỏi, biên soạn/duyệt câu hỏi, form đề, sinh/quản lý đề.

Nguyên tắc:

- Thứ tự nhập dựa trên phụ thuộc dữ liệu, không sao chép nguyên thứ tự các mục trong Word.
- CO/CLO có trước khi gán cho bài học và thành phần đánh giá.
- Bài/CPI có trước khi phân bổ câu hỏi và lập form đề theo bài/CPI.
- Danh sách bài kiểm tra phải có trước form đề kiểm tra thường xuyên và quản lý các bài kiểm tra tương ứng.
- Form đề và câu hỏi đã duyệt là hai đầu vào của sinh đề. Có thể xây dựng song song, không bắt buộc luôn hoàn thành ngân hàng trước khi lập form.
- Hoàn tất đề cương không đồng nghĩa với hoàn tất ngân hàng câu hỏi hoặc đã sinh đề.
- Không hiển thị toàn bộ công việc thành 10 tab ngang ngang hàng.
- Giữ dữ liệu dùng chung một nguồn; không tạo hai danh sách bài kiểm tra hoặc hai bộ tỷ lệ điểm độc lập.

## 2. Cấu trúc tài liệu tham chiếu

### 2.1. Các phần cần nhập

| Phần đề cương | Dữ liệu |
| --- | --- |
| 1. Thông tin học phần | Tên Việt/Anh, mã, tín chỉ, khối kiến thức, loại học phần, học phần học trước/tiên quyết/song hành, phân bổ thời gian, đơn vị phụ trách, mô tả, học liệu, yêu cầu sinh viên |
| 2. Mục tiêu và CĐR | Mục tiêu chung, CO, CLO, liên kết CO–CLO, đối sánh CĐR CTĐT, mức độ đóng góp |
| 3. Kiểm tra, đánh giá | Thang điểm, thành phần đánh giá, thời điểm, CLO, phương pháp, công cụ/rubric, tỷ lệ điểm |
| 4. Nội dung chi tiết | Bài/tuần, nội dung trên lớp, tự học, CLO, phương pháp dạy học, phương pháp đánh giá, tài liệu tham khảo |
| 5. Rubric | Rubric chuyên cần, kiểm tra LMS, kiểm tra thường xuyên, thi hết học phần |
| 6. Giảng viên phụ trách | Người phụ trách, người tham gia, thông tin liên hệ |
| 7–8. Phê duyệt | Ngày phê duyệt, cấp phê duyệt |
| 9. Cập nhật | Lần cập nhật, nội dung, người cập nhật |

### 2.2. Ví dụ từ học phần Công nghệ phát triển ứng dụng

- Mã học phần: ADT332.
- 3 tín chỉ: 2 lý thuyết, 1 thực hành.
- Tổng thời gian: 150; gồm 30 lý thuyết, 27 thực hành, 3 kiểm tra định kỳ, 90 tự học.
- 3 mục tiêu CO1–CO3, 6 chuẩn đầu ra CLO1–CLO6.
- Bảng CĐR ghi PLO8, mức đóng góp I; PLO8 là ô gộp cho các CLO, không phải chỉ áp dụng cho CLO1.
- Tỷ lệ điểm: chuyên cần 5%, LMS 15%, kiểm tra thường xuyên 30%, thi cuối kỳ 50%.
- Ba bài kiểm tra thường xuyên, mỗi bài 10%, thời điểm tuần 3, 5, 9.
- Chín nhóm nội dung: quy trình phát triển, phân tích yêu cầu, thiết kế giao diện, backend, frontend, tích hợp hệ thống, kiểm thử/triển khai, bảo trì/cập nhật, dự án thực tế.
- Rubric LMS mô tả 9 bài trắc nghiệm, mỗi bài 15 câu/15 phút; phân bổ 3 câu Biết, 5 câu Hiểu, 7 câu Vận dụng.
- Rubric kiểm tra thường xuyên: 50 phút, 3 câu, trọng số 40%–40%–20%.
- Rubric thi hết học phần: 90 phút, 3 câu, trọng số 40%–40%–20%.

Các con số này chỉ là ví dụ của tài liệu, không hardcode thành quy định chung cho mọi học phần.

## 3. Hiện trạng đã đối chiếu với code

### 3.1. Shell và điều hướng

[course-management-detail.ts](../src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.ts), dòng 59–67, khai báo 7 tab:

1. Thông tin chung.
2. Mục tiêu/CDR.
3. Nội dung.
4. Phân bổ câu hỏi CDR.
5. Form đề.
6. Kiểm tra - Đánh giá.
7. Cấu hình.

Route được khai báo tại [app-routing.module.ts](../src/app/app-routing.module.ts), dòng 24–27.

Shell đọc `code`, `tab` từ query params; đổi tab bằng `queryParamsHandling: 'merge'`. Template dựng/hủy component theo `@if`, không phải các child route.

### 3.2. Chức năng thực tế và phụ thuộc

| Tab hiện tại | Chức năng chính | Phụ thuộc đáng chú ý |
| --- | --- | --- |
| Thông tin chung | Hồ sơ học phần, tín chỉ/thời lượng, liên kết CTĐT, học liệu, yêu cầu sinh viên, hình thức thi | CTĐT và các danh mục liên quan |
| Mục tiêu/CDR | Mục tiêu chung, CO, CLO, gán CO cho CLO, liên kết CLO–PI theo CTĐT | Học phần đã gắn CTĐT để đối sánh PLO/PI |
| Nội dung | Bài, mục tiêu bài, CLO, CPI, nội dung, phương pháp/thời lượng, tài liệu | Tín chỉ hợp lệ, danh sách CLO |
| Phân bổ câu hỏi CDR | Chỉ tiêu số câu theo bài/CPI và mức độ năng lực | Bài/CPI từ Nội dung, cấu hình mức độ CĐR |
| Form đề | Cấu trúc lấy câu hỏi cho luyện tập, 15 phút, thường xuyên, cuối kỳ tùy hình thức | Bài/CPI, loại bài kiểm tra, hình thức thi |
| Kiểm tra - Đánh giá | Sinh/xóa đề, quản lý kiểm tra thường xuyên, nhập tự luận/dự án, câu hỏi tự luận 15 phút | Bài kiểm tra đã tạo, form đề, câu hỏi đã duyệt |
| Cấu hình | Tạo danh sách/loại bài kiểm tra, tỷ lệ điểm, số đề, thời hạn/gia hạn, thời gian làm bài, tỷ lệ nghỉ | Tín chỉ/hình thức thi và một số cấu hình hệ thống |

### 3.3. Điểm bất hợp lý chính

**Cấu hình đứng cuối nhưng tạo dữ liệu đầu vào cho các tab đứng trước.**

- [monhoc-formde.component.html](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-formde/monhoc-formde.component.html), dòng 48–58: yêu cầu vào Cấu hình khi chưa có bài kiểm tra thường xuyên.
- [monhoc-kiemtra-danhgia.component.html](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-kiemtra-danhgia/monhoc-kiemtra-danhgia.component.html), dòng 162–164: cũng yêu cầu quay về Cấu hình để tạo bài kiểm tra.
- [monhoc-cauhinh.component.ts](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-cauhinh/monhoc-cauhinh.component.ts), dòng 448–474: tỷ lệ điểm đang đặt cùng thiết lập vận hành.

**Tên “Kiểm tra - Đánh giá” chưa thể hiện đúng phạm vi hiện có.** Component chủ yếu phục vụ triển khai kiểm tra/ngân hàng đề, không tương đương bảng thiết kế đánh giá và toàn bộ rubric ở mục 3, 5 của đề cương.

**Phân bổ câu hỏi không phải ma trận đánh giá CLO.** Chức năng này lưu chỉ tiêu `cdr_cauhoi` trên `CoursePlanActivities`, không tạo nội dung câu hỏi.

**Rubric câu hỏi không phải rubric học phần.** Rubric đã xác minh ở câu hỏi tự luận 15 phút là `rubric_markdown` của từng câu; không thể coi đây là chức năng rubric tổng quát của đề cương.

## 4. Cấu trúc điều hướng đề xuất

```text
ĐỀ CƯƠNG
  A1. Thông tin học phần
  A2. Mục tiêu & chuẩn đầu ra
  A3. Nội dung & kế hoạch giảng dạy
  A4. Thiết kế kiểm tra – đánh giá
  A5. Rà soát, phê duyệt & xuất

NGÂN HÀNG CÂU HỎI & ĐỀ
  B1. Thiết lập bài kiểm tra
  B2. Ma trận câu hỏi theo CĐR/CPI
  B3. Ngân hàng câu hỏi
  B4. Form đề
  B5. Sinh & quản lý đề

THIẾT LẬP VẬN HÀNH
  Số đề, thời hạn, gia hạn, quy tắc vận hành
```

Đây là thứ tự điều hướng theo nhóm, không phải wizard bắt buộc hoàn thành liên tục A1 đến B5. A5 có thể hoàn tất mà chưa thực hiện B2–B5. B3 và B4 có thể thực hiện song song.

Ưu tiên sidebar chia nhóm hoặc hai nhóm điều hướng chính với tab con. Không ép 10 tab vào header ngang hiện tại.

## 5. Công việc và thứ tự nhập

### A1. Thông tin học phần

Nhập:

- Mã, tên Việt/Anh, khoa/bộ môn phụ trách.
- CTĐT áp dụng, khối kiến thức, loại học phần, học kỳ.
- Học phần học trước, tiên quyết, song hành.
- Tín chỉ, tín chỉ thực hành, tổng thời lượng và phân bổ.
- Mô tả tóm tắt, yêu cầu sinh viên, tài liệu chính/tham khảo.
- Giảng viên phụ trách/tham gia nếu bổ sung trường dữ liệu.

Các trường hình thức thi đang có có thể giữ tạm tại đây; khi tách Thiết kế đánh giá phải xác định một nơi chỉnh sửa chính, không nhân đôi dữ liệu.

### A2. Mục tiêu và chuẩn đầu ra

Thứ tự:

1. Mục tiêu chung.
2. Mục tiêu chi tiết CO.
3. Chuẩn đầu ra CLO.
4. Gán từng CLO vào CO.
5. Đối sánh CLO với PLO/PI theo CTĐT áp dụng.
6. Mức độ đóng góp theo quy định của CTĐT, sau khi xác minh mô hình lưu trữ.

Không buộc người dùng nhập lại PLO/PI đã có ở CTĐT. Không tự suy ra PI từ PLO8 trong tài liệu tham chiếu.

### A3. Nội dung và kế hoạch giảng dạy

Thứ tự:

1. Tạo khung bài/tuần.
2. Nhập nội dung, mục tiêu, CLO/CPI của bài.
3. Nhập hoạt động trên lớp, tự học, phương pháp dạy, thời lượng.
4. Gắn tài liệu tham khảo từ danh mục học liệu.
5. Sau khi A4 có danh sách đánh giá, chọn hoạt động kiểm tra tương ứng vào kế hoạch.

A3 và A4 cần liên kết hai chiều có kiểm soát: khung bài có thể lập trước; lịch kiểm tra hoàn thiện sau. Không bắt người dùng tạo trùng một bài kiểm tra trong cả hai màn hình.

### A4. Thiết kế kiểm tra – đánh giá

Nhập:

- Thang điểm, nhóm thành phần điểm.
- Danh sách bài kiểm tra, phạm vi bài học, thời điểm.
- CLO được đánh giá.
- Phương pháp: trắc nghiệm, thực hành, tự luận, dự án hoặc hình thức khác theo nghiệp vụ.
- Công cụ/rubric.
- Tỷ lệ điểm của nhóm và từng bài.
- Rubric cấp học phần: tiêu chí, trọng số, mức chất lượng, mô tả.

Ví dụ theo tài liệu: chuyên cần 5%, LMS 15%, ba bài thường xuyên tổng 30%, thi cuối kỳ 50%.

Phần này sở hữu **thiết kế học thuật**. Các hoạt động ở B1 tham chiếu thiết kế này, không nhập lại độc lập tỷ lệ điểm, CLO, phương pháp và rubric.

### A5. Rà soát, phê duyệt và xuất

- Tổng hợp thiếu sót theo mục và dẫn đến đúng nơi sửa.
- Kiểm tra tỷ lệ điểm, thời lượng, liên kết CO/CLO, phạm vi đánh giá.
- Xem trước theo thứ tự trình bày của mẫu Word, dù thứ tự nhập khác.
- Phê duyệt theo quyền và quy trình thực tế được xác minh khi triển khai.
- Ghi ngày, cấp phê duyệt, lịch sử cập nhật.
- Tích hợp xuất đề cương; cần đánh giá khả năng tái sử dụng luồng xuất hiện có.

Không bắt buộc có đủ câu hỏi hoặc đã sinh đề mới được hoàn thành đề cương.

### B1. Thiết lập bài kiểm tra

- Tạo/liên kết hoạt động luyện tập, LMS, thường xuyên/giữa kỳ, thi cuối kỳ từ thiết kế ở A4.
- Chọn loại hoạt động tương ứng với trắc nghiệm/tự luận/dự án.
- Thiết lập thông số phục vụ vận hành.
- Giai đoạn chuyển tiếp: chuyển chức năng tạo bài hiện có từ Cấu hình lên vị trí trước Form đề và Sinh đề.

### B2. Ma trận câu hỏi theo CĐR/CPI

- Phân bổ chỉ tiêu câu hỏi theo bài/CPI và mức độ năng lực.
- Hiển thị tổng, tỷ lệ, số tối thiểu và thiếu hụt.
- Phân biệt **chỉ tiêu số câu trong ngân hàng** với **số câu lấy cho mỗi đề** ở B4.
- Không mặc định hai số này phải bằng nhau; ngân hàng có thể cần nhiều câu hơn một đề.

### B3. Ngân hàng câu hỏi

- Biên soạn câu hỏi, đáp án, lời giải.
- Gắn bài/CLO/CPI, mức độ năng lực.
- Nhập rubric riêng của câu tự luận nếu có.
- Gửi duyệt, nhận xét, chỉnh sửa theo quy trình hiện hành.
- Có thể tích hợp hoặc dẫn tới chức năng quản lý câu hỏi hiện có; chưa mặc định xây một ngân hàng mới.

### B4. Form đề

- Khai báo phần thi, số câu, điểm, nguồn bài/CPI, mức độ.
- Hỗ trợ biến thể theo hình thức thi và cấu hình đang dùng.
- Kiểm tra khả năng đáp ứng từ ngân hàng.
- Giữ trạng thái duyệt và khóa form đã duyệt theo quy định hiện có.

Có thể lập form trước khi hoàn tất câu hỏi để hướng dẫn biên soạn. Không bắt buộc B3 hoàn tất mới được nhập B4.

### B5. Sinh và quản lý đề

Chỉ sinh khi:

1. Có hoạt động kiểm tra hợp lệ.
2. Có form đề hợp lệ và trạng thái cho phép sử dụng.
3. Có đủ câu hỏi đã duyệt cho từng phần, bài/CPI, mức độ theo form.
4. Các thiết lập cần thiết được xác định rõ nguồn và có giá trị hợp lệ.

Lưu ý: UI hiện chỉ kiểm tra có form và có câu hỏi đã duyệt ở một số luồng. Kiểm tra đủ số lượng theo cấu trúc là yêu cầu cần bổ sung/xác minh, không coi là đã có.

## 6. Phân biệt ma trận và rubric

### Ba loại ma trận

| Loại | Vị trí | Ý nghĩa |
| --- | --- | --- |
| CLO–PLO/PI | A2 | Học phần đóng góp vào chuẩn CTĐT nào |
| CLO–thành phần đánh giá | A4 | Bài kiểm tra nào đánh giá CLO nào |
| Bài/CPI–mức độ–số câu | B2 | Cần phân bổ bao nhiêu câu hỏi theo chuẩn và mức độ |

Tên đề xuất cho tab “Phân bổ câu hỏi CDR”: **Ma trận câu hỏi theo CĐR/CPI**. Có thể dùng nhãn ngắn “Ma trận câu hỏi”, mô tả đầy đủ trong màn hình.

### Hai phạm vi rubric

- **Rubric đánh giá học phần:** gắn với chuyên cần, hoạt động/bài kiểm tra, thi cuối kỳ.
- **Rubric câu hỏi tự luận:** gắn với từng câu hỏi cụ thể.

Không dùng chung một trường cho cả hai. Không mặc định mọi rubric trong Word đều là rubric tiêu chí: phần LMS trong tài liệu mô tả cấu trúc số câu theo mức độ, khác với bảng mức chất lượng của bài thực hành.

## 7. Phân tách Cấu hình hiện tại

| Dữ liệu hiện ở Cấu hình | Nơi đề xuất |
| --- | --- |
| Tỷ lệ điểm thành phần | A4. Thiết kế kiểm tra – đánh giá |
| Danh sách học thuật các bài đánh giá, phương pháp, thời điểm, CLO | A4 |
| Khởi tạo/liên kết các hoạt động kiểm tra trên hệ thống | B1. Thiết lập bài kiểm tra |
| Số đề sinh, thời hạn, gia hạn, tùy chọn vận hành | Thiết lập vận hành |
| Điều kiện chuyên cần | Quy định học phần; thiết lập vận hành sử dụng cùng nguồn nếu có thể |

Không tách tab chỉ bằng giao diện rồi giữ hai form cùng cập nhật dữ liệu không đồng bộ. Cần xác định trách nhiệm ghi từng trường khi triển khai.

## 8. Trạng thái, cảnh báo và trải nghiệm nhập liệu

Mỗi bước hiển thị:

- Chưa nhập / Đang nhập / Đủ dữ liệu / Cần rà soát.
- Trạng thái duyệt riêng, không đồng nhất “đủ dữ liệu” với “đã duyệt”.
- Danh sách thiếu sót có liên kết đến trường/bước liên quan.
- Nút **Lưu và tiếp tục**, **Quay lại**.
- Cho phép lưu nháp, chỉnh sửa bước trước theo quyền.
- Cảnh báo dữ liệu chưa lưu trước khi chuyển màn hình.

Không khóa toàn bộ tab chỉ vì một phần tiên quyết chưa có. Cho xem màn hình, giải thích điều còn thiếu, chỉ chặn hành động không thể thực hiện hợp lệ.

Các kiểm tra đề xuất:

| Nhóm | Kiểm tra |
| --- | --- |
| Thông tin | Mã/tên, tín chỉ hợp lệ, tổng thời lượng theo quy định và đơn vị đo |
| Mục tiêu/CĐR | CO/CLO không trùng mã, CLO có CO, liên kết PLO/PI đúng CTĐT nếu bắt buộc |
| Nội dung | Bài có nội dung, thời lượng, CLO/CPI và học liệu theo yêu cầu; thiếu mục nào báo mục đó |
| Đánh giá | Tổng tỷ lệ cấp học phần 100%; tỷ lệ con khớp nhóm, không cộng trùng tổng nhóm và các bài con |
| Bao phủ CLO | Cảnh báo CLO chưa có hoạt động đánh giá; không ép chuyên cần phải gắn CLO nếu quy định không yêu cầu |
| Rubric | Trọng số tiêu chí hợp lệ theo loại rubric; không ép bảng ma trận câu hỏi thành rubric tiêu chí |
| Form đề | Số câu/điểm hợp lệ, có nguồn bài/CPI, phù hợp hoạt động kiểm tra |
| Sinh đề | Đủ câu hỏi đã duyệt theo từng yêu cầu lấy câu, không chỉ kiểm tra tổng số lớn hơn 0 |

Quy tắc bắt buộc/cảnh báo phải xác nhận theo trường và hình thức đào tạo, không lấy một DOCX làm quy định toàn hệ thống.

## 9. Lộ trình triển khai

### Giai đoạn 1 — Sắp xếp lại chức năng hiện có

Thứ tự tối thiểu, giữ nguyên 7 tab:

1. Thông tin chung.
2. Mục tiêu/CDR.
3. Nội dung.
4. Cấu hình.
5. Ma trận câu hỏi theo CĐR/CPI.
6. Form đề.
7. Kiểm tra - Đánh giá.

Công việc:

- Đưa Cấu hình trước Form đề và Kiểm tra - Đánh giá.
- Đổi nhãn Phân bổ câu hỏi CDR; giữ ID query param hiện có nếu không cần đổi.
- Cảnh báo thiếu dữ liệu kèm nút tới tab tiên quyết.
- Bổ sung điều hướng tiếp theo; xử lý dữ liệu chưa lưu trước khi triển khai nút “Lưu và tiếp tục”.
- Giữ hành vi theo trường/hình thức đào tạo, phân quyền và trạng thái duyệt.
- Không thay API/schema chỉ để đổi thứ tự tab.

### Giai đoạn 2 — Biên soạn đề cương đúng nghiệp vụ

- Chuyển sang điều hướng chia nhóm.
- Tách Thiết kế kiểm tra – đánh giá khỏi Cấu hình.
- Bổ sung ma trận CLO–thành phần đánh giá và rubric cấp học phần.
- Liên kết bài kiểm tra với nội dung/kế hoạch, tránh nhập trùng.
- Bổ sung hoặc tái sử dụng dữ liệu giảng viên, phê duyệt, lịch sử cập nhật.
- Tích hợp rà soát, xem trước và xuất đề cương.
- Xác minh model/API trước khi kết luận các mục mới chỉ cần sửa frontend.

### Giai đoạn 3 — Hoàn thiện ngân hàng và đề

- Tích hợp/lối vào Ngân hàng câu hỏi.
- Làm rõ chỉ tiêu ngân hàng và cấu trúc lấy câu của form.
- Bổ sung kiểm tra đủ câu hỏi đã duyệt theo form.
- Đồng bộ nguồn cấu hình dùng khi sinh đề.
- Tách quản lý đề khỏi thiết kế đánh giá học thuật.

## 10. Phạm vi kỹ thuật và lưu ý khi triển khai

Các file/component liên quan:

- [course-management-detail.ts](../src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.ts): danh sách và chọn tab.
- [course-management-detail.html](../src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.html): điều hướng, vòng đời component con.
- [course-management-detail.css](../src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.css): bố cục header/tab hiện tại.
- [monhoc-thongtin](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/): thông tin học phần và liên kết CTĐT.
- [monhoc-muctieu-cdr](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-muctieu-cdr/): CO/CLO, đối sánh PI.
- [monhoc-noidung](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-noidung/), [chuandaura](../src/app/modules/admin/features/course-management/course-management-detail/children/chuandaura/): bài/CPI, nội dung, thời lượng, phương pháp.
- [monhoc-cauhinh](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-cauhinh/): bài kiểm tra và cấu hình.
- [monhoc-question-cdr](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-question-cdr/): chỉ tiêu câu hỏi.
- [monhoc-formde](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-formde/): cấu trúc đề.
- [monhoc-kiemtra-danhgia](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-kiemtra-danhgia/): triển khai kiểm tra/ngân hàng đề.

Các điểm cần xác minh thêm:

1. **Nguồn cấu hình sinh đề:** Cấu hình học phần lưu `CourseConfig`, nhưng component Kiểm tra đang đọc `NUMOF_TEST_CCTX` từ cấu hình hệ thống trong localStorage. Chưa thể khẳng định giá trị riêng học phần được áp dụng xuyên suốt.
2. **Xuất đề cương:** Chưa có nút xuất Word trong shell 7 tab. Có luồng xuất tại [quanly-noidung-decuong.component.ts](../src/app/modules/admin/features/thongke-solieu-tonghop/quanly-noidung-decuong/quanly-noidung-decuong.component.ts) và [export-noidong-decuong-by-html.service.ts](../src/app/modules/shared/services/export-noidong-decuong-by-html.service.ts); cần kiểm tra trình dựng dữ liệu/mẫu trước khi tái dùng.
3. **Phân quyền:** Một số component con kiểm tra route cũ `/monhoc-*`; đổi bố cục không được coi là đã giải quyết quyền tại `/hoc-phan`.
4. **Đối sánh CTĐT:** CLO có thể liên kết nhiều CTĐT. Phải giữ đúng phạm vi chương trình, không biến đối sánh thành một cột chung mất ngữ cảnh.
5. **Rubric/mức đóng góp/phê duyệt:** Cần xác minh model/API cho dữ liệu cấp học phần, không suy từ rubric của từng câu hỏi.
6. **Vòng đời tab:** Chuyển tab hiện có thể hủy component con; cần thiết kế lưu nháp/cảnh báo trước khi thêm bước tiếp theo.

## 11. Kiểm chứng khi triển khai

- Link cũ có `code`, `tab` vẫn mở đúng học phần/chức năng.
- Đổi thứ tự tab không làm sai keyboard navigation, focus, trạng thái active.
- Màn hình nhỏ không phải kéo ngang qua 10 tab ngang hàng.
- Thiếu tín chỉ/CLO/bài/bài kiểm tra có hướng dẫn rõ nơi bổ sung.
- Cấu hình bài kiểm tra xong, Form đề và Quản lý đề nhìn thấy dữ liệu tương ứng.
- Đổi tab không mất dữ liệu đang nhập mà không cảnh báo.
- Form đã duyệt và quyền chỉ đọc không bị mở khóa sau khi chuyển nhóm.
- Tổng tỷ lệ không tính trùng nhóm kiểm tra thường xuyên và từng bài con.
- Có câu hỏi đã duyệt nhưng thiếu đúng mức độ/CPI vẫn không được coi là đủ để sinh đề.
- Đề cương có thể hoàn tất mà ngân hàng câu hỏi chưa hoàn thành.
- Bản xuất giữ thứ tự trình bày của mẫu, độc lập với thứ tự nhập liệu.
- Kiểm tra các biến thể ICTU/HVU/đào tạo từ xa và các hình thức thi liên quan.

## 12. Phạm vi thực hiện hiện tại

Chỉ lưu phân tích và đề xuất vào tài liệu này. Chưa sửa source code, chưa thay schema/API, chưa triển khai giao diện. Các hạng mục trên là kế hoạch, không phải xác nhận chức năng đã có hoặc đã được kiểm thử.
