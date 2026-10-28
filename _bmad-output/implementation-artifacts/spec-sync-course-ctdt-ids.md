---
title: 'Đồng bộ ctdt_ids khi thêm hoặc gỡ học phần'
type: 'bugfix'
created: '2026-10-28'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Khi học phần được thêm vào hoặc gỡ khỏi một CTĐT, hệ thống mới thay đổi liên kết `ctdt-hocphan` nhưng chưa cập nhật danh sách CTĐT của học phần, đồng thời model vẫn giữ trường đơn `ctdt_id`.

**Approach:** Thay trường học phần `ctdt_id` bằng `ctdt_ids`; khi thêm, bổ sung ID CTĐT hiện tại một lần và giữ các ID khác; khi gỡ, chỉ loại ID hiện tại khi học phần không còn liên kết nào khác trong CTĐT đó. Luồng xóa cả khối kiến thức áp dụng cùng quy tắc.

</frozen-after-approval>

## Implementation Notes

- Tiếp tục từ thay đổi chưa commit trong `ctdt-noidung.component.ts` và `elng-khoa-hoc.ts`; không ghi đè phần đã làm.
- Hoàn thiện migration trạng thái `stagedDeletes` sang `{ linkId, course, linkDeleted }` để có thể thử lại an toàn nếu xóa liên kết thành công nhưng cập nhật khóa học lỗi.
- Đồng bộ khóa học bằng `ElnKhoaHocService.updateElnKhoaHoc`; chuẩn hóa ID số hợp lệ, khử trùng, giữ mọi `ctdt_ids` không liên quan.
- Không persist `ctdt_ids` tổng hợp của dòng học phần mới; lấy trạng thái khóa học hiện tại trước khi tính danh sách mới.
- Cập nhật cả `saveCourseDetails()` và `buildDeleteKhoiOperation()`; không đổi ý nghĩa `ctdt_id` trên bảng liên kết/cấu hình CTĐT.
- Cập nhật unit test hiện có, bổ sung ca giữ ID khác, tránh trùng, xóa đúng ID và retry ghi dở.
- Xác minh bằng TypeScript app/spec, unit test liên quan, Angular development build và `git diff --check`.
- Đã hoàn thiện trạng thái thêm/xóa hai bước (`linkCreated`/`linkDeleted` và `membershipSynced`) để retry không tạo/xóa trùng liên kết sau lỗi cập nhật khóa học.
- Đồng bộ `ctdt_ids` luôn đọc lại khóa học mới nhất, chuẩn hóa số nguyên dương, khử trùng; thao tác gỡ kiểm tra lại các liên kết còn tồn tại trong cùng CTĐT trước khi bỏ ID.
- Luồng xóa cả khối dùng cùng phép xóa liên kết + đồng bộ membership, giữ trạng thái retry khi một cập nhật khóa học lỗi.
- Model `ElnKhoaHoc` đã bỏ `ctdt_id` đơn; các `ctdt_id` trên `CtdtHocphan`, `CtdtConfig` và bản ghi con vẫn giữ nguyên vì là khóa ngoại hợp lệ.
- `npx tsc -p tsconfig.app.json --noEmit` và `npx tsc -p tsconfig.spec.json --noEmit` đã qua sau chỉnh sửa cuối; `git diff --check` không có lỗi whitespace (chỉ cảnh báo LF/CRLF).
- Theo yêu cầu mới của người dùng: không chạy spec test. Chỉ chỉnh hai kỳ vọng test có sẵn cho kiểu staged deletion mới; không thêm suite mới.
- Review agent bị giới hạn worktree cũ, không đọc được diff chính; kiểm tra nội tuyến phát hiện và sửa tình huống gỡ một học phần đã POST liên kết thành công nhưng cập nhật membership lỗi: loại staged add trước khi staged delete.
- Có thay đổi đồng thời không thuộc phiên này tại `course-management.component.ts` (lọc `ctdt_ids` bằng `like`); giữ nguyên, không ghi đè.
- Không commit/push vì người dùng chưa yêu cầu.
