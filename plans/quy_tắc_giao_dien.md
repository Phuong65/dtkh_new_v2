# Quy tắc giao diện chung: Bộ CTĐT và CTĐT

> Tài liệu chuẩn hóa UI/UX cho `bo-ctdt-management`, `ctdt-detail` và `ctdt-thongtin`.
>
> Phạm vi: giao diện quản lý Bộ chương trình đào tạo, danh sách Chương trình đào tạo và trang chi tiết CTĐT.
> Mục tiêu: các tab và màn hình CTĐT dùng cùng một ngôn ngữ hình ảnh, cùng cách sắp xếp, cùng trạng thái dữ liệu và cùng hành vi responsive.

---

## 1. Phạm vi và nguồn tham chiếu

### 1.1. Màn hình đã phân tích

| Khu vực | File tham chiếu | Vai trò |
|---|---|---|
| Quản lý Bộ CTĐT | `src/app/modules/admin/features/bo-ctdt/bo-ctdt-management.component.html` | Master–detail: danh sách Bộ CTĐT bên trái, bảng CTĐT bên phải |
| Style Bộ CTĐT | `src/app/modules/admin/features/bo-ctdt/bo-ctdt-management.component.css` | Bố cục, màu, kích thước, responsive của master–detail |
| Shell chi tiết CTĐT | `src/app/modules/admin/features/bo-ctdt/ctdt-detail/ctdt-detail.html` | Header, tab cấp trang, panel nội dung |
| Style shell CTĐT | `src/app/modules/admin/features/bo-ctdt/ctdt-detail/ctdt-detail.css` | Header 64px, tab navigation, breakpoint |
| Thông tin CTĐT | `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-thongtin/ctdt-thongtin.component.html` | Form thông tin chung, editor, sidebar trạng thái |
| Style thông tin CTĐT | `src/app/modules/admin/features/bo-ctdt/ctdt-detail/children/ctdt-thongtin/ctdt-thongtin.component.css` | Card, form grid, editor tab, aside card |
| Style dùng chung | `src/app/core-new/styles/ictu-admin-form.css` | Admin shell, input, bảng, drawer, form, paginator layout |
| Nút dùng chung | `src/app/core-new/styles/ictu-buttons.css` | Button màu, light/reverse/ghost, kích thước và radius |
| Editor dùng chung | `src/app/modules/shared/components/ovic-editor/` | Toolbar và editor nội dung |
| Dropdown dùng chung | `src/app/modules/shared/components/ovic-dropdown/` | Dropdown trong các form cũ |

### 1.2. Nguyên tắc ưu tiên

1. Tái sử dụng class/component ICTU hiện có trước khi viết CSS riêng.
2. Một hành vi chỉ có một cách thể hiện trong toàn bộ nhóm CTĐT.
3. Ưu tiên tính đọc hiểu dữ liệu và thao tác nghiệp vụ hơn trang trí.
4. Không thêm UI library mới cho các thành phần đã có trong PrimeNG, Angular Material hoặc ICTU.
5. CSS component chỉ override khi primitive dùng chung không đủ; không sao chép nguyên khối CSS shared vào component.
6. Mọi thay đổi giao diện phải giữ được loading, empty, error, disabled, focus và responsive state.

---

## 2. Ngôn ngữ hình ảnh chung

### 2.1. Font và màu chữ

| Token | Giá trị chuẩn | Sử dụng |
|---|---|---|
| Font | `var(--primary-font-family)` | Toàn bộ UI admin |
| Text chính | `#0f172a` | Tiêu đề, dữ liệu quan trọng |
| Text thường | `#334155` | Nội dung field, bảng, item |
| Text phụ | `#64748b` | Metadata, placeholder, mô tả |
| Text disabled | `#94a3b8` | Thành phần không khả dụng |
| Primary | `#2563eb` | Active, focus, action chính |
| Primary hover | `#1d4ed8` | Hover/focus action chính |
| Primary đậm | `#0d59cf` | Có thể dùng cho primitive cũ; không tạo thêm màu mới |
| Border chuẩn | `#cbd5e1` | Input, card, select |
| Border nhẹ | `#e2e8f0` | Phân cách panel, footer, card |
| Surface trang | `#f5f7fb` hoặc `#fafbfc` | Nền ngoài card |
| Surface | `#ffffff` | Card, bảng, drawer, form |
| Surface chọn | `#eff6ff` | Item/tab/option được chọn |
| Success nền | `#f0fdf4` | Trạng thái hoàn tất |
| Success border | `#bbf7d0` | Viền trạng thái hoàn tất |
| Success text | `#166534` | Nội dung trạng thái hoàn tất |
| Warning nền | `#fff7ed` | Chưa đủ thông tin hoặc cảnh báo |
| Warning border | `#fed7aa` | Viền cảnh báo |
| Warning text | `#9a3412` | Nội dung cảnh báo |
| Error | `#dc2626` | Lỗi validation và thao tác nguy hiểm |

