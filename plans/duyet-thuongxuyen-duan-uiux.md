# Plan: UI/UX Cải tiến — duyet-thuongxuyen-duan (Đồng bộ với duyet-cauhoi-tn)

## Phạm vi
- **Folder:** `src/app/modules/admin/features/duyetnoidung/duyet-thuongxuyen-duan/`
- **Files:** `.component.html`, `.component.css`, `.component.ts`
- **Tham chiếu:** `plans/duyet-thuongxuyen-tuluan-uiux.md`, `plans/duyet-cauhoi-tn-uiux.md`

---

## Kiến trúc layout (mới)

```
.duyet-duan-container (flex column, height: 100%, overflow: hidden)
├── .duyet-duan-header-label              — plain text title activity
├── .duyet-duan-toolbar                   — filter chips + action buttons
│   ├── .filter-chips                     — Tất cả | Đã duyệt | Chưa duyệt + (Chưa nhận xét)
│   └── .toolbar-actions                  — Khóa | Mở khóa | Làm mới
├── .skeleton-wrapper                     — loading state (5 skeleton rows)
├── .empty-state                          — khi không có data
└── .duyet-duan-table-wrapper             — flex:1, overflow: auto (scroll ngang + dọc)
    └── p-table
        ├── thead                         — col-code(150px) | col-title(200px) | col-status(130px) | col-comment(130px) × N
        └── tbody
            ├── .group-row                — gradient left border, tiêu đề kỹ năng
            └── .question-row             — striped, hover highlight, cursor pointer
```

---

## Hiện trạng (trước khi sửa)

| Vấn đề | Mô tả |
|--------|-------|
| Filter overlay | Dùng `p-overlayPanel` → ẩn filter, không trực quan |
| Không có loading state | `list_plan_kynang = null` nhưng không skeleton |
| Không có empty state | Khi không có data không có UI feedback |
| Status dạng text thuần | `.status-is-active/deactive/redo` chỉ đổi màu chữ, không có badge pill |
| Comment hiển thị text thuần | `.danhanxet/.chuanhanxet` chỉ đổi màu chữ |
| Không scroll ngang | Bảng bị ép trong container, cột hẹp khi nhiều thành viên |
| Lock buttons style cũ | Dùng PrimeNG button nhưng kích thước nhỏ, khó nhấn |
| Không có CSS variables | Hardcoded colors |
| Group row cũ | `background-color: #faedc4` hardcoded |

---

## Đặc trưng riêng (so với duyet-thuongxuyen-tuluan)

| Đặc điểm | Giá trị |
|-----------|---------|
| `type` query | `'THUONGXUYEN_DUAN'` |
| Data source | `list_plan_kynang` (có group row kỹ năng) + `list_de_tuluan` (danh sách đề) |
| Group row | Có — tiêu đề kỹ năng (giống duyet-thuongxuyen-tuluan) |
| Nút "Duyệt tất cả" | **Không** (giống duyet-thuongxuyen-tuluan) |
| Header label | `planTuluan.week > 0 && planTuluan.week < 100 ? ('Bài ' + planTuluan.week) : planTuluan.title` |
| Sync channel | `'duyet-thuongxuyen-duan-detail-sync'` |
| Detail route | `duyet-thuongxuyen-duan-detail/${tuluan.id}` |

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
- `.duyet-thuongxuyen-tuluan` → `.duyet-duan-container`
- `display: flex; flex-direction: column; height: 100%; overflow: hidden`
- Background: `#fff`

### 3. Header
- **Style**: Plain text label (không gradient)
- **Logic**: `planTuluan.week > 0 && planTuluan.week < 100` → "Bài X", else → `planTuluan.title`
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
- Variants: `--danger` (Khóa), `--primary` (Mở khóa), `--success` (Làm mới)
- `[disabled]="isLoading"` khi đang tải
- Hover: `translateY(-1px) + shadow`
- Active: `scale(0.97)`
- Chỉ hiển thị Khóa/Mở khóa khi `rejectRole === true`

### 6. Table
| Cột | Class | Width | Align |
|-----|-------|-------|-------|
| Mã đề | `.col-code` | 150px fixed | Center |
| Tiêu đề | `.col-title` | 200px fixed | Left |
| Kết quả duyệt | `.col-status` | 130px fixed | Center |
| Nhận xét ×N | `.col-comment` | 130px fixed | Center |

- **`.p-datatable-wrapper`**: `overflow: visible !important`
- **`.p-datatable-table`**: `width: max-content; min-width: 100%`
- **Scroll ngang**: do `.duyet-duan-table-wrapper` (`overflow-x: auto`)
- **Scroll dọc**: do `.duyet-duan-table-wrapper` (`overflow-y: auto; flex: 1`)

### 7. Group Row (tiêu đề kỹ năng)
- Background: `linear-gradient(90deg, primary-light → white)`
- Left border: `3px solid primary`
- Content: icon `pi-folder` + title kỹ năng
- **Thay** `background-color: #faedc4` bằng gradient

