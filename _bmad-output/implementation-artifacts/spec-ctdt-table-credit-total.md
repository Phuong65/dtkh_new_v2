---
title: 'Tính tổng tín chỉ CTĐT theo phân loại khối'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tổng tín chỉ hiển thị trong bảng CTĐT hiện cộng tín chỉ của tất cả học phần, làm khối tự chọn bị tính theo toàn bộ môn được liệt kê thay vì số tín chỉ dự kiến.

**Approach:** Tính tổng bằng tín chỉ thực tế của các học phần thuộc khối bắt buộc cộng với tín chỉ dự kiến của các khối tự chọn. Giữ nguyên cách trình bày hiện có và hiển thị trạng thái chưa có dữ liệu nếu không tải được dữ liệu cần thiết.

</frozen-after-approval>

## Implementation Notes

- Tái sử dụng `ctdtDisplayMeta` và `loadCtdtCredits()` đang có trong `src/app/modules/admin/features/bo-ctdt/ctdt.component.ts`; bổ sung tải cấu hình `KHOI_KIEN_THUC` theo các CTĐT hiển thị để phân loại link học phần.
- Ưu tiên `params.loai_khoi` (`TU_CHON`/`BAT_BUOC`); tương thích dữ liệu cũ bằng key `TUCHON` hoặc tên “Môn tự chọn”/“Học phần tự chọn”. Các khối không nhận diện là tự chọn được tính như bắt buộc.
- Với khối bắt buộc, cộng `course.params.sotinchi` của từng học phần liên kết duy nhất trong CTĐT. Với khối tự chọn, bỏ qua số tín chỉ các học phần được liệt kê và cộng `params.sotinchi_dukien`, fallback sang `sotinchi_dukien` cấp cao nhất; giá trị thiếu/không hợp lệ tính 0.
- Giữ nguyên nội dung cột và xử lý lỗi tải; không đổi dữ liệu lưu, API hay các thay đổi giao diện đã có sẵn của bảng CTĐT.
- Bổ sung kiểm thử cho hỗn hợp bắt buộc/tự chọn, fallback legacy, học phần trùng, thiếu tín chỉ dự kiến và lỗi tải cấu hình. Chạy spec CTĐT và Angular build.
- Đã tải `KHOI_KIEN_THUC` theo các CTĐT đang hiển thị; tổng tín chỉ phân loại bằng `params.loai_khoi`, fallback legacy, bỏ tín chỉ khóa tự chọn khỏi links và cộng dự kiến một lần theo khóa khối. Khóa so sánh được chuẩn hóa để không phụ thuộc chữ hoa/thường; nếu một môn trùng ở nhiều link và có ít nhất một khối bắt buộc, tính tín chỉ thực tế đúng một lần.
- Lỗi tải dữ liệu tín chỉ giữ tổng ở trạng thái chưa xác định và có thông báo; lỗi tải ngành/khoa/hệ đào tạo không làm mất tổng tín chỉ.
- Đã bổ sung kiểm thử các nhánh tính tổng, khóa/phân loại legacy, fallback tín chỉ dự kiến, link trùng, lỗi API và tính độc lập với metadata phụ.
- Xác minh: `ctdt.component.spec.ts` đạt 23/23; `npm run build` thành công.

## Review Triage Log

- false — Học phần có `status = -1` bị lọc khỏi dữ liệu khóa học; đây là trạng thái không còn hoạt động và các màn quản lý học phần cũng loại trạng thái này.
- patched — Lỗi tải ngành/khoa/hệ đào tạo trước đây có thể làm tổng tín chỉ mất theo; tách lỗi metadata phụ, hiển thị cảnh báo và vẫn giữ tổng khi tải tín chỉ thành công.
- patched — Chuẩn hóa key khối cho cả cấu hình và liên kết bằng trim/uppercase để cấu hình tự chọn vẫn khớp khi khác hoa/thường.
- false — Vẫn cần tải cấu hình khi CTĐT chưa có học phần liên kết để cộng tín chỉ dự kiến của khối tự chọn; không gọi tải khóa học nếu không có link.
- false — Khóa học không còn khả dụng không có số tín chỉ hợp lệ để cộng; hành vi giữ số 0 tương thích với danh sách khóa học hiện hành vốn lọc trạng thái xóa.
- patched — Gộp link theo cặp CTĐT/môn học; nếu dữ liệu trùng nhiều khối, khối bắt buộc thắng nên kết quả không phụ thuộc thứ tự response.
- false — Đã có `countedElectiveBlocks` chống cộng lặp cấu hình cùng key; bổ sung kiểm thử xác nhận.
- patched — Giá trị dự kiến trong params rỗng/không hợp lệ không che khuất giá trị legacy hợp lệ ở trường cấp cao nhất.
- patched — Bổ sung test cho lỗi tải môn học, lỗi metadata phụ, duplicate configs, link phân loại hỗn hợp và khóa khác hoa/thường; status `-1` vẫn được loại theo điều kiện truy vấn.
- false — Finding về retry danh sách môn học/quan hệ không liên quan tới tổng tín chỉ bảng CTĐT; không có luồng retry này trong phần thay đổi.
