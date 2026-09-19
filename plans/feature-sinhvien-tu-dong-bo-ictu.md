# Kế hoạch: Thêm tính năng tải SV từ hệ thống ICTU cho component `sinhvien`

## Mục tiêu

Thêm nút "Tải từ hệ thống đào tạo" vào component `sinhvien` (thường), tương tự nút "Tải từ hệ thống dangky.hvu.edu.vn" trong `sinhvien-hvu`, nhưng dùng API `getStudentClassesByIctu()` từ `ClassesService`.

## API hiện có

**`ClassesService.getStudentClassesByIctu(sync_class_id: number)`**
- Endpoint: `POST <api>/sv-lop-hoc-phan` với body `{ ID_LopHP: sync_class_id }`
- Response: `DanhSachSinhVienLopHocPhan_ICTU[]` — mỗi item có `{ MaSV: string, Ho_ten: string }`
- **Khác với HVU**: Có cả `Ho_ten`, không chỉ `ma_sinh_vien`

## Các bước thực hiện

### 1. Sửa `sinhvien.component.ts`

**Thêm method `onDownLoadFromIctuApi()`** (mượn pattern từ `sinhvien-hvu.onDownLoadFromHvuApi()` tại dòng 2542):

```typescript
onDownLoadFromIctuApi() {
    this.noitifi.isProcessing(true);
    this.classesService.getStudentClassesByIctu(this.classSelected.sync_class_id).subscribe({
        next: (_sync_student) => {
            const data_sync_student = [];
            _sync_student.forEach((f, key) => {
                const ho = f.Ho_ten.split(' ').slice(0, -1).join(' ');
                const ten = f.Ho_ten.split(' ').slice(-1).join(' ');
                data_sync_student.push([key + 1, f.MaSV, ho, ten]);
            })
            this.noitifi.isProcessing(false);
            this.show_count_status = { done: 0, failed: 0, not_import: 0, no_teacher: 0, no_category: 0, sum_data: 0, class_th: 0, class_lt: 0, exist: 0, no_data: 0 };
            const data_student = [];
            this.displayModal = true;
            this.progressValue = 0;
            this.waitting_title = 'Đang lấy dữ liệu sinh viên, vui lòng chờ';
            this.loopGetStudentClassToCheck(data_student, 1, 1000, data_sync_student);
        },
        error: () => {
            this.noitifi.isProcessing(false);
            this.noitifi.toastWarning("Tải thất bại, vui lòng thử lại");
        }
    })
}
```

**Lưu ý**: `sinhvien.ts` đã import `ClassesService` ở dòng 40 — không cần thêm.

### 2. Sửa `sinhvien.component.html`

Thêm nút bên cạnh nút "Chọn file" trong template `#templateImportSinhvien`, giống `sinhvien-hvu.html` dòng 244:

```html
<button *ngIf="classSelected.sync_class_id" (click)="onDownLoadFromIctuApi()"
    [disabled]="displayModal" class="btn btn-warning">
    <i class="fa fa-random"></i>
    Tải từ hệ thống đào tạo
</button>
```

### Luồng xử lý

```
User click "Tải từ hệ thống đào tạo"
  -> getStudentClassesByIctu(sync_class_id)
    -> response: [{MaSV, Ho_ten}, ...]
    -> map thành [index, MaSV, họ, tên]  (tách Ho_ten)
    -> init show_count_status
    -> loopGetStudentClassToCheck() -> convertSqlStudentData() -> loopGetStudentExist()
    -> hiển thị bảng import preview (giống import Excel)
    -> user bấm "Bắt đầu import" -> startImportStudentToClass()
```

## Các file cần sửa

| File | Thay đổi |
|---|---|
| `sinhvien.component.ts` | Thêm method `onDownLoadFromIctuApi()`, đổi `STATUS_IMPORT_STUDENT_CLASS` → `STATUS_IMPORT_ONE_STUDENT`, thêm flag `_no_user` |
| `sinhvien.component.html` | Thêm nút trong templateImportSinhvien, đổi rows 20 → 100 |

...

## Kiểm tra tài khoản SV (xác định trạng thái no_data)

Khi tải user_profile theo student_code:

1. **Không tìm thấy profile** → `no_data`
2. **Có profile nhưng `user_id = 0/null`** → `no_data`
3. **Có profile, có user_id, nhưng không tìm thấy user trong users table** → gắn `_no_user = true` → `no_data`
4. **Có profile + có user + có email** → `not_import` (hoặc `exist` nếu đã trong lớp)

Cơ chế: Trong `loopGetStudentExist()`, sau khi gọi `userService.getUserByPageNew()`, những user_id không xuất hiện trong response được đánh dấu `_no_user`. Ở else block, kiểm tra `!user_id || _no_user` để gán `no_data`.

## So sánh HVU vs ICTU

| API | Response | Tách tên |
|---|---|---|
| HVU (`HvuApiDanhsachSinhvienTheoLopService`) | `{ ma_sinh_vien: string }` | Không — để `['', '']` |
| ICTU (`ClassesService.getStudentClassesByIctu`) | `{ MaSV: string, Ho_ten: string }` | Có — tách Ho_ten thành họ và tên |

## Xử lý đặc thù

- **`sync_class_id`**: Có thể có hoặc = 0. `*ngIf="classSelected.sync_class_id"` xử lý đúng vì `0` là falsy.
- **Phân trang client**: API trả về 1 lần, nhưng xử lý qua `loopGetStudentClassToCheck()` — batch 50 SV/lần để tránh quá tải request kiểm tra trùng.
