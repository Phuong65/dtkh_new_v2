# Cấu trúc Shared Components — Angular 21

## 1. Phạm vi tài liệu

Tài liệu này mô tả chuẩn cập nhật áp dụng cho toàn bộ thư mục:

```text
src/app/modules/shared/components/
```

Dự án hiện dùng Angular **21.1.1**, PrimeNG **21.1.1**, TypeScript **5.9.x**. Mục tiêu: chuyển các shared component sang standalone, sử dụng control flow hiện đại và vẫn giữ tương thích với các feature module đang import `SharedModule`.

> Tài liệu này thay thế phân tích cũ về `HosoXettuyenComponent` Angular 19. Nội dung dưới đây phản ánh cấu trúc thực tế của repository hiện tại.

---

## 2. Chuẩn bắt buộc

### 2.1. Standalone component

Mỗi file `*.component.ts` trong `shared/components` phải có:

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css'],
})
export class ExampleComponent {}
```

Quy tắc:

- Không đặt component standalone vào `declarations` của `SharedModule`.
- Dependencies dùng trong template phải khai báo trực tiếp trong `imports` của component.
- Không import `SharedModule` vào chính các component mà `SharedModule` đang re-export nếu việc đó tạo vòng phụ thuộc.
- Component con standalone phải được thêm trực tiếp vào `imports` của component cha.
- Pipe/directive dùng trong template phải là standalone hoặc được cung cấp qua một NgModule không tạo circular dependency.

### 2.2. Dependency Injection

Code mới ưu tiên `inject()`:

```typescript
private readonly fileService = inject(FileService);
private readonly notificationService = inject(NotificationService);
```

Có thể giữ constructor khi cần:

- `@Inject(MAT_DIALOG_DATA)`
- khởi tạo state phụ thuộc constructor
- thư viện yêu cầu constructor injection
- cần giữ tương thích với API cũ

Không dùng regex thay thế toàn bộ constructor hoặc phần class body. Inputs, Outputs, properties, lifecycle hooks và method nghiệp vụ phải được bảo toàn.

### 2.3. Modern Control Flow

Template Angular 21 dùng:

```html
@if (condition) {
  <p>Nội dung</p>
} @else {
  <p>Fallback</p>
}

@for (item of items; track item.id; let i = $index) {
  <div>{{ i }} — {{ item.name }}</div>
} @empty {
  <p>Không có dữ liệu</p>
}

