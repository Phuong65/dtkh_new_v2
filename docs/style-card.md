# Quy tắc card chuẩn theo Thông tin cơ bản

## 1. Mẫu chuẩn duy nhất

Mọi card nội dung áp dụng quy tắc này phải tái hiện giao diện của **Thông tin chung → Thông tin cơ bản**, phần tử `section#sec-info.mh-card`. Không chỉ giống màu header; phải khớp viền, góc bo, bóng đổ, accent, icon, chữ, khoảng cách và responsive.

Nguồn đối chiếu:

- [HTML mẫu](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin.component.html): `#sec-info`, dòng 15 trở đi.
- [CSS mẫu](../src/app/modules/admin/features/course-management/course-management-detail/children/monhoc-thongtin/monhoc-thongtin.component.css): token trong `:host`, `.mh-page`, `.mh-card`, `.mh-card__header`, `.mh-card__icon`, `.mh-card__body`; media query tại `640px` và `560px`.

Các giá trị dưới đây được đối chiếu với mã nguồn ngày **2026-11-20**. Nếu hướng dẫn chung yêu cầu gradient hoặc kiểu card khác, mẫu `#sec-info` được ưu tiên trong phạm vi quy tắc này.

**Đính chính để khớp mẫu thật:** `.mh-card` gốc không đặt `overflow: hidden`. Không bắt buộc thêm thuộc tính này hay tự thêm bo góc header. Những thay đổi đó có thể làm khác mẫu và cắt dropdown, nội dung hoặc focus ring.

## 2. Phạm vi áp dụng

- Áp dụng cho card cấp nội dung: khối thông tin, cấu hình, mục tiêu, nội dung học phần, đề, kiểm tra và đánh giá.
- Kiểm tra tất cả nhánh hiển thị: luyện tập, trắc nghiệm, tự luận, dự án; cả trạng thái có dữ liệu, rỗng, thu gọn và chỉ đọc.
- Không tự biến từng input, nút, hàng bảng, badge, mục danh sách hoặc vùng bố cục thành card.
- Không tự áp dụng cho drawer, modal hay popup. Nếu bên trong có card thực sự, chỉ chuẩn hóa card đó.
- Mỗi khối nội dung chỉ có một wrapper sở hữu viền ngoài. Không thêm wrapper card lồng nhau chỉ để có border.

## 3. Cấu trúc HTML chuẩn

Dùng cấu trúc tương đương mẫu gốc. Tên class có thể thay đổi, cấu trúc và giá trị hiển thị không được tự đổi.

```html
<section class="feature-card" aria-labelledby="feature-title">
    <div class="feature-card__header">
        <span class="feature-card__icon" aria-hidden="true">
            <i class="ti ti-id"></i>
        </span>
        <div>
            <h2 id="feature-title" tabindex="-1">Thông tin cơ bản</h2>
            <p>Định danh, tín chỉ và đơn vị chuyên môn phụ trách học phần.</p>
        </div>
    </div>
    <div class="feature-card__body">
        <!-- Nội dung chức năng -->
    </div>
</section>
```

Yêu cầu:

- Header và body nằm trong cùng wrapper có đủ bốn cạnh viền.
- Icon và nhóm chữ là hai phần tử con của header; nhóm chữ chứa `h2` rồi `p`.
- `aria-labelledby` trỏ tới ID tiêu đề duy nhất. Khi lặp card phải tạo ID riêng.
- Không sao chép `_ngcontent-*` hoặc `_nghost-*`; đó là thuộc tính Angular tự sinh.
- Được đổi biểu tượng, tiêu đề, mô tả, dữ liệu và nội dung body theo chức năng.
- Không bỏ icon hoặc mô tả rồi tuyên bố giống hoàn toàn mẫu. Nếu cần biến thể, ghi rõ khác biệt và xác nhận riêng.

## 4. Thông số bắt buộc

