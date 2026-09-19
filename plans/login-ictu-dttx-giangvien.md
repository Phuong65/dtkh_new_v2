# Kế hoạch tạo trang Login cho Đào tạo từ xa — ICTU (Giảng viên)

## 1. Tổng quan

**Mục tiêu:** Tạo trang đăng nhập chuyên nghiệp, thể hiện rõ đây là hệ thống dạy học trực tuyến từ xa dành cho giảng viên của Trường Đại học Công nghệ Thông tin và Truyền thông (ICTU) Thái Nguyên.

**Cơ sở:** Dựa trên `login-template-v4` hiện có (UI hiện đại, glassmorphism, grid pattern overlay), kết hợp với logic xác thực từ `login-template-ictu` (hỗ trợ đăng nhập bên thứ ba, Google Sign-In).

**Kiến trúc:** Project sử dụng multi-tenant `key_server` — mỗi template login là một component riêng trong `login-main-template` và được chọn theo `key_server`.

---

## 2. Cấu trúc thư mục

Tạo mới feature folder theo đúng quy tắc `feedback_feature_folder_structure`:

```
src/app/modules/public/features/
├── login-template-ictu/           # (đã có) — template cũ cho ICTU
├── login-template-v4/             # (đã có) — template làm cơ sở giao diện
└── login-template-ictu-dttx/      # MỚI — template cho ICTU đào tạo từ xa
    ├── login-template-ictu-dttx.component.ts
    ├── login-template-ictu-dttx.component.html
    ├── login-template-ictu-dttx.component.css
    └── login-template-ictu-dttx.component.spec.ts
```

> **`key_server` value:** `'dttx-ictu'`

---

## 3. Thiết kế giao diện (UI/UX)

### 3.1 Layout tổng thể (dựa trên v4)

- **Nền:** `background-color: #f0f4f8` với **grid pattern overlay** (lưới vuông 40px x 40px) + radial gradient làm mờ trung tâm.
- **Hình khối trang trí:** 2 circle mờ (top-right, bottom-left) tạo chiều sâu.
- **Card Login:** `border-radius: 20px`, `backdrop-filter: blur(10px)`, đổ bóng đa lớp, hiệu ứng hover nhẹ.
- **Responsive:** Mobile (≤576px) card full-width, ẩn decorative elements.

### 3.2 Header thương hiệu

| Thành phần | Mô tả |
|---|---|
| **Logo** | Logo ICTU trắng — dùng `assets/images/ICTU-LOGO-WHITE.png` (kế thừa từ login-template-ictu) |
| **Tên trường** | "QUẢN LÝ ĐÀO TẠO TỪ XA" — chữ in hoa, đậm, màu `#0056b3` |
| **Tên trường phụ** | "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG" — font nhỏ hơn, `#718096`, letter-spacing |
| **Slogan/Mô tả** | "Hệ thống dạy học trực tuyến từ xa dành cho giảng viên" — tạo cảm giác tin cậy |

### 3.3 Form đăng nhập

| Trường | Chi tiết |
|---|---|
| **Tên đăng nhập** | Input với icon/user, border-radius 12px, focus ring xanh |
| **Mật khẩu** | Input + toggle show/hide password (eye icon), border-radius 12px |
| **Quên mật khẩu?** | Link nhỏ, hover chuyển màu `#0056b3` |
| **Nút ĐĂNG NHẬP** | Gradient `#0056b3 → #007bff`, height 52px, border-radius 12px, shadow, hover translateY(-2px) |

### 3.4 Đăng nhập bên thứ ba (kế thừa từ login-template-ictu)

- Divider "hoặc"
- Nút **"Sign in with Google"** — style chuẩn Google (icon trắng nền xanh, hover shadow)
- **Không có Microsoft Sign-In** (theo yêu cầu)

### 3.5 Forgot Password Modal (kế thừa từ v4)

- Icon khóa SVG, title "Bạn quên mật khẩu?"
- Input email + nút "Gửi yêu cầu"
- Close button ×

### 3.6 Footer

```
Copyright © 2026 by <a href="https://ictu.vn">ICTU.VN</a>
```

### 3.7 Tuân thủ rules phát triển

- **Template Binding (Rule 1):** Không gọi method trong template — dùng properties, pipes.
- **UI/UX (Rule 2):**
  - Buttons có icon + text
  - Focus ring xanh (3px opacity 0.1)
  - Loading spinner khi đăng nhập
  - Hover effects trên mọi phần tử tương tác
  - CSS Variables cho màu sắc
  - Responsive: breakpoint 992px, 576px
- **UX Evaluation (Rule 6):** Đảm bảo 6 tiêu chí Clarity, Consistency, Efficiency, Feedback, Accessibility, Emotion.

---

## 4. Chức năng xử lý (Logic)

### 4.1 Kế thừa từ login-template-ictu

| Chức năng | Mô tả |
|---|---|
| **Form validation** | Username required, password required |
| **Check login status** | Kiểm tra nếu đã login → redirect; nếu role = student → thông báo + chuyển hướng |
| **Sign in** | Subject `login$` với debounce 100ms → `auth.login()` |
| **Toggle password** | 2 trạng thái `hide`/`show` field + icon |
| **Forgot password** | Modal → `auth.forgetPassword()` |
| **Google Sign-In** | Google Identity Services (GIS) — gọi `google.accounts.id.initialize()` |
| **Google Sign-In** | Google Identity Services (GIS) — gọi `google.accounts.id.initialize()` |
| **Enter key submit** | `(keydown)="handleInputKeyDown($event)"` |

