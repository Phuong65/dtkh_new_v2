# Kế Hoạch: Chuyển Đổi & Sử Dụng Các Template Cơ Bản Từ dacms Sang dtkh_new_v2 (Phiên bản core-new)

## 1. Bối cảnh & Mục tiêu (Context)
Dự án `dtkh_new_v2` cần tái sử dụng các mẫu component, service, model và pipes chuẩn từ project `dacms` (tại `E:/New folder (3)/dacms`) để thống nhất phong cách viết UI bằng Reactive Signal.

**Quan trọng:** Tất cả code mới sẽ đặt vào **`src/app/core-new/`** (thư mục tách biệt) để không ảnh hưởng project hiện tại. Khi cần dùng mới import từ `@core-new/*`.

---

## 2. Danh Sách Các Thành Phần Chi Tiết Cần Copy

### A. Quản Lý Trạng Thái & Models (`src/app/core-new/models/`)
1. **`app-state.ts`**
   - Nguồn: `dacms/src/app/models/app-state.ts`
   - Đích: `dtkh_new_v2/src/app/core-new/models/app-state.ts`
2. **`datatable.ts`** (chứa `IctuDataTable`, `IctuDataTable2`)
   - Nguồn: `dacms/src/app/models/datatable.ts`
   - Đích: `dtkh_new_v2/src/app/core-new/models/datatable.ts`
3. **`dto.ts`** (mở rộng `DtoObject<T>`, `IctuPaginator<T>`, `IctuConditionParam`, `IctuQueryParams`)
   - Nguồn: `dacms/src/app/models/dto.ts`
   - Đích: `dtkh_new_v2/src/app/core-new/models/dto.ts`

### B. Helper Utilities (`src/app/core-new/utils/`)
1. **`helper.ts`** (hàm `appendElementStyle`, các hàm tiện ích khác)
   - Nguồn: `dacms/src/app/utilities/helper.ts`
   - Đích: `dtkh_new_v2/src/app/core-new/utils/helper.ts`

### C. Component Giao Diện Cơ Bản (`src/app/core-new/components/`)
1. **`<app-loading-progress>` (`LoadingProgressComponent`)**
   - Nguồn: `dacms/src/app/theme/components/loading-progress/`
   - Đích: `dtkh_new_v2/src/app/core-new/components/loading-progress/`
2. **`<ictu-paginator>` (`IctuPaginatorComponent`) & `IctuPaginatorControl`**
   - Nguồn: `dacms/src/app/theme/components/ictu-paginator/`
   - Đích: `dtkh_new_v2/src/app/core-new/components/ictu-paginator/`
3. **Dialog Xác Nhận** (tùy chọn nâng cấp sau)

### D. Pipes Bổ Trợ (`src/app/core-new/pipes/`)
- `format-bytes.pipe.ts`: Dung lượng file (KB, MB, GB)
- `format-vnd.pipe.ts`: Tiền VNĐ
- `date2text.pipe.ts`: Ngày tháng thân thiện
- `file-icon.pipe.ts`: Icon theo loại file

---

## 3. Các Bước Triển Khai Cụ Thể

### Bước 1: Tạo cấu trúc thư mục `src/app/core-new/`
```
src/app/core-new/
├── models/
│   ├── app-state.ts
│   ├── datatable.ts
│   └── dto.ts
├── utils/
│   └── helper.ts
├── components/
│   ├── loading-progress/
│   │   ├── loading-progress.component.ts
│   │   ├── loading-progress.component.html
│   │   └── loading-progress.component.scss
│   └── ictu-paginator/
│       ├── ictu-paginator-control.ts
│       ├── ictu-paginator.component.ts
│       ├── ictu-paginator.component.html
│       ├── ictu-paginator.component.css
│       └── index.ts
└── pipes/
    ├── format-bytes.pipe.ts
    ├── format-vnd.pipe.ts
    ├── date2text.pipe.ts
    └── file-icon.pipe.ts
```

### Bước 2: Sao chép Models & Helper
- Tạo file `app-state.ts`, `datatable.ts`, `dto.ts` tại `core-new/models/`
- Tạo file `helper.ts` tại `core-new/utils/`

### Bước 3: Sao chép Components
- Tạo component `loading-progress` và `ictu-paginator` tại `core-new/components/`

### Bước 4: Sao chép Pipes
- Tạo 4 file pipe tại `core-new/pipes/`

### Bước 5: Cập nhật tsconfig.json
- Thêm path alias `"@core-new/*": ["src/app/core-new/*"]` vào `tsconfig.json`

### Bước 6: Kiểm Tra & Xác Nhận
- `ng build` không lỗi TypeScript
- Test import: `import { IctuDataTable2 } from '@core-new/models/datatable';`

---

## 4. Ghi chú
- File `src/app/core/models/app-state.ts` và `datatable.ts` đã tạo trước đó tại `core/` sẽ **di chuyển** sang `core-new/` (hoặc xóa bản cũ).
- Không sửa đổi `AppModule`, `SharedModule` hay các component đang dùng `core/` hiện tại.