# Subject Management Component Blueprint

## Purpose

Reusable Angular 21 standalone admin CRUD table pattern. New components should read this file, then replace the entity type, API service, form fields, labels, permission key, and columns while preserving the structure.

Reference implementation:
- `src/app/modules/admin/features/subject-management/subject-management.component.ts`
- `src/app/modules/admin/features/subject-management/subject-management.component.html`
- `src/app/modules/admin/features/subject-management/subject-management.component.css`

Reference architecture from DACMS:
- `E:/New folder (3)/dacms/src/app/components/bac-dao-tao/bac-dao-tao.component.ts`
- DACMS event map: `private handelEvent: Record<EventName, (data: Entity) => void>`
- DACMS delete flow: `confirmDelete -> IctuDeletingAnimationControl -> startDeleting -> reload`

---

## 1. Stack and component setup

Use a standalone component:

```ts
@Component({
  selector: 'app-entity-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCheckbox,
    MatButton,
    Drawer,
    InputText,
    Textarea,
    IctuPaginatorComponent,
    LoadingProgressComponent
  ],
  templateUrl: './entity-management.component.html',
  styleUrl: './entity-management.component.css'
})
```

Core imports:

```ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Observable, Subject as RxSubject, filter, map, switchMap, takeUntil } from 'rxjs';
import { DataTableEvent, DataTableEventName, IctuDataTable2 } from '@core-new/models/datatable';
import { IctuFormControl2 } from '@core-new/models/ictu-form-control';
import { IctuDeletingAnimationControl } from '@core-new/models/ictu-deleting-animation-control';
import { IctuPaginatorComponent } from '@core-new/components/ictu-paginator/ictu-paginator.component';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { NotificationService } from '@core-new/service/notification.service';
```

Do not import the legacy notification service in a new core-new component.

---

## 2. State and lifecycle

```ts
readonly drawer = viewChild<Drawer>('entityDrawer');
readonly destroy$ = new RxSubject<void>();
readonly table = new IctuDataTable2<Entity>({ rows: 20, pageLinkSize: 5 });
readonly state = signal<AppState>('loading');
readonly isSaving = signal<boolean>(false);
readonly searchValue = signal<string>('');

canAdd = true;
canUpdate = true;
canDelete = true;
```

Lifecycle:

```ts
ngOnInit(): void {
  this.checkPermissions();
  this.observeEvents.pipe(takeUntil(this.destroy$)).subscribe(({ name, data }) => {
    this.handelEvent[name](data);
  });
  this.loadData(1, true);
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

Every HTTP/dialog subscription must use `takeUntil(this.destroy$)` unless it is guaranteed to complete immediately.

---

## 3. Form pattern

Keep the form as a typed/central `FormGroup` with field validators and optional group validators.

Subject example:

```ts
readonly subjectForm: FormGroup = this.fb.group({
  name: ['', [Validators.required, Validators.maxLength(255)]],
  code: ['', [Validators.required, Validators.maxLength(50)]],
  desc: ['', [Validators.maxLength(1000)]],
  sotinchi: [0, [Validators.required, nonNegativeIntegerValidator()]],
  sotinchi_th: [0, [Validators.required, nonNegativeIntegerValidator()]]
}, { validators: creditBalanceValidator() });
```

`IctuFormControl2` controls drawer/form state:

```ts
readonly formControl = new IctuFormControl2<Entity>({
  dropdownFields: [],
  formGroup: this.entityForm,
  objectName: 'đối tượng',
  drawer: this.drawer
});
```

Use `formControl.isFormAdd`, `formControl.object`, `formControl.visible`, `formControl.state()`, `formControl.heading()`, and `formControl.loadingLabel()`.

---

## 4. Event dispatcher pattern

Use the same pattern as DACMS `bac-dao-tao`:

```ts
private readonly handelEvent: Record<DataTableEventName, (data: Entity) => void> = {
  OPEN_FORM_ADD: () => this.openCreateDrawer(),
  OPEN_FORM_UPDATE: data => this.openEditDrawer(data),
  DELETE_SINGLE_ROW: data => this.deleteEntity(data),
  DELETE_SELECTED_ROWS: () => this.deleteSelectedEntities(),
  SUBMIT_FORM: () => this.submitForm()
};

