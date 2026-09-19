# Đồng bộ ca thi từ hệ thống ICTU

## Mục tiêu

Tạo chức năng cho phép đồng bộ ca thi từ hệ thống ICTU (Nam Việt) vào hệ thống hiện tại. Người dùng chọn học kỳ, năm học, môn học → xem danh sách ca thi → chọn và import → đồng thời import sinh viên + phòng thi.

**Trạng thái:** ✅ Hoàn thành (100% theo plan, 14 lần cập nhật)

## Kiến trúc

### Component tree
```
TaoCathiComponent
  └─ DongboCathiIctuComponent (standalone, full-screen side panel)
       ├─ Filter bar: Năm học | Học kỳ | Môn học | Đợt thi
       ├─ Table: checkbox, tên ca thi, thời gian, hình thức, trạng thái
       ├─ Detail view (side-by-side): phòng thi (trái) | SV (phải)
       ├─ Progress modal (dialog-waiting)
       └─ Sync results overlay (max-width: 1024px)
```

### Data flow

```
syncSelected():
  └─ loadAllPreData$(toSync)
       ├─ forkJoin: detail + rooms cho mỗi ca thi → cachedStudents, cachedRooms
       └─ forkJoin batch load profiles (chunk 20):
            ├─ student_codes → studentCodeMap (lowercase)
            ├─ teacher_codes → teacherCodeMap (lowercase)
            └─ teacher_emails → teacherEmailMap (lowercase)
  └─ concatMap import từng ca thi:
       ├─ [1] addThiShifts → newShiftId (hoặc reuse localId nếu reimport)
       ├─ [2] importStudents$ → {errs, importedCount, importedRooms}
       ├─ [3] Nếu totalStudents > 0 && importedCount === 0 → skip rooms
       ├─ [4] preCheckTeachers$() → nếu CB thiếu → skip rooms
       └─ [5] importRooms$(..., importedRooms): chỉ import phòng có SV
```

### Key design decisions

| Decision | Detail |
|---|---|
| **Standalone component** | Không module riêng, import trực tiếp vào `TaoCathiComponent` |
| **Batch pre-load** | Detail + rooms + profiles load 1 lần trước khi import để tránh N+1 queries |
| **Chunk 20 profiles** | Tránh URL quá dài khi batch query user profiles |
| **Lowercase keys** | Toàn bộ lookup keys (Ma_sv, Ma_cb, email) đều `.toLowerCase()` |
| **Reimport** | Ca thi status=0 (chưa kích hoạt) cho phép chọn lại; xóa SV/phòng không còn trong ICTU |
| **Rule 1 compliance** | Không gọi hàm trong template: dùng `shiftDisplayNameMap`, `timeLabelMap`, computed properties |
| **RefreshTrigger** | `openCount` increment mỗi lần mở panel → `ngOnChanges` reset state + tự động load |
| **Overlay 1024px** | Sync results card mở rộng `max-width: 1024px` |

### Status types

| Status | Meaning |
|---|---|
| `pending` | Chưa đồng bộ |
| `exists` | Đã đồng bộ + có SV (không cho chọn) |
| `synced` | Vừa đồng bộ xong |
| `reimport` | Đã đồng bộ nhưng chưa có SV (status=0) → cho phép nhập lại |

## Files

### Created
1. `dongbo-cathi-ictu/dongbo-cathi-ictu.component.ts` (~1288 dòng)
2. `dongbo-cathi-ictu/dongbo-cathi-ictu.component.html` (~358 dòng)
3. `dongbo-cathi-ictu/dongbo-cathi-ictu.component.css` (~664 dòng)

### Modified
1. `tao-cathi/tao-cathi.component.ts` — thêm `openCount`, `openDongBoCathi()`, import component
2. `tao-cathi/tao-cathi.component.html` — thêm nút "Đồng bộ ca thi" + ng-template `#templateDongboCathi`

## API interfaces (`thi-shifts.service.ts`)

| Interface | Usage | Key fields |
|---|---|---|
| `CathiNV` | Danh sách ca thi từ ICTU | ID_thi, Hoc_ky, Nam_hoc, Dot_thi, Mo_ta, Ngay_thi, Ky_hieu, Hinh_thuc_thi, TimeStart, ID_hinh_thuc, kyhieu_cathi |
| `CathiDetailNV` | Sinh viên trong ca thi | ID_thi, Ma_sv, Ho_ten, Ten, So_bao_danh, So_phong, Gioi_tinh, Ngay_sinh, Ten_lop |
| `CathiRoomNV` | Phòng thi + cán bộ coi thi | ID_thi, So_phong, Ma_cb_coi_thi1/2, Email_coi_thi1/2, Giao_vien_coi_thi1/2 |
| `CathiHinhthucthiNV` | Hình thức thi | ID_hinh_thuc, Ky_hieu, Ten_hinh_thuc |

