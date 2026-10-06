# Plan: Component Quản lý Môn học

## Context
Tạo component Angular mới cho quản lý môn học. Component dùng model [subject.ts](../src/app/modules/shared/models/subject.ts), `IctuDataTable2` và `IctuFormControl2` đã có trong `core-new`. Tạo mới `SubjectService`; không thay đổi feature môn học legacy đang dùng `ElnKhoaHocService`.

## Design direction — ui-ux-pro-max
- Education admin dashboard, content-first, modern light surface.
- Một primary CTA: **Thêm môn học**. Header gồm tiêu đề, mô tả, tổng số môn, tổng tín chỉ.
- Card table gồm search, filter state chuẩn bị mở rộng, selection count, bulk action area, empty/loading/error states.
- Bảng desktop: checkbox, STT, tên môn học, mã, mô tả rút gọn, tín chỉ, tín chỉ thực hành, thao tác.
- Mobile: ưu tiên thông tin tên/mã/tín chỉ; hành động vẫn đạt tối thiểu 44px; không tạo horizontal page scroll.
- Drawer: nhóm “Thông tin cơ bản” và “Tín chỉ”; label luôn hiển thị; footer sticky Hủy/Lưu; add/edit title rõ ràng; validation gần field; disable nút khi submitting.
- Accessibility: semantic headings/table, `scope` cho header, `aria-label` cho icon-only buttons, keyboard focus ring, Escape/cancel route, contrast tối thiểu 4.5:1, hỗ trợ reduced motion.
- Style cục bộ bằng SCSS token màu/spacing/radius/shadow; dùng PrimeIcons hoặc icon set sẵn có, không thêm dependency.

## Files và implementation

### 1. Subject service
Tạo `src/app/modules/shared/services/subject.service.ts`:
- `private api = getRoute('subjects/');` — resource endpoint tập trung một chỗ, dễ đổi nếu backend đặt tên khác.
- `get(conditions?: OvicConditionParam[], queryParams?: IctuQueryParams): Observable<IctuPaginator<Subject>>` để dùng trực tiếp với `IctuDataTable2.fillRawData`.
- `create(data: Partial<Subject>): Observable<Subject>` dùng POST.
- `update(id: number, data: Partial<Subject>): Observable<Subject>` dùng PUT theo convention service hiện tại.
- `delete(id: number): Observable<unknown>` dùng DELETE.
- Tái sử dụng `HttpParamsHeplerService`, `getRoute`, `Dto`/`IctuPaginator`; không thêm service duplicate.

### 2. Component mới
Tạo thư mục `src/app/modules/admin/features/quanly-monhoc/subject-management/`:
- `subject-management.component.ts`
- `subject-management.component.html`
- `subject-management.component.scss`

Component standalone, imports tối thiểu: `CommonModule`, `ReactiveFormsModule`, `FormsModule`, PrimeNG `Drawer`, [IctuPaginatorComponent](../src/app/core-new/components/ictu-paginator/ictu-paginator.component.ts), `IctuDataTable2`, `IctuFormControl2`.

State/logic:
- `subjectsTable: IctuDataTable2<Subject>`; gọi `fillRawData(response, { resetPaginator, paged })` sau mỗi load.
- `drawer = viewChild<Drawer>('subjectDrawer')`; truyền signal cho `IctuFormControl2`.
- Form controls đúng model: `name`, `code`, `desc`, `sotinchi`, `sotinchi_th`.
- Validators: `name`/`code` required + length; `desc` optional max length; tín chỉ là số nguyên không âm, `sotinchi_th <= sotinchi`.
- Add reset form rồi `openFormAdd`; edit patch value rồi `openFormEdit`; submit dùng `formControl.canSubmit`, `formControl.submit(request)`, refresh bảng sau success.
- Search debounce; reset page khi search đổi; paging gọi lại service với `paged`/`limit`; preserve current search.
- Delete có confirmation, loading/disable feedback, toast success/error; refresh page.

### 3. Routing
Sửa `src/app/modules/admin/features/quanly-monhoc/quanly-monhoc-routing.module.ts`:
- Thêm route `subject-management` lazy-load component mới.
- Giữ route `''` trỏ tới `DanhsachMonhocComponent`; không phá hành vi legacy.

### 4. Styling
- Header/card/table dùng surface trắng trên nền slate nhạt; indigo làm primary, emerald cho tín chỉ thực hành, red cho destructive action.
- Spacing 4/8px, `min-height` touch target 44px, focus-visible outline.
- Responsive mobile/tablet/desktop; `@media (prefers-reduced-motion: reduce)`.

## Reuse
- [core-new/models/datatable.ts](../src/app/core-new/models/datatable.ts): `IctuDataTable2`, `fillRawData`, selection.
- [core-new/models/ictu-form-control.ts](../src/app/core-new/models/ictu-form-control.ts): drawer form state, heading, add/edit, submit state.
- [core-new/components/ictu-paginator/](../src/app/core-new/components/ictu-paginator/): paginator control/UI.
- [modules/shared/models/subject.ts](../src/app/modules/shared/models/subject.ts): Subject contract.
- Existing notification/auth services để toast, confirm, permission.

## Verification
1. Build Angular development/production; kiểm tra strict template, import alias, standalone imports.
2. Kiểm tra routing tới `subject-management`.
3. Kiểm tra form validations, drawer open/close, search, pagination và UI accessibility states.