private readonly observeEvents = new RxSubject<DataTableEvent<Entity>>();

emitEvent(name: DataTableEventName, data: Entity = null): void {
  this.observeEvents.next({ name, data });
}
```

Template actions call `emitEvent(...)`, not business methods directly:

```html
(click)="emitEvent('OPEN_FORM_ADD')"
(click)="emitEvent('OPEN_FORM_UPDATE', row)"
(click)="emitEvent('DELETE_SINGLE_ROW', row)"
(click)="emitEvent('DELETE_SELECTED_ROWS')"
(click)="emitEvent('SUBMIT_FORM')"
```

`DataTableEventName` is defined in `src/app/core-new/models/datatable.ts`.

---

## 5. Permissions

Derive the route permission key from `Router.url` and support the feature fallback key:

```ts
const rawUrl = this.router.url.split('?')[0];
const routePath = rawUrl.startsWith('/admin/')
  ? rawUrl.substring(7)
  : rawUrl.replace(/^\//, '');

this.canAdd = this.auth.userCanAdd(routePath) || this.auth.userCanAdd('feature-key');
this.canUpdate = this.auth.userCanEdit(routePath) || this.auth.userCanEdit('feature-key');
this.canDelete = this.auth.userCanDelete(routePath) || this.auth.userCanDelete('feature-key');
```

Every action checks permission and shows `toastWarning` before returning.

---

## 6. List/search/pagination

Use `IctuDataTable2<Entity>` and `fillRawData`:

```ts
loadData(page = 1, resetPaginator = false): void {
  this.state.set('loading');
  const conditions: OvicConditionParam[] = [];
  const query = this.searchValue();

  if (query) {
    conditions.push({
      conditionName: 'name',
      condition: OvicQueryCondition.like,
      value: `%${query}%`,
      orWhere: 'or'
    });
    conditions.push({
      conditionName: 'code',
      condition: OvicQueryCondition.like,
      value: `%${query}%`,
      orWhere: 'or'
    });
  }

  this.entityService.get(conditions, {
    limit: this.table.paginator.rows(),
    paged: page,
    orderby: 'created_at',
    order: 'DESC'
  }).pipe(takeUntil(this.destroy$)).subscribe({
    next: response => {
      const total = Number(response.totalRecords) || 0;
      this.table.fillRawData({
        data: Array.isArray(response.data) ? response.data : [],
        recordsFiltered: total,
        recordsTotal: total,
        draw: 1
      }, { paged: page, resetPaginator });
      this.state.set('success');
    },
    error: () => {
      this.state.set('error');
      this.notificationService.toastError('Không thể tải dữ liệu', 'Lỗi kết nối');
    }
  });
}
```

Search input:

```ts
onSearchChange(event: Event): void {
  this.searchValue.set((event.target as HTMLInputElement).value || '');
}

onSearchData(): void {
  this.searchValue.set(this.searchValue().trim());
  this.loadData(1, true);
}
```

Template:

```html
<input class="admin-wrap-table__head-actions__search ictu-form__input-field"
  pInputText placeholder="Tìm kiếm..."
  [value]="searchValue()"
  (input)="onSearchChange($event)"
  (keyup.enter)="onSearchData()"
  aria-label="Tìm kiếm theo tên hoặc mã">
```

---

## 7. Add/edit drawer

Open create:

```ts
openCreateDrawer(): void {
  if (!this.canAdd) { /* warning */ return; }
  this.entityForm.reset({ /* defaults */ });
  this.formControl.openFormAdd();
}
```

Open edit:

```ts
openEditDrawer(item: Entity): void {
  if (!this.canUpdate) { /* warning */ return; }
  this.entityForm.reset({ /* mapped item values */ });
  this.formControl.openFormEdit(item);
}
```

Submit behavior is intentionally different from normal drawer submission:

1. Validate form.
2. Build trimmed payload.
3. Set `isSaving` true.
4. Close drawer immediately.
5. Show page-level `app-loading-progress` overlay.
6. Execute create/update.
7. Clear `isSaving` in both success/error.
8. Toast result and reload current page.

```ts
const isAdd = this.formControl.isFormAdd;
const request$ = isAdd
  ? this.entityService.create(payload)
  : this.entityService.update(this.formControl.object.id, payload);

this.isSaving.set(true);
this.closeDrawer();

request$.pipe(takeUntil(this.destroy$)).subscribe({
  next: () => {
    this.isSaving.set(false);
    this.notificationService.toastSuccess(
      isAdd ? 'Thêm mới thành công' : 'Cập nhật thành công',
      'Thành công'
    );
    this.loadData(this.table.paginator.paged(), false);
  },
  error: () => {
    this.isSaving.set(false);
    this.notificationService.toastError(
      isAdd ? 'Thêm mới thất bại' : 'Cập nhật thất bại',
      'Lỗi thao tác'
    );
  }
});
```

Template page-level loading:

```html
@if (isSaving()) {
  <app-loading-progress heading="Đang lưu dữ liệu..."></app-loading-progress>
}
```

Do not render `formControl.enableLoading()` in the drawer for save.

---

## 8. Delete flow — required DACMS pattern

Do not call `forkJoin` directly for deletes. Use the reusable sequential progress controller:

```ts
private requestDeletingData(ids: number[], message: string): void {
  const currentPage = this.table.paginator.paged();
  const nextPage = ids.length === this.table.data().length && currentPage > 1
    ? currentPage - 1
    : currentPage;

  this.notificationService.confirmDelete2({
    heading: 'Xác nhận xóa',
    htmlMessage: message
  }).pipe(
    filter(confirmed => confirmed),
    map(() => new IctuDeletingAnimationControl(ids, this.entityService)),
    switchMap((deleteController: IctuDeletingAnimationControl): Observable<boolean> => {
      deleteController.run();
      return this.notificationService.startDeleting(deleteController.progress);
    }),
    takeUntil(this.destroy$)
  ).subscribe({
    next: success => {
      if (success) {
        this.notificationService.toastSuccess('Xóa thành công', 'Thành công');
      }
      this.loadData(nextPage, false);
    },
    error: () => {
      this.notificationService.toastError('Xóa thất bại', 'Lỗi thao tác');
      this.loadData(currentPage, false);
    }
  });
}
```

Single delete:

```ts
const safeTitle = (item.name || '')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
this.requestDeletingData([item.id], `Bạn có chắc muốn xóa "${safeTitle}"?`);
```

Multiple delete:

```ts
const selected = this.table.getSelectedData();
if (selected.length) {
  this.requestDeletingData(
    selected.map(item => item.id),
    `Bạn có chắc muốn xóa ${selected.length} mục đã chọn?`
  );
}
```

`IctuDeletingAnimationControl` lives at:

`src/app/core-new/models/ictu-deleting-animation-control.ts`

It deletes sequentially, emits percentage progress, continues after individual failure, and errors at completion if one or more deletes failed.

---

## 9. Required HTML layout

Use this layout hierarchy:

```html
<section class="admin-section--table position-relative">
  @if (state() === 'loading') {
    <app-loading-progress heading="Đang tải dữ liệu..." backdropFilter="none"></app-loading-progress>
  }
  @if (isSaving()) {
    <app-loading-progress heading="Đang lưu dữ liệu..."></app-loading-progress>
  }

  <div class="admin-wrap-table">
    @if (state() !== 'error') {
      <div class="admin-wrap-table__head d-flex">
        <div class="admin-wrap-table__head-actions">
          <!-- search + action buttons -->
        </div>
      </div>

      <div class="admin-wrap-table__body">
        <div class="entity-table-scroll">
          <table class="tbl admin-table table-hover">...</table>
        </div>
      </div>

      <div class="admin-wrap-table__foot">
        <ictu-paginator [control]="table.paginator" (onChangePage)="onChangePage($event)"></ictu-paginator>
      </div>
    }
  </div>
</section>
```

The scroll container is the table wrapper only. Header and paginator remain visible.

---

## 10. Shared CSS / styling

Global shared styles:

- `src/app/core-new/styles/ictu-admin-form.css`
- `src/app/core-new/styles/ictu-buttons.css`
- `src/app/core-new/styles/ictu-notification.css`
- `src/app/core-new/components/ictu-paginator/ictu-paginator.component.css`

`angular.json` must load these styles globally.

### Shared search class

Only use this class. Do not restyle it per feature:

```html
<input class="admin-wrap-table__head-actions__search ictu-form__input-field" pInputText>
```

Global style provides:

- 35px height
- 6px 10px padding
- 4px border radius
- border `#cbd5e1`
- white background
- focus border `#0d59cf`
- 14px Roboto typography
- hover/focus feedback

Feature CSS may set only width/responsive width.

### Shared DACMS button classes

Use:

- Add: `btn ictu-badge-btn--success-reverse` + `mat-flat-button`
- Bulk delete: `btn ictu-button-danger-gradient` + `mat-flat-button`
- Edit: `btn ictu-button-info-light`
- Row delete: `btn ictu-button-danger-light`
- Cancel: `btn ictu-badge-btn--secondary` + `mat-flat-button`
- Save: `btn ictu-badge-btn--primary-reverse` + `mat-flat-button`

Global button style is copied from DACMS `custom-button.css` (`src/app/core-new/styles/ictu-buttons.css`). Radius is 4px; Material ripple layers inherit radius.

### Paginator

DACMS paginator values:

- size: 35px
- radius: 99px
- gap: 0px
- text: `#334155`
- muted: `#64748b`
- active background: `#0d6efd`
- active text: white

The implementation is in `src/app/core-new/components/ictu-paginator/ictu-paginator.component.css`.

### Feature table CSS

Keep only entity-specific styles in component CSS:

```css
.entity-table-scroll {
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.entity-table {
  min-width: 860px;
  table-layout: fixed;
}
```

Use full-height shell:

```css
:host {
  display: block;
  height: 100%;
  background: #fff;
}

.admin-section--table {
  display: flex;
  flex-direction: column;
  height: calc(var(--device-height, 100vh) - var(--topbar-height, 60px));
  min-height: 0;
  padding: 0;
  background: #fff;
}

.admin-wrap-table {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  flex-wrap: nowrap;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.admin-wrap-table__body {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}
```

This prevents the whole page from scrolling; only the table wrapper scrolls.

---

## 11. Notification service API

Import only:

```ts
import { NotificationService } from '@core-new/service/notification.service';
```

Available methods used by CRUD pages:

```ts
notificationService.toastSuccess(body, heading);
notificationService.toastWarning(body, heading);
notificationService.toastError(body, heading);
notificationService.toastInfo(body, heading);
notificationService.confirm(data);          // Observable<ButtonBase | undefined>
notificationService.confirmDelete2(config); // Observable<boolean>
notificationService.startDeleting(progress$); // Observable<boolean>
```

Do not modify `src/app/core/services/notification.service.ts` for core-new components.

---

## 12. Checklist for new components

- [ ] Standalone Angular component.
- [ ] Uses `IctuDataTable2`.
- [ ] Uses `IctuPaginatorComponent`.
- [ ] Uses `IctuFormControl2` for drawer state.
- [ ] Uses `DataTableEventName` + `private handelEvent: Record`.
- [ ] `observeEvents` unsubscribes with `takeUntil(destroy$)`.
- [ ] Permissions guard add/update/delete.
- [ ] Search uses `.admin-wrap-table__head-actions__search` only.
- [ ] Buttons use DACMS `ictu-*` classes, not custom colors.
- [ ] Add/edit/save/delete preserve existing behavior.
- [ ] Save closes drawer and uses page-level `isSaving()` loading overlay.
- [ ] Delete uses `IctuDeletingAnimationControl` + `startDeleting`.
- [ ] Single/multi-delete computes previous page correctly.
- [ ] Form fields have labels, validation, and inline errors.
- [ ] Table wrapper handles vertical/horizontal scrolling.
- [ ] Paginator matches DACMS 35px circular design.
- [ ] `npm run build` passes.
