---
title: 'Bỏ ký hiệu và ordering PLO/PI mẫu của Bộ CTĐT'
type: 'feature'
created: '2026-10-27'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '6a6bbc31590f2c6109e79c35c831802f74e008df'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** PLO/PI trong Bộ CTĐT còn hiển thị, tạo và kiểm tra ký hiệu/ordering dù biểu mẫu đã bắt đầu bỏ hai trường này. PI không có ô nhập tỷ lệ %, khiến không thể tạo PI hợp lệ hoặc cập nhật tỷ lệ.

**Approach:** PLO/PI mẫu của Bộ CTĐT chỉ nhập nội dung; PI nhập thêm tỷ lệ %. Bỏ mã và ordering khỏi payload Bộ CTĐT, bảng, nhãn hành động, truy vấn/sắp xếp và các bước tạo mã. Khi chọn mẫu để sao chép sang một CTĐT, tạo ký hiệu/ordering riêng cho CTĐT dựa trên vị trí PI trong mẫu; không phụ thuộc mã/thứ tự nguồn.

## Boundaries & Constraints

**Always:** Giữ quan hệ cha/con qua `parent_id`, tỷ lệ PI nguyên từ 0–100 và tổng tỷ lệ theo PLO; giữ PEO, mã/order và luồng chống ghi trùng của CTĐT đích. Không đụng các thay đổi đang dở khác trong working tree; không commit/push.

**Never:** Không gửi mã/order rỗng hoặc mã giả cho API Bộ CTĐT. Không sửa schema/backend hay xóa dữ liệu cũ. Không chuyển thay đổi này sang PLO/PI riêng của CTĐT.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| PLO_MỚI | Nội dung hợp lệ | Tạo PLO với `ctdt_bo_id`, `noidung`, `parent_id=0`, `percent_pi=0`; không có `kyhieu`/`ordering` | Giữ bản nháp nếu API lỗi |
| PI_MỚI_SỬA | PI có tỷ lệ nguyên 0–100 | Tạo/cập nhật với `parent_id` và đúng tỷ lệ đã nhập; hiển thị tỷ lệ/tổng | Từ chối rỗng, ngoài khoảng, không nguyên; giữ bản nháp khi lỗi |
| MẪU_CŨ_MỚI | Bản ghi nguồn có hoặc thiếu mã/order | Hiển thị và sao chép cùng nội dung, phần trăm; CTĐT đích tự cấp thứ tự PI 1..n | Từ chối nguồn sai parent/nội dung/tỷ lệ; giữ an toàn đối chiếu ghi một phần |

</frozen-after-approval>

## Code Map

- `src/app/modules/admin/features/bo-ctdt/bo-ctdt/bo-ctdt-cdr/bo-ctdt-cdr.component.ts` — form hiện có `percent_pi`/`noidung`; bỏ `resolveNextOrdering`, tạo mã, sort; lấy phần trăm từ form khi lưu. Giữ bảo vệ quyền/ngữ cảnh, chống xóa PLO có PI và báo tổng.
- `src/app/modules/admin/features/bo-ctdt/bo-ctdt/bo-ctdt-cdr/bo-ctdt-cdr.component.html` và `.css` — bỏ cột mã/order; giữ phân cấp bằng thụt nội dung PI; thêm ô nhập % PI và lỗi; giữ 3 cột Nội dung/%/Thao tác.
- `src/app/modules/shared/models/bo-ctdt-cdr.ts`, `src/app/modules/shared/services/ctdt-bo-cdr.service.ts` — tách kiểu payload ghi không có mã/order; dữ liệu đọc legacy có thể vẫn có hai trường tùy chọn.
- `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-cdr/ctdt-cdr.component.ts` — tải mẫu không sort/order theo nguồn; chọn PI đích theo index; giữ sinh mã/order CTĐT, đối chiếu `findCopyRow`, `sameCopyRow` và phép kiểm tra trùng.
- `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-cdr/ctdt-cdr.component.html` — preview mã PI dùng vị trí nguồn, không đọc `pi.ordering`.
- Hai `*.component.spec.ts` cạnh các component trên — sửa kỳ vọng cũ và bao phủ matrix.

## Tasks & Acceptance

**Execution:**
- [x] Cập nhật model/service và CRUD Bộ CTĐT: bỏ mã/order, lưu `% PI` từ form, giữ bảo vệ dữ liệu.
- [x] Cập nhật giao diện Bộ CTĐT: bảng 3 cột, ngữ cảnh PLO/PI rõ, ô `% PI` bắt buộc có lỗi.
- [x] Cập nhật consumer mẫu CTĐT: không đọc mã/order nguồn; cấp thứ tự PI đích theo index và giữ retry.
- [x] Cập nhật unit tests cho các ca trong matrix; chạy TypeScript, test liên quan và Angular build.

**Acceptance Criteria:**
- Given Bộ CTĐT có PLO/PI, when xem/thêm/sửa/xóa, then không cần và không hiển thị ký hiệu hay ordering; PI lưu đúng tỷ lệ nhập.
- Given mẫu Bộ không có ký hiệu/order, when chọn sao chép vào CTĐT, then CTĐT nhận PLO/PI với mã/order riêng và phần trăm nguồn; xử lý ghi dở vẫn giữ hành vi đối chiếu an toàn.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx tsc -p tsconfig.app.json --noEmit` và `npx tsc -p tsconfig.spec.json --noEmit` — không có lỗi.
- `npm test -- --watch=false --browsers=ChromeHeadless` với `--include` cho hai spec liên quan — đều qua.
- `npm run build -- --configuration development-lowram` — build thành công.
- `git diff --check` — không có lỗi whitespace mới.

**Manual checks:**
- Backend của `ctdt-bo-cdr/` không nằm trong repo này: cần xác nhận endpoint chấp nhận payload không có `kyhieu`/`ordering` khi thử với dữ liệu thật.
