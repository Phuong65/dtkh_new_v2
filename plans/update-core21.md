# Kế hoạch & Trạng thái Migration Core / Other Components — Angular 21 & PrimeNG 21

## 1. Mục tiêu và phạm vi

Tài liệu này theo dõi quá trình nâng cấp các component, module, và application shell **ngoài phạm vi `src/app/modules/shared/components/`** lên **Angular 21.1.1** và **PrimeNG 21.1.1**.

Quy tắc bắt buộc:
- Tạo và duy trì tài liệu này trước và trong suốt quá trình cập nhật.
- Bảo tồn toàn bộ thay đổi uncommitted hiện có của người dùng (182 files đang sửa dở), không chạy format hàng loạt gây nhiễu diff.
- Cập nhật cả file TypeScript và HTML template tương ứng theo API PrimeNG 21, không chỉ sửa import bề mặt.
- Không sử dụng các entrypoint PrimeNG đã bị loại bỏ.
- Mỗi bước cập nhật đều được kiểm tra typecheck và build để ghi nhận kết quả trung thực.

---

## 2. Bảng mapping PrimeNG 21 cho các component ngoài shared

| Module / Component cũ | Trạng thái trong PrimeNG 21 | Thay thế trong Angular 21 / PrimeNG 21 | Ghi chú template |
|---|---|---|---|
| `PrimeNGConfig` từ `primeng/api` | Bị xóa | `PrimeNG` từ `primeng/config` hoặc `providePrimeNG()` | Trong TS: `this.primeng.ripple.set(true)` (signal API) |
| `primeng/dropdown` / `DropdownModule` | Bị xóa | `primeng/select` / `SelectModule` | Template: `<p-select>`, thay `DropdownFilterOptions` bằng `SelectFilterOptions` |
| `primeng/overlaypanel` / `OverlayPanelModule` | Bị xóa | `primeng/popover` / `PopoverModule` | Template: `<p-popover #panel>`, `panel.toggle($event)`, `panel.hide()` |
| `primeng/sidebar` / `SidebarModule` | Bị xóa | `primeng/drawer` / `DrawerModule` | Template: `<p-drawer [(visible)]="...">` |
| `primeng/messages` / `MessagesModule` | Bị xóa | `primeng/message` / `MessageModule` | Template: kiểm tra lại cú pháp inline message |
| `primeng/inputtextarea` / `InputTextareaModule` | Bị xóa | `primeng/textarea` / `TextareaModule` | Template: directive / component textarea mới |
| `primeng/inputswitch` / `InputSwitchModule` | Bị xóa | `primeng/toggleswitch` / `ToggleSwitchModule` | Template: `<p-toggleswitch>` |
| `primeng/tabmenu` / `TabMenuModule` | Bị xóa | `primeng/tabs` hoặc `primeng/menu` | Thay thế theo cấu trúc menu/tabs của PrimeNG 21 |
| `primeng/tabview` / `TabViewModule` | Bị xóa | `primeng/tabs` / `TabsModule` | Thay thế bằng component Tabs mới |
| `node_modules/primeng/resources/themes/...` | Bị xóa trong CSS build | `@primeuix/themes` hoặc `providePrimeNG({ theme: ... })` | Xóa style import CSS cũ trong `angular.json` |

---

## 3. Danh sách các file cần xử lý theo thứ tự ưu tiên

### Giai đoạn 1: Application Shell & Root
- [x] `src/app/app.component.ts`: Sửa `PrimeNGConfig` -> `PrimeNG` từ `primeng/config`. Sửa `this.primengConfig.ripple = true` -> `this.primeng.ripple.set(true)`.
- [x] `src/app/app.module.ts`: Đã kiểm tra tương thích PrimeNG 21.
- [x] `angular.json`: Dọn dẹp đường dẫn theme/css PrimeNG cũ không còn tồn tại trong `node_modules`.

