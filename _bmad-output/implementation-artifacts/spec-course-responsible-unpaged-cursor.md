---
title: 'Người phụ trách và cursor cho Course Management'
type: 'feature'
created: '2026-11-03'
status: 'in-progress'
route: 'dispatch'
baseline_commit: 'af725a2984df29ce8a6ee9cc17e6b288afe22aab'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Tab Thông tin chung thiếu Người phụ trách; truy vấn lookup chưa dùng cursor. Người dùng chọn cho phép chỉnh sửa, scope Course Management, làm cả hai phần và giữ các thay đổi hiện có.

**Approach:** Thêm dropdown `creator_plan_id`; bổ sung `cursor=0` cho lookup không phân page. Xác nhận cuối cùng: **đã phân page thì không cursor**. Kế hoạch đã được duyệt qua ExitPlanMode.

## Boundaries & Constraints

**Always:** Làm trong checkout chính `E:/New folder (3)/dtkh_new_v2`; không dùng bản worktree cũ. Đọc bản hiện tại trước sửa. Người phụ trách = `creator_plan_id`, không phải `creator_id`. Quyền mới: `isManager && (auth.userCanEdit('dao-tao/course-management') || auth.userCanEdit('quanly-monhoc'))`. Các vai trò khác chỉ xem. Dùng convention danh sách giảng viên `teacher=1`, `select=user_id`, `with=user`, `limit=-1`; bỏ chọn `null` như form cũ. Lookup ID có thể dùng `limit=1,cursor=0`.

**Never:** Không thêm cursor vào request có page/paged/offset/start hoặc `limit=-1` đang được interceptor tải tiếp bằng paged. Giữ request đã có cursor; không chỉnh interceptor/shared service mặc định, API ghi/tải file, feature cũ hoặc component ngoài subtree. Không đổi quyền trường khác, CTĐT, phân trang danh sách. Không commit/push/stage thay đổi người dùng. Không thêm thư viện. Không thử thao tác ghi lên backend thật.

## I/O & Edge-Case Matrix

| Trạng thái | Kết quả |
|---|---|
| Học phần có người phụ trách | Hydrate đúng ID, hiển thị tên; không gán người đăng nhập |
| Có quyền, đổi người/bỏ chọn | PUT gửi ID hợp lệ/null; thành công cập nhật giá trị gốc; lỗi giữ lựa chọn |
| Không quyền hoặc không đổi | Payload không gửi `creator_plan_id`, kể cả form bị sửa bằng code |
| Giảng viên hiện tại không trong options | Lookup ID hoặc nhãn dự phòng ID; không mất phân công |
| Lookup giảng viên lỗi | Cảnh báo/thử lại riêng; vẫn lưu trường khác, không xóa phân công |
| Đổi course khi đang tải | Kết quả cũ không ghi lên course mới hoặc lựa chọn đang sửa |
| Lookup cursor có data, total null | Kiểm tồn tại/quyền/mã trùng đúng theo data |
| Lookup empty hoặc HTTP/response lỗi | Empty đúng ý nghĩa; lỗi không được coi là không có dữ liệu |
| GET có page hoặc limit=-1 | Không thêm cursor, giữ phân trang và bộ lọc |

</frozen-after-approval>

## Code Map

Đường dẫn bên dưới tính từ root checkout chính.

