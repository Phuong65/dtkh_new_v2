# Kế hoạch: Thống kê điểm thường xuyên DTTX-ICTU

## Mục tiêu

Tạo chức năng mới `thongke-diemthuongxuyen-dttx-ictu` tại:
`src/app/modules/admin/features/lop-hoc-phan/class-details`

Sao chép **100%** từ `thongke-diemthuongxuyen-tueba-dttx` (giống hệt UI/UX, logic, template, style). Chỉ đổi tên để phân biệt chức năng mới.

## Yêu cầu

- Không chỉnh sửa UI/UX hay logic.
- Chỉ thay đổi: tên thư mục, tên file, tên class, selector.
- Đăng ký vào màn hình quản lý chi tiết lớp học phần (`manage-class-details`).

## Các bước thực hiện

1. **Tạo thư mục** `thongke-diemthuongxuyen-dttx-ictu` trong `class-details`.
2. **Sao chép 3 file** từ `thongke-diemthuongxuyen-tueba-dttx`:
   - `thongke-diemthuongxuyen-dttx-ictu.component.ts`
   - `thongke-diemthuongxuyen-dttx-ictu.component.html`
   - `thongke-diemthuongxuyen-dttx-ictu.component.css`
3. **Đổi tên trong TS**:
   - Class: `ThongkeDiemthuongxuyenTuebaDttxComponent` → `ThongkeDiemthuongxuyenDttxIctuComponent`
   - Selector: `app-thongke-diemthuongxuyen-tueba-dttx` → `app-thongke-diemthuongxuyen-dttx-ictu`
   - `templateUrl`/`styleUrls` → path file mới
4. **Đăng ký trong** `manage-class-details.component.html`:
   - NgSwitchCase `'dttx-ictu'` dùng component mới (thay vì tueba-dttx).
5. **Import** `ThongkeDiemthuongxuyenDttxIctuComponent` trong `manage-class-details.component.ts`.

## Câu hỏi mở

- Không có.

## Trạng thái

- [x] Tạo thư mục + 3 file copy
- [x] Đổi tên class/selector
- [x] Đăng ký trong manage-class-details

## Đã hoàn thành (2026-08-19)

- Copy 100% 3 file từ `thongke-diemthuongxuyen-tueba-dttx` sang thư mục mới `thongke-diemthuongxuyen-dttx-ictu` (không sửa UI/UX/logic).
- Đổi tên: class `ThongkeDiemthuongxuyenDttxIctuComponent`, selector `app-thongke-diemthuongxuyen-dttx-ictu`, templateUrl/styleUrls trỏ file mới.
- `manage-class-details.component.html`: `ngSwitchCase 'dttx-ictu'` giờ dùng `app-thongke-diemthuongxuyen-dttx-ictu`.
- `manage-class-details.component.ts`: import + khai báo component mới trong `imports`.

## Còn lại / chưa chạy

- Chưa build/compile kiểm tra (chỉ review tĩnh).

---

# Cải tiến: Đồng bộ dữ liệu theo cấu trúc chuẩn (2026-08-20)

## Mục tiêu

Thay đổi payload tạo/đồng bộ điểm trong `createAndAddRpt()` để khớp cấu trúc:

```json
{
  "course_id": 20082, "class_id": 6, "student_id": 14384,
  "hodem": "...", "ten": "...", "student_code": "...",
  "bttn": 9,
  "bttn_max_tp": { "week_1": 8.7, ..., "week_9": 9.3 },
  "tx1": 6.3, "tx2": 8.7, "tx3": 7.3, "tx4": 0,
  "thi": 0,
  "tyle": { "cc": 5, "bttn": 15, "tx": 30, "thi": 50 }
}
```

**Quy tắc:** điểm `<= 0` / `null` / không tìm thấy → mặc định `0`.

## Phân tích hiện trạng (`createAndAddRpt()` — dòng ~483-563)