**Quy tắc:**

- Không dùng gradient cho button hoặc background nghiệp vụ.
- Không trộn ngẫu nhiên `#0d6efd`, `#0162e8`, `#2563eb`, `#0d59cf` trong cùng một component mới. Chọn `#2563eb` làm primary mặc định.
- Màu chỉ dùng để biểu thị vai trò: primary, success, warning, error. Không dùng màu để trang trí không có ý nghĩa.
- Text trên nền primary phải đạt tương phản tốt; button primary dùng chữ trắng.

### 2.2. Kích thước và khoảng cách

| Thành phần | Kích thước chuẩn |
|---|---:|
| Header shell CTĐT | `64px` |
| Header admin/master/detail | `55px` |
| Nút icon chuẩn | `32px × 32px` |
| Nút icon mobile | tối thiểu `40px × 40px` |
| Input toolbar/search | `35px` |
| Input form/select | `42px` hoặc `43px`; toàn bộ component mới phải chọn một giá trị |
| Button footer drawer | min-height `38px`, min-width `100px` |
| Card radius | `4px` |
| Master item radius | `8px` |
| Khoảng cách field | `16px` theo chiều dọc, `20px` giữa cột |
| Khoảng cách section | `20px` |
| Khoảng cách workspace | `24px` desktop, `12–16px` mobile |
| Focus ring | `2px`, màu primary, có offset |

Chỉ sử dụng nhịp `4, 8, 12, 16, 20, 24px` nếu không có lý do nghiệp vụ khác.

### 2.3. Shadow và border

- Card: shadow nhẹ `0 1px 3px rgb(15 23 42 / 4%)`.
- Bảng và shell admin: ưu tiên border, không thêm shadow dày.
- Drawer: dùng border header/footer chuẩn `ictu-p-drawer`; không tạo shadow riêng ở từng vùng.
- Border mảnh `1px`; không dùng border 2px cho card/input thông thường.
- Focus được thể hiện bằng outline hoặc box-shadow vòng ngoài, không làm layout nhảy.

---

## 3. Bố cục cấp trang

## 3.1. Trang quản lý Bộ CTĐT: master–detail

```text
Trang admin toàn chiều cao
├── Master panel: Bộ chương trình đào tạo
│   ├── Header: tiêu đề + nút thu gọn
│   ├── Toolbar: tìm kiếm + thêm mới
│   ├── Danh sách Bộ CTĐT
│   └── Paginator
├── Divider dọc
└── Detail panel: Chương trình đào tạo
    ├── Header: tiêu đề + tìm kiếm + thêm CTĐT
    ├── Body: bảng CTĐT có vùng cuộn
    └── Footer: paginator
```

### Kích thước

- Master panel desktop: `320px`.
- Master panel min: `290px`; max: `340px`.
- Detail panel: chiếm phần còn lại, `min-width: 0`.
- Master và detail cùng chiều cao vùng làm việc.
- Vùng danh sách và bảng được cuộn độc lập; không để cả trang bị tràn ngang.

### Master item

Mỗi item gồm:

```text
[icon folder] [Tên bộ CTĐT]       [Môn học] [Sửa] [Xóa] [chevron]
               [Mã bộ CTĐT]
```

Quy tắc:

