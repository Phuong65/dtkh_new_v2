# Kế hoạch import sinh viên vào lớp học phần HVU

## 1. Mục tiêu

Tạo chức năng đồng bộ danh sách sinh viên từ HVU vào các lớp học phần đã tồn tại trong hệ thống.

Chức năng phải:

- Chỉ cho chọn năm học, học kỳ đã có trong cơ sở dữ liệu.
- Tải lớp qua `ClassesService`.
- Chỉ lấy lớp có `sync_class_id != 0` và chưa bị xóa.
- Giới hạn dữ liệu theo khoa đối với lãnh đạo khoa không có quyền đào tạo.
- Tải sinh viên từ `getHvuApiDanhsachSinhvienTheoLopBybody` theo từng `sync_class_id`.
- Mỗi lượt tải tối đa 5 lớp; các lượt chạy tuần tự.
- Hiển thị tiến độ bằng dialog không cho đóng giữa quá trình.
- Hiển thị danh sách sinh viên tổng; chọn lớp để lọc theo `sync_class_id`.
- Trước khi import từng lớp: xóa toàn bộ `class-students` theo `class_id`, sau đó thêm lại danh sách mới.
- Luôn hiển thị cảnh báo; chỉ cho import sau khi người dùng tích “Tôi đã đọc và đồng ý”.

## 2. Phạm vi

### Trong phạm vi

- Một màn hình mới trong `src/app/modules/admin/features/dongbo-dulieu/import-hvu/`.
- Tra cứu lớp nội bộ theo năm học, học kỳ, quyền người dùng.
- Tải danh sách mã sinh viên từ HVU.
- Đối chiếu mã sinh viên với hồ sơ sinh viên, tài khoản nội bộ.
- Xem trước dữ liệu theo lớp.
- Thay thế danh sách sinh viên của các lớp đủ điều kiện.
- Theo dõi tiến độ, trạng thái, lỗi tải và lỗi import.

### Ngoài phạm vi

- Tạo tài khoản hoặc hồ sơ sinh viên chưa tồn tại.
- Tạo mới lớp học phần.
- Sửa dữ liệu lớp học phần.
- Đồng bộ điểm, bài làm, điểm danh, nhóm hoặc dữ liệu học tập liên quan.
- Thay đổi backend nếu các API hiện tại đáp ứng luồng cơ bản.

## 3. Quyết định nghiệp vụ

### 3.1. Nhóm quyền đào tạo

Tạm xác định người dùng có quyền đào tạo khi có ít nhất một role:

- `ROLES.admin`
- `ROLES.manager`
- `ROLES.chuyenvien_pdt`
- `ROLES.troly_pdt`
- `ROLES.daotao_cv_1`

Quy tắc giới hạn khoa:

```text
isFacultyLeader = userHasRole(ROLES.lanhdaokhoa)
hasTrainingPermission = có ít nhất một role đào tạo
facultyScoped = isFacultyLeader && !hasTrainingPermission
```

Nếu `facultyScoped`:

- Lấy `donvi_chuyenmon_id` của hồ sơ người dùng hiện tại.
- Bắt buộc thêm điều kiện `category_id = donvi_chuyenmon_id` khi tải lớp.
- Không hiển thị bộ lọc chọn khoa.
- Nếu không xác định được `donvi_chuyenmon_id`, chặn tải lớp và báo lỗi rõ ràng.

Nếu người dùng vừa có quyền lãnh đạo khoa vừa có quyền đào tạo, không tự động giới hạn theo khoa.

> Lọc phía frontend chỉ phục vụ phạm vi dữ liệu/UX. Backend vẫn phải kiểm tra quyền truy cập và quyền xóa/import.

### 3.2. Lớp hợp lệ

Điều kiện truy vấn lớp:

- `namhoc = năm học đã chọn`
- `hocky = học kỳ đã chọn`
- `sync_class_id != 0`
- `status != -1`
- Thêm `category_id = donvi_chuyenmon_id` khi `facultyScoped`
- `limit = -1`
- Sắp xếp ổn định theo mã hoặc tên lớp.

Loại thêm ở frontend nếu `sync_class_id` là `null`, chuỗi rỗng hoặc giá trị không hợp lệ.

### 3.3. Lớp được phép import

Chỉ import lớp thỏa toàn bộ:

- Tải danh sách từ HVU thành công.
- Đối chiếu xong dữ liệu sinh viên.
- Không có mã sinh viên trùng trong cùng lớp sau chuẩn hóa.
- Không còn sinh viên chưa tìm thấy hồ sơ/tài khoản nội bộ.
- Có `class_id` nội bộ hợp lệ.

Lớp tải lỗi hoặc đối chiếu thiếu dữ liệu phải bị khóa import để tránh xóa danh sách hiện tại rồi tạo danh sách không đầy đủ.

Phản hồi HVU thành công nhưng danh sách rỗng được xem là yêu cầu xóa trắng lớp. Dialog xác nhận phải đánh dấu riêng các lớp này.

## 4. Cấu trúc file

Tạo feature riêng:

```text
src/app/modules/admin/features/dongbo-dulieu/import-hvu/
└── import-sinhvien-lophoc/
    ├── import-sinhvien-lophoc.component.ts
    ├── import-sinhvien-lophoc.component.html
    ├── import-sinhvien-lophoc.component.css
    └── import-sinhvien-lophoc.models.ts
```

Cập nhật:

```text
src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-hvu-main/import-hvu-main.component.ts
src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-hvu-main/import-hvu-main.component.html
```

Không sửa service nếu các phương thức hiện tại đủ dùng.

## 5. Tích hợp menu HVU

Trong `ImportHvuMainComponent`:

- Import standalone component mới.
- Thêm vào `imports`.
- Thêm thẻ chức năng:

```ts
{
    label: 'Sinh viên vào lớp học phần',
    icon: '<i class="fa-solid fa-users-rectangle"></i>',
    key: 'sinh-vien-lop-hoc'
}
```

Trong template:

```html
<app-import-sinhvien-lophoc *ngSwitchCase="'sinh-vien-lop-hoc'"></app-import-sinhvien-lophoc>
```

## 6. Mô hình dữ liệu frontend

### 6.1. Trạng thái lớp

```ts
type ClassDownloadStatus = 'idle' | 'loading' | 'success' | 'empty' | 'failed';
type ClassImportStatus = 'idle' | 'deleting' | 'importing' | 'success' | 'partial' | 'failed' | 'blocked';
```

### 6.2. Lớp đồng bộ

