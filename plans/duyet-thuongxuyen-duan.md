# Plan chức năng: Duyệt thường xuyên dự án

## Phạm vi
- Folder nguồn: [duyet-thuongxuyen-duan](src/app/modules/admin/features/duyetnoidung/duyet-thuongxuyen-duan/)
- Component con của [duyet-cauhoi](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/).
- Vai trò: duyệt đề/nội dung dự án và tiêu chí chấm liên quan.

## Chức năng hiện có
- Nhận `selectedCourse`, `planTuluan`, `listThamDInh` qua `@Input`.
- Tải activity type `THUONGXUYEN_DUAN`, tách activity `ordering === 0` làm đề dự án và các activity khác làm tiêu chí chấm.
- Tải đề dự án, comment/reply hội đồng, và tiêu chí chấm theo `course_plan_activity_tuluan_id`.
- Cho phép nhận xét, reply, duyệt/yêu cầu sửa, đưa về chờ duyệt, khóa/mở hàng loạt.

## Kế hoạch hoàn thiện
- Làm rõ cấu trúc dữ liệu dự án: activity nào là đề chính, activity nào là tiêu chí chấm.
- Hiển thị tiêu chí chấm gắn đúng đề được chọn và xử lý trường hợp chưa có tiêu chí.
- Chuẩn hóa trạng thái và thao tác hàng loạt giống tự luận thường xuyên.
- Rà soát quyền hiển thị danh tính hội đồng và giảng viên phản hồi.

## Tiêu chí hoàn thành
- Chọn đề dự án hiển thị đầy đủ nội dung, nhận xét và tiêu chí chấm.
- Thao tác duyệt/yêu cầu sửa cập nhật đúng `CoursePlanActivityTuluan`.
- Khóa/mở hàng loạt có progress và reload dữ liệu sau khi xong.

## Rủi ro / câu hỏi mở
- Cần xác nhận dự án chỉ có một đề chính `ordering === 0` hay có thể nhiều đề.
- Cần xác nhận tiêu chí chấm có bắt buộc tồn tại trước khi duyệt đề không.
