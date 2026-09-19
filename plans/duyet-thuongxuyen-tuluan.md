# Plan chức năng: Duyệt thường xuyên tự luận

## Phạm vi
- Folder nguồn: [duyet-thuongxuyen-tuluan](src/app/modules/admin/features/duyetnoidung/duyet-thuongxuyen-tuluan/)
- Component con của [duyet-cauhoi](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/).
- Vai trò: duyệt đề/câu hỏi tự luận thường xuyên theo kỹ năng/hoạt động.

## Chức năng hiện có
- Nhận `selectedCourse`, `planTuluan`, `listThamDInh` qua `@Input`.
- Tải các activity type `THUONGXUYEN_TULUAN`, danh sách đề tự luận và comment hội đồng.
- Đánh dấu mỗi đề đã được người dùng/hội đồng nhận xét hay chưa.
- Cho phép mở chi tiết trong side navigation, nhận xét, reply, duyệt/yêu cầu sửa, đưa về chờ duyệt, khóa/mở hàng loạt.

## Kế hoạch hoàn thiện
- Chuẩn hóa tên biến/đầu vào `listThamDInh` để tránh nhầm chính tả khi dùng từ template cha.
- Đảm bảo trạng thái filter “chưa nhận xét/chưa duyệt/đã duyệt” hoạt động thống nhất với trắc nghiệm.
- Rà soát thao tác khóa/mở hàng loạt để không khóa nội dung chưa từng duyệt (`old_status !== 1`).
- Bổ sung xử lý lỗi/tắt loading cho các nhánh API đang để trống.

## Tiêu chí hoàn thành
- Danh sách kỹ năng và đề tự luận tải đúng theo `planTuluan`.
- Người dùng xem được chi tiết đề, nhận xét/reply, duyệt/yêu cầu sửa.
- Các bộ lọc trạng thái phản ánh đúng dữ liệu hiện tại.

## Rủi ro / câu hỏi mở
- Cần xác nhận `course_plan_activity_id` của đề tự luận luôn trỏ về activity kỹ năng, không trỏ trực tiếp plan cha.
- Cần xác nhận nội dung tự luận có yêu cầu file/media cần preview riêng không.