```ts
interface HvuClassSyncItem {
    classId: number;
    syncClassId: string;
    name: string;
    kyhieu: string;
    namhoc: string;
    hocky: string;
    categoryId: number;
    downloadStatus: ClassDownloadStatus;
    importStatus: ClassImportStatus;
    remoteStudentCount: number;
    validStudentCount: number;
    invalidStudentCount: number;
    errorMessage?: string;
}
```

### 6.3. Sinh viên tải về

```ts
interface HvuClassStudentPreview {
    membershipKey: string; // `${syncClassId}|${normalizedStudentCode}`
    classId: number;
    syncClassId: string;
    className: string;
    studentCode: string;
    ordering?: number; // vị trí sau khi sắp xếp theo tên trong từng lớp
    studentId?: number;
    userId?: number;
    fullName?: string;
    birthday?: string;
    email?: string;
    status: 'valid' | 'not-found' | 'duplicate' | 'download-failed' | 'imported' | 'import-failed';
    errorMessage?: string;
}
```

Không khử trùng toàn cục theo mã sinh viên vì một sinh viên có thể thuộc nhiều lớp. Chỉ khử trùng theo `membershipKey`.

## 7. Thiết kế giao diện

### 7.1. Thanh công cụ

- Nút quay lại.
- Dropdown năm học.
- Dropdown học kỳ phụ thuộc năm học.
- Nút “Tải danh sách lớp”.
- Nút “Tải sinh viên từ HVU”.
- Nút “Bắt đầu import”.

Trạng thái nút:

- Chưa chọn đủ năm học/học kỳ: khóa tải lớp.
- Chưa có lớp: khóa tải sinh viên.
- Đang tải/đang import: khóa toàn bộ thao tác thay đổi dữ liệu.
- Không có lớp đủ điều kiện: khóa import.

### 7.2. Bố cục dữ liệu

Bố cục hai vùng:

1. Danh sách lớp:
   - Tên/mã lớp.
   - `sync_class_id`.
   - Số sinh viên HVU.
   - Số hợp lệ/lỗi.
   - Trạng thái tải/import.
   - Chọn một lớp để lọc.

2. Danh sách sinh viên chính:
   - TT.
   - Mã sinh viên.
   - Họ tên.
   - Email/ngày sinh nếu có.
   - Lớp học phần.
   - Trạng thái đối chiếu/import.

Bộ lọc lớp:

- “Tất cả lớp” hiển thị danh sách chính đầy đủ.
- Chọn lớp lọc theo `sync_class_id`.
- Tìm kiếm theo mã sinh viên, họ tên, mã/tên lớp.
- Phân trang cục bộ theo mẫu hiện có.

### 7.3. Dialog tiến độ

Dùng `p-dialog` và `mat-progress-bar`:

- Modal, không closable, không draggable, không resizable.
- Hiển thị giai đoạn hiện tại.
- Hiển thị số lớp hoàn thành/tổng lớp.
- Hiển thị tên lớp đang xử lý.
- Hiển thị số lỗi tích lũy.
- Phần trăm tính theo đơn vị công việc hoàn thành, không tăng trước khi request kết thúc.

Các giai đoạn:

1. Tải sinh viên HVU.
2. Đối chiếu hồ sơ sinh viên.
3. Xóa danh sách cũ.
4. Import danh sách mới.

### 7.4. Dialog xác nhận phá hủy dữ liệu

Nội dung bắt buộc:

- Năm học, học kỳ.
- Số lớp sẽ xử lý.
- Tổng số liên kết sinh viên sẽ import.
- Số lớp có danh sách HVU rỗng.
- Cảnh báo: danh sách sinh viên hiện tại của từng lớp sẽ bị xóa trước khi import.
- Cảnh báo: lỗi giữa quá trình có thể làm lớp ở trạng thái import một phần vì frontend không có transaction liên API.
- Checkbox “Tôi đã đọc và đồng ý”.

Hành vi:

- Mỗi lần mở dialog phải reset checkbox về `false`.
- Nút “Xác nhận import” bị disable khi chưa tích.
- Handler vẫn kiểm tra checkbox lần nữa; không chỉ dựa vào trạng thái disabled trong HTML.
- Nút hủy đóng dialog, không thay đổi dữ liệu.

## 8. Luồng tải lớp

### Bước 1: tải lựa chọn năm học/học kỳ

Dùng `ClassesService.getPluckClassesByCol()` để lấy `namhoc,hocky`.

Xử lý frontend:

- Loại bản ghi thiếu năm học/học kỳ.
- Chuẩn hóa thành danh sách cặp duy nhất.
- Sắp xếp năm học giảm dần, học kỳ tăng dần hoặc theo quy ước hiện có.
- Dropdown năm học lấy danh sách duy nhất.
- Dropdown học kỳ chỉ lấy các học kỳ thuộc năm học đã chọn.
- Khi đổi năm học: reset học kỳ, lớp, sinh viên, trạng thái tải/import.
- Khi đổi học kỳ: reset lớp, sinh viên, trạng thái tải/import.

### Bước 2: xác định phạm vi quyền

- Dùng `AuthService.userHasRole(...)`.
- Nếu `facultyScoped`, tải hồ sơ người dùng theo `auth.user.id` để lấy `donvi_chuyenmon_id`.
- Không gọi API lớp nếu không lấy được khoa bắt buộc.

### Bước 3: tải lớp

Dùng `ClassesService.getClassesByPageNew(condition)` với các điều kiện tại mục 3.2.

Sau khi tải:

- Chuyển về `HvuClassSyncItem`.
- Loại trùng theo `classId`.
- Reset danh sách sinh viên cũ.
- Hiển thị tổng số lớp.

## 9. Luồng tải sinh viên HVU

### 9.1. Chia lượt

- Chia danh sách lớp thành các nhóm tối đa 5 lớp.
- Các nhóm chạy tuần tự.
- Trong một nhóm, tối đa 5 request HVU chạy cùng lượt.
- Không `subscribe()` trong vòng lặp.
- Dùng một RxJS pipeline và một outer subscription.

Khung xử lý:

```ts
from(classChunks).pipe(
    concatMap(chunk => forkJoin(
        chunk.map(item => loadStudentsForClass$(item))
    )),
    scan(...),
    finalize(...)
).subscribe(...);
```

`loadStudentsForClass$`:

