# Kế hoạch sao chép hai chiều hội đồng CELO và hội đồng câu hỏi

## 1. Thông tin chung

- **Chức năng:** Hiển thị danh sách hội đồng nguồn, cho phép người dùng chọn một hoặc nhiều hội đồng CELO để sao chép thành hội đồng câu hỏi; hỗ trợ chiều ngược lại.
- **Nguồn:** `HoidongThamdinh.type = 'celo'` hoặc `'cauhoi'`.
- **Đích:** Loại hội đồng còn lại.
- **Dữ liệu sao chép:**
  1. `HoidongThamdinh`.
  2. `HoidongThamdinhThanhvien`.
  3. `HoidongThamdinhMonhoc`.
  4. `HoidongThamdinhMonhocThanhvien`.
- **Trạng thái kế hoạch:** Đã triển khai frontend ngày 2026-08-21; backend chưa có trong workspace; chưa build/test/run.

## 2. Mục tiêu nghiệp vụ

1. Tại màn quản lý hội đồng CELO, người có quyền mở danh sách hội đồng CELO đủ điều kiện, chọn một hoặc nhiều hội đồng để sao chép sang hội đồng câu hỏi.
2. Tại màn quản lý hội đồng câu hỏi, người có quyền mở danh sách hội đồng câu hỏi đủ điều kiện, chọn một hoặc nhiều hội đồng để sao chép sang hội đồng CELO.
3. Job chỉ xử lý các ID hội đồng người dùng đã chọn; không mặc định sao chép toàn bộ danh sách.
4. Mỗi hội đồng mới giữ đúng thành viên chung, môn học, thành viên theo môn và vai trò chủ tịch của hội đồng nguồn.
5. Mọi khóa ngoại của dữ liệu mới phải trỏ sang ID mới; không dùng lại ID cha/con của hội đồng nguồn.
6. Thao tác lặp lại không tạo bản sao vô hạn hoặc sao chép vòng CELO → câu hỏi → CELO.
7. Một hội đồng lỗi không làm hỏng dữ liệu của chính hội đồng đó; các hội đồng đã hoàn tất vẫn được ghi nhận rõ.
8. Người dùng nhận được kết quả tổng hợp: số hội đồng đã chọn, đã tạo, bỏ qua, thất bại; số bản ghi con đã sao chép.

## 3. Hiện trạng frontend

### 3.1. Phân biệt loại hội đồng

- Model `HoidongThamdinh` dùng trường `type: 'celo' | 'cauhoi'`.
- `HdThamdinhManagerComponent` suy ra `type_hd` từ route:
  - `thamdinh-celo` → `celo`.
  - `thamdinh-cauhoi` → `cauhoi`.
- Danh sách hiện tại lọc API theo `type_hd`.
- Form tạo mới tự gán `type = type_hd`.

### 3.2. API frontend hiện có

Các service hiện chỉ cung cấp CRUD từng resource:

| Resource | Service | API |
|---|---|---|
| Hội đồng | `HoidongThamdinhService` | `hoidong-thamdinh/` |
| Thành viên chung | `HoidongThamdinhThanhvienService` | `hoidong-thamdinh-thanhvien/` |
| Môn học hội đồng | `HoidongThamdinhMonhocService` | `hoidong-thamdinh-monhoc/` |
| Thành viên theo môn | `HoidongThamdinhMonhocThanhvienService` | `hoidong-thamdinh-monhoc-thanhvien/` |

Chưa có endpoint sao chép, transaction hoặc batch riêng trong frontend.

### 3.3. Quan hệ dữ liệu hiện tại

```text
HoidongThamdinh
├── HoidongThamdinhThanhvien
│   └── hoidong_thamdinh_id
└── HoidongThamdinhMonhoc
    ├── hoidong_thamdinh_id
    └── HoidongThamdinhMonhocThanhvien
        ├── hoidong_thamdinh_id
        └── hoidong_thamdinh_monhoc_id
```

Luồng quản lý môn hiện ghép `HoidongThamdinhMonhocThanhvien` vào môn bằng `hoidong_thamdinh_monhoc_id`. Khi tạo thành viên mới theo môn, frontend cũng tạo thành viên chung cho hội đồng.

### 3.4. Quyền hiện tại

- Nút thêm hội đồng chỉ hiển thị khi `canAdd && isManager`.
- `isManager` hiện gồm: `manager`, `admin`, `hoidongthi_lanhdao`, `chuyenvien_pdt`.
- Backend vẫn phải kiểm tra quyền; không tin cậy điều kiện hiển thị frontend.

## 4. Quyết định kiến trúc đề xuất

### 4.1. Chọn sao chép phía backend

**Khuyến nghị:** Thêm một endpoint nghiệp vụ ở backend; frontend chỉ gửi một lệnh sao chép và hiển thị kết quả.

Không khuyến nghị điều phối toàn bộ bằng bốn service CRUD hiện có vì:

1. Frontend phải tải toàn bộ dữ liệu bốn bảng.
2. Phải tự quản lý ánh xạ ID cũ → ID mới.
3. Mạng ngắt giữa chừng dễ tạo dữ liệu thiếu cha/con.
4. Bấm lại dễ tạo trùng.
5. Không thể transaction qua nhiều HTTP request.
6. Sao chép hai chiều dễ sinh vòng lặp và tăng dữ liệu vô hạn.
7. Trình duyệt phải thực hiện rất nhiều request khi số hội đồng lớn.

### 4.2. Phạm vi transaction

**Khuyến nghị:** Transaction theo từng hội đồng nguồn, không dùng một transaction cho toàn bộ đợt.

- Trong một hội đồng: bốn nhóm dữ liệu phải thành công cùng nhau hoặc rollback toàn bộ hội đồng đó.
- Giữa nhiều hội đồng: hội đồng lỗi được đánh dấu thất bại; hội đồng khác tiếp tục.
- Lần chạy sau bỏ qua hội đồng đã có cặp; chỉ xử lý hội đồng còn thiếu.

