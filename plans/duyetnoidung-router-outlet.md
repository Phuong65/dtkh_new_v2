# Plan chức năng: Duyệt nội dung - Router Outlet

## Phạm vi
- Folder nguồn: [duyetnoidung-router-outlet](src/app/modules/admin/features/duyetnoidung/duyetnoidung-router-outlet/)
- Vai trò: shell component chứa router outlet cho module duyệt nội dung.
- Route cha được cấu hình tại [duyetnoidung-routing.module.ts](src/app/modules/admin/features/duyetnoidung/duyetnoidung-routing.module.ts#L4-L27), có `AdminGuard` cho child routes.

## Chức năng hiện có
- Là entry layout cho các màn hình con: danh sách duyệt nội dung, duyệt CPI/CDR, duyệt bài giảng, duyệt câu hỏi.
- Tách shell route khỏi các component nghiệp vụ để lazy-load từng màn hình.

## Kế hoạch hoàn thiện
- Giữ component shell tối giản, không đặt logic nghiệp vụ tại đây.
- Kiểm tra template chỉ chứa vùng render child route và layout chung nếu có.
- Nếu thêm route mới trong module duyệt nội dung, chỉ cập nhật routing và giữ shell không phụ thuộc trực tiếp component con.

## Tiêu chí hoàn thành
- Truy cập `/admin/.../duyetnoidung` render đúng màn hình manager mặc định.
- Các route con render trong cùng shell và vẫn chịu `AdminGuard`.

## Rủi ro / câu hỏi mở
- Cần xác nhận URL đầy đủ từ module cha để ghi test case điều hướng chính xác.