- Min-height `52px`.
- Icon folder `32px × 32px`.
- Tên ở dòng trên, mã ở dòng dưới.
- Tên và mã ellipsis khi dài.
- Item được chọn: nền `#eff6ff`, border `#93c5fd`, text primary.
- Hover: nền `#f1f5f9`, border `#cbd5e1`.
- Action phụ không được làm thay đổi item đang chọn; phải gọi `stopPropagation()`.
- Không chỉ dựa vào hover để truy cập action trên thiết bị cảm ứng.

### Detail panel

- Header cùng chiều cao master header: `55px`.
- Tiêu đề `17–19px`, weight `700`.
- Search desktop rộng tối đa khoảng `260px`.
- Nút thêm dùng `ictu-badge-btn--success-reverse` hoặc modifier success tương đương.
- Khi chưa chọn Bộ CTĐT, bảng hiển thị empty state đúng ngữ cảnh và action thêm bị disabled.

## 3.2. Trang chi tiết CTĐT

```text
Header 64px
├── Nút quay lại
├── Tên chương trình đào tạo
└── Tab điều hướng ngang

Body
└── Panel của tab đang chọn
```

Quy tắc:

- Header chiếm đúng `64px`, không cuộn theo body.
- Nút quay lại là icon-only `40px × 40px`, có tooltip và `aria-label`.
- Tên CTĐT truncate một dòng; title đầy đủ đặt ở thuộc tính `title` nếu cần.
- Tab cấp trang có icon Tabler + label.
- Tab active dùng nền primary đậm, chữ trắng, indicator dưới `3px`.
- Tab chưa chọn dùng chữ `#334155`; hover dùng nền `#dbeafe` hoặc nền rất nhạt.
- Tab dài cuộn ngang; không xuống dòng và không làm rộng viewport.
- Trạng thái tab phải được phản ánh trong URL query `tab` nếu shell đang dùng query navigation.
- Hỗ trợ phím `ArrowLeft`, `ArrowRight`, `Home`, `End`.

## 3.3. Form thông tin CTĐT

```text
Workspace tối đa 1320px
├── Main column: form cuộn dọc
│   ├── Card: Định danh chương trình
│   ├── Card: Tổ chức đào tạo
│   └── Card: Hồ sơ và định hướng (editor)
└── Aside 340px
    ├── Trạng thái thông tin + nút Lưu
    └── Thông tin nhanh
```

- Desktop: grid `minmax(0, 1fr) 340px`, gap `24px`.
- Main column có scroll riêng, aside không làm mất vùng thao tác.
- Card có header nhận diện bằng icon + `h2`, body chứa nội dung.
- Card header dùng nền xanh rất nhạt và vạch primary bên trái `5px`.
- Không lồng quá nhiều card; mỗi card đại diện một nhóm nghiệp vụ rõ ràng.
- Aside là vùng hành động và tóm tắt, không lặp lại toàn bộ form.

---

## 4. Quy tắc tab

### 4.1. Tab cấp trang

Dùng cho `ctdt-detail`:

- Role: `tablist`, `tab`, `tabpanel`.
- Tab active: background `#1d4ed8`, text trắng, weight `650–700`.
- Indicator: thanh dưới `3px`, màu `#1e3a8a` hoặc primary đậm.
- Tab inactive: text `#334155`; icon primary nhẹ.
- Min-width desktop khoảng `114px`; mobile cho phép co theo nội dung.
- Khi mobile: giữ label, cho scroll ngang, ẩn scrollbar thô.
- Chỉ tab active có `tabindex="0"`; tab khác `-1` nếu dùng roving tabindex.

### 4.2. Tab nội bộ editor

Dùng cho các nội dung `Mô tả tổng quan`, `Cơ hội học tập`, `Vị trí việc làm`:

- Không dùng nền primary đậm như tab cấp trang.
- Active dùng chữ primary + underline `3px`.
- Inactive hover dùng nền `#f8fafc`.
- Tab có chiều cao `54px` desktop.
- Editor tab cuộn ngang ở mobile.
- Cần hỗ trợ cùng quy tắc bàn phím với tab cấp trang nếu số lượng tab lớn hoặc người dùng thường xuyên dùng bàn phím.

### 4.3. Không trộn hai kiểu tab

