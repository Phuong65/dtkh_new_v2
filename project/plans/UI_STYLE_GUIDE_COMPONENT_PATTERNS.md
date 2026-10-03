# HƯỚNG DẪN THIẾT KẾ GIAO DIỆN CHUẨN (UI PATTERNS & STYLE GUIDE)
> **Mục đích**: Tài liệu hóa toàn bộ quy chuẩn giao diện đã được chuẩn hóa tại component `monhoc-thongtin` để dễ dàng tái sử dụng và áp dụng đồng bộ cho tất cả các component quản trị (LMS Admin / Form quản lý) khác trong hệ thống.

---

## 1. Triết Lý Thiết Kế & Hệ Thống Màu Sắc (Color Tokens)

### 1.1. Bảng màu chủ đạo (Palettes)
- **Nền trang chính (Canvas)**: `#f1f5f9` (Slate-100) — sáng sủa, sạch mắt, không bị xám đục như `#f2f2f2`.
- **Màu nền thẻ (Card Surface)**: `#ffffff` bo góc mềm `14px`, viền mảnh `1px solid #e2e8f0`.
- **Màu chữ chính (Primary Text)**: `#0f172a` (tiêu đề), `#1e293b` (nội dung, nhãn).
- **Màu chữ phụ (Muted Text)**: `#64748b` (mô tả, gợi ý, metadata).
- **Màu nhấn thương hiệu (Primary Blue)**: 
  - Gradient: `linear-gradient(135deg, #1e40af 0%, #2563eb 100%)`
  - Nền phụ nhạt: `#eff6ff` (Blue-50), viền nhạt: `#bfdbfe`
- **Màu phân loại theo phân hệ (Accent Icons)**:
  - *Thông tin cơ bản*: `#2563eb` (Blue)
  - *Thời lượng / Tiến độ*: `#0d9488` (Teal)
  - *Đánh giá / Kiểm tra*: `#7c3aed` (Violet)
  - *Chương trình / Cấu trúc*: `#4f46e5` (Indigo)
  - *Đề cương / Nội dung*: `#0284c7` (Sky Blue)
  - *Học liệu / Tài liệu*: `#d97706` (Amber)

---

## 2. Cấu Trúc Khung Trang (Page Layout Shell)

Mỗi trang form quản trị sử dụng khung chuẩn:
```html
<main class="layout_component_container mh-page">
    <div class="mh-container">
        <form [formGroup]="formKhoaHoc" class="mh-form" novalidate>
            <!-- Các Section Cards bên trong -->
        </form>
    </div>
</main>
```

### CSS Layout Shell:
```css
:host {
    display: block;
    width: 100%;
}

.mh-page {
    height: calc(100vh - 60px);
    min-height: 100%;
    padding: 24px 20px 48px;
    overflow-y: auto;
    background-color: #f1f5f9;
    color: #1e293b;
    box-sizing: border-box;
}

.mh-container {
    max-width: 1240px;
    margin: 0 auto;
    width: 100%;
}

.mh-form {
    display: flex;
    flex-direction: column;
    gap: 22px;
}
```

---

## 3. Cấu Trúc Thẻ Mục (Section Card Pattern)

Mỗi khối thông tin được gói trong một `mh-section` có:
- **Header**: Icon bo góc theo màu chủ đề, tiêu đề, dòng phụ đề (eyebrow), và tóm tắt trạng thái.
- **Body**: Padding thoáng đãng (`22px`), chứa lưới các trường thông tin.

```html
<section class="mh-section mh-section--overview" aria-labelledby="section-title">
    <div class="mh-section__header">
        <span class="mh-section__icon fa fa-info-circle" aria-hidden="true"></span>
        <div class="mh-section__heading">
            <span class="mh-section__eyebrow">Nhóm phân hệ</span>
            <h2 id="section-title">Tiêu đề phân mục</h2>
            <p>Mô tả ngắn gọn mục đích hoặc hướng dẫn của phân mục này.</p>
        </div>
    </div>

    <div class="mh-section__body">
        <!-- Lưới nhập liệu ở đây -->
    </div>
</section>
```