- Gọi `getHvuApiDanhsachSinhvienTheoLopBybody({ id_lop: syncClassId })`.
- Xác thực response phải là mảng; response sai cấu trúc được xem là lỗi tải và khóa import lớp.
- Chuẩn hóa `ma_sinh_vien`: `trim().toLowerCase()`.
- Loại dòng rỗng.
- Phát hiện trùng trong cùng lớp.
- Sau đối chiếu hồ sơ, sắp xếp sinh viên riêng trong từng lớp theo tên gọi (từ cuối của `full_name`), trùng tên thì theo tên đệm, tiếp theo họ, cuối cùng mã sinh viên; so sánh tiếng Việt bằng `localeCompare('vi')`.
- Sinh viên thiếu họ tên hợp lệ xếp sau sinh viên có họ tên; mã sinh viên là khóa ổn định cuối cùng.
- Gán lại `ordering` liên tục từ 1 theo kết quả sắp xếp; không giữ vị trí ban đầu từ response HVU.
- Gắn `classId`, `syncClassId`, thông tin lớp.
- Bắt lỗi ở cấp lớp; trả kết quả lỗi có cấu trúc để nhóm khác tiếp tục.

### 9.2. Đối chiếu sinh viên nội bộ

Sau khi tải xong mã sinh viên:

1. Lấy danh sách mã duy nhất toàn bộ.
2. Chia thành nhóm phù hợp, đề xuất 100 mã/request.
3. Dùng `ElngUserProfileService.getUserProfileByPageNewV2` với:
   - `include_by = student_code`
   - `include = danh sách mã`
   - `limit = -1`
4. Lấy `user_id` từ hồ sơ tìm thấy.
5. Dùng `UserService.getUserByPageNew` để lấy email/thông tin tài khoản theo nhóm `user_id`.
6. Map lại từng membership theo mã sinh viên.
7. Đánh dấu:
   - `valid`: có hồ sơ và `user_id` hợp lệ.
   - `not-found`: không có hồ sơ hoặc không có tài khoản.
   - `duplicate`: trùng mã trong cùng lớp.

Chỉ tạo payload `ClassStudent` cho dòng `valid`:

```ts
{
    student_id: profile.id,
    class_id: class.id,
    user_id: profile.user_id,
    user_info: {
        name: profile.name,
        full_name: profile.full_name,
        birthday: profile.birthday,
        student_code: profile.student_code,
        email: user.email
    },
    status: 1,
    namhoc: class.namhoc,
    hocky: class.hocky,
    ordering: preview.ordering
}
```

## 10. Luồng import

### 10.1. Chuẩn bị

- Chỉ lấy các lớp đủ điều kiện tại mục 3.3.
- Giữ snapshot preview trong bộ nhớ suốt quá trình.
- Không tải lại HVU âm thầm khi người dùng bấm import.
- Hiển thị dialog xác nhận.

### 10.2. Thứ tự xử lý

Xử lý từng lớp tuần tự để giới hạn phạm vi lỗi:

```text
Lớp 1: xóa cũ → import mới → ghi kết quả
Lớp 2: xóa cũ → import mới → ghi kết quả
...
```

Với mỗi lớp:

1. Cập nhật trạng thái `deleting`.
2. Gọi `ClassStudentService.deleteClassStudentByCol(classId, 'class_id')`.
3. Nếu xóa lỗi:
   - Đánh dấu lớp `failed`.
   - Không import lớp đó.
   - Chuyển sang lớp kế tiếp.
4. Nếu xóa thành công:
   - Nếu danh sách HVU rỗng: đánh dấu thành công sau bước xóa.
   - Nếu có sinh viên: chia payload thành nhóm tối đa 5 bản ghi.
5. Các nhóm import chạy tuần tự; trong mỗi nhóm dùng `forkJoin` tối đa 5 lệnh `addClassStudent`.
6. Bắt lỗi từng bản ghi để không làm mất kết quả của các bản ghi còn lại.
7. Nếu tất cả thêm thành công: lớp `success`.
8. Nếu có bản ghi lỗi: lớp `partial`, lưu số thành công/thất bại.
9. Chuyển sang lớp tiếp theo.

Một outer subscription điều khiển toàn bộ quá trình; không `subscribe()` trong vòng lặp.

### 10.3. Kết quả

Sau import hiển thị:

- Tổng lớp thành công.
- Tổng lớp thất bại.
- Tổng lớp import một phần.
- Tổng sinh viên thành công/thất bại.
- Chi tiết lỗi theo lớp và mã sinh viên.
- Nút lọc nhanh các dòng lỗi.
- Nút thử lại chỉ xuất hiện sau khi người dùng chủ động xem cảnh báo; thử lại lớp sẽ thực hiện lại quy trình xóa rồi import.

Không hiển thị toast “thành công” nếu còn lớp `partial` hoặc `failed`; dùng thông báo hoàn tất kèm cảnh báo.

## 11. Xử lý lỗi và an toàn dữ liệu

- Không xóa dữ liệu của lớp tải HVU thất bại.
- Không xóa dữ liệu của lớp có sinh viên chưa đối chiếu được.
- Không xóa nếu dialog chưa được xác nhận hợp lệ.
- Không import nếu lệnh xóa lớp đó thất bại.
- Phân biệt rõ response rỗng hợp lệ và lỗi HTTP.
- `catchError` phải giữ lỗi có cấu trúc; không biến mọi lỗi thành thành công.
- `finalize` luôn đóng progress dialog và mở lại các nút.
- Khi component bị hủy, hủy subscription bằng pattern hiện có (`takeUntilDestroyed` nếu phiên bản Angular hỗ trợ; nếu không dùng `Subject<void>` + `takeUntil`).
- Chống bấm lặp bằng cờ `isDownloading`/`isImporting` và kiểm tra ở handler.
- Không dùng `sync_class_id` để xóa `class-students`; luôn map về `Classes.id`, sau đó xóa theo `class_id`.
- Không log dữ liệu cá nhân đầy đủ ra console.

## 12. Rủi ro kiến trúc

### Rủi ro chính: không có transaction xuyên suốt xóa và import

Luồng frontend hiện tại dùng hai loại request độc lập:

1. Xóa toàn bộ sinh viên theo `class_id`.
2. Thêm lại từng sinh viên.

Nếu mạng hoặc API lỗi sau bước xóa, lớp có thể bị thiếu sinh viên.

Giảm thiểu phía frontend:

- Chặn lớp có dữ liệu chưa hợp lệ.
- Xử lý từng lớp tuần tự.
- Chia import thành nhóm nhỏ.
- Báo `partial` chính xác.
- Cho phép thử lại có xác nhận.

Giải pháp kiến trúc an toàn hơn, khuyến nghị cho giai đoạn sau:

- Backend cung cấp endpoint “replace class students”.
- Payload gồm `class_id` và toàn bộ `student_ids`.
- Backend validate toàn bộ trước khi xóa.
- Xóa và thêm trong một database transaction.
- Rollback toàn bộ lớp nếu bất kỳ bản ghi nào lỗi.

## 13. Thứ tự triển khai