- Tab cấp trang = điều hướng giữa module lớn.
- Tab nội bộ = đổi nội dung trong cùng một card.
- Không dùng active style của tab cấp trang cho editor tab.
- Không dùng card editor tab để thay cho navigation cấp trang.

---

## 5. Quy tắc form

### 5.1. Cấu trúc field chuẩn

```text
Section card
├── Header: icon + tiêu đề
└── Body
    └── Form grid
        └── Field
            ├── Label
            ├── Control
            └── Error message
```

Quy tắc:

- Label luôn nằm trước control.
- Label có `for` trỏ đúng `id` của input/select khi component hỗ trợ.
- Label: `13px`, weight `600`, màu `#334155`.
- Khoảng cách label–control: `6px`.
- Control full width trong field.
- Required dùng dấu `*` đỏ ngay sau label.
- Field lỗi hiển thị message dưới control, font `12px`, màu `#dc2626`.
- Chỉ hiển thị lỗi sau khi field `touched` hoặc sau khi submit đã gọi `markAllAsTouched()`.
- Lỗi phải có `aria-invalid` và `aria-describedby`.
- Không dùng placeholder để thay cho label.

### 5.2. Form grid

- Desktop: 2 cột `repeat(2, minmax(0, 1fr))`.
- Field quan trọng hoặc nội dung dài: `grid-column: 1 / -1`.
- Gap: `16px 20px`.
- Mobile: chuyển 1 cột.
- Không đặt field số ngắn và field text dài vào cùng một chiều rộng nếu làm giảm khả năng đọc.

### 5.3. Input text

- Dùng `pInputText` + class ICTU chuẩn cho form mới.
- Chiều cao mục tiêu: `42–43px`.
- Border `#cbd5e1`; hover `#94a3b8`; focus primary.
- Placeholder màu `#94a3b8`.
- Mã bộ CTĐT/mã CTĐT: chuyển uppercase khi nhập, trim trước khi gửi API.
- Trường số: `inputmode="numeric"`; ngăn ký tự không hợp lệ ở UI nhưng vẫn validate ở Reactive Form/API.
- Không sử dụng inline style cho width, height, border nếu có class chuẩn.

### 5.4. Select/dropdown

**Form mới:**

- Dùng PrimeNG `p-select`.
- `appendTo="body"` để tránh bị cắt trong drawer/overflow.
- Danh mục dài: bật `[filter]="true"`, cấu hình `filterBy`.
- Placeholder mô tả hành động: `Chọn khoa`, `Chọn ngành đào tạo`.
- Select phụ thuộc phải reset giá trị khi select cha thay đổi.

**Form cũ:**

- Có thể giữ `ovic-dropdown` để tránh phá logic hiện tại.
- Không tạo thêm kiểu dropdown thứ ba.
- Khi mở rộng component, bổ sung liên kết label và trạng thái invalid/disabled.

### 5.5. Rich text editor

- Dùng `ovic-editor` cho mô tả, cơ hội học tập, vị trí việc làm.
- Chiều cao gọi component chuẩn: `240px`.
- Vùng nội dung tối thiểu: `180px`.
- Toolbar nền xanh rất nhạt; border giữa toolbar và nội dung là `1px`.
- Editor có border ngoài cùng theo card, không lồng border dày.
- Không dùng editor cho dữ liệu ngắn hoặc dữ liệu cần lọc/bảng.

### 5.6. Readonly và disabled

- Disabled: không cho thao tác, opacity giảm nhẹ, cursor mặc định/không khả dụng.
- Readonly: vẫn đọc được và vẫn có contrast bình thường; không giả disabled nếu người dùng vẫn cần copy nội dung.
- Disabled phải đi kèm logic permission/loading, không chỉ ẩn bằng CSS.
- Các action bị disable do chưa chọn Bộ CTĐT phải có ngữ cảnh rõ ràng qua trạng thái màn hình hoặc tooltip.

---

## 6. Quy tắc button và action

### 6.1. Phân cấp button