### CSS Section Card:
```css
.mh-section {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
    overflow: hidden;
}

.mh-section__header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 22px;
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
}

.mh-section__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 9px;
    font-size: 15px;
    color: #ffffff;
    background: #2563eb;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
}

.mh-section__icon--teal   { background: #0d9488; box-shadow: 0 2px 6px rgba(13, 148, 136, 0.2); }
.mh-section__icon--violet { background: #7c3aed; box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2); }
.mh-section__icon--indigo { background: #4f46e5; box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2); }
.mh-section__icon--blue   { background: #0284c7; box-shadow: 0 2px 6px rgba(2, 132, 199, 0.2); }
.mh-section__icon--amber  { background: #d97706; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.2); }

.mh-section__heading {
    flex: 1;
    min-width: 0;
}

.mh-section__eyebrow {
    display: block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 1px;
}

.mh-section__heading h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
}

.mh-section__heading p {
    margin: 2px 0 0;
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
}

.mh-section__body {
    padding: 22px;
}
```

---

## 4. Hệ Thống Lưới Nhập Liệu 3 Cột (Form Grid Pattern)

### 4.1. Quy tắc hàng & cột:
- **Lưới cơ sở**: Sử dụng `display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px;`
- **Ô chiếm toàn bộ chiều ngang (Full-width)**: Gán class `.mh-field--title` (hoặc `grid-column: 1 / -1;`).
- **Ô đơn lẻ**: Tự động chiếm đúng 1/3 chiều rộng hàng (`1fr`).
- **3 input 1 dòng**: 3 thẻ `.mh-field` kế tiếp nhau trong lưới sẽ tự động nằm trên cùng 1 hàng.
- **3 select 1 dòng**: 3 thẻ `.mh-field` kế tiếp nhau sẽ tự động nằm trên cùng 1 hàng kế tiếp.

### 4.2. Mẫu HTML:
```html
<div class="mh-grid-3">
    <!-- Dòng 1: Full-width -->
    <div class="mh-field mh-field--title">
        <label for="tenTruong">
            <i class="fa fa-bookmark-o" aria-hidden="true"></i>
            Tên trường dữ liệu chính<span class="ovic-mark">*</span>
        </label>
        <input type="text" id="tenTruong" class="ovic-input-field" formControlName="title" placeholder="Nhập nội dung...">
    </div>

    <!-- Dòng 2: 3 input 1 dòng -->
    <div class="mh-field">
        <label for="input1"><i class="fa fa-barcode"></i> Ô nhập 1<span class="ovic-mark">*</span></label>
        <input type="text" id="input1" formControlName="input1" class="ovic-input-field">
    </div>
    <div class="mh-field">
        <label for="input2"><i class="fa fa-certificate"></i> Ô nhập 2<span class="ovic-mark">*</span></label>
        <input type="number" id="input2" formControlName="input2" class="ovic-input-field">
    </div>
    <div class="mh-field">
        <label for="input3"><i class="fa fa-flask"></i> Ô nhập 3<span class="ovic-mark">*</span></label>
        <input type="number" id="input3" formControlName="input3" class="ovic-input-field">
    </div>

    <!-- Dòng 3: 3 dropdown/select 1 dòng -->
    <div class="mh-field">
        <label><i class="fa fa-university"></i> Lựa chọn 1<span class="ovic-mark">*</span></label>
        <ovic-dropdown placeholder="Chọn..." [options]="list1" optionId="id" optionLabel="title" [formField]="f['select1']"></ovic-dropdown>
    </div>
    <div class="mh-field">
        <label><i class="fa fa-sitemap"></i> Lựa chọn 2</label>
        <ovic-dropdown placeholder="Chọn..." [options]="list2" optionId="id" optionLabel="title" [formField]="f['select2']"></ovic-dropdown>
    </div>
    <div class="mh-field">
        <label><i class="fa fa-list-alt"></i> Lựa chọn 3</label>
        <ovic-dropdown placeholder="Chọn..." [options]="list3" optionId="key" optionLabel="label" [formField]="f['select3']"></ovic-dropdown>
    </div>
</div>
```