1. Tạo folder và models của feature.
2. Tạo standalone component, khai báo module UI cần thiết.
3. Tích hợp thẻ chức năng vào `ImportHvuMainComponent`.
4. Tải và chuẩn hóa danh sách năm học/học kỳ.
5. Xây dựng kiểm tra role, phạm vi khoa.
6. Tải danh sách lớp bằng `ClassesService`.
7. Xây dựng danh sách lớp và vùng lọc sinh viên.
8. Xây dựng pipeline tải HVU theo nhóm 5, nhóm chạy tuần tự.
9. Xây dựng pipeline đối chiếu hồ sơ/tài khoản.
10. Hiển thị preview, trạng thái hợp lệ/lỗi.
11. Tạo dialog xác nhận bắt buộc checkbox.
12. Xây dựng pipeline xóa rồi import theo từng lớp.
13. Bổ sung progress, kết quả tổng hợp, retry có kiểm soát.
14. Hoàn thiện CSS responsive, trạng thái disabled, empty state.
15. Kiểm tra tĩnh luồng quyền, luồng lỗi, nguy cơ mất dữ liệu.
16. Chỉ build/test/run khi có yêu cầu xác minh riêng.

## 14. Kịch bản kiểm thử chấp nhận

### Quyền và bộ lọc

- Lãnh đạo khoa không có role đào tạo chỉ thấy lớp có `category_id = donvi_chuyenmon_id`.
- Lãnh đạo khoa đồng thời có role đào tạo không bị giới hạn khoa.
- Người dùng không phải lãnh đạo khoa dùng phạm vi theo quyền backend hiện có.
- Thiếu `donvi_chuyenmon_id` ở tài khoản bị giới hạn khoa: chặn tải, báo lỗi.
- Chỉ hiển thị năm học/học kỳ đã tồn tại trong database.
- Đổi năm học reset học kỳ, lớp, sinh viên cũ.
- Không lấy lớp có `sync_class_id = 0`, rỗng hoặc `status = -1`.

### Tải HVU

- 1–5 lớp tạo một lượt tải.
- 6 lớp tạo hai lượt: 5 rồi 1.
- Lượt sau chỉ bắt đầu khi lượt trước hoàn thành.
- Một lớp lỗi không dừng các lớp còn lại.
- Response HVU không phải mảng bị đánh dấu tải lỗi; lớp bị khóa import và không bị xóa dữ liệu hiện tại.
- Response là mảng rỗng hợp lệ vẫn được phân biệt để xử lý xóa trắng sau xác nhận.
- Progress đạt 100% sau khi toàn bộ lớp kết thúc.
- Sinh viên cùng mã ở hai lớp vẫn tạo hai dòng membership.
- Payload import giữ `ordering` theo thứ tự tên đã sắp xếp trong từng lớp: tên gọi → tên đệm → họ → mã sinh viên.
- Mã trùng trong cùng lớp bị đánh dấu duplicate.
- Chọn lớp lọc đúng theo `sync_class_id`.

### Xác nhận

- Bấm import luôn mở dialog cảnh báo.
- Nút xác nhận bị khóa khi chưa tích checkbox.
- Đóng/mở lại dialog reset checkbox.
- Handler từ chối nếu checkbox là `false`.

### Xóa và import

- Lớp tải lỗi không bị xóa dữ liệu hiện tại.
- Lớp có sinh viên chưa đối chiếu được không bị xóa.
- Xóa lỗi: không gọi API thêm sinh viên của lớp đó.
- Xóa thành công: thêm sinh viên đúng `class_id`, `student_id`, `user_id`.
- Danh sách HVU rỗng đã xác nhận: xóa lớp, không gọi add.
- Một bản ghi add lỗi: lớp `partial`, chi tiết lỗi được giữ.
- Lớp kế tiếp vẫn được xử lý sau lỗi lớp trước.
- Không phát sinh nhiều outer subscription hoặc `subscribe()` trong vòng lặp.

## 15. Tiêu chí hoàn thành

- Có thẻ “Sinh viên vào lớp học phần” trong màn hình import HVU.
- Lọc lớp đúng năm học, học kỳ, `sync_class_id`, trạng thái, phạm vi khoa.
- Tải HVU theo lượt tối đa 5 lớp; các lượt tuần tự; progress chính xác.
- Danh sách sinh viên chính hiển thị đầy đủ; lọc được theo lớp.
- Sinh viên được đối chiếu trước khi cho phép xóa dữ liệu lớp.
- Import luôn yêu cầu dialog và checkbox đồng ý.
- Mỗi lớp thực hiện đúng thứ tự xóa theo `class_id`, sau đó import.
- Lỗi được cô lập theo lớp/bản ghi; không báo thành công sai.
- Không sửa parser hoặc chuẩn hóa dữ liệu ngoài phạm vi đã nêu.

## 16. Câu hỏi mở

1. Backend đã kiểm tra quyền xóa/import theo phạm vi khoa chưa, hay cần bổ sung kiểm tra phía API?
2. “Quyền đào tạo” có chính xác gồm `admin`, `manager`, `chuyenvien_pdt`, `troly_pdt`, `daotao_cv_1` không?
3. Lớp có một mã sinh viên chưa tồn tại nên bị chặn toàn bộ như phương án an toàn, hay vẫn cho thay thế bằng các sinh viên hợp lệ?
4. Response HVU rỗng có luôn mang nghĩa xóa toàn bộ sinh viên khỏi lớp không?
5. Có cần cho người dùng chọn một số lớp để import, hay luôn import toàn bộ lớp đã tải thành công?
6. Có cần backend endpoint transaction “replace class students” trước khi đưa chức năng vào vận hành chính thức không?

## 17. Trạng thái triển khai

Đã triển khai frontend ngày 2026-08-17:

- Tạo feature độc lập `import-sinhvien-lophoc` gồm models, TypeScript, HTML, CSS.
- Tích hợp thẻ và `ngSwitchCase` vào màn hình import HVU.
- Tải năm học/học kỳ bằng `ClassesService.getPluckClassesByCol()`.
- Giới hạn lãnh đạo khoa không có quyền đào tạo theo `category_id = donvi_chuyenmon_id`.
- Tải lớp theo năm học, học kỳ, `sync_class_id != 0`, `status != -1`.
- Tải HVU theo nhóm tối đa 5 lớp; nhóm chạy tuần tự; một outer subscription.
- Đối chiếu hồ sơ/tài khoản theo nhóm 100 mã hoặc ID.
- Khóa lớp tải lỗi, trùng mã, thiếu hồ sơ hoặc thiếu tài khoản.
- Hiển thị danh sách lớp, danh sách sinh viên chính, bộ lọc lớp, tìm kiếm, phân trang.
- Bổ sung dialog progress và dialog xác nhận bắt buộc checkbox.
- Xử lý từng lớp tuần tự: xóa theo `class_id`, import nhóm tối đa 5 sinh viên.
- Ghi trạng thái `success`, `partial`, `failed`, lỗi theo lớp và sinh viên.