Cách này giảm thời gian khóa DB, hỗ trợ retry, phù hợp thao tác sao chép nhiều hội đồng đã chọn.

### 4.3. Chống trùng và chống sao chép vòng bằng `id_coppy`

Bổ sung trực tiếp trường `id_coppy` vào `HoidongThamdinh`. Tên trường giữ đúng yêu cầu nghiệp vụ dù từ “copy” thường chỉ có một chữ `p`.

Ý nghĩa:

- Hội đồng gốc: `id_coppy = null`.
- Hội đồng được sao chép: `id_coppy = id` của hội đồng gốc trực tiếp.
- Không tạo bảng ánh xạ riêng.

Ràng buộc đề xuất:

- `id_coppy` là khóa ngoại tự tham chiếu tới `HoidongThamdinh.id`.
- `ON DELETE SET NULL`: khi hội đồng gốc bị xóa, bản sao còn lại trở thành hội đồng độc lập và có thể làm nguồn tạo lại hội đồng loại đối diện.
- Unique index có điều kiện trên `id_coppy` khi khác null: mỗi hội đồng gốc chỉ có tối đa một bản sao loại đối diện.
- Backend vẫn dùng khóa tác vụ để chặn hai job đồng thời vượt qua bước kiểm tra trùng.

Quy tắc:

1. Chỉ hội đồng độc lập có `id_coppy = null` được xét làm nguồn.
2. CELO → câu hỏi: bỏ qua nguồn nếu đã có hội đồng `type = 'cauhoi'` và `id_coppy = source.id`.
3. Câu hỏi → CELO: bỏ qua nguồn nếu đã có hội đồng `type = 'celo'` và `id_coppy = source.id`.
4. Hội đồng đích mới luôn nhận `id_coppy = source.id`.
5. Hội đồng được tạo bởi tính năng có `id_coppy != null`; không được sao chép ngược để tránh vòng lặp.
6. Hội đồng đã có bản sao bị bỏ qua; không update, merge hoặc ghi đè.
7. Khi bản sao bị xóa, lần chạy sau không còn bản ghi mang `id_coppy = source.id`; hệ thống được phép tạo lại.
8. Khi hội đồng gốc bị xóa, `ON DELETE SET NULL` làm hội đồng còn lại thành nguồn độc lập; lần chạy chiều ngược có thể tạo lại một hội đồng đối diện với ID mới.

Không dùng `title`, `category_id`, ngày bắt đầu/kết thúc làm khóa chống trùng.

## 5. Quy tắc ánh xạ dữ liệu

### 5.1. `HoidongThamdinh`

| Trường nguồn | Trường đích | Quy tắc |
|---|---|---|
| `id` | `id` | Không sao chép; DB sinh ID mới |
| `id` | `id_coppy` | Gán ID hội đồng nguồn trực tiếp |
| `title` | `title` | Giữ nguyên |
| `desc` | `desc` | Giữ nguyên |
| `type` | `type` | Đổi `celo` ↔ `cauhoi` |
| `status` | `status` | Giữ nguyên |
| `date_start` | `date_start` | Giữ nguyên |
| `date_end` | `date_end` | Giữ nguyên |
| `category_id` | `category_id` | Giữ nguyên |
| `files` | `files` | Dùng chung tham chiếu; không sao chép file vật lý |
| `countthanhviens` | — | Không gửi; dữ liệu tính toán |
| `countcourses` | — | Không gửi; dữ liệu tính toán |
| `courses` | — | Không gửi trong payload cha; xử lý thành bản ghi con |
| Audit/quan hệ mở rộng | — | Không sao chép; backend sinh lại hoặc tải bằng relation |

Kết quả tạo cha phải trả về ID mới để ánh xạ các bảng con.

### 5.2. `HoidongThamdinhThanhvien`

| Trường nguồn | Trường đích | Quy tắc |
|---|---|---|
| `id` | `id` | DB sinh ID mới |
| `hoidong_thamdinh_id` | `hoidong_thamdinh_id` | Gán ID hội đồng đích mới |
| `user_id` | `user_id` | Giữ nguyên |
| `chutich` | `chutich` | Giữ nguyên nếu backend lưu trường này |
| `user` | — | Không gửi; relation chỉ đọc |
| `display_chutich` | — | Không gửi; state UI |

Dedupe trong cùng hội đồng đích theo `(hoidong_thamdinh_id, user_id)`.

### 5.3. `HoidongThamdinhMonhoc`

| Trường nguồn | Trường đích | Quy tắc |
|---|---|---|
| `id` | `id` | DB sinh ID mới; lưu map `old_monhoc_id → new_monhoc_id` |
| `hoidong_thamdinh_id` | `hoidong_thamdinh_id` | Gán ID hội đồng đích mới |
| `course_id` | `course_id` | Giữ nguyên |
| `leader_id` | `leader_id` | Giữ nguyên nếu có |
| `course` | — | Không gửi; relation chỉ đọc |
| `thanhvien` | — | Không gửi trực tiếp; xử lý bảng con |

Dedupe trong cùng hội đồng đích theo `(hoidong_thamdinh_id, course_id)`.

### 5.4. `HoidongThamdinhMonhocThanhvien`

| Trường nguồn | Trường đích | Quy tắc |
|---|---|---|
| `id` | `id` | DB sinh ID mới |
| `hoidong_thamdinh_id` | `hoidong_thamdinh_id` | Gán ID hội đồng đích mới |
| `hoidong_thamdinh_monhoc_id` | `hoidong_thamdinh_monhoc_id` | Gán ID môn hội đồng mới theo map |
| `course_id` | `course_id` | Lấy từ bản ghi `HoidongThamdinhMonhoc` cha để bảo đảm nhất quán |
| `user_id` | `user_id` | Giữ nguyên |
| `chutich` | `chutich` | Giữ nguyên |
| `ordering` | `ordering` | Giữ nguyên; null/default nếu dữ liệu nguồn không có |
| `user` | — | Không gửi; relation chỉ đọc |