| Trường | Hiện trạng | Việc cần làm |
|---|---|---|
| course_id, class_id, student_id, hodem, ten, student_code | ✅ đã có | — |
| `bttn` | ✅ trung bình điểm cao nhất theo tuần (`bttn_tp_total / weeks`) | giữ nguyên |
| `bttn_max_tp` | ⚠️ tuần không có bài → **thiếu key** (undefined) | điền đủ `week_1..week_N`, tuần thiếu = `0` |
| `tx1..txN` | ⚠️ có thể `-1` (chưa làm / lock=1 / tuluan không có point) | normalize `<=0` → `0` |
| `thi` | ❌ không có trong payload | thêm `thi: 0` (chưa có nguồn dữ liệu thi) |
| `tyle` | ❌ không có; chỉ set lúc export (`kynang`, không phải `tx`) | thêm `tyle: {cc, bttn, tx, thi}` |

## Các bước thực hiện

1. **Thêm helper normalize** (cạnh `validatePoint`, dòng 62):
   `normalizePoint = (v) => v > 0 ? v : 0` — điểm `null/undefined/<=0` → `0`.
2. **TX** (dòng 536-556):
   - `THUONGXUYEN_TRACNGHIEM`: `-1` → `0`; giữ `Number(tong_diem)` nếu > 0.
   - `THUONGXUYEN_TULUAN/DUAN`: `validatePoint(tx.point, -1)` → `normalizePoint(...)`.
3. **`bttn_max_tp`** (dòng 500-519): sau vòng lặp tuần, dựng lại object đủ `week_1..week_N`:
   `{ week_i: existing > 0 ? existing : 0 }` cho mọi i từ 1..weeks. (`bttn_tp` giữ nguyên như cũ).
4. **`thi`**: thêm `mapData['thi'] = 0` (chưa có nguồn; mặc định theo yêu cầu).
5. **`tyle`**: thêm `mapData['tyle'] = {...}`:
   - Ưu tiên đọc từ `course_config` group `PERCENT_SCORE_SUMMARY` (giống `btnExportExcel` dòng 676-703), map key: `kynang` → `tx`.
   - Fallback mặc định `{cc: 5, bttn: 15, tx: 30, thi: 50}`; key thiếu → mặc định.
6. **`bttn` an toàn**: `bttn_tp_total / (weeks || 1)` tránh NaN.
7. Chỉ sửa file `thongke-diemthuongxuyen-dttx-ictu.component.ts` — không sửa HTML/CSS, không ảnh hưởng tueba-dttx.

## Câu hỏi mở — đã chốt (2026-08-20)

1. **`thi`** → **Mặc định = 0** (chưa có nguồn điểm thi).
2. **`tyle`** → Đọc từ config `PERCENT_SCORE_SUMMARY` (map `kynang` → `tx`), fallback `{cc: 5, bttn: 15, tx: 30, thi: 50}`, key thiếu → mặc định.
3. **Hiển thị bảng** → Giữ nguyên template, bài TX chưa làm hiện `0` (không sửa UI/UX).
4. **`bttn_max_tp` tuần thiếu** → điền `week_i = 0` (theo quy tắc, không phân biệt chưa có bài vs điểm 0 thật).

## Trạng thái

- [x] Thêm `normalizePoint`: giá trị `<= 0`, `null`, không hợp lệ, không tìm thấy → `0`.
- [x] `bttn_max_tp`: luôn đủ `week_1..week_N`, tuần thiếu → `0`.
- [x] `bttn`: trung bình điểm cao nhất theo tuần, kiểu `number`, chống chia 0/NaN.
- [x] `tx1..txN`: khởi tạo đủ bằng `0`; trắc nghiệm/tự luận/dự án chuẩn hóa điểm và trạng thái lock.
- [x] `thi`: mặc định `0`.
- [x] `tyle`: lấy từ course config `PERCENT_SCORE_SUMMARY`, map `kynang` → `tx`, fallback `{cc: 5, bttn: 15, tx: 30, thi: 50}`.
- [x] Giữ nguyên HTML/CSS/UI/UX; chỉ sửa TypeScript của DTTX-ICTU.

