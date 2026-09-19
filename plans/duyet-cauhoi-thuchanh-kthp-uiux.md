# Plan: UI/UX Cải tiến — duyet-cauhoi-thuchanh-kthp (Đồng bộ với duyet-cauhoi-tn)

## Phạm vi
- **Folder:** `src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-thuchanh-kthp/`
- **Files:** `.component.html`, `.component.css`, `.component.ts`
- **Tham chiếu:** `plans/duyet-thuongxuyen-tuluan-uiux.md`, `plans/duyet-cauhoi-tn-uiux.md`

---

## Kiến trúc layout (mới)

```
.duyet-thuchanh-container (flex column, height: 100%, overflow: hidden)
├── .duyet-thuchanh-header-label          — plain text title "Thực hành KTHP"
├── .duyet-thuchanh-toolbar               — filter chips + action buttons
│   ├── .filter-chips                     — Tất cả | Đã duyệt | Chưa duyệt + (Chưa nhận xét)
│   └── .toolbar-actions                  — Duyệt tất cả | Khóa | Mở khóa | Làm mới
├── .skeleton-wrapper                     — loading state (5 skeleton rows)
├── .empty-state                          — khi không có data
└── .duyet-thuchanh-table-wrapper         — flex:1, overflow: auto (scroll ngang + dọc)
    └── p-table
        ├── thead                         — col-code(150px) | col-status(130px) | col-comment(130px) × N
        └── tbody
            └── .question-row             — striped, hover highlight, cursor pointer (KHÔNG có group row)
```

---

## Hiện trạng (trước khi sửa)

| Vấn đề | Mô tả |
|--------|-------|
| Filter overlay | Dùng `p-overlayPanel` → ẩn filter, không trực quan |
| Không có loading state | `list_plan_kynang = null` nhưng không skeleton |
| Không có empty state | Khi không có data không có UI feedback |
| Status dạng text thuần | `.status-is-active/deactive/redo` chỉ đổi màu chữ |
| Comment hiển thị text thuần | `.danhanxet/.chuanhanxet` chỉ đổi màu chữ |
| Lock buttons style cũ | Dùng PrimeNG button background cứng 30×30px |
| Không có CSS variables | Hardcoded colors |
| Dialog progress cũ | Dùng `mat-progress-bar` trực tiếp, layout đơn giản |
| Nút "Duyệt tất cả" style cũ | `btn btn-primary` class cũ |

---

## Đặc trưng riêng (so với duyet-thuongxuyen-duan & duyet-thuongxuyen-tuluan)

| Đặc điểm | Giá trị |
|-----------|---------|
| Data source | `list_de_tuluan` trực tiếp (KHÔNG có group row kỹ năng) |
| Query condition | `private = 1`, `course_id = selectedCourse.id`, `course_plan_activity_id = 0` |
| Group row | **KHÔNG** — flat list |
| Nút "Duyệt tất cả" | **CÓ** — giống duyet-cauhoi-tn (khi `rejectRole`) |
| Cột "Tiêu đề" | **KHÔNG** có (comment trong HTML) |
| Header label | `planTuluan.title` (hoặc custom "Thực hành KTHP") |
| Sync channel | `'duyet-cauhoi-thuchanh-kthp-detail-sync'` |
| Detail route | `duyet-cauhoi-thuchanh-kthp-detail/${tuluan.id}` |
| Dialog progress | Có `p-dialog` + `mat-progress-bar` khi duyệt tất cả |
| `approvedAll()` | Có — duyệt tất cả `list_de_tuluan` |

---

## Thay đổi cần thực hiện

### 1. CSS Variables (`:host`) — copy từ duyet-cauhoi-tn
| Token | Giá trị |
|-------|---------|
| `--primary` | #3B82F6 |
| `--success` | #10B981 |
| `--warning` | #F59E0B |
| `--danger` | #EF4444 |
| `--purple` | #8B5CF6 |
| `--gray-50..900` | Tailwind scale |
| `--radius-sm/md/lg` | 4/8/12px |
| `--shadow-sm/md/lg` | Subtle shadows |
| `--transition` | all 0.2s ease |

### 2. Container
- `.duyet-thuongxuyen-tuluan` → `.duyet-thuchanh-container`
- `display: flex; flex-direction: column; height: 100%; overflow: hidden`
- Background: `#fff`

### 3. Header
- **Style**: Plain text label (không gradient)
- **Logic**: `planTuluan.week > 0 && planTuluan.week < 100 ? ('Bài ' + planTuluan.week) : planTuluan.title` (mapping giống duyet-cauhoi-tn)
- **Padding**: `14px 20px 0`, background `#fff`

