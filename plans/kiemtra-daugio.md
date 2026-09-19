# Kế hoạch: Kiểm tra đầu giờ (kt-daugio)

## Mô tả

Hiển thị danh sách các tuần học trong học phần, cho phép giảng viên xem/tạo bài kiểm tra đầu giờ (15 phút) cho từng tuần. Là màn hình tổng quan trước khi vào chi tiết từng bài KT đầu giờ.

## Files

| File | Vai trò |
|---|---|
| `kiemtra-daugio.component.ts` | Logic chính: lấy kế hoạch tuần, ngân hàng đề DG, kiểm tra bài test đã tạo |
| `kiemtra-daugio.component.html` | Grid 3 cột, mỗi card là 1 tuần, link đến `/kt-daugio`, overlay + icon trạng thái |
| `kiemtra-daugio.component.css` | Style card, overlay, màu sắc trạng thái |

## Luồng xử lý (initData)

1. **CoursePlanActivitiesService** — lấy các tuần của môn (ordering 1-99), select: `title, id, week, ordering`
2. **CoursePlanBankService** — lấy ngân hàng đề DG (`bank_type = 'DG'`), group theo week → gán flag `has_test`
3. **ClassPlanActivityStudentTestsService** — với mỗi tuần, kiểm tra bản ghi `type = 'KT_DAUGIO'` → gán flag `test_already`
4. Xoá item cuối (row tổng kết) khỏi danh sách

## Trạng thái card

| Flag | UI |
|---|---|
| `has_test = true` | Link sáng, click được |
| `has_test = false` | Link mờ (`fade-color`) + overlay "Chưa được tạo đề" |
| `test_already = true` | Icon `fa-check-square-o` xanh (góc phải trên) |
| `test_already = false` | Không icon |

## Dependencies

| Service | Import | Trạng thái |
|---|---|---|
| `CoursePlanActivitiesService` | ✅ Dùng | OK |
| `ClassPlanActivityStudentTestsService` | ✅ Dùng | OK |
| `CoursePlanBankService` | ✅ Dùng | OK |

## Ghi chú

- `splice(-1, 1)` giữ hardcode — xoá row tổng kết cuối mảng tuần
- Route `/kt-daugio` đã tồn tại
- Chỉ dùng `notificationService.isProcessing` global, không loading skeleton riêng
