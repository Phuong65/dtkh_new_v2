---
title: 'Đặt mặc định khối Học phần tự chọn cho CTĐT'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Mặc định khối kiến thức của CTĐT chưa nhất quán về tên và phân loại cho khối tự chọn.

**Approach:** Trong cấu hình mặc định áp dụng cho CTĐT mới, bảo đảm có khối `TUCHON` tên “Học phần tự chọn” với `params.loai_khoi` là `TU_CHON`. Đổi nhãn “Môn tự chọn” thành “Học phần tự chọn” ở danh mục tĩnh liên quan, nhưng không sửa các cấu hình khối đã được lưu của CTĐT hiện hữu.

</frozen-after-approval>

## Implementation Notes

- Dùng `TUCHON` làm định danh của khối; giữ các giá trị params khác nếu khối đã có sẵn, chỉ bổ sung `loai_khoi: 'TU_CHON'` khi thiếu hoặc không hợp lệ.
- Áp dụng chuẩn hóa khi hiển thị/tạo bộ khối mặc định trong cả tab Cấu hình và tab Khung chương trình. Chỉ bổ sung mặc định khi CTĐT chưa có cấu hình khối riêng và không có marker biểu thị người dùng đã xóa toàn bộ khối.
- Nếu danh sách mặc định đã có key `TUCHON`, cập nhật nhãn thành “Học phần tự chọn” mà không tạo dòng trùng; nếu chưa có thì thêm một dòng ở cuối với thứ tự tiếp theo.
- Bảo toàn params và tín chỉ dự kiến hiện có khi map mặc định sang cấu hình CTĐT. Không đổi tên các cấu hình đã lưu; vẫn nhận diện tên cũ để tương thích dữ liệu hiện hữu.
- Files dự kiến: `src/app/modules/shared/utils/syscat.ts`, `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-cauhinh/ctdt-cauhinh.component.ts`, `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-cauhinh/ctdt-cauhinh.component.spec.ts`, `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-noidung/ctdt-noidung.component.ts`, `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-noidung/ctdt-noidung.component.spec.ts`.
- Kiểm thử trường hợp API mặc định thiếu/có sẵn khối `TUCHON`, kiểm tra tên, phân loại, params/tín chỉ được giữ, và không bổ sung khối khi có cấu hình riêng hoặc empty marker. Chạy test component liên quan và Angular build.
- Đã chuẩn hóa mặc định tại cả hai tab: thêm khối thiếu hoặc đổi tên/loại khối `TUCHON` sẵn có; tab Cấu hình giờ cũng giữ `params`, `value` và tín chỉ khi map dữ liệu. Danh mục `KHOI_KIEN_THUC` dùng nhãn mới; tên cũ vẫn được nhận diện khi đọc dữ liệu cũ.
- Test hai component đạt 25/25; Angular build thành công.

## Review Triage Log

- patched — Guard trường hợp item mặc định thiếu key trong tab Cấu hình; tránh lỗi mới do gọi `toLocaleUpperCase()` không kiểm tra.
- deferred — Việc xóa khối cuối ở tab Cấu hình không tạo empty marker nên mặc định hiện lại; lỗi có sẵn, được ghi trong `deferred-work.md`.
- false — Cấu hình riêng không được tự đổi tên/phân loại; giữ nguyên dữ liệu đã lưu là ranh giới đã thống nhất.
- false — Route `chuongtrinh-daotao` đang tải component `bo-ctdt/ctdt.component`; module cũ được review không phải route đang dùng.
- false — Tương tự finding trên: màn hình nội dung đang hoạt động là tab `bo-ctdt` được chỉnh trong task này, không phải component module cũ.
- false — Mapping giữ nguyên params, value và tín chỉ; xác thực thêm trường của cấu hình API không thuộc yêu cầu.
- deferred — Thiếu test xóa khối cuối cùng cùng root cause với marker bị thiếu; hành vi đã ghi trong `deferred-work.md`.
- patched — Bổ sung kiểm thử khi payload defaults không phải mảng cho cả hai tab.
- false — Template API hiện có schema key/title; truy cập các trường này vốn đã được giả định trước thay đổi, không phải hồi quy của việc chuẩn hóa.
- deferred — Nhiều request lưu cấu hình có thể hoàn tất một phần khi request khác lỗi; giới hạn có sẵn, được ghi trong `deferred-work.md`.