| Nghiệp vụ | Class/style |
|---|---|
| Lưu, xác nhận | `ictu-badge-btn--primary-reverse` |
| Hủy, đóng | `ictu-badge-btn--secondary` |
| Thêm mới | `ictu-badge-btn--success-reverse` hoặc success tương đương |
| Xóa | `ictu-button-danger-light` |
| Action phụ | `ictu-button-info-light` hoặc secondary light |
| Icon-only | `ictu-admin-icon-button` |

### 6.2. Quy tắc sắp xếp

- Toolbar: tiêu đề bên trái, tìm kiếm/action bên phải.
- Drawer footer: `Hủy` trước, `Lưu lại` sau.
- Footer desktop căn phải; mobile hai button chia đều chiều ngang.
- Aside form: trạng thái trước, nút `Lưu thay đổi` full-width sau.
- Row table: chỉ giữ action cần thiết; xóa luôn ở cuối cụm action.
- Icon-only button luôn có `aria-label` và tooltip.
- Không dùng icon-only cho hành động quan trọng nếu không có tooltip/accessible name.

### 6.3. Trạng thái action

- Save disabled khi form invalid, option đang tải hoặc request đang chạy.
- Khi save: đổi nhãn thành `Đang lưu...` nếu có thể; khóa thao tác trùng.
- Khi xóa: confirm trước, hiển thị toast sau khi API thành công.
- Khi lỗi: giữ ngữ cảnh người dùng, cho phép retry; không tự đóng drawer trước khi biết request đã thành công nếu điều đó làm mất dữ liệu nhập.
- Không dùng animation dịch chuyển quá mạnh; hover chỉ thay đổi màu/nền hoặc translate tối đa `1–2px`.

---

## 7. Quy tắc bảng và danh sách

### 7.1. Bảng CTĐT

```text
Table shell
├── Header toolbar
├── Table body trong .ictu-admin-table-scroll
└── Footer paginator
```

- Dùng `admin-table table-hover`.
- Header bảng nền `#f7f7f7`, text weight `500–600`.
- Cell padding mặc định theo shared style `10px 15px`.
- Cột số thứ tự, khóa, tín chỉ, action: căn giữa.
- Cột tên, khoa, ngành, hệ: căn trái.
- Tên CTĐT là button text để mở chi tiết, không dùng thẻ `<a>` giả nếu route xử lý bằng click.
- Action xóa icon-only, màu danger light.
- Bảng rộng có `min-width`; chỉ `.ictu-admin-table-scroll` cuộn ngang.
- Không đặt `overflow-x: auto` lên toàn trang.
- Empty state nằm trong `td colspan`, căn giữa, padding đủ lớn.

### 7.2. Danh sách master

- Dùng `role="listbox"` chỉ khi semantics không chứa interactive control lồng bên trong.
- Nếu item vừa chọn vừa có nút Môn học/Sửa/Xóa, nên tách nút chọn thành button chính hoặc chuyển sang list semantics phù hợp; tránh lồng nhiều interactive element trong `role="option"`.
- Tên dài phải ellipsis.
- Mã hoặc metadata luôn nằm dòng phụ, font nhỏ hơn và màu muted.
- Selected state phải phân biệt bằng nền + border + màu, không chỉ bằng icon.

### 7.3. Danh sách chọn môn học

- Search ở đầu drawer.
- Item là button toàn hàng.
- Checkbox visual `24px × 24px`; trạng thái selected dùng primary.
- Tên/mã môn học dòng chính; tín chỉ và tín chỉ thực hành dòng phụ.
- Item disabled giảm opacity nhưng vẫn đọc được.
- Paginator nằm trước footer hành động.
- Trong lúc save, khóa item, search, paginator và button phù hợp.
- Nếu save một phần thất bại, hiển thị lỗi trong drawer và tải lại quan hệ từ server.

---

## 8. Drawer và modal form

### 8.1. Bố cục drawer

```text
Drawer
├── Header 55px: tiêu đề
├── Body: nội dung cuộn
└── Footer 55px: Hủy + Lưu lại
```

