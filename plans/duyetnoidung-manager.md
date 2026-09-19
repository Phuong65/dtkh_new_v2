# Plan chức năng: Quản lý danh sách duyệt nội dung

## Phạm vi
- Folder nguồn: [duyetnoidung-manager](src/app/modules/admin/features/duyetnoidung/duyetnoidung-manager/)
- Route: route rỗng trong [duyetnoidung-routing.module.ts](src/app/modules/admin/features/duyetnoidung/duyetnoidung-routing.module.ts#L10-L13).
- Vai trò: màn hình tổng hợp hội đồng/môn học cần duyệt và điều hướng sang các luồng duyệt chi tiết.

## Chức năng hiện có
- Dùng các service hội đồng thẩm định, hội đồng thẩm định môn học, câu hỏi, tự luận để lấy dữ liệu tổng quan.
- Có phân quyền theo vai trò quản trị/đào tạo/hội đồng qua `AuthService` và `ROLES`.
- Có bảng PrimeNG để hiển thị, lọc, điều hướng theo trạng thái/nội dung.

## Kế hoạch hoàn thiện
- Chuẩn hóa bộ lọc danh sách theo hội đồng, môn học, trạng thái duyệt và deadline.
- Bổ sung quy ước thống nhất cho các chỉ số tổng quan: số mục chờ duyệt, đã duyệt, yêu cầu sửa.
- Làm rõ từng action điều hướng sang `celo`, `baigiang`, `cauhoi` cần truyền query param `code` là `hoidong_thamdinh_monhoc_id`.
- Tách các phép tính thống kê phức tạp ra hàm nhỏ trong component nếu cần mở rộng nhưng không tạo service mới khi chưa cần.

## Tiêu chí hoàn thành
- Người có quyền thấy đúng danh sách môn/hội đồng được phân công.
- Người không đủ quyền không truy cập được dữ liệu ngoài phạm vi.
- Từ mỗi dòng có thể đi đến đúng màn hình duyệt chi tiết tương ứng.

## Rủi ro / câu hỏi mở
- Cần xác nhận quy tắc deadline và các trạng thái tổng hợp cuối cùng từ nghiệp vụ.
- Có `console.log` trong component hiện tại; khi chỉnh code nên dọn nếu không còn dùng.