### 4.2 Tên trường hiển thị

| Key | Giá trị hiển thị |
|---|---|
| `universityName` | **"QUẢN LÝ ĐÀO TẠO TỪ XA"** |
| `universitySub` | **"TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG"** |
| `pageTitle` | **"Đăng nhập — Đào tạo từ xa ICTU"** |

---

## 5. Các bước triển khai

### Bước 1: Tạo component

- [ ] Tạo folder `login-template-ictu-dttx/`
- [ ] Tạo 4 file: `.ts`, `.html`, `.css`, `.spec.ts`
- [ ] Component class: `LoginTemplateIctuDttxComponent`
- [ ] Selector: `app-login-template-ictu-dttx`

### Bước 2: Xây dựng HTML template

- [ ] Copy layout login card từ v4 (grid pattern, circles, glass card)
- [ ] Sửa logo ICTU
- [ ] Sửa tên trường: "QUẢN LÝ ĐÀO TẠO TỪ XA" + "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG"
- [ ] Thêm mô tả "Hệ thống dạy học trực tuyến từ xa dành cho giảng viên"
- [ ] Form login: username, password, toggle password, forgot password
- [ ] Nút đăng nhập gradient
- [ ] Divider "hoặc" + nút Google Sign-In
- [ ] Footer copyright

### Bước 3: Xây dựng CSS

- [ ] Grid pattern overlay + radial gradient
- [ ] Glass card login (backdrop-filter, border-radius 20px, box-shadow multi-layer)
- [ ] Form controls: border-radius 12px, focus ring, hover
- [ ] Buttons: gradient, shadow, hover translateY
- [ ] Responsive: ≤576px full-width, ẩn decorative
- [ ] CSS Variables: `--primary: #0056b3`, `--primary-light`...
- [ ] Google sign-in button style

### Bước 4: Xây dựng TypeScript logic

- [ ] Import các module: Forms, Router, Modal, Auth, Notification
- [ ] Interface: `FieldPasswordState`, `FieldPasswordControl`, `LoginButton`
- [ ] FormGroup: `loginForm` (username, password), `resetPasswordForm` (email)
- [ ] Subject: `login$`, `resetPassword$`, `signInWithThirdPartyObserver$`
- [ ] `checkUserLoginStatus()` — redirect nếu đã login, thông báo nếu student
- [ ] `btnSignIn()` — validate → gửi login$
- [ ] `checkLogin()` — gọi `auth.login()`
- [ ] `toggleShowPassword()` — toggle field type
- [ ] `openResetPasswordPanel()` — modal quên mật khẩu
- [ ] `btnSignInWithThirdPartyAccounts(source)` — Google/Microsoft
- [ ] `ngAfterViewInit()` — khởi tạo Google Identity Services
- [ ] `handleInputKeyDown()` — Enter submit

### Bước 5: Đăng ký route

- [ ] Thêm `LoginTemplateIctuDttxComponent` vào `public.module.ts`
- [ ] Cập nhật `login-main-template.component.html`:
  ```html
  <app-login-template-ictu-dttx *ngIf="acceptDivi && key_server === 'ictu_dttx'"></app-login-template-ictu-dttx>
  ```
  với key_server `'dttx-ictu'`

### Bước 6: Kiểm tra & hoàn thiện

- [ ] Kiểm tra form validation
- [ ] Kiểm tra loading/disabled state
- [ ] Kiểm tra responsive (desktop, tablet, mobile)
- [ ] Kiểm tra Enter key submit
- [ ] Kiểm tra forgot password flow
- [ ] Kiểm tra Google Sign-In
- [ ] Kiểm tra student redirect
- [ ] Xóa dead code (method không dùng trong template)

---

## 6. Ghi chú kỹ thuật

- **Component standalone hay module-based?** Các login template hiện tại đều dùng module-based (styleUrls, templateUrl). Giữ nguyên pattern để đồng bộ.
- **Dùng chung AuthService** `@core/services/auth.service` — không cần tạo service mới.
- **Dùng chung NotificationService** `@core/services/notification.service`.
- **Dùng chung Modal (NgbModal)** với `NORMAL_MODAL_OPTIONS` từ `@core/utils/syscat`.
- **Assets:** Dùng `assets/images/ICTU-LOGO-WHITE.png` (logo trắng, đã có sẵn trong dự án từ `login-template-ictu`).

---

## 7. Câu hỏi đã giải đáp

| Câu hỏi | Trả lời |
|---|---|
| `key_server` value? | `'dttx-ictu'` |
| Logo ICTU? | `assets/images/ICTU-LOGO-WHITE.png` (logo trắng) |
| Hình nền đặc trưng? | Không — giữ grid pattern như v4 |
| Google Sign-In? | Có — cần tích hợp Google Sign-In |
| Microsoft Sign-In? | Không — bỏ qua Microsoft Sign-In |