Chưa thực hiện:

- Chưa build/test/run theo quy tắc xác minh tĩnh của dự án.
- Chưa bổ sung backend transaction `replace class students`.
- Chưa xác minh backend cưỡng chế quyền theo khoa.

Quyết định tạm đang áp dụng theo kế hoạch đã duyệt:

- Quyền đào tạo gồm `admin`, `manager`, `chuyenvien_pdt`, `troly_pdt`, `daotao_cv_1`.
- Một mã sinh viên chưa tồn tại chặn toàn bộ lớp.
- Response HVU rỗng hợp lệ cho phép xóa trắng lớp sau xác nhận.
- Import toàn bộ lớp đủ điều kiện; chưa có checkbox chọn một phần lớp.

## 18. Kế hoạch bổ sung: đối chiếu danh sách hiện tại với danh sách HVU

### 18.1. Mục tiêu

Trước khi cho phép thay thế sinh viên của từng lớp:

- Tải danh sách `class-students` hiện có theo `Classes.id`.
- So sánh với danh sách sinh viên HVU đã tải và đối chiếu hợp lệ.
- Phân loại rõ: không thay đổi, thêm mới, xóa khỏi lớp, thay đổi thứ tự.
- Hiển thị trạng thái và số lượng thay đổi trước khi import.
- Nếu danh sách khác nhau, vẫn cho import sau cảnh báo và xác nhận hiện có.
- Nếu không tải được danh sách hiện tại, khóa import lớp đó; tuyệt đối không gọi API xóa.

### 18.2. Quy tắc so sánh

Khóa đối chiếu là mã sinh viên đã chuẩn hóa bằng `trim().toLowerCase()`.

Với mỗi lớp:

1. Danh sách đích lấy từ preview HVU của chính `syncClassId` đó.
2. Danh sách hiện tại lấy bằng `ClassStudentService.getClassStudentByCol('class_id', classId)`.
3. Response danh sách hiện tại bắt buộc là mảng; `null`, `undefined` hoặc object sai cấu trúc là lỗi tải, không được xem là lớp rỗng.
4. Mã hiện tại lấy từ `ClassStudent.user_info.student_code` và chuẩn hóa cùng quy tắc với HVU.
5. So sánh theo mã và `ordering`:
   - `unchanged`: mã tồn tại ở cả hai phía, `ordering` không đổi.
   - `added`: chỉ có trong danh sách HVU; sẽ được thêm.
   - `removed`: chỉ có trong danh sách hiện tại; sẽ bị xóa.
   - `reordered`: tồn tại ở cả hai phía nhưng `ordering` thay đổi.
6. Lớp là `unchanged` khi không có `added`, `removed`, `reordered` hoặc dữ liệu hiện tại bất thường.
7. Lớp là `changed` khi có ít nhất một khác biệt.
8. Bản ghi hiện tại thiếu mã sinh viên hoặc trùng mã không được bỏ qua âm thầm; phải tính riêng, đánh dấu lớp `changed` và cảnh báo các bản ghi này sẽ bị loại khi thay thế.
9. So sánh chỉ phục vụ preview/an toàn. Payload import vẫn chỉ tạo từ danh sách HVU hợp lệ; dòng `removed` không được đưa vào payload thêm mới.

`ordering` phải được xem là một phần của khác biệt. Cùng tập mã sinh viên nhưng thứ tự khác vẫn là `changed` để cho phép cập nhật thứ tự theo HVU.

### 18.3. Trạng thái và model đề xuất

```ts
type ClassComparisonStatus =
    'idle' |
    'loading' |
    'unchanged' |
    'changed' |
    'failed' |
    'stale';

type StudentDifferenceStatus =
    'unchanged' |
    'added' |
    'removed' |
    'reordered' |
    'current-invalid';
```

Bổ sung vào `HvuClassSyncItem`:

```ts
comparisonStatus: ClassComparisonStatus;
currentStudentCount: number;
unchangedStudentCount: number;
addedStudentCount: number;
removedStudentCount: number;
reorderedStudentCount: number;
invalidCurrentStudentCount: number;
currentSnapshotSignature?: string;
comparisonMessage?: string;
```

Thêm model chi tiết độc lập, không trộn trạng thái đối chiếu với `StudentPreviewStatus` đang dùng cho validate/import:

```ts
interface HvuClassStudentDifference {
    differenceKey: string;
    classId: number;
    syncClassId: string;
    className: string;
    studentCode?: string;
    fullName?: string;
    status: StudentDifferenceStatus;
    currentOrdering?: number;
    remoteOrdering?: number;
    message?: string;
}
```

Giữ một mảng `studentDifferences` riêng. Cách này tránh biến dòng chỉ tồn tại trong dữ liệu hiện tại thành sinh viên được import nhầm.

### 18.4. Luồng tải và đối chiếu

Mở rộng pipeline hiện tại:

```text
tải lớp
→ tải sinh viên HVU
→ đối chiếu hồ sơ/tài khoản
→ tải class-students hiện tại
→ so sánh từng lớp
→ tính lớp đủ điều kiện import
→ hiển thị preview
```

Quy tắc thực hiện:

- Chia lớp thành nhóm tối đa 5 request lấy danh sách hiện tại.
- Các nhóm chạy tuần tự; trong nhóm dùng `forkJoin`.
- Chỉ có một outer subscription; không `subscribe()` trong vòng lặp.
- Bắt lỗi theo từng lớp để lớp khác vẫn tiếp tục.
- Lỗi tải danh sách hiện tại đặt `comparisonStatus = 'failed'`, `importStatus = 'blocked'`.
- Cập nhật progress thành giai đoạn riêng: “Đang đối chiếu danh sách sinh viên hiện tại”.
- Sau khi so sánh, gọi lại `refreshEligibleClasses()` và `refreshDisplayedStudents()`.

Điều kiện lớp đủ import được bổ sung:

```text
comparisonStatus = unchanged hoặc changed
```

`failed`, `loading`, `idle`, `stale` không đủ điều kiện import.

### 18.5. Chống import từ preview đã cũ

Danh sách hiện tại có thể bị chức năng khác thay đổi sau lúc preview. Trước bước xóa của từng lớp:

