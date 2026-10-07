# Kế hoạch triển khai: Thanh Tab Chi Tiết CTĐT dưới Bộ CTĐT

## 1. Bối cảnh & Yêu cầu
- Khi người dùng bấm vào một Chương trình đào tạo (CTĐT) từ bảng trong `bo-ctdt-management`, ứng dụng sẽ chuyển sang một **trang riêng biệt** (không còn hiển thị bảng danh sách 2 cột master-detail nữa).
- Trang này là **route con của `bo-ctdt`** (đường dẫn: `/admin/dao-tao/bo-ctdt/ctdt-detail`).
- Giữ nguyên toàn bộ cấu trúc slug và query param `?code=<id>` y hệt tính năng cũ (`features/chuongtrinh-daotao`):
  - `ctdt-thongtin` (Thông tin chung)
  - `ctdt-muctieu` (Mục tiêu)
  - `ctdt-cdr` (Chuẩn đầu ra - CDR)
  - `ctdt-noidung` (Nội dung)
  - `ctdt-doingu` (Đội ngũ)
  - `ctdt-cauhinh` (Cấu hình)
- **Chưa nạp các component nghiệp vụ cũ**: Mỗi tab chỉ hiển thị placeholder sạch, có tiêu đề, icon và mô tả.
- **Làm mới giao diện thanh Tab** theo tiêu chuẩn UX/UI Pro Max:
  - Nền trắng tinh tế, active indicator xanh `#0d59cf` có thanh gạch dưới rõ ràng.
  - Phím điều hướng chuẩn, focus-visible hỗ trợ trợ năng bàn phím.
  - Hỗ trợ cuộn ngang mượt mà trên mobile/tablet, không gây vỡ layout trang.
  - Nút quay lại (Back) để trở về danh sách Bộ CTĐT (kèm lưu ngữ cảnh bộ đang chọn qua `bo_id`).

---

## 2. Thiết kế Routing chi tiết

### 2.1. Cấu trúc Routes con của `bo-ctdt` (`src/app/modules/admin/features/bo-ctdt/bo-ctdt.routers.ts`)
```ts
export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./bo-ctdt-management.component').then(m => m.BoCtdtManagementComponent)
    },
    {
        path: 'ctdt-detail',
        loadComponent: () => import('./ctdt-detail-shell/ctdt-detail-shell.component').then(m => m.CtdtDetailShellComponent),
        canActivateChild: [AdminGuard],
        children: [
            { path: '', redirectTo: 'ctdt-thongtin', pathMatch: 'full' },
            {
                path: 'ctdt-thongtin',
                loadComponent: () => import('./ctdt-detail-shell/ctdt-tab-placeholder.component').then(m => m.CtdtTabPlaceholderComponent),
                data: { title: 'Thông tin chung', icon: 'ti ti-info-circle', desc: 'Quản lý thông tin tổng quan của chương trình đào tạo' }
            },
            {
                path: 'ctdt-muctieu',
                loadComponent: () => import('./ctdt-detail-shell/ctdt-tab-placeholder.component').then(m => m.CtdtTabPlaceholderComponent),
                data: { title: 'Mục tiêu đào tạo', icon: 'ti ti-target', desc: 'Mục tiêu chung và các mục tiêu cụ thể của chương trình' }
            },
            {
                path: 'ctdt-cdr',
                loadComponent: () => import('./ctdt-detail-shell/ctdt-tab-placeholder.component').then(m => m.CtdtTabPlaceholderComponent),
                data: { title: 'Chuẩn đầu ra (CDR)', icon: 'ti ti-certificate', desc: 'Ma trận chuẩn đầu ra và các mức độ đạt được' }
            },
            {
                path: 'ctdt-noidung',
                loadComponent: () => import('./ctdt-detail-shell/ctdt-tab-placeholder.component').then(m => m.CtdtTabPlaceholderComponent),
                data: { title: 'Nội dung chương trình', icon: 'ti ti-book', desc: 'Cấu trúc khối kiến thức và danh mục học phần' }
            },
            {
                path: 'ctdt-doingu',
                loadComponent: () => import('./ctdt-detail-shell/ctdt-tab-placeholder.component').then(m => m.CtdtTabPlaceholderComponent),
                data: { title: 'Đội ngũ giảng viên', icon: 'ti ti-users', desc: 'Danh sách giảng viên phụ trách và tham gia giảng dạy' }
            },
            {
                path: 'ctdt-cauhinh',
                loadComponent: () => import('./ctdt-detail-shell/ctdt-tab-placeholder.component').then(m => m.CtdtTabPlaceholderComponent),
                data: { title: 'Cấu hình chương trình', icon: 'ti ti-settings', desc: 'Các thiết lập nâng cao và thông số vận hành' }
            }
        ]
    }
];
```