- Dùng `p-drawer` + `styleClass="ictu-p-drawer"`.
- Header nền `#f8fafc`, border dưới `#dbe0e5`.
- Body dùng `.ictu-p-drawer__content__body` và `position-relative` nếu có overlay loading.
- Footer dùng `.ictu-p-drawer__content__footer ictu-admin-drawer-footer`.
- Form trong drawer dùng `.ictu-form`.
- Drawer nhỏ: width khoảng `400px` cho form Bộ CTĐT.
- Drawer form CTĐT: width khoảng `560px`, tối đa `100vw`.
- Drawer chọn môn: width khoảng `620px`, tối đa `100vw`.
- Không cho dismiss/escape khi đang lưu dữ liệu.

### 8.2. Form drawer

- Header chỉ có tên hành động/nghiệp vụ, ví dụ `Thêm chương trình đào tạo`.
- Label và control xếp dọc; không dùng label nổi nếu gây khó đọc trong select.
- Form invalid: mark all touched, hiển thị lỗi tại field và warning ngắn nếu cần.
- Hủy không reset dữ liệu server; chỉ đóng và hủy phiên chỉnh sửa.
- Sau save thành công: đóng drawer, toast success, reload đúng trang hiện tại.

---

## 9. Trạng thái dữ liệu

| Trạng thái | Cách hiển thị | Quy tắc |
|---|---|---|
| Loading trang | `app-loading-progress` trong body | Heading nêu đúng dữ liệu đang tải |
| Loading bảng | Overlay trong body bảng | Không che toolbar/footer nếu không cần |
| Loading form options | Overlay trong drawer body | Khóa submit cho tới khi options sẵn sàng |
| Saving | Loading + disabled controls | Không cho đóng drawer hoặc submit lặp |
| Empty master | Text `Chưa có bộ CTĐT` | Có thể thêm CTA nếu nghiệp vụ cho phép |
| Empty table | Text theo ngữ cảnh | Không dùng câu chung chung `Không có dữ liệu` nếu biết lý do |
| Empty subject filter | Icon + `Không có môn học phù hợp.` | Giữ search để người dùng đổi điều kiện |
| Load error | Alert + nút `Tải lại` | Error có thể retry phải nằm trong đúng panel |
| Save error | Alert trong drawer/form + toast nếu cần | Giữ dữ liệu nhập và trạng thái người dùng |
| Form invalid | Error field + aside warning | Nút save disabled hoặc submit báo rõ lý do |
| Form valid | Status success | Mở khóa lưu |
| Disabled permission | Ẩn hoặc disabled action | API vẫn phải kiểm tra quyền |
| Không tìm thấy CTĐT | Error/empty state ở shell | Có hành động quay lại hoặc tải lại |

**Chuẩn thông báo:**

- Success: toast sau khi server xác nhận thành công.
- Error request: toast ngắn + trạng thái lỗi tại vùng liên quan nếu cần thao tác tiếp.
- Retry: dùng button thật, không dùng `href="javascript:"`.
- Mọi alert có thể cần đọc bởi screen reader nên dùng `role="alert"`.

---

## 10. Responsive

### Breakpoint chuẩn

Dùng một mốc chính `960px` cho toàn bộ nhóm CTĐT.

| Màn hình | Layout |
|---|---|
| Trên `960px` | Master–detail ngang; form main + aside `340px`; tab đầy đủ |
| `≤ 960px` | Master–detail xếp dọc; form chuyển một cột; aside xuống sau main; tab cuộn ngang |
| `≤ 640px` | Field một cột; padding workspace `12px`; card body `14px`; editor tab cuộn ngang |
| `≤ 560px` | Header gọn; tên CTĐT ellipsis; action thêm full-width khi cần; bảng cuộn trong vùng riêng |

### Quy tắc mobile

- Không ẩn paginator để giải quyết vấn đề chiều rộng.
- Không để tab tự xuống dòng làm tăng chiều cao header bất ngờ.
- Button footer drawer chuyển thành hai nút bằng nhau, min-height tối thiểu `40px`.
- Master list có max-height hợp lý khi xếp dọc; không chiếm toàn bộ màn hình trước detail.
- Bảng giữ cấu trúc cột và cho scroll ngang trong `.ictu-admin-table-scroll`.
- Search và action toolbar có thể xếp dọc nếu không đủ chiều rộng.
- Aside form xếp sau nội dung chính, không nằm cạnh một cột quá hẹp.
- Text dài luôn có wrapping/ellipsis có chủ đích; không phá layout bằng chuỗi không giới hạn.