1. Tải lại nhanh danh sách `class-students` của lớp.
2. Tạo chữ ký ổn định từ mã sinh viên chuẩn hóa và `ordering`.
3. So sánh với `currentSnapshotSignature` đã lưu khi preview.
4. Nếu khác, đặt `comparisonStatus = 'stale'`, `importStatus = 'blocked'` và bỏ qua lớp; không xóa dữ liệu.
5. Yêu cầu người dùng tải/đối chiếu lại để thấy thay đổi mới.

Kiểm tra này giảm khoảng thời gian dùng dữ liệu cũ nhưng không thay thế transaction backend.

### 18.6. Giao diện và cảnh báo

Danh sách lớp:

- Thêm chip `Không thay đổi`, `Có thay đổi`, `Đối chiếu lỗi`, `Dữ liệu đã thay đổi`.
- Với lớp `changed`, hiển thị số liệu `+ thêm`, `− xóa`, `↕ đổi thứ tự` bằng chữ và màu; không chỉ dùng màu.
- Với dữ liệu hiện tại thiếu/trùng mã, hiển thị số bản ghi bất thường.

Danh sách sinh viên:

- Thêm cột “Thay đổi”.
- Dòng HVU hiển thị `Giữ nguyên`, `Sẽ thêm`, `Đổi thứ tự`.
- Dòng chỉ có trong dữ liệu hiện tại hiển thị read-only `Sẽ xóa`; không đưa vào payload import.
- Bộ lọc cho phép xem riêng các dòng có thay đổi.

Dialog xác nhận import:

- Thêm số lớp `changed` và `unchanged`.
- Thêm tổng số sinh viên sẽ thêm, sẽ xóa, đổi thứ tự.
- Liệt kê lớp có xóa sinh viên hoặc dữ liệu hiện tại bất thường.
- Nếu có khác biệt, hiển thị cảnh báo nổi bật: “Import sẽ thay thế danh sách hiện tại theo dữ liệu HVU”.
- Giữ checkbox xác nhận bắt buộc; nội dung checkbox phải bao gồm việc đã xem số sinh viên thêm/xóa.
- Lớp đối chiếu lỗi hoặc preview cũ không xuất hiện trong danh sách xác nhận.

### 18.7. Hành vi import

- `changed`: cho phép xóa rồi import sau khi người dùng xác nhận cảnh báo.
- `unchanged`: đề xuất bỏ qua xóa/import để tránh request phá hủy không cần thiết; vẫn hiển thị trạng thái “Không cần cập nhật”.
- `failed` hoặc `stale`: khóa import, giữ nguyên dữ liệu lớp.
- Nếu chỉ thay đổi `ordering`, vẫn xử lý như `changed`.
- Summary sau import bổ sung số lớp không thay đổi đã bỏ qua và số lớp bị chặn do dữ liệu thay đổi sau preview.

### 18.8. File dự kiến chỉnh sửa

1. `import-sinhvien-lophoc.models.ts` — thêm trạng thái/model/counters đối chiếu.
2. `import-sinhvien-lophoc.component.ts` — tải danh sách hiện tại, so sánh, snapshot, preflight trước xóa, điều kiện eligible và summary.
3. `import-sinhvien-lophoc.component.html` — chip trạng thái, số liệu khác biệt, cột thay đổi, cảnh báo dialog.
4. `import-sinhvien-lophoc.component.css` — style cục bộ cho trạng thái và cảnh báo; không sửa `src/assets/css/style.css`.
5. `plans/import-sinh-vien-lop-hoc-hvu.md` — cập nhật quyết định và trạng thái triển khai sau khi code hoàn tất.

Không cần sửa `ClassStudentService`; phương thức `getClassStudentByCol()` hiện có đáp ứng truy vấn theo `class_id`.

### 18.9. Thứ tự triển khai

1. Bổ sung model và khởi tạo trạng thái/counters mặc định.
2. Tạo Observable tải danh sách hiện tại theo lớp, nhóm 5.
3. Tạo hàm chuẩn hóa, snapshot và so sánh thuần, không gọi API.
4. Gắn pipeline so sánh sau bước đối chiếu hồ sơ/tài khoản.
5. Mở rộng điều kiện eligible và trạng thái lỗi.
6. Hiển thị trạng thái/counters trong danh sách lớp và bảng sinh viên.
7. Mở rộng dialog xác nhận bằng số liệu thêm/xóa/đổi thứ tự.
8. Thêm preflight snapshot ngay trước xóa từng lớp.
9. Bỏ qua lớp không thay đổi nếu quyết định đề xuất được duyệt.
10. Cập nhật summary, retry và thông báo hoàn tất.
11. Review tĩnh luồng lỗi/mất dữ liệu; chỉ build/test/run khi được yêu cầu riêng.

### 18.10. Kịch bản kiểm thử chấp nhận

- Hai danh sách rỗng: `unchanged`, không gọi delete/add.
- Hai danh sách cùng mã và cùng thứ tự: `unchanged`.
- HVU có thêm mã: `changed`, đếm đúng `added`, dialog cảnh báo.
- HVU thiếu mã đang có: `changed`, đếm đúng `removed`, dialog nêu rõ sinh viên sẽ bị xóa.
- Cùng mã nhưng khác `ordering`: `changed`, đếm đúng `reordered`.
- Khác hoa thường hoặc khoảng trắng mã: vẫn là cùng sinh viên.
- Một sinh viên thuộc hai lớp: so sánh độc lập theo từng lớp.
- Dữ liệu hiện tại trùng mã hoặc thiếu mã: không bị bỏ qua; có trạng thái/cảnh báo riêng.
- Response danh sách hiện tại sai cấu trúc: lớp `failed/blocked`, không gọi delete.
- Một lớp tải danh sách hiện tại lỗi: lớp khác vẫn được đối chiếu.
- Danh sách hiện tại đổi sau preview: preflight đặt `stale/blocked`, không gọi delete.
- Dòng `removed` chỉ dùng hiển thị, không xuất hiện trong payload add.
- Lớp `changed` chỉ import sau xác nhận checkbox.
- Không có `subscribe()` trong vòng lặp.

### 18.11. Quyết định đã xác nhận trước triển khai

1. Lớp `unchanged` được bỏ qua hoàn toàn; không gọi API xóa hoặc thêm lại.
2. Chỉ thay đổi `ordering` vẫn được xem là `changed` và cần import để cập nhật thứ tự theo HVU.
3. Bản ghi hiện tại thiếu mã, mã rỗng hoặc trùng mã áp dụng phương án A:
   - Đánh dấu `current-invalid`, tính lớp là `changed` và hiển thị số bản ghi bất thường.
   - Vẫn cho thay thế nếu danh sách HVU đã tải và đối chiếu hoàn toàn hợp lệ.
   - Cảnh báo rõ các bản ghi bất thường sẽ bị xóa khi thay thế.
   - Chỉ khóa lớp khi không tải được danh sách hiện tại hoặc response sai cấu trúc.
