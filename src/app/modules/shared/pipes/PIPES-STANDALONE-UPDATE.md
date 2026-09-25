# Shared Pipes — Standalone Update

## 1. Mục đích

Chuyển toàn bộ pipe trong `src/app/modules/shared/pipes/` sang **standalone** (`standalone: true`), tuân thủ chuẩn Angular 21.

## 2. Danh sách Pipe Đã Cập Nhật

Đã chuyển các file từ `standalone: false` sang `standalone: true`:

| Tên File | Pipe Name | Class Name |
|---|---|---|
| `filter-child.pipe.ts` | `filterChild` | `FilterChildPipe` |
| `focus-input.pipe.ts` | `focusInput` | `FocusInputPipe` |
| `get-ans-drag-drop.pipe.ts` | `getAnsDragDrop` | `GetAnsDragDropPipe` |
| `identity.pipe.ts` | `identity` | `IdentityPipe` |
| `innerhtml-raw-pipe.ts` | `innerHtmlRaw` | `InnerHtmlRawPipe` |
| `ovic-date-time.pipe.ts` | `ovicDateTime` | `OvicDateTimePipe` |
| `ovic-date-to-utc.pipe.ts` | `ovicDateToUtc` | `OvicDateToUtcPipe` |
| `ovic-date.pipe.ts` | `ovicDate` | `OvicDatePipe` |
| `ovic-file-extension.pipe.ts` | `ovicFileExtension` | `OvicFileExtensionPipe` |
| `ovic-file-name.pipe.ts` | `ovicFileName` | `OvicFileNamePipe` |
| `ovic-file-share-state.pipe.ts` | `ovicFileShareState` | `OvicFileShareStatePipe` |
| `ovic-file-size.pipe.ts` | `ovicFileSize` | `OvicFileSizePipe` |
| `ovic-safe-html.pipe.ts` | `ovicSafeHtml` | `OvicSafeHtmlPipe` |
| `ovic-safe-resource-url.pipe.ts` | `ovicSafeResourceUrl` | `OvicSafeResourceUrlPipe` |
| `ovic-safe-url.pipe.ts` | `ovicSafeUrl` | `OvicSafeUrlPipe` |
| `ovic-time.pipe.ts` | `ovicTime` | `OvicTimePipe` |
| `ovic-timer-mm-ss.pipe.ts` | `ovicTimerMmSs` | `OvicTimerMmSsPipe` |
| `paginator-local.pipe.ts` | `paginatorLocal` | `PaginatorLocalPipe` |
| `safe-html-decode.ts` | `safeHtmlDecode` | `SafeHtmlDecodePipe` |
| `safe-html.pipe.ts` | `safeHtml` | `SafeHtmlPipe` |
| `show-label-data.pipe.ts` | `showLabelData` | `ShowLabelDataPipe` |
| `string-to-array-pipe.ts` | `stringToArray` | `StringToArrayPipe` |

### Danh sách các Pipe đã Standalone từ trước:
- `checkInputHtml.pipe.ts`
- `duplicate-array.pipe.ts`
- `extract-correct-answer.pipe.ts`
- `file-type.pipe.ts`
- `ictu-media-link.pipe.ts`
- `ovic-file-icon.pipe.ts`
- `pipe-check-img.ts`
- `question-prefix.pipe.ts`
- `safe-html-single.pipe.ts`

## 3. Cách Dùng

Component standalone muốn sử dụng chỉ cần import trực tiếp vào mảng `imports`:

```typescript
@Component({
  standalone: true,
  imports: [
    OvicDatePipe,
    SafeHtmlPipe,
    OvicFileSizePipe
  ],
  // ...
})
export class MyComponent {}
```
