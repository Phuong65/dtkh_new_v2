# Kế hoạch cải tiến UI/UX: duyet-cauhoi (màn hình tổng điều phối)

## 1. Mục tiêu

Cải tiến hoàn toàn UI/UX cho component `duyet-cauhoi` hiện tại (không tạo route mới), áp dụng đầy đủ quy tắc từ [docs/_rules.md](docs/_rules.md).

## 2. Phạm vi

- **Folder:** `src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/`
- **Files:**
  - `duyet-cauhoi.component.ts`
  - `duyet-cauhoi.component.html`
  - `duyet-cauhoi.component.css`
- **Không thay đổi:** Logic nghiệp vụ, services, models, component con (chỉ cải tiến shell điều phối).

---

## 3. Trạng thái triển khai

| # | Phase | Trạng thái | Ghi chú |
|---|-------|-----------|---------|
| 1 | CSS Variables & Design Tokens | ✅ Hoàn thành | Thay thế 100% hardcode |
| 2 | ~~Header chức năng~~ | ❌ Bỏ | User yêu cầu bỏ header |
| 3 | Sidebar cải tiến | ✅ Hoàn thành | Toggle pill, item cards, empty state |
| 4 | Content area | ✅ Hoàn thành (rút gọn) | Chỉ giữ empty state + CTA, bỏ breadcrumb + action bar |
| 5 | Loading & Error States | ✅ Hoàn thành | Skeleton sidebar, error + retry |
| 6 | Responsive | ✅ Hoàn thành | 992px + 576px |
| 7 | TypeScript clean-up | ✅ Hoàn thành | View-model, trackBy, states |

---

## 4. Chi tiết triển khai (đã thực hiện)

### Phase 1: CSS Variables & Design Tokens ✅

```css
:host {
  --primary: #3B82F6;
  --primary-light: #EFF6FF;
  --primary-dark: #1D4ED8;
  --success: #22C55E;
  --success-light: #F0FDF4;
  --danger: #EF4444;
  --danger-light: #FEF2F2;
  --warning: #F59E0B;
  --warning-light: #FFFBEB;
  --gray-50 → --gray-900 (10 bậc);
  --radius-sm/md/lg;
  --shadow-sm/md/lg;
  --transition: all 0.2s ease;
}
```

### Phase 2: Header — ❌ BỎ

User quyết định bỏ header, không cần gradient/badges ở đây.

### Phase 3: Sidebar cải tiến ✅

1. **Toggle button** — Pill bo tròn mịn (28×56px, border-radius 24px), shadow mềm, hiệu ứng scale on press.

2. **Item card** cho mỗi plan:
   - Icon theo loại: 📝 Bài học, 📄 KTTX, 🎯 Dự án, 📋 KTHP, 📐 Cấu trúc đề
   - Title (giữ `label_parent_kehoach` + week hoặc title gốc)
   - Progress bar mini (width% = duyet/tong*100)
   - Badge trạng thái: `Hoàn thành` (green) / `Đang xử lý` (blue) / `Chưa có` (gray)
   - Hover: translateY(-1px) + shadow + primary border

3. **Empty state sidebar** khi `list_plan` rỗng:
   - Icon 📂
   - "Chưa có dữ liệu kế hoạch"
   - "Vui lòng kiểm tra cấu hình môn học"

4. **Custom scrollbar** — 8px, track gray-100, thumb gray-400/500/600, border-radius 4px.

### Phase 4: Content area — ✅ (rút gọn)

1. **Empty state** khi chưa chọn mục: ✅
   - Icon 👈 lớn (48px)
   - "Chọn một mục ở danh sách bên trái để bắt đầu duyệt"
   - Button "Mục cần duyệt tiếp theo" (auto-select pending)

2. ~~**Breadcrumb mini**~~ — ❌ Bỏ theo yêu cầu user.

3. ~~**Action bar**~~ — ❌ Bỏ theo yêu cầu user.

### Phase 5: Loading & Error States ✅

1. **Loading:** Skeleton loader (5 items) trong sidebar khi đang tải.
2. **Error:** Icon ⚠️ + "Không thể tải dữ liệu" + Button "Thử lại".