### 4. Toolbar — Filter Chips (thay thế overlay panel)
- **Bỏ** `p-overlayPanel` + nút "Lọc"
- **Thay bằng** inline filter chips dạng pill (border-radius 20px):
  - `Tất cả (N)` | `Chờ duyệt (N)` | `Đã duyệt (N)` | `Chưa đạt (N)`
  - Active chip: bg primary, text white
  - Inactive chip: bg gray-100, text gray-600
  - Mỗi chip hiển thị count badge
- **Chip "Chưa nhận xét"**: chỉ hiện khi `kd_uyvien === true`, toggle purple khi active
- **Filter divider**: 1px vertical line giữa status chips và comment chip

### 5. Toolbar — Action Buttons
- Mỗi button: `icon + text + gap 6px`
- Variants:
  - `--primary` (Duyệt tất cả) — **CÓ** — hiện khi `rejectRole && list_de_tuluan?.length`
  - `--danger` (Khóa) — hiện khi `rejectRole`
  - `--info` (Mở khóa) — hiện khi `rejectRole`
  - `--success` (Làm mới)
- `[disabled]="isLoading"` khi đang tải
- Hover: `translateY(-1px) + shadow`
- Active: `scale(0.97)`

### 6. Table (KHÔNG có group row)
| Cột | Class | Width | Align |
|-----|-------|-------|-------|
| Mã đề | `.col-code` | 150px fixed | Center |
| Kết quả duyệt | `.col-status` | 130px fixed | Center |
| Nhận xét ×N | `.col-comment` | 130px fixed | Center |

- **KHÔNG** có cột "Tiêu đề" (giữ nguyên như hiện tại)
- **`.p-datatable-wrapper`**: `overflow: visible !important`
- **`.p-datatable-table`**: `width: max-content; min-width: 100%`
- **Scroll ngang**: do `.duyet-thuchanh-table-wrapper` (`overflow-x: auto`)
- **Scroll dọc**: do `.duyet-thuchanh-table-wrapper` (`overflow-y: auto; flex: 1`)

### 7. Question Rows (flat list — KHÔNG group row)
- Striped: odd rows `gray-50`
- Hover: background `primary-light` + left border 3px primary
- **Không** translateX khi hover (tránh nhảy layout)
- Cursor: pointer
- Filter pipe giữ nguyên: `| filter : _chuanhanxet : ['_chuanhanxet'] | filter : _daduyet : ['_daduyet']`

### 8. Status Badges (`.status-badge-new`) — thay thế text thuần
- Pill shape, icon + text, `min-width: 95px`, `justify-content: center`
- Variants:
  - `--pending` (warning): "Chờ duyệt"
  - `--approved` (success): "Đạt"
  - `--rejected` (danger): "Chưa đạt"
  - `--revised` (purple): "Đã sửa"
- Dual badge (Đạt → Đang sửa): column layout

### 9. Comment Chips (`.comment-chip`) — thay thế `.danhanxet/.chuanhanxet`
- `width: 130px` cố định
- `--done`: success-light + success border → "Đã nhận xét"
- `--pending`: gray-100 + gray border → "Chưa nhận xét"

### 10. Lock Button (`.question-cell__lock`)
- 32×32px touch target, border-radius 4px
- Locked: color danger, hover bg danger-light
- Unlocked: color gray-400, hover bg primary-light + primary
- Tooltip: pTooltip (giữ nguyên)
- **Bỏ** style `.icon-lock/.icon-unlock` cũ, `.action-icon-redo` cũ

### 11. Empty State (mới)
- Icon: `pi-inbox` 64px, color gray-300
- Title: 16px, weight 600, gray-700 → "Không có đề thực hành"
- Hint: 14px, gray-400 → "Chưa có đề thực hành KTHP nào trong môn học này"
- Centered, padding 60px

### 12. Loading Skeleton (mới)
- 5 rows animation `skeleton-pulse` (shimmer effect)
- Cells: medium + medium + medium × N
- Hiển thị khi `isLoading && !list_de_tuluan`

### 13. Dialog "Đang duyệt" (nâng cấp)
- Giữ `p-dialog` + `mat-progress-bar`
- Thêm icon spinner: `pi pi-spin pi-spinner`
- Thêm progress text: `{{progressValue | number:'1.0-0'}}%`
- Style class: `dialog-duyet-thuchanh`
- Layout: icon + title + progress bar + percent text (giống duyet-cauhoi-tn)

### 14. Responsive
- `< 992px`: toolbar wrap
- `< 576px`: filter chips nowrap + scroll-x, header compact

### 15. Custom Scrollbar
- Width/height: 6px
- Track: gray-100, Thumb: gray-300, hover gray-400
- Border-radius: 3px

### 16. Animations
- `.question-row`: `fadeInRow 0.2s ease`

---

## Thay đổi TypeScript