### Giai đoạn 2: Admin Dashboard & Layout Shell
- [x] `src/app/modules/admin/dashboard/user-info/user-info.component.ts` & `.html`: `OverlayPanel` -> `Popover`, `<p-overlayPanel>` -> `<p-popover>`.
- [x] `src/app/modules/admin/dashboard/user-info-v2/user-info-v2.component.ts` & `.html`: `OverlayPanel` -> `Popover`, `<p-overlayPanel>` -> `<p-popover>`, thêm `OvicSafeUrlPipe`.
- [x] `src/app/modules/admin/dashboard/menu-language/menu-language.component.ts` & `.html`: `OverlayPanel` -> `Popover`, `<p-overlayPanel>` -> `<p-popover>`.
- [x] `src/app/modules/admin/dashboard/dashboard.component.ts`: Xóa import `OverlayPanel` không dùng.
- [x] `src/app/modules/admin/dashboard/dashboard-v2/dashboard-v2.component.ts` & `.html`: Xóa import `OverlayPanel` không dùng, chuyển `<p-tabMenu>` sang thanh điều hướng semantic nav menu giữ nguyên routerLink và styling.
- [x] `src/app/modules/admin/admin.module.ts`: Thay thế `OverlayPanelModule` bằng `PopoverModule`, `DropdownModule` bằng `SelectModule`, bỏ `MessagesModule`.

### Giai đoạn 3: Public Modules & Features
- [x] `src/app/modules/public/features/index/index.component.ts` & `.html`: Chuyển sang standalone component đầy đủ imports, thay `DropdownFilterOptions` bằng `SelectFilterOptions`, `<p-dropdown>` bằng `<p-select>`, khớp kiểu `PaginatorState`.
- [x] `src/app/modules/public/public.module.ts`: Thay `DropdownModule` bằng `SelectModule`, gỡ bỏ `TraCuuComponent` bị xóa, chuyển `IndexComponent` và `LoginTemplateV4Component` sang `imports`.
- [x] `src/app/modules/public/public-routing.module.ts`: Gỡ bỏ `TraCuuComponent` bị xóa.
- [x] `src/app/modules/public/features/basic/basic.module.ts`: Thay `SidebarModule` bằng `DrawerModule`.
- [x] `src/app/modules/public/features/basic/features/show-case/show-case.component.html`: Thay `<p-sidebar>` bằng `<p-drawer>`.
- [x] `src/app/modules/public/features/login-template-v4/login-template-v4.component.ts`: Bổ sung direct imports `CommonModule`, `FormsModule`, `ReactiveFormsModule`.

### Giai đoạn 4: Admin Features (Câu hỏi & Khóa học)
- [x] `src/app/modules/admin/features/cauhoi-tracnghiem/question-types/question-types.module.ts`: Thay `InputTextareaModule` bằng `TextareaModule`, `DropdownModule` bằng `SelectModule`.
- [x] `src/app/modules/admin/features/danh-muc-khoa-hoc/danh-muc-khoa-hoc.module.ts`: Thay `DropdownModule` bằng `SelectModule`, `TabViewModule` bằng `TabsModule`, `InputSwitchModule` bằng `ToggleSwitchModule`.
- [x] 3 spec files trong `danh-muc-khoa-hoc` (`khoa-hoc`, `bai-hoc`, `bank-audio-viewer`): thay `async` bằng `waitForAsync`.

---

## 4. Nhật ký thực hiện & Kết quả kiểm tra

### Trạng thái mới nhất (2026-09-23)