### Phase 6: Responsive ✅

- **992px:** Sidebar absolute overlay + shadow, content full width
- **576px:** Sidebar thu hẹp 280px, padding/font giảm

### Phase 7: TypeScript — View-model & Clean-up ✅

```ts
interface PlanItemVm {
  icon: string;
  statusLabel: string;
  statusClass: string;
  progressPercent: number | undefined;
}

// Thêm:
planVm: { [key: number]: PlanItemVm };
isLoading: boolean;
hasError: boolean;
roleBadgeLabel: string;

// Methods:
trackByPlanId()
selectNextPending()
refreshCurrentPlan()
retryLoad()
buildPlanVm()
getPlanIcon()
computeRoleBadge()
```

---

## 5. Ràng buộc

- **KHÔNG** thay đổi logic nghiệp vụ (services, API calls, routing).
- **KHÔNG** thay đổi component con (duyet-cauhoi-tn, duyet-thuongxuyen-tuluan, v.v.).
- **KHÔNG** thêm route mới.
- Chỉ cải tiến visual/UX của shell điều phối.
- CSS file viết lại hoàn toàn.
- Template restructure nhưng giữ nguyên child component binding interface.

---

## 6. Tiêu chí hoàn thành

- [x] CSS Variables thay thế 100% hardcode màu/radius/shadow
- [x] ~~Header gradient + icon + badge~~ → Bỏ
- [x] Sidebar: pill toggle, items có icon + progress bar + badge trạng thái
- [x] Sidebar empty state (icon + text + hint)
- [x] Content empty state khi chưa chọn mục (icon + text + CTA)
- [x] ~~Content breadcrumb + action bar~~ → Bỏ
- [x] Loading skeleton inline
- [x] Error state có retry button
- [x] Responsive tại 992px và 576px
- [x] Template không gọi method tính trạng thái (dùng `planVm`)
- [x] trackBy cho mọi *ngFor
- [x] Custom scrollbar rõ ràng (8px, visible track/thumb)
- [x] Hover/active effects trên mọi interactive element
- [x] Dead code CSS/TS đã xóa

---

## 7. Quyết định đã chốt

1. **Header** — Bỏ, không triển khai.
2. **Breadcrumb** — Bỏ, không triển khai.
3. **Action bar** — Bỏ, không triển khai.
4. **Summary cards** — Bỏ, không triển khai.
5. **Search sidebar** — Không cần.
6. **Toggle sidebar** — Pill bo tròn thay vì hamburger vuông.
7. **`label_parent_kehoach`** — Giữ như hiện tại ("Bài").

---

## 8. Changelog

### 2026-06-09 — Lần 1: Tạo kế hoạch UI/UX cải tiến
**Mục đích:** Đánh giá hiện trạng và lập kế hoạch cải tiến.

**Kết quả:** Kế hoạch 7 phase sẵn sàng.

### 2026-06-09 — Lần 2: Triển khai cả 7 phase
**Mục đích:** Viết lại hoàn toàn 3 file (CSS, HTML, TS).

**Các thay đổi:**
1. **`.css`** — Viết lại 100%: design tokens, sidebar cards, progress bars, empty/loading/error states, custom scrollbar, responsive.
2. **`.html`** — Restructure: header + sidebar (toggle + items + empty) + content area (empty + breadcrumb + action bar + routing).
3. **`.ts`** — Thêm `PlanItemVm`, `planVm`, states, trackBy, helper methods.

### 2026-06-09 — Lần 3: Điều chỉnh theo feedback
**Mục đích:** Loại bỏ phần không cần thiết, tinh chỉnh UI.

**Các thay đổi:**
1. **`.html`** — Bỏ header, bỏ breadcrumb, bỏ action bar.
2. **`.css`** — Toggle button đổi sang pill bo tròn mịn hơn (28×56px, shadow soft, scale on press). Scrollbar rộng 8px, track/thumb rõ ràng hơn.

**Kết quả:** Giao diện gọn gàng, tập trung vào sidebar + content. Tất cả tiêu chí hoàn thành (đã điều chỉnh checklist theo quyết định mới).