## Đã triển khai (2026-08-20)

- Bổ sung course config vào `forkJoin` hiện có; không tạo subscription trong vòng lặp.
- Chuẩn hóa giá trị API dạng số/chuỗi; loại `NaN`, số âm, `null`.
- Giữ riêng chức năng `thongke-diemthuongxuyen-tueba-dttx`, không thay đổi bản TUEBA.
- Review tĩnh hoàn tất. Chưa build/test/run theo quy ước dự án.

---

# Cải tiến: An toàn bất đồng bộ (2026-08-20)

## Đã triển khai

- Snapshot `classId`, `courseId`, số tín chỉ cho từng lần tải/đồng bộ; callback không đọc lại lớp mutable.
- Hủy request cũ khi `classSelected` đổi hoặc component bị hủy bằng `takeUntil`.
- Gộp chuỗi đọc dữ liệu → dựng payload → ghi tuần tự → tải lại vào một outer subscription.
- Tải report hiện có trong pipeline đồng bộ; giữ điểm CC hiện tại, không phụ thuộc `listData` chưa tải.
- Report đã tồn tại dùng `update`; sinh viên chưa có report mới dùng `add`, giảm nguy cơ tạo bản ghi trùng khi đồng bộ lại.
- Khóa thao tác bằng `isSyncing`; vô hiệu hóa nút Đồng bộ/Lưu trong thời gian xử lý.
- Validation CC không hợp lệ phát `error`; không còn trả kết quả thành công giả.
- Dùng `finalize` để đóng modal và mở khóa xử lý; request đổi lớp cũ không ghi đè trạng thái lớp mới.
- Guard config `PERCENT_SCORE_SUMMARY` không tồn tại.

## Còn lại / chưa chạy

- Review tĩnh hoàn tất; `git diff --check` không phát hiện lỗi khoảng trắng.
- Chưa build/compile/test/run theo quy ước dự án.
- Ghi tuần tự vẫn không có transaction backend; lỗi giữa chuỗi có thể tạo trạng thái cập nhật một phần. Retry idempotent nhờ update report hiện có.

---

# Cải tiến: Xuất Excel và tính điểm theo tỷ lệ (2026-08-20)

## Đã triển khai

- Lọc `PERCENT_SCORE_SUMMARY` theo đúng `course_id`; không trộn cấu hình giữa các môn.
- Dùng một cấu trúc tỷ lệ `{cc, bttn, tx, thi}` cho đồng bộ, tính điểm và xuất file; map cấu hình `kynang` sang `tx`.
- Chuẩn hóa công thức điểm thường xuyên theo tổng tỷ lệ ba thành phần: `(CC × cc + BTTN × bttn + TX trung bình × tx) / (cc + bttn + tx)`.
- Giữ quy tắc cũ làm tròn điểm TX trung bình một chữ số trước khi quy đổi; điểm tổng hợp làm tròn một chữ số khi xuất.
- Hai sheet `BangDiemTX` và `Chitiet` dùng cùng công thức, cùng kết quả `CAM`, cùng lý do cấm thi.
- Bảo vệ report cũ thiếu `bttn_max_tp`; tuần thiếu xuất `0`.
- Số cột TX của sheet chi tiết dùng cùng nguồn `arrSotinchi`, tránh lệch header và dữ liệu.
- Không ghi đè `tyle` trong `listData` khi xuất.
- `ExportDiemthuongxuyenV3Service.exportExcel()` trả `Promise<void>` để caller chờ hoàn tất và nhận lỗi tạo file.
- Ghi chú trong Excel hiển thị đúng tỷ lệ `cc`, `bttn`, `tx`.

## Còn lại / chưa chạy

- Chưa build/compile/test/run theo quy ước dự án.
- Cần kiểm thử thực tế với môn có tỷ lệ tùy chỉnh, sinh viên bị `CAM`, report cũ thiếu `bttn_max_tp`, lớp 2/3/4 tín chỉ.
