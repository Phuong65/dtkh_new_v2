# `view-tracnghiem-tuluan` — xem kết quả trắc nghiệm

## Mục tiêu hiện tại

Modal chỉ hiển thị phần trắc nghiệm và kết quả số câu đúng trên tổng số câu.

Vị trí:

`src/app/modules/admin/features/lop-hoc-phan/class-details/view-tracnghiem-tuluan/`

## Quyết định đã chốt

- Bỏ toàn bộ tính năng chấm điểm khỏi modal xem bài.
- Bỏ hiển thị điểm từng câu.
- Bỏ hiển thị tổng điểm bài kiểm tra.
- Bỏ toàn bộ nội dung tự luận: câu hỏi, bài làm, điểm và phản hồi.
- Chỉ hiển thị kết quả trắc nghiệm theo dạng `số câu đúng / tổng số câu`.
- Giữ hiển thị chi tiết câu hỏi, đáp án sinh viên, đáp án đúng và trạng thái đúng/sai của trắc nghiệm.
- Không xóa các luồng chấm tự luận hoặc chấm AI ở màn hình khác.

## Thay đổi đã thực hiện

### `view-tracnghiem-tuluan.component.ts`

- Gỡ input và state liên quan đến tự luận, trạng thái chấm và tổng điểm.
- Gỡ map câu trả lời/điểm tự luận cùng logic chuẩn hóa tương ứng.
- Giữ logic chuẩn bị và đếm kết quả trắc nghiệm.

### `view-tracnghiem-tuluan.component.html`

- Header chỉ hiển thị `Kết quả: đúng / tổng`.
- Gỡ khối tổng điểm `/10`.
- Gỡ toàn bộ section tự luận.
- Giữ nguyên hai kiểu hiển thị trắc nghiệm theo `_av`.

### `view-tracnghiem-tuluan.component.css`

- Gỡ toàn bộ style của phần tự luận và điểm.
- Giữ style header kết quả và nội dung trắc nghiệm.

### `theodoi-kiemtra-daugio`

- Modal không truyền câu hỏi tự luận, trạng thái chấm hoặc tổng điểm vào component.
- Modal không gọi API lấy chi tiết câu hỏi tự luận.
- Vẫn tải answer để đối chiếu câu trả lời trắc nghiệm.
- Nút xem bài chỉ khả dụng khi bài đã nộp và có câu trắc nghiệm; bài chỉ có tự luận không mở modal rỗng.
- Điều hướng trước/sau chỉ đi qua các bài có câu trắc nghiệm.

## Tiêu chí nghiệm thu

- [x] Không hiển thị điểm từng câu.
- [x] Không hiển thị tổng điểm.
- [x] Không hiển thị phần tự luận.
- [x] Chỉ hiển thị số câu trắc nghiệm đúng trên tổng.
- [x] Chi tiết trắc nghiệm giữ nguyên.
- [x] Modal không tải chi tiết câu hỏi tự luận.
- [x] Bài chỉ có tự luận không mở modal rỗng.
- [ ] Kiểm tra giao diện runtime trên desktop và mobile.

## Kiểm chứng

- Đã rà soát tĩnh tham chiếu trong component và modal cha.
- Chưa chạy build, test hoặc ứng dụng theo quy ước kiểm tra tĩnh mặc định.

## Câu hỏi mở

Không có.