Dedupe theo `(hoidong_thamdinh_monhoc_id, user_id)`.

### 5.5. Bất biến dữ liệu

1. Mọi bản ghi con phải thuộc hội đồng đích mới.
2. Thành viên theo môn phải trỏ tới đúng `HoidongThamdinhMonhoc` mới.
3. `course_id` của thành viên theo môn phải khớp môn cha.
4. `status`, `files`, thành viên và mọi dữ liệu thuộc bốn nhóm được giữ đúng như nguồn; không tự chuẩn hóa hoặc sửa dữ liệu nguồn.
5. Nếu nguồn có thành viên theo môn nhưng không có thành viên chung tương ứng, đích giữ nguyên tình trạng đó; không tự bổ sung.
6. Nếu nguồn có nhiều/không có chủ tịch, đích giữ nguyên; có thể trả warning nhưng không chặn sao chép.
7. Quan hệ `user`, `course`, biến hiển thị và trường đếm không được ghi xuống DB.
8. Hội đồng đích có `id_coppy = source.id`; hội đồng gốc giữ `id_coppy = null`.

## 6. Hợp đồng API đề xuất

### 6.1. Endpoint danh sách hội đồng có thể sao chép

```http
GET hoidong-thamdinh/copy-candidates
```

Query đề xuất:

```text
source_type=celo
target_type=cauhoi
search=<tên hội đồng>
category_id=<đơn vị tùy quyền>
paged=1
limit=20
```

Response đề xuất:

```json
{
  "data": [
    {
      "id": 125,
      "title": "Hội đồng A",
      "status": 1,
      "date_start": "2026-08-01",
      "date_end": "2026-08-31",
      "category_id": 10,
      "countthanhviens": 8,
      "countcourses": 5,
      "countcoursemembers": 18
    }
  ],
  "recordsFiltered": 42
}
```

Quy tắc danh sách:

1. Chỉ trả hội đồng đúng `source_type`, có `id_coppy = null`, thuộc phạm vi quyền của người dùng.
2. Loại hội đồng đã có bản sao loại đích mang `id_coppy = source.id`.
3. Hỗ trợ server-side search, filter, pagination vì dữ liệu nhiều.
4. Sắp xếp ổn định, mặc định mới nhất trước theo `id DESC` hoặc quy ước backend hiện có.
5. Không trả hội đồng bản sao có `id_coppy != null`; tránh sao chép vòng.

### 6.2. Endpoint xem trước các hội đồng đã chọn

```http
POST hoidong-thamdinh/copy-selected/preview
```

Payload:

```json
{
  "source_type": "celo",
  "target_type": "cauhoi",
  "source_ids": [125, 128, 140],
  "duplicate_policy": "skip"
}
```

Response đề xuất:

```json
{
  "selected_total": 3,
  "eligible_total": 2,
  "skipped_total": 1,
  "council_members": 15,
  "council_courses": 9,
  "course_members": 31,
  "skipped": [
    {
      "source_hoidong_id": 140,
      "code": "ALREADY_COPIED",
      "message": "Hội đồng đã có bản sao"
    }
  ],
  "warnings": []
}
```

Backend phải kiểm tra cặp loại hợp lệ, loại ID trùng trong `source_ids`, quyền trên từng hội đồng và trạng thái đủ điều kiện tại thời điểm preview.

### 6.3. Endpoint tạo và đọc background job

```http
POST hoidong-thamdinh/copy-selected/jobs
GET  hoidong-thamdinh/copy-selected/jobs/{job_id}
```

Payload tạo job:

```json
{
  "source_type": "celo",
  "target_type": "cauhoi",
  "source_ids": [125, 128],
  "duplicate_policy": "skip"
}
```

`POST` trả `202 Accepted`:

```json
{
  "job_id": "copy-hoidong-20260821-001",
  "selected_total": 2,
  "status": "queued"
}
```

`GET` trả trạng thái `queued | running | completed | partial_success | failed`, tiến độ theo số hội đồng đã chọn, thống kê và danh sách lỗi:

```json
{
  "job_id": "copy-hoidong-20260821-001",
  "status": "partial_success",
  "selected_total": 2,
  "processed_total": 2,
  "created_total": 1,
  "skipped_total": 0,
  "failed_total": 1,
  "created": {
    "hoidong": 1,
    "thanhvien": 8,
    "monhoc": 5,
    "monhoc_thanhvien": 18
  },
  "failures": [
    {
      "source_hoidong_id": 128,
      "title": "Hội đồng B",
      "code": "COPY_FAILED",
      "message": "Không thể sao chép hội đồng"
    }
  ],
  "warnings": []
}
```

Frontend poll trạng thái với khoảng thời gian hợp lý; dừng poll khi đạt trạng thái cuối hoặc component bị hủy. Không tạo một HTTP request cho từng bản ghi con.

### 6.4. Quy tắc backend