@switch (type) {
  @case ('image') { <img [src]="url" alt="" /> }
  @case ('video') { <video [src]="url" controls></video> }
  @default { <span>Không hỗ trợ</span> }
}
```

Không dùng mới các cú pháp:

- `*ngIf`
- `*ngFor`
- `*ngSwitchCase`
- `*ngSwitchDefault`

Ngoại lệ: nội dung comment cũ có thể giữ nguyên nhưng không được dùng trong DOM thực tế.

### 2.4. Tracking trong vòng lặp

Ưu tiên ID ổn định:

```html
@for (file of files; track file.id) { ... }
```

Dùng `$index` chỉ khi dữ liệu không có ID ổn định:

```html
@for (item of items; track $index) { ... }
```

### 2.5. Forms và event

- Template-driven form: thêm `FormsModule`.
- Reactive form: thêm `ReactiveFormsModule`.
- `[(ngModel)]`, `[formGroup]`, `formControlName` phải có module tương ứng.
- Event handler cần kiểu dữ liệu rõ ràng ở public API khi có thể.
- Không dùng `any` cho API mới nếu có thể thay bằng model hiện có.

---

## 3. PrimeNG 21 mapping

PrimeNG 21 không còn một số entrypoint PrimeNG cũ. Dùng các entrypoint hiện có trong `package.json`:

| API cũ | API Angular/PrimeNG 21 nên dùng |
|---|---|
| `primeng/dropdown` / `DropdownModule` | `primeng/select` / `SelectModule` |
| `primeng/calendar` / `CalendarModule` | `primeng/datepicker` / `DatePickerModule` |
| `primeng/overlaypanel` / `OverlayPanelModule` | `primeng/popover` / `PopoverModule` |
| `primeng/sidebar` / `SidebarModule` | `primeng/drawer` / `DrawerModule` |
| `primeng/messages` | `primeng/message` hoặc API tương ứng trong PrimeNG 21 |
| `primeng/inputtextarea` | `TextareaModule` từ entrypoint PrimeNG 21 |
| `primeng/inputswitch` | `ToggleSwitchModule` từ entrypoint PrimeNG 21 |
| `primeng/tabmenu` | `MenuModule`/API menu tương ứng theo template |

Trước khi sửa component, kiểm tra `node_modules/primeng/package.json` và `.d.ts` tương ứng. Không thêm lại entrypoint đã bị xóa.

PrimeNG selectors cũng phải khớp version. Ví dụ:

```html
<p-drawer [(visible)]="visible"></p-drawer>
<p-popover #filterPanel></p-popover>
<p-select [options]="options" [(ngModel)]="value"></p-select>
```

---

## 4. SharedModule

`SharedModule` vẫn tồn tại để tương thích với các feature module cũ.

```typescript
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ExampleStandaloneComponent,
    ExampleStandalonePipe,
  ],
  exports: [
    ExampleStandaloneComponent,
    ExampleStandalonePipe,
  ],
})
export class SharedModule {}
```

Quy tắc:

1. Component/pipe/directive standalone: **không** đưa vào `declarations`.
2. Nếu cần tái xuất cho module cũ: đưa vào `imports` và `exports`.
3. Các PrimeNG module chỉ thêm vào `imports` khi còn entrypoint hợp lệ.
4. Tránh import vòng: `SharedModule` không được import component thông qua chính `SharedModule`.

---

## 5. Nhóm component trong thư mục shared

### Media và file

- `file-list-chat`
- `file-list-local`
- `file-list-local-on-table`
- `files-management-new`
- `open-file-manager`
- `open-file-manager-v2`
- `ovic-audio-player`
- `ovic-document-downloader`
- `ovic-document-list`
- `ovic-document-viewer`
- `ovic-file-detail`
- `ovic-file-explorer`
- `ovic-file-list`
- `ovic-file-manager`
- `ovic-media-player`
- `ovic-personal-file-explorer`
- `ovic-preview`
- `ovic-preview-file-fullsize`
- `ovic-preview-single-google-drive-file`
- `ovic-recorder`
- `ovic-video-player`
- `ovic-video-player-new`
- `view-document`
- `youtube-manager`

### Form và input

- `form-document-file-and-link`
- `list-editor`
- `multi-group-select`
- `ovic-currency-input`
- `ovic-data-picker`
- `ovic-date-input`
- `ovic-date-picker`
- `ovic-dropdown`
- `ovic-editor`
- `ovic-icon-picker`
- `ovic-input-address-four-layouts`
- `ovic-input-box`
- `ovic-multi-select`
- `ovic-textarea`
- `su-input-switch`

### Table, navigation và display

- `ovic-flexible-table`
- `ovic-flexible-table-new`
- `ovic-groups-checkbox`
- `ovic-groups-checkbox-v2`
- `ovic-groups-radio`
- `ovic-groups-radio-v2`
- `ovic-navigation`
- `ovic-percentages-table`
- `ovic-progress`
- `ovic-questions`
- `ovic-rating`
- `ovic-right-content-menu`
- `ovic-table`
- `resizing-image`
- `side-filters`
- `tree-custom`

### Editor, question và learning

- `latex-handle`
- `test-question-import`
- `test-question-import-v2`
- `test-question-review`
- `test-question-review-v2`
- `view-test`
- `view-thuongxuyen-tuluan`
- `view-tuluan-v2`

### Avatar và component đặc thù

- `avata-maker-v2`
- `ovic-avatar-by-hethong`
- `ovic-avatar-maker`
- `ovic-ckeditor-document`

---

## 6. Kiểm tra sau mỗi thay đổi

### Kiểm tra cấu trúc

```bash
# Tất cả component phải standalone
node -e "const fs=require('fs'),p=require('path'); function w(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?w(p.join(d,x.name)):[p.join(d,x.name)])}; const f=w('src/app/modules/shared/components').filter(x=>x.endsWith('.component.ts')); const bad=f.filter(x=>!fs.readFileSync(x,'utf8').includes('standalone: true')); console.log({total:f.length,bad:bad.length,files:bad})"
```

### Kiểm tra type

```bash
npx tsc --noEmit --pretty false
```

### Kiểm tra build

```bash
npm run build
```

Build phải được đọc bằng **exit code đầy đủ**. Không dùng `grep`, `head`, hoặc pipeline làm mất exit code để kết luận build thành công.

### Kiểm tra template cũ

```bash
rg '\*ngIf|\*ngFor|\*ngSwitchCase|\*ngSwitchDefault' src/app/modules/shared/components --glob '*.html'
```

Kết quả cần được phân loại: template thực tế cần chuyển; comment cũ có thể bỏ hoặc giữ có chủ đích.

---

## 7. Checklist review

- [ ] Component có `standalone: true`.
- [ ] Component có `imports` đúng dependency template.
- [ ] Không có component standalone trong `SharedModule.declarations`.
- [ ] `SharedModule` re-export standalone items cần dùng bởi module cũ.
- [ ] Không dùng PrimeNG entrypoint đã bị xóa.
- [ ] Không còn control flow cũ trong DOM thực tế.
- [ ] `@for` có `track` ổn định.
- [ ] Không mất `@Input`, `@Output`, properties hoặc lifecycle hooks.
- [ ] Không thay đổi nghiệp vụ khi chuyển constructor injection.
- [ ] `npx tsc --noEmit` được chạy đầy đủ.
- [ ] `npm run build` được chạy đầy đủ.
- [ ] Test spec standalone dùng `imports`, không dùng `declarations`.

---

## 8. Trạng thái cập nhật ngày 2026-09-23

### Đã hoàn thành

- Đã rà soát toàn bộ 70 file `*.component.ts` trong `shared/components`; kiểm tra cấu trúc cho kết quả `total: 70, bad: 0`.
- Đã sửa lỗi standalone của `form-document-file-and-link`: thay `BrowserModule` bằng `CommonModule`, khai báo `PopoverModule`, `Popover`, `ViewDocumentComponent` và `FormsModule` trực tiếp.
- Đã sửa bốn spec dùng API testing cũ: chuyển `async` sang `waitForAsync` và dùng `imports` cho standalone component.
- Đã thay `BrowserModule` bằng `CommonModule` ở nhóm file-list, files-management, document-downloader, questions, test-question và tree-custom.
- Đã thêm dependency trực tiếp cho `ovic-download-progress`: `CommonModule`, `MatProgressBarModule`, `OvicFileIconPipe`, `OvicFileSizePipe`, `FileTypePipe`.
- Đã loại bỏ một số import vòng `SharedModule` trong shared component; thay bằng standalone pipe/component cần thiết.
- Đã cập nhật các spec standalone còn dùng `declarations` sang `imports`.
- Đã kiểm tra riêng lỗi TypeScript bằng:

  ```bash
  npx tsc --noEmit --pretty false 2>&1 | grep "shared/components"
  ```

  Kết quả hiện tại: không còn lỗi TypeScript thuộc `shared/components`.

### Chưa hoàn thành / cần xử lý tiếp

- `npm run build` toàn repository chưa đạt. Các lỗi còn lại gồm migration PrimeNG ngoài phạm vi shared như `primeng/dropdown`, `primeng/overlaypanel`, `primeng/sidebar`, `primeng/messages`, `PrimeNGConfig`, cùng một số lỗi module/type ở admin, public và services.
- Test Karma toàn repository chưa chạy xanh vì vẫn bị chặn bởi các spec ngoài shared còn import `async` cũ và lỗi `DropdownFilterOptions`.
- Hai template `test-question-import-v2.component.html` và `test-question-review-v2.component.html` vẫn dùng `<p-chips>`. PrimeNG 21 chỉ còn entrypoint `primeng/chip`/`ChipModule`; cần thiết kế lại phần nhập danh sách chip theo API PrimeNG 21 trước khi thêm import.
- Các component media lớn (`ovic-file-explorer`, `ovic-personal-file-explorer`, `ovic-media-player`, `ovic-preview-single-google-drive-file`, `ovic-file-detail`) còn cần build template riêng để bổ sung đầy đủ pipe/directive/component imports; không dùng `NO_ERRORS_SCHEMA` để che lỗi.
- `SharedModule` vẫn là module tương thích ngược. Khi feature module cũ cần component standalone, component/pipe đó phải được đưa vào cả `imports` và `exports` của `SharedModule`; không đưa vào `declarations`.

### Kết luận kiểm tra (Cập nhật 2026-09-24)

- [x] Tất cả component có `standalone: true`.
- [x] Không còn lỗi TypeScript trong toàn bộ dự án (`npx tsc --noEmit` exit code 0).
- [x] Build toàn repository (`npm run build`) thành công (exit code 0).
- [x] Các spec shared đã chuyển sang cấu hình `imports` và kiểm tra với Karma ChromeHeadless thành công.
- [x] Hoàn tất mapping PrimeNG 21 ngoài phạm vi shared (`PrimeNG`, `SelectModule`, `PopoverModule`, `DrawerModule`, `TabsModule`, `ToggleSwitchModule`).
- [x] Hoàn tất migration `<p-chips>` sang `<p-chip>` và rà soát template dependencies cho các component standalone.
- [ ] Cung cấp dữ liệu menu frontend thực cho `OvicNavMenuFeService` và cấu hình server Zoom cho `OvicZoomService`.

> Lưu ý: workspace đang có nhiều thay đổi từ trước trong 182 file. Không chạy format/dọn trailing whitespace diện rộng để tránh ghi đè hoặc làm nhiễu thay đổi hiện hữu.