1. **Build toàn bộ ứng dụng (`npm run build`): THÀNH CÔNG (Exit code: 0).**
   - Lệnh kiểm chứng: `npm run build` (tương đương `node --max_old_space_size=3072 ./node_modules/@angular/cli/bin/ng build --aot`).
   - Thư mục output sinh ra đầy đủ tại: `dist/lcms_v2`.
   - Không còn lỗi Angular template trên graph bundle production hiện tại (build exit code 0). Các component/orphan route không nằm trong graph bundle không được xem là đã xác minh chỉ dựa trên kết quả này.
   - Đã chuyển đổi thành công `<p-tabMenu>` của `DashboardV2Component` sang thanh điều hướng semantic nav menu giữ nguyên styling và routerLink.
   - Đã gỡ bỏ 2 đường dẫn style PrimeNG không còn tồn tại khỏi `angular.json`.
   - `OvicFileExplorerComponent`, `OvicPersonalFileExplorerComponent`, `OvicFileDetailComponent`, `OvicMediaPlayerComponent`, `OvicPreviewComponent`, `OvicPreviewSingleGoogleDriveFileComponent`: đã được cấp đầy đủ direct imports cho toàn bộ pipes, directives, components và forms.

2. **Lỗi TypeScript component/module toàn bộ repository: 0 lỗi.**
   - Đã giải quyết toàn bộ 47 lỗi compile liên quan đến component và module.
   - `sao-chep-hoidong.types.ts`: đã chuyển sang `export type { ... }` theo chuẩn `isolatedModules`.
   - 8 skeleton component trong `kiem-thu-ngan-hang-cau-hoi/test/test-question-types`: đã dọn sạch các import interface sai từ `@angular/core`.
   - `PublicModule` & `PublicRoutingModule`: đã dỡ bỏ `TraCuuComponent` bị xóa (theo chỉ thị của người dùng).
   - `IndexComponent`: đã hoàn tất chuyển sang standalone component với đầy đủ direct imports và template dùng `<p-select>`, đồng thời khớp type `PaginatorState`.
   - `LoginTemplateV4Component`: đã bổ sung direct imports (`CommonModule`, `FormsModule`, `ReactiveFormsModule`).
   - `test-question-review-v2.component.html`: đã thay `<p-chips [disabled]="true">` bằng vòng lặp `@for` với thẻ `<p-chip>` của PrimeNG 21.
   - `export-word-*.ts`: đã chuyển `FileChild` nội bộ sang `Array<Paragraph | Table>` và định kiểu tường minh `AlignmentType`.
   - `ovic-plyr.directive.ts`: đã ép kiểu an toàn cho `off()` và dùng default constructor import kết hợp type namespace (`import Plyr, * as PlyrTypes from 'plyr'`) để tránh cảnh báo namespace object không thể khởi tạo runtime.

3. **Kiểm tra Unit Test (Karma / ChromeHeadless): 8/8 SUCCESS (Exit code: 0).**
   - Lệnh kiểm chứng tổng hợp: `ng test --watch=false --browsers=ChromeHeadless --include=src/app/modules/shared/components/test-question-import-v2/*.spec.ts --include=src/app/modules/shared/components/test-question-review-v2/*.spec.ts --include=src/app/modules/public/features/login-template-v4/*.spec.ts`
   - `TestQuestionImportV2Component`: 5/5 test pass (create component, thêm token đầu tiên, chống duplicate, xóa token, render/tương tác UI với `<p-chip>`).
   - `TestQuestionReviewV2Component`: 2/2 test pass (create component, render đầy đủ nhiều đáp án bằng `<p-chip>`).
   - `LoginTemplateV4Component`: 1/1 test pass (create standalone component).
   - `test-question-import-v2.component.html`: đã thay `<p-chips>` bị xóa trong PrimeNG 21 bằng danh sách `<p-chip removable>` + input/button thêm đáp án.
   - `onAddChips` và `onRemoveChips` đã chuyển sang pure immutable updates; không mutate mảng đầu vào và có test xác nhận.

4. **Các lỗi TypeScript còn lại trong toàn dự án: đúng 10 lỗi** (đều là lỗi service/model cũ từ trước):
   - `models/commons.ts` & `ictu-question-direction.pipe.ts`: import thiếu `CourseTesterResultExtend`.
   - `export-diemthuongxuyen*.service.ts`: import thiếu `PercentScore`.
   - `ovic-nav-menu-fe.service.ts`: import thiếu `FEMainMenu`.
   - `ovic-zoom.service.ts`: thiếu thư viện `create-hmac`, `base64url`, thuộc tính `environment.server`.