### 8. Question Rows
- Striped: odd rows `gray-50`
- Hover: background `primary-light` + left border 3px primary
- **Không** translateX khi hover (tránh nhảy layout)
- Cursor: pointer

### 9. Status Badges (`.status-badge-new`) — thay thế text thuần
- Pill shape, icon + text, `min-width: 95px`, `justify-content: center`
- Variants:
  - `--pending` (warning): "Chờ duyệt"
  - `--approved` (success): "Đạt"
  - `--rejected` (danger): "Chưa đạt"
  - `--revised` (purple): "Đã sửa"
- Dual badge (Đạt → Đang sửa): column layout

### 10. Comment Chips (`.comment-chip`) — thay thế `.danhanxet/.chuanhanxet`
- `width: 130px` cố định
- `--done`: success-light + success border → "Đã nhận xét"
- `--pending`: gray-100 + gray border → "Chưa nhận xét"

### 11. Lock Button (`.question-cell__lock`)
- 32×32px touch target, border-radius 4px
- Locked: color danger, hover bg danger-light
- Unlocked: color gray-400, hover bg primary-light + primary
- Tooltip: pTooltip (giữ nguyên)
- **Bỏ** style `.icon-lock/.icon-unlock` cũ, `.action-icon-redo` cũ

### 12. Empty State (mới)
- Icon: `pi-inbox` 64px, color gray-300
- Title: 16px, weight 600, gray-700 → "Không có đề dự án"
- Hint: 14px, gray-400 → "Chưa có đề dự án nào trong kế hoạch này"
- Centered, padding 60px

### 13. Loading Skeleton (mới)
- 5 rows animation `skeleton-pulse` (shimmer effect)
- Cells: medium + wide + medium + medium × N
- Hiển thị khi `isLoading && !list_plan_kynang`

### 14. Responsive
- `< 992px`: toolbar wrap
- `< 576px`: filter chips nowrap + scroll-x, header compact

### 15. Custom Scrollbar
- Width/height: 6px
- Track: gray-100, Thumb: gray-300, hover gray-400
- Border-radius: 3px

### 16. Animations
- `.question-row`: `fadeInRow 0.2s ease`
- `.group-row`: `fadeInRow 0.15s ease`

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
| `list_check_status` | Giữ nguyên logic nhưng UI dùng chips thay vì radio |
| **Bỏ** `OverlayPanelModule` import | Không còn dùng overlay |

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
  total: list_de_tuluan.length,
  approved: list_de_tuluan.filter(q => q.status === 1).length,
  pending: list_de_tuluan.filter(q => q.status === 0).length,
  rejected: list_de_tuluan.filter(q => q.status === -1).length
}
```

---

## Checklist UX

- [ ] **Clarity**: Status badges rõ ràng (icon + text + color), group row nổi bật
- [ ] **Consistency**: Tất cả badges/chips cùng min-width, cột cùng width, CSS variables toàn bộ
- [ ] **Efficiency**: Filter inline (không overlay), count trên mỗi chip
- [ ] **Feedback**: Loading skeleton, disabled buttons, empty state
- [ ] **Accessibility**: 32px touch target (lock btn), tooltip, min-height 32px chips
- [ ] **Emotion**: Rounded corners, subtle hover, smooth transitions, color harmony
- [ ] **Đồng nhất với duyet-cauhoi-tn**: Cùng design language, cùng spacing, cùng color tokens
- [ ] **Đồng nhất với duyet-thuongxuyen-tuluan**: Cùng layout structure (có group row)

---

## Quyết định đã xác nhận

1. ✅ Header: logic tương tự → `planTuluan.week > 0 && planTuluan.week < 100 ? ('Bài ' + planTuluan.week) : planTuluan.title`
2. ✅ Bỏ hoàn toàn `p-overlayPanel` → inline filter chips
3. ✅ Không thêm nút "Duyệt tất cả" — chỉ giữ Khóa | Mở khóa | Làm mới
4. ✅ Cột "Tiêu đề" width: **200px**
5. ✅ Giữ group row (tiêu đề kỹ năng) — đây là đặc trưng của component này
6. ✅ Thêm filter chip thứ 4 "Chưa đạt" — đồng bộ duyet-cauhoi-tn

---

## Thứ tự thực hiện

1. **CSS**: Viết lại hoàn toàn `.component.css` theo design mới
2. **HTML**: Refactor template (bỏ overlay, thêm filter chips, skeleton, empty state, badges, group row mới)
3. **TS**: Thêm `isLoading`, `stats`, `computeStats()`, `onFilterChipClick()`, `toggleChuaNhanXet()`
4. **Verify**: So sánh visual với duyet-cauhoi-tn & duyet-thuongxuyen-tuluan đảm bảo đồng nhất

---

## Open Questions — ĐÃ GIẢI QUYẾT

1. ✅ Thêm filter chip thứ 4 "Chưa đạt" (status === -1) — đồng bộ với duyet-cauhoi-tn
2. ✅ Header label mapping giống duyet-cauhoi-tn: `planTuluan.week > 0 && planTuluan.week < 100 ? ('Bài ' + planTuluan.week) : planTuluan.title`
