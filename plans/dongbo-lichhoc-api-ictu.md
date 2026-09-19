# Kế hoạch: Đồng bộ lịch học từ API ICTU

## Mô tả

Thêm nút "Đồng bộ ICTU" vào component `import-lichhoc` hiện tại (tương tự pattern `import-lophoc`). Click → modal nhập năm học + học kỳ + đợt → gọi `ClassesService.getCalendarByIctu()` → convert dữ liệu từ `CALENDAR_ICTU[]` → gán vào `list_lichhoc` → dùng chung luồng import có sẵn (`startImportLichHoc()`, `loopAddCalendar()`).

---

## Kiến trúc

### Component sửa đổi

- `import-lichhoc.component.ts` — thêm state (syncYear, syncSemester, syncDot, syncYears) + methods (openSyncModal, syncFromIctu, convertIctuToCalendar)
- `import-lichhoc.component.html` — thêm nút + modal `#templateSyncIctu`

### API sử dụng

| API | Mục đích |
|---|---|
| `ClassesService.getCalendarByIctu(Nam_hoc, Hoc_ky, Dot)` | Tải lịch giảng dạy từ ICTU (trả về `CALENDAR_ICTU[]`) |
| `ClassesService.getClassesByPageNew(option)` | Tra `class_id` từ slug (đã có sẵn trong convertDataToSql) |

### Interface `CALENDAR_ICTU`

```typescript
interface CALENDAR_ICTU {
    IDlophp: number;      // ID lớp học phần trên ICTU
    MaLopHP: string;      // mã lớp HP: "NRS131-1-25 (K23.TKĐH.K1.D1.N03)"
    Tenlophp: string;     // tên lớp HP
    Monhoc: string;       // tên môn học
    Ngaygiangday: string; // "7/7/2025 12:00:00 AM"
    Giangduong: string;   // phòng học
    Tuanthu: number;      // tuần học thứ mấy
    Tietbatdau: number;   // tiết bắt đầu
    Tietketthuc: number;  // tiết kết thúc
    MaGV: string;         // mã giảng viên
    Hotengv: string;      // tên giảng viên
}
```

### Mapping `CALENDAR_ICTU` → `Calendar` (local)

| Calendar field | Nguồn | Ghi chú |
|---|---|---|
| `class_id` | Tra từ `MaLopHP`/`Tenlophp` slug → `ClassesService.getClassesByPageNew({ include: slug })` | Cần lookup class theo tên (giống Excel flow hiện tại) |
| `tuan` | `Tuanthu` | Trùng khớp |
| `ngay` | `Ngaygiangday` → format `yyyy-MM-dd` | Parse date, dùng `helperService.strToSQLDate()` |
| `thu` | `Ngaygiangday` → lấy day of week (2-8) | `new Date(Ngaygiangday).getDay()` → 0=CN→8, 1-6→2-7 |
| `tiet` | `Tietbatdau` → `Tietketthuc` → string `"1,2,3"` | Join range bằng dấu phẩy |
| `diadiem` | `Giangduong` | Trùng khớp |
| `teacher_ids` | `MaGV` → mapping local teacher ID | Cần lookup teacher. Nếu không tìm thấy → `status_import = -2` |
| `class_name` | `Tenlophp` | Trùng khớp |
| `class_name_slug` | `helperService.slugVietnamese(Tenlophp)` | Giống Excel flow |
| `sotc` | **Không có từ API** — để trống hoặc lấy từ lookup class | Cần confirm |

### Luồng xử lý

```
Click "Đồng bộ ICTU"
  → modal nhập năm học (dropdown) + học kỳ (input) + đợt (input)
  → getCalendarByIctu(Nam_hoc, Hoc_ky, Dot)
    → nhận CALENDAR_ICTU[]
    → gom theo slug, batch lookup class_id (giống Excel flow hiện tại — convertDataToSql)
    → với mỗi record:
        parse Ngaygiangday → ngay, thu
        Tietbatdau+Tietketthuc → tiet string
        lookup class_id từ slug
        lookup teacher_ids từ MaGV
    → gán list_lichhoc (dùng chung list với import Excel)
    → import giống hệt flow Excel (nút "Bắt đầu")
```

---

## Câu hỏi cần làm rõ

1. **`sotc` (số tín chỉ)** — `CALENDAR_ICTU` không có field này. Lấy từ đâu?
   - Để trống / mặc định?
   - Tra từ lớp học phần đã được import trước đó (`Classes`)?

2. **Mapping `teacher_ids` từ `MaGV`** — `MaGV` từ ICTU là string kiểu `"gv00001"`. Làm thế nào để map sang local user ID?
   - Import giảng viên từ ICTU đã tạo mapping này chưa?
   - Cần tra theo `ma_gv` (user.ma_gv hay user.username)?
   - Hay vẫn để trống và import xong người dùng tự sửa?

3. **Tìm `class_id` từ `IDlophp`** — `CALENDAR_ICTU` có `IDlophp` (ID lớp HP từ ICTU). Nếu `import-lophoc` đã lưu `sync_class_id = ID_LopHP` vào `Classes` thì ta có thể tra ngược. Hiện tại `convertDataToSql` dùng slug để tra — có cần thêm cách tra theo `sync_class_id` không?

4. **Ghi đè dữ liệu** — Có cần logic ghi đè riêng cho data từ ICTU, hay dùng chung checkbox `ghi_de` hiện tại?

5. **`Ngaygiangday` timezone** — Giá trị `Ngaygiangday` từ API có dạng `"7/7/2025 12:00:00 AM"` (giờ 00:00). Cần parse chính xác date, bỏ qua time part.

6. **`Tuanthu`** — Tuần này là tuần thứ mấy theo: lịch năm học hay tuần từ đầu học kỳ? Cần confirm xem `tuan` trong Calendar model dùng loại tuần nào.
