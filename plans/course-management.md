# Plan: Xây dựng Quản lý học phần trong Đào tạo

## Context

Cần xây dựng trang quản lý học phần tại `/admin/dao-tao/course-management`. Trang chỉ hiển thị course đã gắn CTĐT (`ctdt_id != 0`), dùng `admin-wrap-table` và style `core-new`, quản lý trạng thái bằng `AppState` + `WritableSignal`.

Yêu cầu:

- Read-only: không thêm, sửa nhanh hoặc xóa tại trang này.
- Tìm theo mã/tên học phần.
- Lọc theo khoa quản lý và CTĐT.
- Click tên học phần mở route chi tiết hiện có: `/admin/dao-tao/quanly-monhoc/monhoc-thongtin?code={id}`.
- Dùng `IctuPaginatorComponent`, `LoadingProgressComponent`, `IctuDataTable2`/`IctuPaginatorControl`.

## Existing patterns

- Route Đào tạo: `src/app/modules/admin/routings/dao-tao/dao-tao-routing.module.ts`.
- UI core-new mẫu: `src/app/modules/admin/features/subject-management/subject-management.component.ts`, `.html`, `.css`.
- State: `src/app/core-new/models/app-state.ts`.
- Datatable/paginator: `src/app/core-new/models/datatable.ts`.
- Course API: `ElnKhoaHocService.getKhoaHocByPageNew_2()` trong `src/app/modules/shared/services/elearning-khoa-hoc.service.ts`.
- Course model: `src/app/modules/shared/models/elng-khoa-hoc.ts`.
- Khoa: `DonViService`; CTĐT: `CtdtService`.
- `OvicQueryCondition.notEqual` tạo compare `<>`.
- Chi tiết course: `src/app/modules/admin/features/quanly-monhoc/quanly-monhoc-routing.module.ts`.

## Implementation

### Component

Tạo:

```text
src/app/modules/admin/features/course-management/
├── course-management.component.ts
├── course-management.component.html
├── course-management.component.css
└── course-management.component.spec.ts
```

Standalone imports: `CommonModule`, `FormsModule`, `RouterModule`, `SelectModule`, `InputTextModule`, `IctuPaginatorComponent`, `LoadingProgressComponent`, `MatButtonModule`.

Writable state:

```ts
readonly state: WritableSignal<AppState> = signal('loading');
readonly filterState: WritableSignal<AppState> = signal('loading');
readonly table = new IctuDataTable2<ElnKhoaHoc>({ rows: 20, pageLinkSize: 5 });
readonly searchValue = signal('');
readonly searchField = signal<'title' | 'maso'>('title');
readonly categoryId = signal<number | null>(null);
readonly ctdtId = signal<number | null>(null);
readonly categories = signal<DonVi[]>([]);
readonly programmes = signal<Ctdt[]>([]);
readonly errorMessage = signal('');
```

Dùng `table.data()` trong template; không dùng mảng mutable song song cho trạng thái hiển thị. Dùng `DestroyRef`/`takeUntilDestroyed` và request/session guard chống response cũ ghi đè filter mới.

### Query

`loadCourses(page, resetPaginator)` luôn thêm:

```ts
{ conditionName: 'ctdt_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' }
{ conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '-1', orWhere: 'and' }
```

Bổ sung:

- Search: một field rõ ràng `title` hoặc `maso` với `LIKE`.
- Khoa: `category_ids = selectedCategoryId`.
- CTĐT: `ctdt_id = selectedCtdtId`.

Dùng `limit = table.paginator.rows()`, `paged = page`, `orderby = title`, `order = ASC`. Response cập nhật `table.fillRawData`, `recordsFiltered`, paginator và `AppState`.

Không dùng OR search không nhóm, tránh làm lọt course `ctdt_id = 0`.

### Filter options

Load khoa và CTĐT bằng `forkJoin`. Khoa lọc active, sắp xếp tên; CTĐT lọc theo convention active, sắp xếp tên. Lỗi filter không làm mất danh sách course; hiển thị trạng thái riêng/disable select. Khi đổi khoa, reset CTĐT nếu không còn phù hợp.

### UI

Khung:

```html
<section class="admin-section--table ictu-admin-page position-relative">
  <app-loading-progress />
  <div class="admin-wrap-table ictu-admin-table-shell">
    <div class="admin-wrap-table__head">toolbar</div>
    <div class="admin-wrap-table__body ictu-admin-table-shell__body">table</div>
    <div class="admin-wrap-table__foot"><ictu-paginator /></div>
  </div>
</section>
```

Cột:

1. TT
2. Mã học phần
3. Tên học phần, link chi tiết
4. Số tín chỉ
5. TC thực hành
6. Khoa quản lý
7. CTĐT

States: loading overlay, error + retry, empty row. Không render nút xóa/clone/sửa nhanh.

### Routing và permission

Thêm vào `dao-tao-routing.module.ts`:

```ts
{
  path: 'course-management',
  loadComponent: () => import('@modules/admin/features/course-management/course-management.component')
    .then(c => c.CourseManagementComponent)
}
```

`AdminGuard` yêu cầu permission `dao-tao/course-management`. Không bypass bằng `ACCEPT_ROUTER`; backend/menu use-case cần có key này, title `Quản lý học phần`, icon `ti ti-books`.

### CSS

Chỉ sửa `course-management.component.css`:

- core-new/admin-wrap-table.
- Border 1px xám nhạt, không viền kép.
- `font-weight` tối đa 600.
- Bảng có min-width và scroll ngang responsive.
- Toolbar xếp dọc ở mobile.
- Link có focus-visible.

Không sửa global CSS, không copy CSS cũ toàn bộ.

## Tests and verification

Tạo spec mock `ElnKhoaHocService`, `CtdtService`, `DonViService`:

- Mọi query có `ctdt_id <> 0` và `status > -1`.
- Search, khoa, CTĐT thêm đúng condition.
- Success cập nhật table/total/paginator/state.
- Error chuyển state và retry.
- Response cũ không ghi đè request mới.
- Empty state và detail link đúng.

Chạy:

```bash
npx tsc -p tsconfig.app.json --noEmit
npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/modules/admin/features/course-management/course-management.component.spec.ts'
```

Kiểm tra thực tế `/admin/dao-tao/course-management`, request network, loại course `ctdt_id = 0`, pagination, filter, loading/error, keyboard focus và mobile scroll.
