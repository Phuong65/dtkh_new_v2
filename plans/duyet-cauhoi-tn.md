# Plan chức năng: Duyệt câu hỏi trắc nghiệm

## Phạm vi
- Folder nguồn: [duyet-cauhoi-tn](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-tn/)
- Component con của [duyet-cauhoi](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/).
- Vai trò: duyệt câu hỏi trắc nghiệm theo CDR/hoạt động, xem kết quả test và nhận xét hội đồng.

## Chức năng hiện có
- Nhận `courseSelected`, `activity`, `hoidong` qua `@Input`.
- Tải CDR, câu hỏi theo `reference = course_plan_activities`, comment hội đồng, cấu hình `TIME_FOR_TEST`, cấu hình `CHECK_DUYET_HOIDONG_BY_CHUTICH`, kết quả test giáo viên.
- Hỗ trợ nhiều kiểu câu hỏi view từ `cauhoi-tracnghiem-v2/question-types-view`.
- Với `course.av === 1`, câu cha là đầu mối UI; hiển thị, kiểm thử, thống kê và cập nhật trạng thái theo toàn bộ nhóm cha/con.
- Nhận xét yêu cầu đã có kết quả test, trừ câu từng được duyệt, câu clone hoặc khi `APP_CONFIGS.no_test_question` bật.
- Trước khi mở hoặc cập nhật, truy theo chuỗi `question_root_id` để chuyển đến phiên bản mới nhất.
- Cho phép chọn câu hỏi, nhận xét, reply, duyệt/yêu cầu sửa, khóa/mở từng nhóm và hàng loạt, duyệt tất cả; thao tác hàng loạt dùng snapshot mới và loại câu đã xóa.
- Trạng thái: `0` chờ duyệt, `1` duyệt, `-1/-2` yêu cầu sửa/đã sửa, `-3` xóa.

## Kế hoạch hoàn thiện
- Kiểm thử thủ công luồng tiếng Anh và môn khác khi được phép chạy ứng dụng.
- Bổ sung unit test khi dự án có test harness cho standalone component này.

## Tiêu chí hoàn thành
- Câu hỏi hiển thị đúng theo CDR và nhóm câu hỏi cha/con.
- Hội đồng nhận xét và phản hồi được theo đúng vai trò, danh tính hiển thị đúng.
- Duyệt/yêu cầu sửa/hủy trạng thái từng câu và hàng loạt cập nhật đúng backend, reload danh sách thành công.
- Báo cáo lỗi câu hỏi được tổng hợp và hiển thị khi có dữ liệu report.

## Rủi ro / câu hỏi mở
- Cần xác nhận cấu hình chủ tịch hội đồng có bắt buộc duyệt sau cùng không.