1. Xác thực quyền thao tác và phạm vi dữ liệu trên từng `source_id`.
2. Chỉ nhận hai chiều `celo → cauhoi` và `cauhoi → celo`.
3. `source_ids` bắt buộc là mảng ID không rỗng; loại ID trùng trước khi tạo job.
4. Không có chế độ ngầm hiểu “tất cả”; job chỉ lưu snapshot các `source_ids` người dùng gửi.
5. ID không tồn tại, sai `source_type`, có `id_coppy != null` hoặc đã có bản sao phải được từ chối/bỏ qua với mã kết quả rõ.
6. ID ngoài phạm vi quyền phải làm request bị từ chối; không để người dùng suy đoán dữ liệu ngoài quyền.
7. Worker phải kiểm tra lại quyền và điều kiện sao chép khi bắt đầu từng hội đồng để xử lý thay đổi sau preview.
8. Với từng hội đồng đủ điều kiện:
   - Mở transaction.
   - Tạo `HoidongThamdinh` đích với `id_coppy = source.id`.
   - Tạo các `HoidongThamdinhThanhvien` đúng như nguồn.
   - Tạo các `HoidongThamdinhMonhoc`, lưu map ID môn.
   - Tạo các `HoidongThamdinhMonhocThanhvien` đúng như nguồn bằng ID cha mới.
   - Commit.
9. Lỗi bất kỳ bước nào: rollback hội đồng hiện tại; ghi kết quả lỗi; chuyển hội đồng đã chọn kế tiếp.
10. Thực thi lặp lại với `duplicate_policy = skip` phải idempotent.
11. Ghi audit: người thực hiện, chiều sao chép, danh sách ID đã chọn, tổng số và lỗi.
12. Không trả stack trace hoặc chi tiết DB cho frontend.
13. Dùng khóa tác vụ và unique index `id_coppy` để tránh job đồng thời tạo trùng.

## 7. Thiết kế frontend

### 7.1. Vị trí và cấu trúc feature

Tạo feature riêng:

```text
src/app/modules/admin/features/quanly-hoidong/sao-chep-hoidong/
├── sao-chep-hoidong.component.ts
├── sao-chep-hoidong.component.html
├── sao-chep-hoidong.component.css
└── sao-chep-hoidong.types.ts
```

Component quản lý hiện tại chỉ:

1. Xác định chiều từ `type_hd`.
2. Mở dialog/side navigation sao chép.
3. Nhận sự kiện hoàn tất.
4. Tải lại danh sách hội đồng hiện tại khi cần.

Không nhồi toàn bộ logic sao chép vào `HdThamdinhManagerComponent`.

### 7.2. CTA

Tại thanh công cụ màn danh sách:

- Màn CELO: **“Chọn hội đồng sao chép sang câu hỏi”**.
- Màn câu hỏi: **“Chọn hội đồng sao chép sang CELO”**.
- Chỉ hiển thị khi `canAdd && isManager`.
- Disable trong khi job đang được tạo.
- Backend kiểm tra quyền độc lập.

### 7.3. Danh sách chọn hội đồng

Mở dialog/side navigation kích thước lớn, gồm:

1. Tiêu đề thể hiện rõ chiều sao chép.
2. Ô tìm kiếm tên hội đồng; chỉ gửi tìm kiếm khi Enter hoặc debounce hợp lý.
3. Bộ lọc đơn vị chuyên môn nếu người dùng có quyền xem nhiều đơn vị.
4. Bảng server-side pagination, hiển thị:
   - Checkbox chọn.
   - Tên hội đồng.
   - Đơn vị phối hợp.
   - Thời gian bắt đầu/kết thúc.
   - Trạng thái.
   - Số thành viên.
   - Số môn học.
5. Chỉ hiển thị hội đồng đủ điều kiện; hội đồng đã sao chép không xuất hiện.
6. Cho chọn nhiều hội đồng.
7. Giữ selection theo ID khi đổi trang/tìm kiếm trong cùng phiên mở form.
8. Hiển thị **“Đã chọn N hội đồng”**.
9. Nút **Tiếp tục** bị disable khi chưa chọn.
10. Không cung cấp nút “Chọn tất cả toàn bộ dữ liệu”; người dùng phải chọn hội đồng cần sao chép.

### 7.4. Dialog xác nhận

Sau khi bấm **Tiếp tục**, gọi preview với `source_ids` đã chọn và hiển thị:

1. Chiều sao chép.
2. Tổng số hội đồng người dùng đã chọn.
3. Số hội đồng còn đủ điều kiện.
4. Số hội đồng bị bỏ qua do dữ liệu thay đổi/đã được sao chép.
5. Tổng thành viên, môn học, thành viên theo môn.
6. Danh sách hội đồng bị bỏ qua cùng lý do.
7. Ghi chú: thao tác tạo dữ liệu mới; không sửa nguồn; không ghi đè đích.
8. Nút **Quay lại**, **Hủy**, **Bắt đầu sao chép**.

Nếu `eligible_total = 0`, disable nút thực hiện. Nếu một phần selection bị bỏ qua, job chỉ nhận các ID còn đủ điều kiện sau khi người dùng xác nhận.

### 7.5. Trạng thái xử lý

- `idle`: chưa mở.
- `candidateLoading`: đang tải danh sách hội đồng nguồn.
- `selecting`: người dùng đang chọn.
- `previewLoading`: đang kiểm tra selection.
- `ready`: có thể xác nhận.
- `jobCreating`: đang tạo job; khóa CTA, không cho gửi lặp.
- `jobRunning`: đang poll tiến độ job.
- `success`: job hoàn tất.
- `partialSuccess`: job hoàn tất một phần.
- `error`: tải danh sách, preview, tạo job hoặc poll thất bại; cho phép thử lại phù hợp.

Không dùng một cờ processing toàn cục làm nguồn trạng thái duy nhất.

### 7.6. Kết quả

Sau khi hoàn tất:

- Toast thành công khi không có lỗi.
- Toast cảnh báo khi thành công một phần.
- Hiển thị số đã chọn, đã xử lý, đã tạo, bỏ qua, thất bại.
- Hiển thị số bản ghi con theo từng nhóm.
- Danh sách lỗi có tên hội đồng, mã lỗi, thông báo an toàn.
- Có nút thử lại cho các ID thất bại; backend idempotent bỏ qua phần đã thành công.
- Xóa các ID đã tạo thành công khỏi selection/danh sách ứng viên.
- Reload danh sách màn hiện tại khi phù hợp.