| Thành phần | Thuộc tính | Giá trị chuẩn |
|---|---|---|
| Card | Viền trên, phải, dưới, trái | Mỗi cạnh `1px solid #cbd5e1` |
| Card | Góc bo | `4px` ở cả bốn góc |
| Card | Nền | `#ffffff` |
| Card | Bóng đổ | `0 1px 3px rgb(15 23 42 / 4%)` |
| Card | Co theo flex | `flex-shrink: 0` |
| Header | Bố cục | `display: flex; align-items: center; gap: 12px` |
| Header | Chiều cao tối thiểu | `48px`, không phải chiều cao cố định |
| Header | Padding trên/phải/dưới/trái | `9px 14px 9px 18px` trên desktop |
| Header | Nền | `#eff6ff`, không gradient |
| Header | Đường phân cách body | `1px solid #cbd5e1` |
| Accent | Vị trí, kích thước | Pseudo-element sát trái header, rộng `5px`, cao theo header |
| Accent | Màu | `#2563eb` |
| Icon | Khung | `34px × 34px`, `flex: 0 0 34px` |
| Icon | Viền, góc bo | `1px solid #bfdbfe`, `4px` |
| Icon | Nền, màu, cỡ | `#eff6ff`, `#2563eb`, `17px` |
| Nhóm chữ | Kích thước flex | `flex: 1 1 auto; min-width: 0` |
| Tiêu đề | Màu, cỡ, độ đậm | `#1e3a8a`, `15px`, `700` |
| Tiêu đề | Margin, line-height | `0`, `1.3` |
| Mô tả | Màu, cỡ | `#64748b`, `12px` |
| Mô tả | Margin, line-height | `2px 0 0`, `1.4` |
| Body | Padding desktop | `20px` cả bốn phía |
| Font kế thừa | Font của trang mẫu | `var(--primary-font-family), sans-serif` |

Viền `#e2e8f0`, `#edf2f7`, `#bfdbfe` không thay thế viền ngoài `#cbd5e1`. Các màu này vẫn có thể dùng cho ô bảng, icon hoặc thành phần con theo vai trò riêng.

## 5. CSS chuẩn để tái sử dụng

Đoạn dưới chuyển tên class từ mẫu gốc sang `feature-card`, giữ giá trị của khung card. Font và màu chữ nền được khai báo tại wrapper để không lệ thuộc font của trang đích.

```css
.feature-card {
    --card-primary: #2563eb;
    --card-border: #cbd5e1;
    --card-radius: 4px;
    --card-surface: #ffffff;
    --card-header-bg: #eff6ff;
    --card-heading: #1e3a8a;
    --card-muted: #64748b;
    --card-icon-border: #bfdbfe;
    --card-ink: #0f172a;
    --card-shadow: 0 1px 3px rgb(15 23 42 / 4%);

    min-width: 0;
    border: 1px solid var(--card-border);
    border-radius: var(--card-radius);
    background: var(--card-surface);
    box-shadow: var(--card-shadow);
    flex-shrink: 0;
    scroll-margin-top: 16px;
    color: var(--card-ink);
    font-family: var(--primary-font-family), sans-serif;
}

.feature-card__header {
    position: relative;
    display: flex;
    min-height: 48px;
    align-items: center;
    gap: 12px;
    padding: 9px 14px 9px 18px;
    border-bottom: 1px solid var(--card-border);
    background: var(--card-header-bg);
}

.feature-card__header::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 5px;
    background: var(--card-primary);
    content: '';
}

.feature-card__header > div {
    flex: 1 1 auto;
    min-width: 0;
}

.feature-card__icon {
    display: inline-flex;
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--card-icon-border);
    border-radius: var(--card-radius);
    background: var(--card-header-bg);
    color: var(--card-primary);
    font-size: 17px;
}

.feature-card__header h2 {
    margin: 0;
    color: var(--card-heading);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.3;
}

.feature-card__header p {
    margin: 2px 0 0;
    color: var(--card-muted);
    font-size: 12px;
    line-height: 1.4;
}

.feature-card__body {
    padding: 20px;
}

@media (max-width: 640px) {
    .feature-card__header,
    .feature-card__body {
        padding: 14px;
    }

    .feature-card__header {
        padding-left: 18px;
    }
}

@media (max-width: 560px) {
    .feature-card__header {
        flex-wrap: wrap;
    }
}
```

Không mặc định thêm `overflow: hidden`, `height: 48px`, `border-left` cho header, `border-radius` cho header, hiệu ứng hover nổi lên hoặc nền gradient. Những thuộc tính đó không thuộc mẫu `#sec-info`.

Accent phải dùng pseudo-element: thay bằng `border-left: 5px` sẽ chiếm thêm không gian và làm lệch nội dung.

## 6. Quy trình áp dụng vào card hiện có

