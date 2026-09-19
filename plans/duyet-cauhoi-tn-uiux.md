# Plan: UI/UX Cải tiến — duyet-cauhoi-tn (Final)

## Phạm vi
- **Folder:** `src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-tn/`
- **Files:** `.component.html`, `.component.css`, `.component.ts`

---

## Kiến trúc layout

```
.duyet-tn-container (flex column, height: 100%, overflow: hidden)
├── .duyet-tn-header-label          — plain text title activity
├── .duyet-tn-toolbar               — filter chips + action buttons
│   ├── .filter-chips               — Tất cả | Chờ duyệt | Đã duyệt | Chưa đạt + (Chưa nhận xét)
│   └── .toolbar-actions            — Duyệt tất cả | Khóa | Mở khóa | Làm mới
├── .skeleton-wrapper               — loading state (5 skeleton rows)
├── .empty-state                    — khi không có data
└── .duyet-tn-table-wrapper         — flex:1, overflow: auto (scroll ngang + dọc)
    └── p-table
        ├── thead                   — col-question(200px) | col-code(150px) | col-status(130px) × N
        └── tbody
            ├── .cdr-group-row      — gradient left border, icon + kyhieu + count
            └── .question-row       — striped, hover highlight, cursor pointer
```

---

## Thay đổi đã thực hiện

### 1. CSS Variables (`:host`)
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

### 2. Header
- **Style**: Plain text label (không gradient)
- **Logic**: `week > 0 && week < 100` → "Bài X", else → `activity.title`
- **Padding**: `14px 20px 0`, background `#fff`

### 3. Toolbar — Filter Chips
- **Filter chips** dạng pill (border-radius 20px):
  - `Tất cả (N)` | `Chờ duyệt (N)` | `Đã duyệt (N)` | `Chưa đạt (N)`
  - Active chip: bg primary, text white
  - Inactive chip: bg gray-100, text gray-600
  - Mỗi chip hiển thị count badge
- **Chip "Chưa nhận xét"**: chỉ hiện khi `kd_uyvien === true`, toggle purple khi active
- **Filter divider**: 1px vertical line giữa status chips và comment chip

### 4. Toolbar — Action Buttons
- Mỗi button: `icon + text + gap 6px`
- Variants: `--primary`, `--danger`, `--info`, `--success`
- `[disabled]="isLoading"` khi đang tải
- Hover: `translateY(-1px) + shadow`
- Active: `scale(0.97)`

### 5. Table
| Cột | Class | Width | Align |
|-----|-------|-------|-------|
| Câu hỏi | `.col-question` | 200px fixed | Left |
| Mã | `.col-code` | 150px fixed | Center |
| Kết quả | `.col-status` | 130px fixed | Center |
| Nhận xét ×N | `.col-status` | 130px fixed | Center |

- **`.p-datatable-wrapper`**: `overflow: visible !important`
- **`.p-datatable-table`**: `width: max-content; min-width: 100%`
- **Scroll ngang**: do `.duyet-tn-table-wrapper` (`overflow-x: auto`)
- **Scroll dọc**: do `.duyet-tn-table-wrapper` (`overflow-y: auto; flex: 1`)

### 6. CDR Group Row
- Background: `linear-gradient(90deg, primary-light → white)`
- Left border: `3px solid primary`
- Content: icon `pi-folder` + kyhieu + "| Tổng: X câu"

### 7. Question Rows
- Striped: odd rows `gray-50`
- Hover: background `primary-light` + left border 3px primary
- **Không** translateX khi hover (tránh nhảy layout)
- Cursor: pointer

### 8. Status Badges (`.status-badge-new`)
- Pill shape, icon + text, `min-width: 95px`, `justify-content: center`
- Variants: `--pending` (warning), `--approved` (success), `--rejected` (danger), `--revised` (purple)
- Dual badge (Đạt → Đang sửa): column layout

### 9. Comment Chips (`.comment-chip`)
- `width: 130px` cố định (done = pending về kích thước)
- `--done`: success-light + success border
- `--pending`: gray-100 + gray border

### 10. Lock Button (`.question-cell__lock`)
- 32×32px touch target, border-radius 4px
- Locked: color danger, hover bg danger-light
- Unlocked: color gray-400, hover bg primary-light + primary
- Tooltip: pTooltip

### 11. Empty State
- Icon: `pi-inbox` 64px, color gray-300
- Title: 16px, weight 600, gray-700
- Hint: 14px, gray-400
- Centered, padding 60px

### 12. Loading Skeleton
- 5 rows animation `skeleton-pulse` (shimmer effect)
- Cells: wide + small + medium + medium

### 13. Dialog "Đang duyệt"
- `styleClass="dialog-duyet-tn"`, width 400px
- Header: gradient primary + spinner icon + text
- Body: label + mat-progress-bar + percentage text
- Border-radius: 12px

### 14. Responsive
- `< 992px`: toolbar wrap, stat cards 2 cột (removed)
- `< 576px`: filter chips nowrap + scroll-x, header compact

### 15. Custom Scrollbar
- Width/height: 6px
- Track: gray-100, Thumb: gray-300, hover gray-400
- Border-radius: 3px

### 16. Animations
- `.question-row`: `fadeInRow 0.2s ease`
- `.cdr-group-row`: `fadeInRow 0.15s ease`

---

## Thay đổi TypeScript

| Property/Method | Mục đích |
|-----------------|----------|
| `isLoading: boolean = false` | Bind skeleton/disabled state |
| `activeFilter: number = 100` | Track active filter chip |
| `stats: {total, approved, pending, rejected}` | Filter chip counts |
| `computeStats()` | Tính stats từ `list_cdr` sau loadData |
| `onFilterChipClick(id)` | Set activeFilter + gọi onSelectStatus |
| `toggleChuaNhanXet()` | Toggle `_chuanhanxet` = 1 / null |
| `list_check_status` | Updated: Tất cả, Chờ duyệt, Đã duyệt, Chưa đạt |

---

## Checklist UX (Rule 5)

- [x] **Clarity**: Status badges rõ ràng (icon + text + color), CDR group nổi bật
- [x] **Consistency**: Tất cả badges/chips cùng min-width, cột cùng width, CSS variables toàn bộ
- [x] **Efficiency**: Filter inline (không overlay), count trên mỗi chip
- [x] **Feedback**: Loading skeleton, disabled buttons, empty state, progress %
- [x] **Accessibility**: 32px touch target (lock btn), tooltip, min-height 32px chips
- [x] **Emotion**: Rounded corners, subtle hover, smooth transitions, color harmony

---

## Quyết định đã xác nhận

1. ✅ Header: plain text label (không gradient)
2. ✅ Stat cards: **bỏ** — count hiển thị trên filter chips đủ thông tin
3. ✅ Filter: inline chips (không overlay panel)
4. ✅ Hover row: chỉ highlight bg, **không** translateX
5. ✅ Scroll: `.duyet-tn-table-wrapper` xử lý cả ngang + dọc
6. ✅ Icon set: PrimeNG icons (`pi pi-*`) toàn bộ
7. ✅ Chip "Chưa nhận xét": chỉ hiện cho ủy viên