## 8. Thay đổi frontend dự kiến

### 8.1. Service

Bổ sung vào `HoidongThamdinhService`:

```ts
getCopyCandidates(option: CopyHoidongCandidateQuery): Observable<CopyHoidongCandidatePage>
previewCopySelected(request: CopySelectedHoidongRequest): Observable<CopySelectedHoidongPreview>
createCopySelectedJob(request: CopySelectedHoidongRequest): Observable<CopySelectedHoidongJobCreated>
getCopySelectedJob(jobId: string): Observable<CopySelectedHoidongJobStatus>
```

Không gọi trực tiếp bốn API CRUD từ component sao chép khi endpoint backend đã có.

### 8.2. Types

Trong `sao-chep-hoidong.types.ts`:

- `HoidongType = 'celo' | 'cauhoi'` nếu chưa tách type dùng chung.
- `CopyHoidongCandidateQuery`, `CopyHoidongCandidate`, `CopyHoidongCandidatePage`.
- `CopySelectedHoidongRequest` có `source_ids: number[]`.
- `CopySelectedHoidongPreview`.
- `CopySelectedHoidongCreatedCounts`.
- `CopySelectedHoidongFailure`.
- `CopySelectedHoidongJobCreated`, `CopySelectedHoidongJobStatus`.
- `CopySelectedHoidongState`.

Hạn chế `any`; response API phải có kiểu rõ.

### 8.3. Model liên quan

Chỉ sửa nếu cần khi triển khai:

1. Tách type hội đồng dùng chung thay vì khai báo lặp.
2. Bổ sung kiểu `number` cho `HoidongThamdinhMonhocThanhvien.hoidong_thamdinh_id`.
3. Kiểm tra `leader_id` là bắt buộc hay optional theo response thực tế.
4. Bổ sung `id_coppy?: number | null` vào `HoidongThamdinh`.

### 8.4. Component quản lý

Sửa tối thiểu:

- Import component sao chép.
- Thêm CTA.
- Truyền `sourceType = type_hd` và `targetType` được tính sẵn.
- Reload dữ liệu sau kết quả thành công nếu cần.
- Không thay đổi CRUD hội đồng hiện tại ngoài phạm vi tích hợp.

## 9. Phương án fallback nếu chưa thể bổ sung backend

Chỉ dùng tạm thời khi backend chưa hỗ trợ endpoint nghiệp vụ.

### 9.1. Luồng RxJS bắt buộc

1. Tải danh sách ứng viên theo `type`, hiển thị để người dùng chọn.
2. Chỉ tải dữ liệu con theo `source_ids` đã chọn.
3. Dùng `from(sourceCouncils).pipe(concatMap(...))`.
4. Với mỗi hội đồng:
   - POST hội đồng đích.
   - Dùng ID trả về để tạo thành viên chung.
   - Tạo môn, thu map ID môn cũ → mới.
   - Tạo thành viên theo môn.
5. Mỗi hội đồng là một chuỗi Observable; chỉ một `subscribe` ngoài cùng.
6. Không `subscribe` trong vòng lặp; không gọi API bằng đệ quy.
7. Báo thành công một phần; reload dữ liệu server sau lỗi.

### 9.2. Hạn chế không thể loại bỏ hoàn toàn

- Không có transaction xuyên nhiều request.
- Có thể tồn tại hội đồng đích thiếu dữ liệu con khi request lỗi.
- Retry khó chống trùng nếu backend chưa có `id_coppy`, unique index và khóa tác vụ.
- Trình duyệt có thể timeout hoặc đóng giữa chừng.
- Không bảo đảm an toàn khi hai người cùng sao chép.

Vì vậy fallback không phải phương án phát hành chính thức cho dữ liệu quan trọng.

## 10. Kế hoạch triển khai

### Giai đoạn 1 — Hoàn thiện hợp đồng dữ liệu

1. Áp dụng chính sách trùng `skip` theo `HoidongThamdinh.id_coppy`.
2. Giữ nguyên `status`, ngày và các trường dữ liệu nguồn; `files` dùng chung tham chiếu.
3. Không tự bổ sung hoặc sửa dữ liệu thành viên; nguồn thế nào sao chép như vậy.
4. Dùng background job do khối lượng dữ liệu lớn.
5. Chốt quyền backend cho thao tác hàng loạt.
6. Chốt migration `HoidongThamdinh.id_coppy`, self-FK, unique index có điều kiện và `ON DELETE SET NULL`.

**Kết quả:** API contract và migration được duyệt trước khi sửa frontend.

### Giai đoạn 2 — Backend: migration và domain service

1. Bổ sung cột `HoidongThamdinh.id_coppy`, self-FK, unique index có điều kiện và `ON DELETE SET NULL`.
2. Tạo domain/application service sao chép.
3. Chỉ xử lý snapshot `source_ids` của job; xây dựng map ID hội đồng và map ID môn.
4. Áp dụng transaction theo từng hội đồng.
5. Bổ sung idempotency và khóa chống chạy đồng thời.
6. Ghi audit, warning, failure có cấu trúc.
7. Không ghi relation/count/state UI.

**Kết quả:** Sao chép đúng bốn nhóm dữ liệu; retry không tạo trùng.

### Giai đoạn 3 — Backend: API preview và execute

1. Thêm endpoint danh sách ứng viên có search/filter/pagination.
2. Thêm endpoint preview theo `source_ids`.
3. Thêm endpoint tạo background job theo `source_ids`.
4. Thêm endpoint lấy tiến độ/kết quả job.
5. Validate chiều sao chép, selection và từng ID.
6. Kiểm tra quyền.
7. Trả thống kê chuẩn hóa.

