# Plan chức năng: Duyệt câu hỏi - màn hình tổng

## Phạm vi
- Folder nguồn: [duyet-cauhoi](src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/)
- Route: `cauhoi` tại [duyetnoidung-routing.module.ts](src/app/modules/admin/features/duyetnoidung/duyetnoidung-routing.module.ts#L22-L25).
- Vai trò: màn hình tổng điều phối các luồng duyệt câu hỏi và cấu trúc đề.

## Chức năng hiện có
- Tải thông tin hội đồng/môn học từ query param `code` và kiểm tra quyền admin/manager/hội đồng thi lãnh đạo/thành viên hội đồng.
- Parse `course.params`, xác định hình thức thi từ `EXAMFORMAT`.
- Tải kế hoạch bài, số lượng câu hỏi đã duyệt/tổng theo tuần và các nhóm đặc biệt: KTTX tự luận, dự án, KTHP trắc nghiệm, KTHP thực hành, cấu trúc đề.
- Import các component con: trắc nghiệm, thường xuyên tự luận, thường xuyên dự án, thực hành KTHP, form đề.

## Kế hoạch hoàn thiện
- Chuẩn hóa mapping giữa `CoursePlanActivities.type/week/order` và component con được render.
- Làm rõ điều kiện xuất hiện từng mục đặc biệt: `THUONGXUYEN_TULUAN`, `THUONGXUYEN_DUAN`, tuần 100, tuần 1000, form đề.
- Đảm bảo count `questions_duyet/questions_tong` thống nhất với dữ liệu component con.
- Thêm thông báo lỗi/tắt loading ở nhánh load kế hoạch đang để trống.

## Tiêu chí hoàn thành
- Màn hình trái hiển thị đủ nhóm duyệt phù hợp cấu hình môn học.
- Chọn một mục hiển thị đúng component con và truyền đủ `selectedCourse`, `activity`, `listThamDinh`.
- Người không thuộc hội đồng hoặc không có vai trò hợp lệ bị chặn.

## Rủi ro / câu hỏi mở
- Cần xác nhận `exam_format` và `exam_type` ưu tiên thế nào khi cả hai cùng tồn tại.
- Cần xác nhận `course.params` luôn là JSON hợp lệ trước khi parse.