## Import mapping

### ThiShifts
| Field | Source |
|---|---|
| `sync_cathi_id` | `CathiNV.ID_thi` |
| `hocky` | `CathiNV.Hoc_ky` |
| `namhoc` | `CathiNV.Nam_hoc` (replace `-` → `_`) |
| `dotthi` | `CathiNV.Dot_thi` |
| `name` | `{kyhieu_cathi} - {courseName} - {timeLabel} - {Nam_hoc} - HK{Hoc_ky} - Đợt{Dot_thi}` |
| `time_start` | `Ngay_thi + TimeStart` → SQL datetime |
| `course_id` | `selectedCourse.id` |
| `type_of_test` | `'TRACNGHIEM'` |
| `status` | `0` |

### ThiShiftStudents
| Field | Source |
|---|---|
| `student_id` | `studentCodeMap.get(Ma_sv.toLowerCase()).id` |
| `ordering` | Sort theo `So_bao_danh` (parseInt) |
| `sbd` | `CathiDetailNV.So_bao_danh` |
| `room` | `CathiDetailNV.So_phong` |
| `student_user_id` | `studentCodeMap.get(Ma_sv).user_id` |

### ThiShiftRooms
| Field | Source |
|---|---|
| `room` | `CathiRoomNV.So_phong` (chỉ phòng có SV imported) |
| `canbo_coithi_ids` | `[lookupTeacher(Ma_cb1, Email1)?.user_id, ...]` |
| `pass_of_room` | `generatePasscode()` — 6 số ngẫu nhiên |

## Xuất Excel danh sách SV không có trong hệ thống

- Nút "Xuất Excel" trong footer của sync results overlay
- Định dạng: xlsx dùng exceljs
- Header màu vàng (`FFFF00`), border thin, font bold
- Cột:

| Cột | Giá trị | Tô màu |
|---|---|---|
| `SBD` | `So_bao_danh` | ✘ |
| `Họ và tên` | `Ho_ten` | 🟡 |
| `Ngày sinh` | `Ngay_sinh` → `dd.mm.yyyy` | 🟡 |
| `Giới tính` | `Gioi_tinh` | ✘ |
| `Phone` | `Ma_sv` | 🟡 |
| `Mã SV` | `Ma_sv` | 🟡 |
| `Email` | `Ma_sv` + `@ictu.edu.vn` | 🟡 |
| `Lớp quản lý` | `Ten_lop` | 🟡 |
| `Tỉnh` | (rỗng) | ✘ |
| `Ngành` | (rỗng) | ✘ |
| `Khoa` | (rỗng) | ✘ |
| `Khoa đào tạo` | (rỗng) | 🟡 |

- Lưu file với tên `SV_khong_co_trong_he_thong_{timestamp}.xlsx`
- Dùng `file-saver` để download

## Sync results overlay

- **Summary:** Thành công X / Y ca thi, Thất bại Z ca thi
- **SV không có trong hệ thống:** table (ca thi, mã SV, họ tên)
- **CB không có trong hệ thống:** table (ca thi, cán bộ, phòng)
- **SBD trùng:** table (ca thi, số báo danh, danh sách SV)
- **Nút "Hoàn tất"** → đóng overlay (không đóng panel). Dùng nút X header để đóng panel
- **Nút X overlay** → chỉ đóng overlay, giữ panel
- **Nút X header / đóng panel** → emit `onSyncSuccess` → parent reload + đóng panel

## Changelog

| Date | Lần | Nội dung |
|---|---|---|
| 2026-07-01 | 1 | Tạo kế hoạch |
| 2026-07-01 | 2-12 | Implement + bổ sung import SV/phòng, batch pre-load, reimport, layout detail, lowercase keys, refresh trigger, filters, etc. |
| 2026-07-02 | 13 | Thêm `kyhieu_cathi` vào tên hiển thị, refactor tuân thủ Rule 1 (không gọi hàm trong template) |
| 2026-07-03 | 14 | Sửa "Hoàn tất" không đóng side panel, reload parent chỉ khi đóng panel |
| 2026-07-03 | 15 | Thêm Gioi_tinh/Ngay_sinh/Ten_lop vào CathiDetailNV; thêm nút Xuất Excel danh sách SV không có trong hệ thống (header màu vàng) |