**Kết quả:** Frontend hiển thị ứng viên, gửi đúng `source_ids` đã chọn, tạo một job, sau đó theo dõi trạng thái; không gửi request theo từng bản ghi con.

### Giai đoạn 4 — Frontend: service và types

1. Tạo types trong feature mới.
2. Bổ sung các method tải ứng viên, preview selection, tạo job và đọc trạng thái job vào `HoidongThamdinhService`.
3. Chuẩn hóa error response.
4. Không thay đổi bốn service CRUD con.

### Giai đoạn 5 — Frontend: feature sao chép

1. Tạo thư mục/component riêng.
2. Xác định nhãn theo chiều.
3. Tải danh sách ứng viên bằng server-side search/filter/pagination.
4. Cho chọn nhiều; quản lý selection bằng `Set<number>` để giữ chọn khi đổi trang.
5. Disable **Tiếp tục** khi selection rỗng.
6. Gửi preview đúng `source_ids` đã chọn.
7. Hiển thị xác nhận, số lượng và hội đồng bị bỏ qua.
8. Tạo một background job với các ID còn đủ điều kiện.
9. Poll tiến độ; khóa thao tác gửi lặp.
10. Hiển thị kết quả đầy đủ; hỗ trợ thử lại các ID thất bại.
11. Bổ sung empty/loading/error states, keyboard focus, `aria-label` phù hợp.

### Giai đoạn 6 — Tích hợp màn quản lý

1. Thêm CTA mở danh sách chọn vào `HdThamdinhManagerComponent`.
2. Giữ điều kiện `canAdd && isManager`.
3. Truyền đúng `sourceType`/`targetType`.
4. Không truyền ngầm toàn bộ `list_hoidong` của trang hiện tại; feature tự tải ứng viên từ backend.
5. Reload danh sách sau thao tác phù hợp.
6. Không ảnh hưởng thêm/sửa/xóa/xem thành viên/xem môn hiện tại.

### Giai đoạn 7 — Xác minh tĩnh và chức năng

1. Kiểm tra type, payload, state và mọi nhánh lỗi.
2. Kiểm tra endpoint không tin dữ liệu quyền từ frontend.
3. Kiểm tra không có `subscribe` trong vòng lặp.
4. Kiểm tra retry, chạy đồng thời, rollback theo hội đồng.
5. Kiểm tra dữ liệu bốn bảng bằng truy vấn đối chiếu.
6. Chỉ build/test/run khi người dùng yêu cầu riêng.

## 11. Thứ tự file dự kiến chỉnh sửa

### Frontend

1. `src/app/modules/admin/features/quanly-hoidong/sao-chep-hoidong/sao-chep-hoidong.types.ts` — tạo mới.
2. `src/app/modules/admin/features/quanly-hoidong/sao-chep-hoidong/sao-chep-hoidong.component.ts` — tạo mới.
3. `src/app/modules/admin/features/quanly-hoidong/sao-chep-hoidong/sao-chep-hoidong.component.html` — tạo mới.
4. `src/app/modules/admin/features/quanly-hoidong/sao-chep-hoidong/sao-chep-hoidong.component.css` — tạo mới.
5. `src/app/modules/shared/services/hoidong-thamdinh.service.ts` — thêm API ứng viên/preview/tạo job/đọc job.
6. `src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-manager/hd-thamdinh-manager.component.ts` — tích hợp CTA/dialog.
7. `src/app/modules/admin/features/quanly-hoidong/hd-thamdinh-manager/hd-thamdinh-manager.component.html` — thêm CTA.
8. `src/app/modules/shared/models/hoidong-thamdinh-monhoc-thanhvien.ts` — chỉ sửa type nếu cần.

### Backend

Repo backend chưa có trong workspace hiện tại. File cụ thể phải xác định tại repo backend, tối thiểu gồm:

1. Migration cột `HoidongThamdinh.id_coppy`, self-FK, unique index có điều kiện và `ON DELETE SET NULL`.
2. Cập nhật model/entity `HoidongThamdinh`.
3. Request/response DTO và DTO trạng thái job.
4. Domain/application service sao chép.
5. Controller/route preview, tạo job và đọc trạng thái job.
6. Queue/worker xử lý job cùng khóa chống chạy trùng.
7. Authorization policy.
8. Unit/integration tests.

## 12. Kịch bản kiểm thử

### 12.1. Quyền và validate

1. Người không có quyền không thấy CTA.
2. Gọi API trực tiếp khi không có quyền trả 403.
3. `source_type = target_type` bị từ chối.
4. Loại ngoài `celo|cauhoi` bị từ chối.
5. `source_ids` rỗng, trùng ID, sai loại hoặc không tồn tại được xử lý đúng hợp đồng.
6. ID ngoài phạm vi quyền bị từ chối, không làm lộ dữ liệu.
7. Hai request cùng chiều chứa cùng ID chạy đồng thời không tạo trùng.

### 12.2. CELO → câu hỏi

1. Không có hội đồng CELO đủ điều kiện.
2. Danh sách có nhiều trang; chọn hội đồng ở nhiều trang.
3. Tìm kiếm/lọc rồi quay lại; selection theo ID vẫn đúng.
4. Chọn một hội đồng không có dữ liệu con.
5. Chọn hội đồng với thành viên chung.
6. Chọn hội đồng với nhiều môn.
7. Chọn hội đồng có nhiều thành viên theo môn; giữ `chutich`, `ordering`.
8. Chọn nhiều hội đồng thuộc nhiều `category_id` trong phạm vi quyền.
9. Chọn hội đồng có tài liệu.
10. Hội đồng được người khác sao chép sau khi tải danh sách nhưng trước preview/job bị bỏ qua rõ ràng.
11. Hội đồng không được chọn không phát sinh bản sao.

### 12.3. Câu hỏi → CELO