- `src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin.component.ts`: controls ~169, `loadCourse` ~220, `editKhoaHoc` ~327, `onCheckMaHpPromise` ~399, `saveCourse` raw payload ~484 và PUT ~529. `/hoc-phan` đặt `routerDaotao=true` bất kể vai trò: không dùng để cấp quyền mới. Có `isManager`; thêm UserService nếu cần lookup tên. Đảm bảo kiểm owner trước các thao tác ghi CTĐT; payload chỉ có owner khi đổi có quyền. Loader danh sách giáo viên độc lập, có trạng thái và retry; chuẩn hóa ID, không mutate form khi options về muộn.
- `.html`: nhóm thông tin cơ bản, sau Bộ môn phụ trách (~87–95). Reuse `ovic-dropdown`, `mh-field`, `role=group/aria-labelledby`, sáu section hiện hữu.
- `.spec.ts`: hiện shallow tests với queryParamMap EMPTY và service mock rỗng; bổ sung spies/fixtures/signal route cho load/save. Giữ test layout/readonly cũ.
- `src/app/modules/admin/features/quanly-monhoc/danhsach-monhoc/danhsach-monhoc.component.ts:222–250` và `.html:153–162`: CHỈ đọc query teacher + dropdown; showName gồm tên/email, showClear trả null. Không sửa feature cũ.
- `src/app/modules/shared/models/elng-khoa-hoc.ts`: đã có creator_plan_id. `core/services/user.service.ts::getUserByPageNew`: lookup ID. Dropdown options cập nhật strict equality: ID phải nhất quán.
- `src/app/modules/admin/features/course-management/course-management-detail/course-management-detail.ts:104`: lookup course limit1, đã kiểm data[0].
- Lookup limit1 cần rà trong `children/<name>/<name>.component.ts`: `monhoc-thongtin` course/profile; `monhoc-noidung` course/profile (~377/391, các lookup khác đã cursor); `monhoc-question-cdr` course/profile (~271/285); `monhoc-formde` course/profile (~260/274); `monhoc-kiemtra-danhgia` (~382); `cauhoi-tuluan-15p` profile (~440); `thuongxuyen-duan` plan gốc (~279); `clone-course` kiểm tồn tại (~187); `chuandaura::checkKyhieuCdrPromise` (~380). Đọc và xác nhận option consumer trước thêm. Không đụng set limit=-1 trong cùng file. `quanly-monhoc-router-outlet` limit1 chỉ sửa nếu chứng minh còn route/render sử dụng.
- `course-management.component.ts::loadCourses(page)` và lookups limit=-1: giữ nguyên.
- `docs/FRONTEND_API_GUIDE.md:280–302,546–558`: cursor thay chế độ, totals nullable. `src/app/core/services/interceptors.service.ts:70–126`: limit=-1 chuyển1000/continuation paged; chỉ tham khảo, KHÔNG sửa.

## Tasks & Acceptance

**Execution:**
- [ ] Thêm Người phụ trách vào TS/HTML, loader/retry/fallback và guard payload như ràng buộc; sửa CSS chỉ nếu cần, reuse style.
- [ ] Thêm cursor đúng những lookup không phân trang, giữ tất cả limit=-1/page. Mã trùng chỉ cần tồn tại nên có thể thêm limit1 cùng cursor. Chuyển kiểm recordsFiltered sang data cho lookup bị tác động; fail closed khi HTTP/response lỗi.
- [ ] Test mọi dòng matrix: unit/component/HTTP spies phù hợp. Không sửa test cho khớp lỗi code; thêm regression params cho paginator/list limit=-1 không đổi.
- [ ] Chạy tests liên quan, build, diff check; ghi output và hạng mục chưa kiểm chứng.

**Acceptance Criteria:**
- Given học phần có phân công, when mở tab, then đúng ID/tên và không thay đổi ngầm.
- Given có quyền, when đổi/bỏ chọn và lưu, then gửi đúng ID/null; không quyền/không đổi không gửi field.
- Given API lookup không phân page, when gọi, then có một cursor0 và không đổi filters/order; empty/lỗi phân biệt rõ.
- Given request page hoặc limit=-1, when gọi, then không thêm cursor và paginator/tải tiếp giữ nguyên.

## Implementation Notes

- Kế hoạch đã duyệt tại `C:/Users/phuong/.claude/plans/mossy-sparking-curry.md`; spec này chứa cùng scope triển khai. Nếu phát hiện cần thay interceptor/quyền rộng hơn thì dừng báo, không tự mở rộng.
- Chỉ dùng công cụ file để chỉnh. Không tạo worktree; các worktree theo main cũ thiếu feature Course Management.

## Spec Change Log

## Review Triage Log

## Verification

- `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/modules/admin/features/course-management/**/*.spec.ts'` — test liên quan phải chạy/passed, không chỉ có file test.
- `npm run build` — AOT không lỗi. `git diff --check` — không lỗi whitespace.
- Nếu toàn feature test có lỗi unrelated sẵn: ghi lỗi, chạy focused subset chứng minh matrix; không tuyên bố toàn suite đạt.
- Không khẳng định tốc độ hoặc backend thật đã kiểm thử. UI/Network nếu có phiên hợp lệ; không tự ghi dữ liệu thật.