| Property/Method | Mục đích |
|-----------------|----------|
| `isLoading: boolean = false` | Bind skeleton/disabled state |
| `activeFilter: number = 100` | Track active filter chip |
| `stats: {total, approved, pending}` | Filter chip counts |
| `computeStats()` | Tính stats từ `list_de_tuluan` sau loadData |
| `onFilterChipClick(id)` | Set activeFilter + gọi onSelectStatus |
| `toggleChuaNhanXet()` | Toggle `_chuanhanxet` = 1 / null |
| **Bỏ** `OverlayPanelModule` import | Không còn dùng overlay |
| Giữ `approvedAll()` | Vẫn hoạt động — chỉ đổi UI dialog |
| Giữ `displayModal`, `progressValue` | Cho dialog progress |

---

## Mapping filter logic

```typescript
// activeFilter mapping
activeFilter === 100 → _daduyet = null         (Tất cả)
activeFilter === 1   → _daduyet = 1            (Đã duyệt)
activeFilter === 0   → _daduyet = 0            (Chờ duyệt — status !== 1)
activeFilter === -1  → filter status === -1    (Chưa đạt)

// Stats
stats = {
  total: list_de_tuluan?.length || 0,
  approved: list_de_tuluan?.filter(q => q.status === 1).length || 0,
  pending: list_de_tuluan?.filter(q => q.status === 0).length || 0,
  rejected: list_de_tuluan?.filter(q => q.status === -1).length || 0
}
```

---

## Checklist UX

- [ ] **Clarity**: Status badges rõ ràng (icon + text + color)
- [ ] **Consistency**: Tất cả badges/chips cùng min-width, cột cùng width, CSS variables toàn bộ
- [ ] **Efficiency**: Filter inline (không overlay), count trên mỗi chip
- [ ] **Feedback**: Loading skeleton, disabled buttons, empty state, progress dialog cải tiến
- [ ] **Accessibility**: 32px touch target (lock btn), tooltip, min-height 32px chips
- [ ] **Emotion**: Rounded corners, subtle hover, smooth transitions, color harmony
- [ ] **Đồng nhất với duyet-cauhoi-tn**: Cùng design language, cùng spacing, cùng color tokens
- [ ] **Đồng nhất với duyet-thuongxuyen-tuluan**: Cùng toolbar structure, cùng filter chips pattern

---

## So sánh với duyet-thuongxuyen-duan

| Khía cạnh | duyet-thuongxuyen-duan | duyet-cauhoi-thuchanh-kthp |
|-----------|------------------------|----------------------------|
| Group row | ✅ Có (tiêu đề kỹ năng) | ❌ Không (flat list) |
| Cột "Tiêu đề" | ✅ Có (200px) | ❌ Không |
| Nút "Duyệt tất cả" | ❌ Không | ✅ Có |
| Dialog progress | ❌ Không | ✅ Có |
| Data binding table | `[value]="list_plan_kynang"` → nested | `[value]="list_de_tuluan | filter..."` → flat |
| Header text | Bài X / planTuluan.title | planTuluan.title |

---

## Quyết định đã xác nhận

1. ✅ Giữ flat list (KHÔNG thêm group row — dữ liệu không có cấu trúc nhóm)
2. ✅ Bỏ hoàn toàn `p-overlayPanel` → inline filter chips
3. ✅ **GIỮ** nút "Duyệt tất cả" — chức năng quan trọng cho KTHP, hiện khi `rejectRole`
4. ✅ KHÔNG thêm cột "Tiêu đề" (giữ nguyên, dữ liệu không cần)
5. ✅ Nâng cấp dialog progress giống duyet-cauhoi-tn
6. ✅ Thêm filter chip thứ 4 "Chưa đạt" — đồng bộ duyet-cauhoi-tn
7. ✅ Header mapping: `planTuluan.week > 0 && planTuluan.week < 100 ? ('Bài ' + planTuluan.week) : planTuluan.title`

---

## Thứ tự thực hiện

1. ✅ **CSS**: Viết lại hoàn toàn `.component.css` theo design mới
2. ✅ **HTML**: Refactor template (bỏ overlay, thêm filter chips, skeleton, empty state, badges, dialog mới)
3. ✅ **TS**: Thêm `isLoading`, `stats`, `computeStats()`, `onFilterChipClick()`, `toggleChuaNhanXet()`; bỏ `checkValue()`, `OverlayPanelModule`, `CheckboxModule`, `FormsModule`
4. **Verify**: So sánh visual với duyet-cauhoi-tn & duyet-thuongxuyen-tuluan đảm bảo đồng nhất

---

## Open Questions — ĐÃ GIẢI QUYẾT

1. ✅ Thêm filter chip thứ 4 "Chưa đạt" (status === -1) — đồng bộ với duyet-cauhoi-tn
2. ✅ Header label mapping giống duyet-cauhoi-tn: `planTuluan.week > 0 && planTuluan.week < 100 ? ('Bài ' + planTuluan.week) : planTuluan.title`
3. ✅ Nút "Duyệt tất cả" hiển thị khi `rejectRole === true`