### Reduced motion

Trong `@media (prefers-reduced-motion: reduce)`:

- Tắt hoặc giảm transition không cần thiết.
- Tắt spinner animation nếu phù hợp; vẫn phải có chỉ báo loading bằng text.
- Không phụ thuộc animation để truyền tải selected/error/success state.

---

## 11. Accessibility

### Bắt buộc

- Mỗi vùng chính có heading hoặc accessible name.
- `aria-labelledby` phải trỏ tới phần tử thật sự tồn tại.
- Button icon-only có `aria-label`.
- Tooltip chỉ bổ trợ, không thay thế accessible name.
- Label liên kết control bằng `for`/`id` nếu có thể.
- Field lỗi có `aria-invalid="true"` và `aria-describedby`.
- Tab dùng đúng `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`.
- Focus-visible phải thấy rõ, tối thiểu outline `2px`.
- Không dùng màu đơn độc để biểu thị selected, error hoặc success.
- Vùng tương tác mobile tối thiểu khoảng `40px`.
- Nút reload/error phải là button thật.
- Loading/save state phải được đọc hiểu bằng text, không chỉ spinner.

### Điểm cần kiểm tra khi triển khai

1. `bo-ctdt-management.component.html` đang dùng `aria-labelledby="bo-ctdt-title"`; cần bảo đảm có phần tử `id="bo-ctdt-title"`.
2. Master item đang là `role="option"` nhưng chứa nhiều button action; cần chọn lại semantics để không lồng interactive control không hợp lệ.
3. Editor tabs có ARIA nhưng cần bổ sung keyboard navigation thống nhất nếu sử dụng như tablist đầy đủ.
4. Các label đang là `<span>` cho một số dropdown Ovic; cần bổ sung liên kết accessibility khi component hỗ trợ.

---

## 12. Quy tắc code và đặt tên CSS

### HTML

- Ưu tiên class theo block–element–modifier:
  - `.bo-ctdt-master-item`
  - `.bo-ctdt-master-item__content`
  - `.bo-ctdt-master-item--active`
  - `.ctdt-card--editor`
- Không dùng inline style cho giá trị đã có token/class chung.
- Một element chỉ nhận thêm class component khi primitive chung không đủ.
- Dùng `@if`, `@for` nhất quán theo Angular hiện tại của dự án.
- Text trạng thái viết rõ theo nghiệp vụ, không hard-code thông báo rải rác nếu có thể gom lại.

### CSS

- Tên class theo phạm vi feature, tránh tên chung như `.header`, `.card`, `.button`.
- Dùng CSS custom properties cho màu/kích thước dùng lặp lại.
- Không dùng `!important` trừ khi cần override component library và có selector giới hạn phạm vi.
- Không copy toàn bộ shared CSS vào component.
- Mỗi breakpoint phải giải quyết một vấn đề layout cụ thể.
- Tập trung border/radius/spacing ở token, không tạo nhiều giá trị gần giống.

### TypeScript/UI state

- Phân biệt state tải trang, tải danh sách, tải options và saving.
- Khi đổi master selection: reset search/detail state liên quan trước khi tải dữ liệu mới.
- Khi request lỗi: cập nhật state lỗi đúng panel, không chỉ log hoặc toast.
- Disable action dựa trên permission và loading state.
- Sau update CTĐT: cập nhật selected object và thông tin hiển thị ở shell.

---

## 13. Ma trận chọn component

| Trường hợp | Dùng | Không dùng |
|---|---|---|
| Danh sách có nhiều dòng/cột | `admin-table` + `ictu-admin-table-scroll` | Card lồng cho từng dòng |
| Chọn một Bộ CTĐT | Master item | Dropdown nếu cần xem metadata và action |
| Chọn nhiều môn học | Drawer + button option + paginator | Checkbox rời rạc không có metadata |
| Form tạo/sửa ngắn | `p-drawer` + `ictu-form` | Modal tự viết nếu drawer phù hợp |
| Nội dung dài | `ovic-editor` | Textarea nhỏ |
| Navigation cấp module | Tab shell `ctdt-detail` | Editor tab |
| Nhóm field | Card section | Divider rời không có heading |
| Trạng thái thao tác | Badge/status panel + toast | Chỉ đổi màu button |
| Loading vùng dữ liệu | `app-loading-progress` | Spinner tự viết cho mỗi component |
| Phân trang | `ictu-paginator` | Prime paginator khác trong cùng feature |