4. Khi có sinh viên sẽ bị xóa hoặc bản ghi `current-invalid`, dialog phải hiển thị checkbox thứ hai riêng. Nút xác nhận chỉ khả dụng khi cả checkbox xác nhận chung và checkbox chấp nhận xóa đều được tích.

## 19. Lịch sử chỉnh sửa

### 2026-08-17 — Lần 1: Triển khai chức năng import sinh viên vào lớp học phần HVU
**Mục đích:** Hiện thực hóa luồng tải, đối chiếu, xác nhận, xóa và import theo kế hoạch đã duyệt.

**Các thay đổi:**
1. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.models.ts`** — Thêm type trạng thái, model lớp, sinh viên preview, kết quả tải/import.
2. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.ts`** — Thêm phân quyền khoa, pipeline tải HVU nhóm 5, đối chiếu nội bộ, xác nhận, replace từng lớp, retry lớp lỗi.
3. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.html`** — Thêm toolbar, danh sách lớp, bảng sinh viên, progress dialog, dialog cảnh báo bắt buộc checkbox.
4. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.css`** — Thêm bố cục responsive, trạng thái, cảnh báo, empty state.
5. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-hvu-main/import-hvu-main.component.ts`** — Đăng ký component và thẻ chức năng mới.
6. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-hvu-main/import-hvu-main.component.html`** — Thêm `ngSwitchCase` mở chức năng mới.

**Kết quả:** Frontend đã triển khai. Chưa build/test/run. Rủi ro transaction và kiểm tra quyền backend vẫn còn mở.

### 2026-08-17 — Lần 2: Đồng bộ cách lấy năm học và học kỳ
**Mục đích:** Dùng cùng cách truy vấn với `QuanlyLophocphanV2Component`, đảm bảo danh sách được lấy trực tiếp từ dữ liệu lớp chưa xóa.