### 4.3. CSS Lưới & Input:
```css
.mh-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
}

.mh-field--title {
    grid-column: 1 / -1;
}

.mh-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.mh-field label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.mh-field label i {
    color: #64748b;
    font-size: 12px;
    width: 14px;
    text-align: center;
}

.mh-field label .ovic-mark {
    color: #dc2626;
    margin-left: 2px;
}

.mh-field .ovic-input-field {
    height: 38px;
    padding: 7px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    color: #0f172a;
    font-size: 13.5px;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    box-sizing: border-box;
    width: 100%;
}

.mh-field .ovic-input-field:hover:not([disabled]) {
    border-color: #94a3b8;
}

.mh-field .ovic-input-field:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    outline: none;
}

.mh-field .ovic-input-field[disabled] {
    background-color: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
    border-color: #e2e8f0;
}

.mh-field.field-err .ovic-input-field {
    border-color: #ef4444;
    background-color: #fffaf0;
}
```

---

## 5. Lưới Thông Số Thời Lượng / Thống Kê (Time Grid Pattern - 3 Cột)

Dành cho các thông số số liệu, thời lượng, số tiết: 6 ô chia đều thành 2 hàng x 3 cột.

### 5.1. HTML:
```html
<div class="mh-time-grid">
    <div class="mh-time-field">
        <label for="f1"><span class="mh-time-field__icon fa fa-calendar"></span><span>Tổng số</span></label>
        <input type="text" id="f1" formControlName="tongsogio" class="ovic-input-field">
    </div>
    <div class="mh-time-field">
        <label for="f2"><span class="mh-time-field__icon fa fa-graduation-cap"></span><span>Lý thuyết</span></label>
        <input type="number" id="f2" formControlName="lythuyet" class="ovic-input-field">
    </div>
    <div class="mh-time-field">
        <label for="f3"><span class="mh-time-field__icon fa fa-comments-o"></span><span>Thảo luận</span></label>
        <input type="number" id="f3" formControlName="thaoluan_baitap" class="ovic-input-field">
    </div>
    <div class="mh-time-field">
        <label for="f4"><span class="mh-time-field__icon fa fa-flask"></span><span>Thực hành</span></label>
        <input type="text" id="f4" formControlName="th_thinghiem" class="ovic-input-field">
    </div>
    <div class="mh-time-field">
        <label for="f5"><span class="mh-time-field__icon fa fa-check-square-o"></span><span>Kiểm tra</span></label>
        <input type="number" id="f5" formControlName="kiemtra_dinhky" class="ovic-input-field">
    </div>
    <div class="mh-time-field">
        <label for="f6"><span class="mh-time-field__icon fa fa-home"></span><span>Tự học</span></label>
        <input type="number" id="f6" formControlName="tuhoc" class="ovic-input-field">
    </div>
</div>
```

### 5.2. CSS:
```css
.mh-time-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
}

.mh-time-field {
    display: flex;
    flex-direction: column;
    padding: 14px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    transition: all 180ms ease;
}

.mh-time-field:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
}

.mh-time-field label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
}

.mh-time-field__icon {
    font-size: 13px;
    color: #2563eb;
    flex-shrink: 0;
}

.mh-time-field .ovic-input-field {
    height: 38px;
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    box-sizing: border-box;
}
```

---

## 6. Nút Lưu Trực Quan Đáy Trang (Bottom Action Card Pattern)

Để nút lưu ở dưới cùng **không bị trống trải** hay cô độc giữa khoảng trắng, dùng thẻ card đầy đủ bề ngang có thông điệp xác nhận bên trái và nút lưu lớn bên phải:

### 6.1. HTML:
```html
<div class="mh-action-card">
    <div class="mh-action-card__content">
        <span class="mh-action-card__icon fa fa-check-circle-o" aria-hidden="true"></span>
        <div>
            <h3 class="mh-action-card__title">Hoàn tất chỉnh sửa dữ liệu</h3>
            <p class="mh-action-card__desc">Kiểm tra kỹ thông tin và nhấn nút bên cạnh để cập nhật vào hệ thống.</p>
        </div>
    </div>
    <button type="button" class="btn btn-primary mh-save-button mh-save-button--large" (click)="saveCourse()">
        <i class="fa fa-floppy-o" aria-hidden="true"></i>
        <span>Lưu lại toàn bộ thông tin</span>
    </button>
</div>
```