Lặp lại toàn bộ kịch bản trên theo chiều ngược lại.

### 12.4. Chống vòng

1. Sao chép CELO → câu hỏi.
2. Chạy lại CELO → câu hỏi: không tạo thêm.
3. Chạy câu hỏi → CELO ngay sau đó: các cặp vừa tạo bị bỏ qua.
4. Tạo một hội đồng câu hỏi độc lập; chạy câu hỏi → CELO: chỉ hội đồng độc lập được sao chép.
5. Xóa một đầu của cặp; xác nhận quy tắc tạo lại hoạt động đúng.

### 12.5. Toàn vẹn dữ liệu

1. ID cha/con đích đều mới.
2. Không bản ghi con nào trỏ sang hội đồng nguồn.
3. `hoidong_thamdinh_monhoc_id` trỏ đúng môn mới.
4. `course_id` thành viên theo môn khớp môn cha.
5. `user_id`, `chutich`, `ordering` được giữ.
6. Thành viên chung và thành viên theo môn ở đích giữ đúng như từng danh sách nguồn; không tự bổ sung quan hệ thiếu.
7. Relation/count/client state không bị ghi thành cột dữ liệu.
8. Hội đồng đích có `id_coppy = source.id`; hội đồng nguồn có `id_coppy = null`.

### 12.6. Lỗi và rollback

1. Lỗi khi tạo hội đồng: không có dữ liệu con.
2. Lỗi khi tạo thành viên chung: rollback hội đồng hiện tại.
3. Lỗi khi tạo môn: rollback hội đồng hiện tại.
4. Lỗi khi tạo thành viên theo môn: rollback hội đồng hiện tại.
5. Lỗi khi tạo hội đồng đích với `id_coppy`: rollback hội đồng hiện tại.
6. Một hội đồng lỗi; hội đồng tiếp theo vẫn được xử lý.
7. Retry sau lỗi chỉ tạo phần còn thiếu.
8. Frontend mất kết nối sau khi backend hoàn tất; retry không tạo trùng.

### 12.7. UI

1. Nhãn CTA đúng theo route.
2. Danh sách ứng viên loading/success/error/empty.
3. Search, filter, pagination gọi đúng điều kiện backend.
4. Chọn một, chọn nhiều, bỏ chọn; bộ đếm selection chính xác.
5. Selection giữ đúng khi đổi trang/tìm kiếm; không tự chọn hội đồng mới tải.
6. Chưa chọn hội đồng: nút **Tiếp tục** disabled.
7. Preview loading/success/error theo đúng `source_ids`.
8. Quay lại từ preview không mất selection còn hợp lệ.
9. Disable nút trong lúc tạo job; double-click không gửi hai request.
10. Poll tiến độ dừng đúng khi hoàn tất hoặc component bị hủy.
11. Thành công toàn bộ, thành công một phần, thất bại toàn cục.
12. Hội đồng tạo thành công biến mất khỏi danh sách ứng viên.
13. Hiển thị tốt desktop/tablet/mobile; focus bàn phím hợp lệ.

## 13. Tiêu chí hoàn thành

- Có thể sao chép cả hai chiều từ đúng màn quản lý.
- Người dùng thấy danh sách hội đồng nguồn đủ điều kiện, tìm kiếm/lọc/phân trang, chọn một hoặc nhiều hội đồng.
- Job chỉ chứa `source_ids` được chọn; hội đồng không chọn không phát sinh bản sao.
- Selection giữ đúng theo ID khi đổi trang/tìm kiếm.
- Bốn nhóm dữ liệu được sao chép đầy đủ với ID mới.
- Quan hệ cha/con đích chính xác.
- Bấm lại không tạo trùng.
- Sao chép chiều ngược không tạo vòng lặp.
- Transaction bảo vệ từng hội đồng.
- Một hội đồng lỗi không chặn các hội đồng được chọn khác; kết quả lỗi rõ.
- Backend kiểm tra quyền từng ID và chống request đồng thời.
- Frontend tạo một job; không tạo request theo từng bản ghi con.
- CTA có danh sách chọn, xác nhận, trạng thái tải, disable, kết quả và retry.
- CRUD hội đồng hiện tại không bị thay đổi hành vi.
- Có kiểm thử cho selection, mapping, idempotency, rollback, hai chiều và quyền.
- Kế hoạch được cập nhật sau mỗi đợt triển khai.

## 14. Rủi ro và giảm thiểu

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| `id_coppy` không có unique index/khóa job | Tạo trùng, sao chép vòng khi chạy đồng thời | Unique index có điều kiện + khóa tác vụ |
| Sao chép bằng nhiều HTTP request frontend | Dữ liệu thiếu, khó rollback | Dùng một endpoint backend |
| Một transaction cho toàn bộ dữ liệu | Khóa lâu, timeout, rollback lớn | Transaction theo từng hội đồng |
| Dữ liệu nguồn không nhất quán | Đích thiếu thành viên/khóa ngoại sai | Validate, chuẩn hóa bất biến, warning/failure rõ |
| Hai người chạy cùng lúc | Tạo cặp trùng | Unique constraint + application/distributed lock |
| Tài liệu tham chiếu bị xóa/thay đổi | Cả nguồn và đích cùng bị ảnh hưởng | Chấp nhận dùng chung tham chiếu; bảo vệ vòng đời tài liệu ở backend |
| Khối lượng lớn | Request timeout | Luôn xử lý bằng background job; frontend poll trạng thái |
| Hội đồng đích được sửa độc lập | Hai đầu cặp khác nhau | Mặc định coi đây là clone một lần; không tự đồng bộ |
| Backend chưa có repo trong workspace | Kế hoạch thiếu vị trí file backend | Xác định repo/owner backend trước giai đoạn 2 |

## 15. Ngoài phạm vi mặc định

