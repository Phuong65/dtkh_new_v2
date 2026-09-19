# Plan: Clone project dtkh_v2.x thành dtkh_new_v2 (Component rỗng)

## Context
Project Angular 14 `dtkh_v2.x` cần được clone thành project mẫu tại `E:\New folder (3)\dtkh_new_v2` để nâng cấp lên Angular mới.
Giữ nguyên toàn bộ cấu trúc: routing, services, models, guards, pipes, utils, menu layout, shared UI components.
Tất cả các component nghiệp vụ/tính năng theo các quyền được làm rỗng (skeleton component) để sẵn sàng build pass và copy nội dung dần sang.

## Phân loại Component

### 1. Giữ nguyên 100% (KHÔNG làm rỗng):
- **Core Components** ([src/app/core/components/](src/app/core/components/)): alert, confirm, confirm-delete, confirm-rounded, popup (5 components).
- **Dashboard/Shell Layout** ([src/app/modules/admin/dashboard/](src/app/modules/admin/dashboard/)): dashboard-v2, menu-v2, menu-language, user-info, user-info-v2, dashboard (6 components) — đảm bảo menu và sidebar hoạt động đầy đủ.
- **Shared Components** ([src/app/modules/shared/components/](src/app/modules/shared/components/)): toàn bộ 70 UI components dùng chung (ovic-table, ovic-dropdown, ovic-editor, etc.) theo lựa chọn của người dùng.
- **Public Core** ([src/app/modules/public/](src/app/modules/public/)): login, index, clear, content-none, huong-dan-public, basic/*, redirect-uri-call-back, reset-password, unauthorized, tra-cuu và các login-template-* để đăng nhập được vào hệ thống.

### 2. Làm rỗng (chỉ giữ skeleton):
- **Admin Features** ([src/app/modules/admin/features/](src/app/modules/admin/features/)): 318 component files thuộc các quyền (cauhoi-tracnghiem, quanly-monhoc, chuongtrinh-daotao, lop-hoc-phan, danh-muc, cthssv, etc.).
- **Kiểm thử ngân hàng câu hỏi** ([src/app/modules/kiem-thu-ngan-hang-cau-hoi/](src/app/modules/kiem-thu-ngan-hang-cau-hoi/)): 17 component files.

## Cấu trúc Component sau khi làm rỗng

Mỗi component được làm rỗng đảm bảo không làm gãy compile và routing:

1. **File `.ts`**:
   - Trích xuất từ file gốc: class name, selector, templateUrl, styleUrls, export type (named / default export), cờ `standalone: true`.
   - Giữ decorator `@Component` tối thiểu:
     ```typescript
     import { Component, OnInit } from '@angular/core';
     import { CommonsModule } from '@angular/common';
     import {RouterModule} from '@angular/router';

     @Component({
         selector: 'app-[selector-goc]',
         templateUrl: './[ten].component.html',
         styleUrls: ['./[ten].component.css']
         // standalone: true (nếu file gốc có standalone)
         // imports: [CommonModule,RouterModule] (nếu standalone)
     })
     export class [TenClass] implements OnInit {
         constructor() {}
         ngOnInit(): void {}
     }
     ```
   - Xóa toàn bộ logic nghiệp vụ, methods, inject service cũ, biến state.

2. **File `.html`**:
   - Nếu file gốc chứa `<router-outlet>`: Giữ nguyên `<router-outlet></router-outlet>`.
   - Các component lá còn lại:
     ```html
     <div class="p-3">
       <p>[TenClass] works!</p>
     </div>
     ```

3. **File `.css` / `.scss`**:
   - Làm trống (empty file).

## Các bước thực hiện

### Bước 1: Sao chép mã nguồn sang `E:\New folder (3)\dtkh_new_v2`
- Dùng robocopy / PowerShell loại trừ `node_modules`, `.git`, `.angular`, `dist`.
- Giữ nguyên y hệt: `package.json`, `angular.json`, `tsconfig*.json`, `src/assets`, `src/environments`, `src/styles.scss`, etc.

### Bước 2: Script tự động làm rỗng các feature components
- Viết script Node.js / PowerShell:
  1. Quét recursion `src/app/modules/admin/features` và `src/app/modules/kiem-thu-ngan-hang-cau-hoi`.
  2. Với mỗi file `.component.ts`:
     - Parse tên class, selector, standalone flag, export syntax.
     - Viết lại file `.ts` dạng skeleton.
     - Kiểm tra file `.html`: nếu có `router-outlet` thì giữ, ngược lại ghi placeholder.
     - Xóa rỗng file `.css` / `.scss`.

### Bước 3: Cài đặt và nghiệm thu (Verification)
- Cài đặt `npm install` (hoặc copy/link `node_modules` từ `dtkh_v2.x` để tiết kiệm thời gian).
- Chạy `npm run build` hoặc `ng build` kiểm tra dự án biên dịch thành công 0 lỗi.
- Chạy `npm start`, đăng nhập và kiểm tra thanh menu các quyền hiển thị đầy đủ, bấm vào từng mục đều mở ra trang rỗng mà không bị crash.