---

## 14. Checklist trước khi hoàn thành một tab CTĐT

### Bố cục

- [ ] Tab nằm đúng trong shell CTĐT.
- [ ] Có heading/accessible name.
- [ ] Main content không làm tràn ngang viewport.
- [ ] Kích thước card, spacing, border dùng token chung.
- [ ] Có scroll đúng vùng, không scroll toàn trang ngoài ý muốn.

### Form

- [ ] Label đứng trước control và liên kết đúng.
- [ ] Required có dấu `*`.
- [ ] Input/select/editor dùng component chuẩn.
- [ ] Validation hiển thị sau touched/submit.
- [ ] `aria-invalid`, `aria-describedby` đã có.
- [ ] Save disabled khi invalid/saving.
- [ ] Numeric input có `inputmode` và validation.

### Dữ liệu

- [ ] Có loading state.
- [ ] Có empty state đúng ngữ cảnh.
- [ ] Có error state + retry.
- [ ] Có save error không làm mất dữ liệu nhập.
- [ ] Toast success/error dùng `NotificationService`.

### Responsive

- [ ] Kiểm tra desktop trên `960px`.
- [ ] Kiểm tra tablet tại `960px` và `640px`.
- [ ] Kiểm tra mobile tại `560px`.
- [ ] Tab cuộn ngang, không xuống dòng.
- [ ] Bảng cuộn trong container.
- [ ] Footer button drawer còn thao tác được.

### Accessibility

- [ ] Keyboard tab và focus-visible hoạt động.
- [ ] Icon-only button có label.
- [ ] Không dùng màu đơn độc để truyền trạng thái.
- [ ] `role`/`aria-*` hợp lệ, không lồng interactive control sai semantics.
- [ ] Reduced motion không làm mất thông tin trạng thái.

---

## 15. Các điểm cần chuẩn hóa khi triển khai tiếp

1. Gom màu primary về token dùng chung; hạn chế trộn `#0d6efd`, `#0162e8`, `#2563eb`, `#0d59cf`.
2. Thống nhất breakpoint layout ở `960px`; hiện master–detail dùng `900px` còn shell CTĐT dùng `960px`.
3. Bổ sung breakpoint để `ctdt-workspace__grid` chuyển thành một cột; hiện grid desktop có `340px` aside nhưng mobile chưa định nghĩa đầy đủ.
4. Thống nhất chiều cao control form về `42px` hoặc `43px`; không tạo thêm giá trị mới.
5. Thay `href="javascript:"` bằng button cho các thao tác tải lại.
6. Bổ sung `id` thật cho mọi `aria-labelledby`.
7. Xử lý semantics master list để tránh `role="option"` chứa nhiều button tương tác.
8. Bổ sung keyboard navigation cho editor tabs.
9. Trên mobile, không ẩn paginator; chỉ đổi bố cục và kích thước.
10. Ưu tiên sử dụng `ictu-admin-footer-button`, `ictu-admin-icon-button`, `ictu-form`, `ictu-admin-table-shell`, `ictu-admin-table-scroll` thay vì CSS tương đương tự viết.

---

## 16. Quy tắc ngắn gọn cần nhớ

1. **Shell chung:** admin page → master/detail hoặc header/tab → content panel.
2. **Form chung:** card → header → grid field → label → control → error.
3. **Action chung:** primary lưu, secondary hủy, success thêm, danger xóa.
4. **State chung:** loading, empty, error/retry, saving, disabled đều phải có.
5. **Responsive chung:** `960px` chuyển layout, `640px` chuyển form một cột, `560px` tối ưu mobile.
6. **Accessibility chung:** label thật, focus rõ, icon có aria-label, tab đúng ARIA, không dùng màu đơn độc.
7. **Component chung:** không tạo primitive mới nếu ICTU/PrimeNG/Material đã có component tương ứng.