**Các thay đổi:**
1. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.ts`** — Thay `getPluckClassesByCol()` bằng truy vấn `getClassesByCols()` có `groupby`, sắp xếp giảm dần; học kỳ được tải lại theo năm học đã chọn.
2. **Khởi tạo bộ lọc** — Mặc định chọn năm học mới nhất và học kỳ mới nhất của năm học đó.

**Kết quả:** Năm học/học kỳ dùng cùng nguồn và quy tắc với màn hình quản lý lớp học phần V2. Chưa build/test/run.

### 2026-08-17 — Lần 3: Gộp thao tác tải lớp và tải sinh viên
**Mục đích:** Rút gọn thao tác người dùng; một nút thực hiện toàn bộ luồng tải.

**Các thay đổi:**
1. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.html`** — Bỏ nút “Tải danh sách lớp”; nút “Tải sinh viên từ HVU” khả dụng khi đã chọn năm học/học kỳ.
2. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.ts`** — Khi bấm tải: reset preview → tải lớp nội bộ → tải sinh viên HVU theo nhóm 5 → đối chiếu hồ sơ/tài khoản.
3. **Luồng lỗi** — Lỗi tải lớp dừng trước khi gọi HVU; không có lớp hiển thị thông báo và kết thúc an toàn.

**Kết quả:** Người dùng chỉ cần chọn năm học/học kỳ rồi bấm “Tải sinh viên từ HVU”. Chưa build/test/run.

### 2026-08-17 — Lần 4: Chuyển bộ chọn năm học, học kỳ vào popup tải
**Mục đích:** Giữ màn hình chính gọn; chỉ yêu cầu chọn thời gian khi người dùng bắt đầu tải dữ liệu.

**Các thay đổi:**
1. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.html`** — Bỏ bộ chọn năm học/học kỳ khỏi toolbar; nút “Tải sinh viên từ HVU” mở popup chọn thời gian và chỉ tải sau khi xác nhận.
2. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.ts`** — Thêm trạng thái lựa chọn tạm trong popup; tải lại học kỳ khi đổi năm; áp dụng lựa chọn sau xác nhận rồi chạy pipeline tải hiện tại.
3. **`src/app/modules/admin/features/dongbo-dulieu/import-hvu/import-sinhvien-lophoc/import-sinhvien-lophoc.component.css`** — Thêm bố cục responsive cho các trường chọn trong popup.

**Kết quả:** Nút tải mở popup năm học/học kỳ; hủy popup không thay đổi phạm vi dữ liệu hiện tại. Chưa build/test/run.

### 2026-08-17 — Lần 5: Bổ sung bộ chọn khóa
**Mục đích:** Giới hạn danh sách lớp theo `Classes.khoa` trước khi tải sinh viên HVU.

**Các thay đổi:**
1. **Popup tải dữ liệu** — Thêm trường bắt buộc “Khóa”; thứ tự phụ thuộc: năm học → học kỳ → khóa.
2. **Truy vấn khóa** — Lấy từ `ClassesService.getClassesByCols()` với `status != -1`, năm học, học kỳ; `groupby/orderby = khoa`, sắp xếp giảm dần và mặc định chọn khóa đầu tiên.
3. **Truy vấn lớp** — Thêm điều kiện `khoa = khóa đã chọn`; xác nhận import hiển thị thêm khóa.

**Kết quả:** Chỉ tải lớp và sinh viên thuộc năm học, học kỳ, khóa đã chọn. Chưa build/test/run.

### 2026-08-17 — Lần 6: Cải thiện giao diện bảng điều khiển đồng bộ
**Mục đích:** Làm rõ tiến trình tải–đối chiếu–import, tăng khả năng quét dữ liệu và giảm nhầm lẫn trước thao tác thay thế danh sách.

**Các thay đổi:**
1. **Cấu trúc màn hình** — Bổ sung tiêu đề chức năng, quy trình ba bước, phạm vi đang áp dụng và hệ thống hành động chính có thứ bậc rõ ràng.
2. **Danh sách lớp và sinh viên** — Thiết kế lại panel master-detail, số liệu lớp, trạng thái, tìm kiếm, bộ lọc lỗi, bảng dữ liệu và empty state; giữ nguyên binding/nghiệp vụ hiện có.
3. **Tổng kết và dialog** — Chuyển kết quả import thành nhóm chỉ số; cải thiện popup chọn phạm vi, tiến độ và xác nhận thay thế bằng nội dung phân cấp, cảnh báo nổi bật.
4. **Responsive và accessibility** — Thêm bố cục desktop/tablet/mobile, `aria-label`/`aria-pressed`, focus-visible, nhãn tìm kiếm ẩn và hỗ trợ `prefers-reduced-motion`.

**Kết quả:** UI mang cấu trúc bảng điều khiển học vụ, dễ theo dõi trạng thái và an toàn hơn trước thao tác import. Không đổi TypeScript/API. Chưa build/test/run hoặc kiểm tra trực quan runtime.

### 2026-08-17 — Lần 7: Thu gọn giao diện và tìm kiếm lớp
**Mục đích:** Tăng diện tích hiển thị dữ liệu, giảm độ chiếm chỗ của điều khiển và hỗ trợ tìm lớp nhanh.

**Các thay đổi:**
1. **Giao diện compact** — Giảm chiều cao header, nút, tiến trình, khoảng cách panel, chiều rộng danh sách lớp và mật độ item/bảng.
2. **Tìm kiếm lớp** — Thêm ô tìm kiếm tức thời theo `name` hoặc `kyhieu`, không phân biệt hoa thường; hiển thị số lớp đang khớp/tổng số lớp, nút xóa từ khóa và trạng thái không có kết quả.
3. **Phạm vi ảnh hưởng** — Chỉ thêm trạng thái lọc cục bộ `searchClass`/`displayedClasses`; không thay đổi API, phân quyền, dữ liệu tải hoặc quy trình import.

**Kết quả:** Màn hình gọn hơn, danh sách lớp dễ tra cứu hơn. Chưa build/test/run hoặc kiểm tra trực quan runtime.

### 2026-08-24 — Lần 8: Siết chặt response HVU và giữ thứ tự sinh viên
**Mục đích:** Ngăn response HVU sai cấu trúc bị hiểu nhầm thành danh sách rỗng; đồng bộ thứ tự sinh viên giống luồng import một lớp.

**Các thay đổi:**
1. **Kiểm tra response HVU** — Chỉ mảng hợp lệ mới được xử lý; response không phải mảng chuyển lớp sang `failed/blocked`, không cho xóa trắng dữ liệu.
2. **`ordering`** — Lưu vị trí ban đầu trong response HVU vào preview và gửi trong payload `ClassStudent`.
3. **Model dùng chung** — Bổ sung `ordering?: number` vào `ClassStudent`.
4. **`sync_class_id`** — Xác nhận nghiệp vụ ngày 2026-08-24: giá trị này duy nhất; giữ cách gom membership theo `syncClassId`.

**Kết quả:** Luồng mới phân biệt response rỗng hợp lệ với response sai cấu trúc; dữ liệu import giữ thứ tự HVU. Chưa build/test/run.

### 2026-08-24 — Lần 9: Lập kế hoạch đối chiếu danh sách hiện tại
**Mục đích:** Phát hiện khác biệt giữa danh sách sinh viên đang có trong lớp và dữ liệu HVU trước khi thực hiện replace.

**Các quyết định trong kế hoạch:**
1. So sánh mã sinh viên chuẩn hóa và `ordering`; phân loại giữ nguyên, thêm, xóa, đổi thứ tự.
2. Hiển thị trạng thái/counters và cảnh báo thay đổi trong preview, danh sách lớp, dialog xác nhận.
3. Lỗi tải danh sách hiện tại khóa import; không gọi xóa.
4. Thêm snapshot và preflight trước xóa để chặn preview đã cũ.
5. Bỏ qua lớp không thay đổi; xem thay đổi `ordering` là thay đổi cần import.
6. Bản ghi hiện tại thiếu/trùng mã vẫn được thay thế sau cảnh báo nếu dữ liệu HVU hợp lệ.
7. Yêu cầu checkbox thứ hai khi có sinh viên hoặc bản ghi bất thường sẽ bị xóa.

**Kết quả:** Kế hoạch đã bổ sung; các quyết định nghiệp vụ đã được xác nhận ngày 2026-08-24. Chưa build/test/run.

### 2026-08-25 — Lần 10: Triển khai đối chiếu danh sách hiện tại
**Mục đích:** Hiển thị khác biệt giữa dữ liệu `class-students` hiện tại và danh sách HVU; chặn replace khi dữ liệu preview đã cũ.

**Các thay đổi:**
1. **Model đối chiếu** — Thêm trạng thái lớp `idle/loading/unchanged/changed/failed/stale`, trạng thái dòng `unchanged/added/removed/reordered/current-invalid`, counters, snapshot và summary lớp bỏ qua/bị chặn.
2. **Pipeline đối chiếu** — Sau khi đối chiếu hồ sơ/tài khoản, tải `class-students` theo nhóm 5, bắt lỗi riêng từng lớp, kiểm tra response bắt buộc là mảng, so sánh mã chuẩn hóa cùng `ordering`.
3. **An toàn import** — Chỉ lớp `changed` thực hiện replace; lớp `unchanged` bị bỏ qua. Trước delete, tải lại danh sách hiện tại và so snapshot; khác snapshot chuyển `stale/blocked`, không gọi delete.
4. **Dữ liệu hiện tại bất thường** — Bản ghi thiếu/trùng mã được đánh dấu `current-invalid`; lớp vẫn có thể replace theo phương án A sau cảnh báo và xác nhận xóa riêng.
5. **UI cảnh báo** — Thêm chip/counters khác biệt theo lớp, cột “Thay đổi”, dòng read-only `Sẽ xóa`, bộ lọc thay đổi, thống kê dialog và checkbox thứ hai khi có sinh viên/bản ghi bất thường sẽ bị xóa.
6. **CSS** — Thêm style trạng thái/cảnh báo cục bộ trong component; không sửa `src/assets/css/style.css`.

**Kết quả:** Đã triển khai tĩnh theo mục 18. Chưa build/test/run hoặc kiểm tra runtime; transaction xuyên API vẫn cần backend nếu yêu cầu replace nguyên tử.

### 2026-08-25 — Lần 11: Sắp xếp sinh viên theo tên trước import
**Mục đích:** Chuẩn hóa thứ tự sinh viên trong từng lớp theo họ tên thay vì vị trí trả về từ HVU.

**Các thay đổi:**
1. **Quy tắc sắp xếp** — Sau đối chiếu hồ sơ, sắp tăng dần theo tên gọi; trùng tên thì theo tên đệm, tiếp theo họ, cuối cùng mã sinh viên. So sánh chuỗi bằng locale tiếng Việt.
2. **`ordering`** — Gán lại liên tục từ 1 riêng trong từng lớp theo kết quả sắp xếp; payload import và bước so sánh danh sách hiện tại sử dụng thứ tự mới.
3. **Họ tên thiếu** — Xếp sau các sinh viên có họ tên; mã sinh viên giữ vai trò khóa ổn định cuối cùng.

**Kết quả:** Đã cập nhật tĩnh pipeline đối chiếu trước bước so sánh/import. Chưa build/test/run theo quy tắc xác minh của dự án.