1. **Xác định wrapper thật trong DOM đã render.** Đọc HTML và CSS của cả component cha, component con, stylesheet dùng chung và thư viện. Không sửa riêng header rồi coi là đã sửa card.
2. **Đặt viền ngoài tại một nơi.** Wrapper bao cả header và body giữ border, radius, nền và shadow. Header chỉ có divider dưới; body không có viền bao riêng.
3. **Giữ cấu trúc mẫu.** Bổ sung icon, nhóm tiêu đề/mô tả và body nếu thiếu. Chỉ đổi màu border không đủ để đồng nhất.
4. **Xử lý style cũ có phạm vi.** Gỡ hoặc ghi đè tại selector của card đích các thuộc tính gây lệch: `border: 0`, cạnh bị mất, padding riêng, radius `6px/8px`, shadow khác, background khác, pseudo-element accent trùng. Không reset toàn bộ `.p-panel`, `.admin-wrap-table` hoặc toàn ứng dụng.
5. **Kiểm tra thư viện.** `p-panel` được dùng nếu DOM cuối cùng đạt cấu trúc và giao diện tương đương. Nếu đã có wrapper card bên ngoài, panel bên trong không được tạo viền/shadow thứ hai. Không cấm thư viện chỉ vì tên component.
6. **Bảng và vùng cuộn.** Đặt cuộn ngang tại vùng chứa bảng bên trong body. Không bỏ padding body hoặc dùng viền ô bảng thay viền card khi yêu cầu giống hệt mẫu. Card bảng sát mép là biến thể, không phải mẫu chuẩn này.
7. **Giữ hành vi.** Không đổi điều kiện hiển thị, phân quyền, sự kiện, dữ liệu hay chức năng vì việc chuẩn hóa card. Đảm bảo dropdown, tooltip, editor và focus ring không bị cắt.
8. **Kiểm tra responsive và mọi nhánh.** Không để media query trả lại border/radius/padding cũ. Card nằm trong component tự luận hoặc dự án phải được kiểm tra riêng, không suy ra từ card trắc nghiệm.

Style triển khai dùng chung toàn hệ thống nằm trong [core-new/styles/ictu-admin-form.css](../src/app/core-new/styles/ictu-admin-form.css), đã được nạp global qua `angular.json`. Dùng class `.course-detail-card` và các phần tử `__header`, `__icon`, `__heading`, `__title`, `__description`, `__actions`, `__body`; chỉ những phần tử có class tương ứng mới nhận style. Mẫu `feature-card` phía trên mô tả cấu trúc tương đương; khi triển khai dùng các class core này, không sao chép CSS vào component hoặc tạo file `course-detail-card.css` riêng. Không thêm stylesheet core vào `styleUrls` từng component. CSS component chỉ giữ bố cục và hành vi đặc thù, không ghi đè thông số card chuẩn hay breakpoint của core.

Nếu có nút thao tác ở header, đặt sau nhóm chữ, không đổi kích thước icon, accent, font hay padding chuẩn. Đây là phần mở rộng của mẫu; phải kiểm tra riêng khi xuống dòng.

## 7. Nghiệm thu: phải giống trên trình duyệt

Không kết luận “đã đồng nhất” chỉ vì build thành công hoặc CSS có khai báo border.

- [ ] Mở mẫu `#sec-info` và card đích ở cùng viewport, mức zoom, font đã tải và chiều rộng card tương đương.
- [ ] Dùng nội dung có số dòng tương đương khi so sánh chiều cao header; nội dung dài hơn được phép tăng chiều cao, không ép header thành `48px`.
- [ ] DevTools xác nhận cả bốn cạnh wrapper là `1px solid rgb(203, 213, 225)`.
- [ ] Cả bốn góc wrapper là `4px`; nền `rgb(255, 255, 255)`; shadow đúng mẫu.
- [ ] Header nền `rgb(239, 246, 255)`, đúng padding/gap; chỉ một divider dưới, không viền kép.
- [ ] Accent rộng `5px`, màu `rgb(37, 99, 235)`, không đẩy nội dung sang phải.
- [ ] Icon `34px × 34px`; tiêu đề `15px/700`; mô tả `12px`; font và line-height khớp mẫu.
- [ ] Body có padding `20px` ở desktop; không có wrapper trung gian tự thêm padding hoặc border.
- [ ] Kiểm tra trên và dưới breakpoint `640px`, `560px`: padding và wrap đúng CSS mẫu.
- [ ] Kiểm tra các nhánh trắc nghiệm, tự luận, dự án, trạng thái rỗng và sidebar nếu sidebar được áp dụng chuẩn card.
- [ ] Cuộn bảng, mở dropdown/tooltip, tab bàn phím và thu gọn vẫn hoạt động; nội dung không che viền ngoài.
- [ ] Chụp và so sánh giao diện thực tế với mẫu. Ghi rõ phần chưa kiểm chứng nếu không mở được trang.
- [ ] `git diff --check` và build phù hợp dự án đạt; không coi hai kiểm tra này là bằng chứng giao diện đã giống.

**Định nghĩa hoàn thành:** khung, header, icon, chữ, khoảng cách và responsive khớp mẫu; khác biệt chỉ ở nội dung được phép thay. Bất kỳ khác biệt hình thức nào khác phải được ghi nhận là biến thể, không gọi là “y hệt”.
