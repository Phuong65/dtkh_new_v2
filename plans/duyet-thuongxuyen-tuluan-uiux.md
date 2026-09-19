# Plan: UI/UX Cải tiến — duyet-thuongxuyen-tuluan (Tương ứng duyet-cauhoi-tn)

## Phạm vi
- **Folder:** `src/app/modules/admin/features/duyetnoidung/duyet-thuongxuyen-tuluan/`
- **Files:** `.component.html`, `.component.css`, `.component.ts`
- **Tham chiếu:** `plans/duyet-cauhoi-tn-uiux.md`

---

## Kiến trúc layout (mới)

```
.duyet-tuluan-container (flex column, height: 100%, overflow: hidden)
├── .duyet-tuluan-header-label          — plain text title activity
├── .duyet-tuluan-toolbar               — filter chips + action buttons
│   ├── .filter-chips                   — Tất cả | Đã duyệt | Chưa duyệt + (Chưa nhận xét)
│   └── .toolbar-actions                — Khóa | Mở khóa | Làm mới
├── .skeleton-wrapper                   — loading state (5 skeleton rows)
├── .empty-state                        — khi không có data
└── .duyet-tuluan-table-wrapper         — flex:1, overflow: auto (scroll ngang + dọc)
    └── p-table
        ├── thead                       — col-code(150px) | col-title(200px) | col-status(130px) | col-comment(130px) × N
        └── tbody
            ├── .group-row              — gradient left border, tiêu đề kỹ năng
            └── .question-row           — striped, hover highlight, cursor pointer
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
- `.duyet-thuongxuyen-tuluan` → `.duyet-tuluan-container`
- `display: flex; flex-direction: column; height: 100%; overflow: hidden`
- Background: `#fff`

### 3. Header
- **Style**: Plain text label (không gradient)
- **Logic**: `planTuluan.week > 0 && planTuluan.week < 100` → "Bài X", else → `planTuluan.title`
- **Padding**: `14px 20px 0`, background `#fff`

### 4. Toolbar — Filter Chips (thay thế overlay panel)
- **Bỏ** `p-overlayPanel` + nút "Lọc"
- **Thay bằng** inline filter chips dạng pill (border-radius 20px):
  - `Tất cả (N)` | `Đã duyệt (N)` | `Chưa duyệt (N)`
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

### 6. Table
| Cột | Class | Width | Align |
|-----|-------|-------|-------|
| Mã đề | `.col-code` | 150px fixed | Center |
| Tiêu đề | `.col-title` | 200px fixed | Left |
| Kết quả duyệt | `.col-status` | 130px fixed | Center |
| Nhận xét ×N | `.col-comment` | 130px fixed | Center |

- **`.p-datatable-wrapper`**: `overflow: visible !important`
- **`.p-datatable-table`**: `width: max-content; min-width: 100%`
- **Scroll ngang**: do `.duyet-tuluan-table-wrapper` (`overflow-x: auto`)
- **Scroll dọc**: do `.duyet-tuluan-table-wrapper` (`overflow-y: auto; flex: 1`)

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
- **Bỏ** style `.icon-lock/.icon-unlock` cũ

### 12. Empty State (mới)
- Icon: `pi-inbox` 64px, color gray-300
- Title: 16px, weight 600, gray-700 → "Không có đề tự luận"
- Hint: 14px, gray-400 → "Chưa có đề tự luận nào trong kế hoạch này"
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
| `computeStats()` | Tính stats từ `list_plan_kynang` sau loadData |
| `onFilterChipClick(id)` | Set activeFilter + gọi onSelectStatus |
| `toggleChuaNhanXet()` | Toggle `_chuanhanxet` = 1 / null |
| `list_check_status` | Updated: Tất cả, Đã duyệt, Chưa duyệt (giữ nguyên logic) |

---

## Checklist UX

- [ ] **Clarity**: Status badges rõ ràng (icon + text + color), group row nổi bật
- [ ] **Consistency**: Tất cả badges/chips cùng min-width, cột cùng width, CSS variables toàn bộ
- [ ] **Efficiency**: Filter inline (không overlay), count trên mỗi chip
- [ ] **Feedback**: Loading skeleton, disabled buttons, empty state
- [ ] **Accessibility**: 32px touch target (lock btn), tooltip, min-height 32px chips
- [ ] **Emotion**: Rounded corners, subtle hover, smooth transitions, color harmony
- [ ] **Đồng nhất với duyet-cauhoi-tn**: Cùng design language, cùng spacing, cùng color tokens

---

## Quyết định đã xác nhận

1. ✅ Header: logic tương tự duyet-cauhoi-tn → `planTuluan.week > 0 && planTuluan.week < 100 ? ('Bài ' + planTuluan.week) : planTuluan.title`
2. ✅ Bỏ hoàn toàn `p-overlayPanel` → inline filter chips
3. ✅ Không thêm nút "Duyệt tất cả" — chỉ giữ Khóa | Mở khóa | Làm mới
4. ✅ Cột "Tiêu đề" width: **200px**

---

## Thứ tự thực hiện

1. **CSS**: Viết lại hoàn toàn `.component.css` theo design mới
2. **HTML**: Refactor template (bỏ overlay, thêm filter chips, skeleton, empty state, badges)
3. **TS**: Thêm `isLoading`, `stats`, `computeStats()`, `onFilterChipClick()`
4. **Verify**: So sánh visual với duyet-cauhoi-tn đảm bảo đồng nhất