### Trạng thái ngày 2026-09-24 — Đã giải quyết toàn bộ lỗi compile theo quyết định người dùng

5. **TypeScript toàn dự án: 0 lỗi (`npx tsc --noEmit --pretty false`, exit code 0).**
   - Khôi phục `CourseTesterResultExtend` từ lịch sử git `b75196f`; giải quyết 2 lỗi tại `commons.ts` và `ictu-question-direction.pipe.ts`.
   - Khôi phục `PercentScore` từ lịch sử git `b75196f`; giải quyết 2 lỗi tại 2 service `export-diemthuongxuyen*.service.ts`.
   - `test-question-review.component.ts`: bổ sung direct imports cho template standalone (`CommonModule`, `MatTooltipModule`, `AudioViewerComponent`, `OvicGroupsRadioV2Component`, `OvicGroupsCheckboxComponent`, `PipeCheckImg`, `OvicSafeHtmlPipe`).
   - `ovic-groups-checkbox.component.ts`: dùng `CommonModule`, `RawHtmlPipe`, loại bỏ `BrowserModule`.
   - Theo quyết định của người dùng ("Giữ lại và khai báo stub rỗng"):
     - `ovic-nav-menu-fe.service.ts`: khai báo stub local `const FEMainMenu: OvicNavFe[] = []`.
     - `ovic-zoom.service.ts`: khai báo stub local `DEFAULT_ZOOM = { api: '', apiSecret: '', host_id: '', user_id: '' }`, loại bỏ dead imports (`create-hmac`, `base64url`), và thiết lập bảo vệ fail-closed (`getZoomToken`, `getUserByZoom`, `createMeeting` throw error khi chưa có cấu hình backend, không ký JWT client-side, không gửi request rò rỉ token).

6. **Build production (`npm run build`): THÀNH CÔNG (Exit code: 0).**
   - Output sinh ra đầy đủ tại `dist/lcms_v2`.

7. **Kiểm tra Unit Test toàn bộ dự án (Karma / ChromeHeadless): 94/94 SUCCESS (Exit code: 0).**
   - Lệnh kiểm chứng: `npx ng test --watch=false --browsers=ChromeHeadless`
   - Đã xử lý toàn bộ 45 spec failures trước đó:
     - 41 standalone component specs: chuyển `declarations: [ Component ]` sang `imports: [ Component ]`.
     - 9 non-standalone component specs: giữ nguyên `declarations: [ Component ]` theo đúng metadata `@Component({ standalone: false })`.
     - 7 public login template components: thêm guard kiểm tra `typeof google !== 'undefined' && google?.accounts?.id` trước khi khởi tạo Google Identity Services runtime, ngăn chặn `ReferenceError: google is not defined`.
     - `LoginMainTemplateComponent`: bổ sung test doubles cho 6 component login con và thêm 9 unit test kiểm tra cơ chế chọn template theo `key_server` và cờ `acceptDivi`.
     - `FileListChatComponent` & `ViewDocumentComponent`: bổ sung mocks cho `FileService`, `HelperService`, `AuthService`, `NgbModal`, và cung cấp mock file data hợp lệ để template render không bị `TypeError: Cannot read properties of undefined (reading 'type')`.
     - `OpenFileManagerComponent`, `OpenFileManagerV2Component`, `FilesManagementNewComponent`, `YoutubeManagerComponent`, `TestQuestionImportComponent`: bổ sung đầy đủ providers/mocks (`TranslateService` via mocks, `MediaService`, `MediaFolderService`, `ConfirmationService`, `PlaylistYoutubeService`).
     - `OvicNavMenuFeService`: 1 test pass (xác nhận menu rỗng khi chưa cấu hình).
     - `OvicZoomService`: 3 test pass (xác nhận fail-closed JWT signing, fail-closed external calls, và hoạt động bình thường của internal `class-zoom/` CRUD).