### 6.2. CSS:
```css
.mh-action-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 16px 18px;
    border: 1px solid #bfdbfe;
    border-radius: 12px;
    background: linear-gradient(110deg, #eff6ff 0%, #ffffff 72%);
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.07);
}

.mh-action-card__content {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.mh-action-card__icon {
    display: inline-flex;
    flex: 0 0 34px;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: #dbeafe;
    color: #1e40af;
    font-size: 16px;
}

.mh-action-card__title {
    margin: 0 0 2px;
    color: #1e3a8a;
    font-size: 14px;
    font-weight: 700;
}

.mh-action-card__desc {
    margin: 0;
    color: #64748b;
    font-size: 12px;
    line-height: 1.4;
}

.mh-save-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 20px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.28);
    cursor: pointer;
    transition: all 180ms ease;
    line-height: 1;
}

.mh-save-button:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1d4ed8 100%);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.38);
    transform: translateY(-1px);
}

.mh-save-button--large {
    flex: 0 0 auto;
    min-height: 42px;
    padding: 11px 24px;
}
```

---

## 7. Xử Lý Bảng & Dropdown Tránh Lỗi Popup Bị Cắt (Table Pattern)

Khi nhúng `<p-select>` hoặc `<ovic-dropdown>` vào bên trong container bảng có `overflow-x: auto`:
- **Bắt buộc** khai báo: `appendTo="body"` trên thẻ `<p-select>` hoặc `<p-multiSelect>`.
- Nếu thiếu thuộc tính này, menu dropdown thả xuống sẽ bị khung bảng cắt mất hoặc thanh cuộn ngang bị nhảy lệch.

```html
<div class="mh-table-wrapper">
    <table class="mh-program-table">
        <thead>
            <tr>
                <th scope="col" class="mh-program-table__index">TT</th>
                <th scope="col">Tên danh mục</th>
                <th scope="col">Lựa chọn cấu hình</th>
            </tr>
        </thead>
        <tbody>
            @for (item of items; track item; let i = $index) {
            <tr>
                <td class="mh-program-table__index">{{ i + 1 }}</td>
                <td><strong>{{ item.name }}</strong></td>
                <td>
                    <!-- Chú ý thuộc tính appendTo="body" -->
                    <p-select appendTo="body" [showClear]="true" placeholder="Chọn..."
                        [options]="item.options" [(ngModel)]="item.selected"
                        [ngModelOptions]="{ standalone: true }">
                    </p-select>
                </td>
            </tr>
            }
        </tbody>
    </table>
</div>
```

---

## 8. Tinh Chỉnh Sâu Cho Thư Viện (PrimeNG & Ovic Deep CSS)

Khai báo các bộ chọn `:host ::ng-deep` để các component dùng chung luôn đồng bộ kiểu dáng:
```css
:host ::ng-deep .p-multiselect {
    width: 100%;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
}

:host ::ng-deep .p-multiselect-token {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 2px 8px;
}

:host ::ng-deep .p-select {
    width: 100%;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
}

:host ::ng-deep ovic-dropdown {
    display: block;
    width: 100%;
}

:host ::ng-deep ovic-dropdown .p-select {
    width: 100%;
    min-height: 38px;
    border-radius: 8px;
    border-color: #cbd5e1;
}

:host ::ng-deep .group-radio-v2 .radio-item-item-v2 {
    min-height: 38px;
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

:host ::ng-deep .group-radio-v2 .radio-item-item-v2:hover {
    background: #eff6ff;
    border-color: #bfdbfe;
}
```

---

## 9. Khả Năng Co Giãn Thiết Bị (Responsive Breakpoints)

```css
@media (max-width: 1024px) {
    .mh-time-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 768px) {
    .mh-page {
        padding: 16px 12px 32px;
    }

    .mh-grid-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
    }

    .mh-field--title {
        grid-column: 1 / -1;
    }

    .mh-time-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .mh-action-card {
        align-items: flex-start;
        flex-direction: column;
    }

    .mh-save-button--large {
        width: 100%;
        justify-content: center;
    }
}

@media (max-width: 640px) {
    :host ::ng-deep .group-radio-v2 .radio-item-v2[class*='hoziron-radio-'] {
        display: block;
        width: 100% !important;
        padding-right: 0 !important;
    }
}

@media (max-width: 480px) {
    .mh-grid-3,
    .mh-time-grid {
        grid-template-columns: 1fr;
    }

    .mh-field--title {
        grid-column: 1 / -1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .mh-save-button,
    .mh-time-field {
        transition: none;
    }

    .mh-save-button:hover {
        transform: none;
    }
}
```