- Đồng bộ liên tục sau lần sao chép.
- Tự cập nhật hội đồng đích khi hội đồng nguồn thay đổi.
- Ghi đè hoặc merge hội đồng đã có cặp.
- Sao chép dữ liệu duyệt, nhận xét, kết quả nghiệm thu ngoài bốn nhóm đã nêu.
- Tự xóa hội đồng đích khi xóa hội đồng nguồn.
- Thay đổi CRUD hội đồng, thành viên, môn học hiện tại.

## 16. Quyết định đã chốt

1. **Trạng thái:** Giữ nguyên `status` của hội đồng nguồn.
2. **Tài liệu:** Dùng chung tham chiếu `files`; không sao chép file vật lý.
3. **Trùng dữ liệu:** Hội đồng đã có bản sao bị bỏ qua; không update, merge hoặc ghi đè.
4. **Tính nguyên trạng:** Dữ liệu nguồn thế nào thì sao chép như vậy; không tự sửa, không tự bổ sung thành viên chung.
5. **Tạo lại sau xóa:** Cho phép sao chép tạo lại. `id_coppy` dùng self-FK `ON DELETE SET NULL`.
6. **Khối lượng:** Có nhiều dữ liệu; dùng background job từ đầu.
7. **Kiến trúc:** Làm theo khuyến nghị backend endpoint, transaction theo từng hội đồng, job nền, kiểm tra quyền, khóa chống chạy đồng thời.
8. **Theo dõi nguồn:** Bổ sung `HoidongThamdinh.id_coppy`; bản sao lưu ID hội đồng gốc trực tiếp.
9. **Tên trường:** Giữ tên `id_coppy` đúng yêu cầu hiện tại.
10. **Phạm vi thao tác:** Hiển thị danh sách ứng viên; người dùng chọn một hoặc nhiều hội đồng. Không mặc định sao chép toàn bộ.
11. **Payload:** Preview và job bắt buộc nhận `source_ids`; chỉ xử lý các ID được chọn.

## 16.1. Câu hỏi mở

Không còn câu hỏi nghiệp vụ mở. Khi triển khai backend cần xác định vị trí repo/framework cụ thể để ánh xạ tên file migration, worker và controller.

## 17. Lịch sử chỉnh sửa

### 2026-08-21 — Lần 1: Khởi tạo kế hoạch kiến trúc

**Thay đổi:**

1. Khảo sát model, service, route và màn quản lý hội đồng hiện tại.
2. Xác định quan hệ bốn nhóm dữ liệu và yêu cầu ánh xạ ID.
3. Đề xuất endpoint backend, transaction theo hội đồng và cơ chế chống trùng/vòng.
4. Đề xuất feature frontend riêng, CTA hai chiều, preview, xác nhận và kết quả.
5. Bổ sung kịch bản kiểm thử, tiêu chí hoàn thành, rủi ro và câu hỏi mở.

**Kết quả:** Đã tạo kế hoạch; chưa thay đổi mã nguồn; chưa build/test/run.

### 2026-08-21 — Lần 2: Chốt nghiệp vụ và `id_coppy`

**Thay đổi:**

1. Chốt giữ nguyên `status` và toàn bộ dữ liệu nguồn trong bốn nhóm.
2. Chốt `files` dùng chung tham chiếu; không sao chép vật lý.
3. Chốt bỏ qua hội đồng đã có bản sao; không update/merge/ghi đè.
4. Chốt không tự sửa hoặc bổ sung dữ liệu thành viên.
5. Chốt cho phép tạo lại sau xóa bằng self-FK `ON DELETE SET NULL`.
6. Chốt background job vì dữ liệu lớn.
7. Thay phương án bảng ánh xạ bằng `HoidongThamdinh.id_coppy` lưu ID hội đồng gốc.
8. Bổ sung unique index có điều kiện, khóa job, API tạo/đọc job và kịch bản liên quan.

**Kết quả:** Không còn câu hỏi nghiệp vụ mở; chưa thay đổi mã nguồn; chưa build/test/run.

### 2026-08-21 — Lần 3: Chọn hội đồng cần sao chép

**Thay đổi:**

1. Bỏ hành vi mặc định sao chép toàn bộ hội đồng nguồn.
2. Bổ sung danh sách ứng viên server-side search/filter/pagination.
3. Cho phép chọn một hoặc nhiều hội đồng; giữ selection theo ID qua các trang.
4. Đổi hợp đồng preview/job sang bắt buộc `source_ids`.
5. Bổ sung kiểm tra quyền và điều kiện sao chép trên từng ID.
6. Cập nhật UI xác nhận, trạng thái job, retry và kịch bản kiểm thử selection.

**Kết quả:** Job chỉ xử lý hội đồng người dùng chọn; chưa thay đổi mã nguồn; chưa build/test/run.

### 2026-08-21 — Lần 4: Triển khai frontend

**Thay đổi:**

1. Bổ sung `HoidongThamdinh.id_coppy?: number | null`.
2. Tạo model contract dùng chung cho danh sách ứng viên, preview, tạo job và trạng thái job.
3. Bổ sung bốn method API vào `HoidongThamdinhService`.
4. Tạo feature standalone `sao-chep-hoidong` gồm chọn nhiều theo ID, tìm kiếm, lọc đơn vị, phân trang, preview, tạo job, poll tiến độ, kết quả và retry.
5. Tích hợp CTA hai chiều và side navigation vào `HdThamdinhManagerComponent`.
6. Giữ nguyên các thay đổi có sẵn về quyền lãnh đạo bộ môn trong component quản lý.
7. Rà soát tĩnh bằng diff, `git diff --check`, tìm `subscribe` trong vòng lặp; chưa build/test/run.

**Phụ thuộc:** Các endpoint backend trong mục 6 phải được triển khai đúng contract để chức năng chạy thực tế.