### Cập nhật PrimeNG 21 theme — 2026-09-25

8. **Khôi phục Design Tokens cho PrimeNG 21.**
   - Triệu chứng: `<p-menu styleClass="submenu-v2">` nhận class `submenu-v2` nhưng mất kiểu dáng PrimeNG nền tảng sau migration.
   - Nguyên nhân đã xác minh: PrimeNG 21 không còn các stylesheet `primeng/resources/themes/lara-light-blue/theme.css` và `primeng/resources/primeng.min.css`; dự án chưa có preset từ `@primeuix/themes`, nên token `dt('menu.*')` không được resolve.
   - Đã cài `@primeuix/themes@2.0.3`, tương thích với `@primeuix/styles@2.0.3` của `primeng@21.1.1`.
   - Lệnh cài dùng: `npm install @primeuix/themes@2.0.3 --save --legacy-peer-deps`.
     - Cờ `--legacy-peer-deps` chỉ xử lý peer conflict đã tồn tại từ `angular-resize-element@1.2.0` yêu cầu Angular 10; không dùng `--force` và không thay đổi phiên bản Angular hiện tại.
   - `src/app/app.module.ts`: thêm `providePrimeNG({ theme: { preset: Lara, options: { darkModeSelector: false } }, ripple: true })` với preset `Lara` để thay thế theme `lara-light-blue` cũ.
   - `src/assets/css/style.css`: điều chỉnh `submenu-v2` theo DOM PrimeNG 21 (`.p-menu-submenu-label`, `.p-menu-item-content`, `.p-menu-item-link`, `.p-menu-item.p-focus`) và giữ màu/khoảng cách của CSS cũ.
   - Kiểm tra sau cấu hình: `npx tsc --noEmit --pretty false` exit code 0.
   - `npm run build`: SUCCESS, exit code 0; output `dist/lcms_v2`.
   - `npx ng test --watch=false --browsers=ChromeHeadless`: **94/94 SUCCESS**, exit code 0.
   - Npm install ban đầu gặp peer conflict cũ từ `angular-resize-element@1.2.0` (peer Angular 10); cài lại bằng `--legacy-peer-deps`, không dùng `--force`.

### Cập nhật header Dashboard V2 — 2026-09-25

9. **Chuyển riêng vùng header sang Angular built-in control flow.**
   - Angular 21 vẫn hỗ trợ `NgIf`/`NgSwitch`, nhưng các directive này đã deprecated từ Angular 20; đây là chuẩn hóa cú pháp, không phải sửa lỗi biên dịch.
   - Chuyển `ngSwitch`/`ngSwitchCase`/`ngSwitchDefault` sang `@switch`/`@case`/`@default`.
   - Chuyển các điều kiện trong header sang `@if`/`@else`; giữ `@for (item of menuTopV2; track item.label)`.
   - Rút gọn `[routerLinkActive]="'p-highlight'"` thành `routerLinkActive="p-highlight"`.
   - Xóa các đoạn HTML đã comment trong header. Giữ nguyên class CSS, style, routerLink, queryParams và callback.
   - Không đổi sidebar, `p-menu`, TypeScript hoặc phần còn lại của template.
   - Build trước thay đổi: SUCCESS, exit code 0.
   - Build và kiểm thử sau thay đổi: `npm run build && npx ng test --watch=false --browsers=ChromeHeadless` -> **BUILD THÀNH CÔNG**, **94/94 UNIT TEST PASS** (Exit code: 0).

### Ghi chú cấu hình thực tế cho tương lai

- `OvicNavMenuFeService`: khi triển khai menu frontend thật, cần cung cấp dữ liệu menu thay thế cho stub rỗng.
- `OvicZoomService`: khi kích hoạt Zoom, cần tích hợp với backend API có xác thực thay vì khôi phục ký JWT phía client.