### 2.2. Cập nhật `dao-tao-routing.module.ts`
Chuyển route `bo-ctdt` từ `loadComponent` sang `loadChildren`:
```ts
{
    path: 'bo-ctdt',
    loadChildren: () => import('@modules/admin/features/bo-ctdt/bo-ctdt.routers').then(m => m.routes)
}
```

### 2.3. Xử lý phân quyền trong `AdminGuard` (`src/app/core/guards/admin.guard.ts`)
- URL con dạng `dao-tao/bo-ctdt/ctdt-detail/...` không nằm trong danh sách menu tĩnh của hệ thống.
- Cần bổ sung xử lý trong `AdminGuard`: Nếu truy cập vào `dao-tao/bo-ctdt/ctdt-detail`, guard sẽ kiểm tra quyền truy cập của route cha `dao-tao/bo-ctdt` (hoặc `chuongtrinh-daotao`). Nếu có quyền thì cho phép truy cập.

---

## 3. Thiết kế Giao diện Shell & Thanh Tab Mới (`CtdtDetailShellComponent`)

### 3.1. Header Component
- Nút bấm quay lại (Back): Dùng style nút icon chuẩn DACMS/core-new (`ictu-admin-icon-button`), nhấn vào điều hướng về `/admin/dao-tao/bo-ctdt` kèm query param `bo_id` để khôi phục trạng thái bộ đang chọn.
- Tiêu đề CTĐT: Hiển thị tên chương trình đào tạo (Typography 18px Bold `#0f172a`), mã chương trình (badge xanh nhạt `#eef4ff`).
- Lấy thông tin CTĐT nhẹ nhàng từ `CtdtService` dựa theo `queryParam: code`.

### 3.2. Thanh Tab Navigation mới (UX/UI Pro Max)
- Đặt ngay bên dưới Header, nằm trên nền trắng `#ffffff`, có đường kẻ đáy `1px solid #e2e8f0`.
- Mỗi tab gồm:
  - Icon Tabler đại diện (`ti ti-*`).
  - Tên tab ngắn gọn, rõ ràng.
  - Trạng thái chưa chọn: Màu chữ `#64748b`, hover chuyển `#0f172a` và nền xám siêu nhạt `#f8fafc`.
  - Trạng thái active (`routerLinkActive="is-active"`): Màu chữ `#0d59cf`, font-weight 600, thanh gạch chân bên dưới (border indicator) dày 2.5px màu `#0d59cf`.
  - Hỗ trợ cuộn ngang tự nhiên trên mobile/tablet (`overflow-x: auto`), ẩn thanh scroll thô.
  - Đảm bảo trợ năng bàn phím: Hỗ trợ phím Tab, hiển thị `focus-visible` outline 2px rõ ràng.

### 3.3. Component Placeholder cho Tab (`CtdtTabPlaceholderComponent`)
- Render nội dung dựa trên `ActivatedRoute.data` (`title`, `icon`, `desc`).
- Thiết kế thẻ card trắng, bo góc 8px, viền mỏng `#e2e8f0`.
- Hiển thị badge trạng thái: *"Khung xem trước - Sẵn sàng tích hợp component nghiệp vụ"*.

---

## 4. Cập nhật Điều hướng từ `BoCtdtManagementComponent`
- Trong bảng danh sách CTĐT ở panel phải:
  - Cột Tên chương trình đào tạo: Biến thành link click gọi `openCtdt(row)`.
  - Nút Thao tác sửa: Gọi `openCtdt(row)`.
- Hàm `openCtdt(item: Ctdt)`:
  ```ts
  this.router.navigate(['/admin/dao-tao/bo-ctdt/ctdt-detail/ctdt-thongtin'], {
      queryParams: { code: item.id, bo_id: this.selectedBo()?.id }
  });
  ```

---

## 5. Kế hoạch triển khai từng bước (Phase-by-Phase)

### Bước 1: Routing & Guard
1. Tạo `src/app/modules/admin/features/bo-ctdt/bo-ctdt.routers.ts`.
2. Tạo component placeholder `CtdtTabPlaceholderComponent`.
3. Cập nhật `AdminGuard` cho route con `ctdt-detail`.
4. Cập nhật `dao-tao-routing.module.ts`.
5. Cập nhật hàm `openCtdt()` trong `bo-ctdt-management.component.ts` và gắn click ở template.

### Bước 2: Xây dựng Giao diện Shell & Thanh Tab mới
1. Tạo component `CtdtDetailShellComponent` (TS, HTML, CSS).
2. Xây dựng Header (nút Back, tên CTĐT, mã CTĐT).
3. Xây dựng thanh Tab Navigation UX/UI Pro Max chuẩn responsive và trợ năng bàn phím.
4. Gắn `<router-outlet></router-outlet>`.

### Bước 3: Hoàn thiện & Kiểm thử
1. Chạy `npm run build` kiểm tra toàn diện.
2. Kiểm tra tương tác: Bấm CTĐT từ danh sách -> mở trang tab mới -> chuyển đổi mượt mà giữa 6 tab -> bấm quay lại về đúng bộ CTĐT.
