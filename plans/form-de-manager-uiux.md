# Kế hoạch cải tiến UI/UX: form-de-manager (wrapper điều phối tab đề thi)

## 1. Mục tiêu

Cải tiến UI/UX cho component `form-de-manager` — wrapper TabView quản lý các form đề thi, áp dụng quy tắc từ [docs/_rules.md](../docs/_rules.md).

## 2. Phạm vi

- **Folder:** `src/app/modules/admin/features/duyetnoidung/form-de-manager/`
- **Files:**
  - `form-de-manager.component.ts`
  - `form-de-manager.component.html`
  - `form-de-manager.component.css`
- **Không thay đổi:** Logic nghiệp vụ, services, models, 5 component con (form-de-luyentap, form-de-dg, form-de-tn-tx, form-de-tn-kthp, form-de-th-kthp).

---

## 3. Phân tích hiện trạng vs _rules

| Tiêu chí _rules | Hiện trạng | Cần làm |
|-----------------|-----------|---------|
| CSS Variables | ❌ Hardcode `#28a745`, `#BDBDBD`, `red`, `#8f48d2` | Chuyển sang CSS variables |
| Empty state (icon + title + hint) | ❌ Không có khi chưa load xong | Thêm empty state |
| Loading state | ❌ Không có spinner/skeleton khi loadStatusForm | Thêm loading |
| Hover effects | ❌ Tab panel không có hover | Thêm hover |
| Inline styles | ⚠️ `style="font-size: 14px/16px;"` trong HTML | Loại bỏ hoàn toàn |
| Button icon+text | ⚠️ Lock/unlock chỉ có icon | Giữ nguyên theo user |
| Scrollbar custom | ❌ Không | Thêm nếu content overflow |
| Badge/Tag status | ⚠️ Dùng span + class thô | Cải tiến pill shape |
| Responsive | ❌ Không có | Thêm breakpoints |
| trackBy | ❌ `*ngFor` không có trackBy | Thêm trackBy |

---

## 4. Các Phase triển khai

### Phase 1: CSS Variables & Design Tokens

```css
:host {
  --primary: #3B82F6;
  --primary-light: #EFF6FF;
  --success: #22C55E;
  --success-light: #F0FDF4;
  --danger: #EF4444;
  --danger-light: #FEF2F2;
  --warning: #F59E0B;
  --warning-light: #FFFBEB;
  --purple: #8B5CF6;
  --purple-light: #F5F3FF;
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --transition: all 0.2s ease;
}
```

**Mapping màu hiện tại:**
- `#28a745` → `var(--success)`
- `#BDBDBD` → `var(--gray-400)`
- `red` → `var(--danger)`
- `#8f48d2` → `var(--purple)`

---

### Phase 2: Tab Header cải tiến

**Giữ nguyên layout:** tên tab + status bên dưới (theo user).

**Cải tiến:**
1. **Status badge** — đổi sang pill shape nhỏ gọn hơn:
   - Border-radius pill (999px)
   - Padding `2px 8px`
   - Font-size `11px`, font-weight `500`
   - Background nhạt + text đậm (vd: success-light + success)
2. **Lock icon** — giữ icon hiện tại, cải tiến hover:
   - Hover: background circle nhẹ + scale
   - Tooltip giữ nguyên
3. **Tab panel hover** — highlight nhẹ khi hover (background gray-50)
4. **Active tab** — custom indicator:
   - Border-bottom `3px solid var(--primary)` (thicker than PrimeNG default)
   - Background nhạt `var(--primary-light)` trên tab active
   - Transition mượt khi chuyển tab
   - Override PrimeNG default:
     ```css
     :host ::ng-deep .p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
       border-bottom: 3px solid var(--primary);
       background: var(--primary-light);
       color: var(--primary);
     }
     ```

---

### Phase 3: Loading & Empty States

1. **Loading** khi `loadStatusForm()` đang chạy:
   - Biến `isLoading: boolean = true`
   - Hiển thị **skeleton giả lập tab headers** (3-4 skeleton blocks ngang, mô phỏng tab pills)
   - Skeleton: `height: 40px`, `border-radius: var(--radius-md)`, shimmer animation
   - Sau khi load xong → `isLoading = false`, hiện TabView thật

2. **Empty state** khi `list_tab` rỗng (sau load):
   - Icon 📋 lớn (48px)
   - Title: "Chưa có cấu hình đề thi"
   - Hint: "Vui lòng kiểm tra cài đặt khóa học"

---

### Phase 4: Loại bỏ inline styles

**Hiện tại trong HTML:**
```html
style="font-size: 14px;"  → class lock-icon-sm
style="font-size: 16px;"  → class lock-icon-md
```

**Chuyển toàn bộ sang CSS classes**, đảm bảo 0 inline style trong template.

---

### Phase 5: TypeScript clean-up

1. **Thêm `isLoading`** và `hasError` state
2. **Thêm `trackByKey`** cho `*ngFor="let panel of list_tab"`
3. **View-model** cho status display (precompute class/label):
   ```ts
   interface TabStatusVm {
     label: string;
     cssClass: string;
     approvedAt?: string;
   }
   ```
4. **Xóa dead code** nếu có

---

### Phase 6: Responsive

- **992px:** Tab labels thu gọn (ẩn status text, chỉ hiện dot màu)
- **576px:** Font giảm, padding giảm, lock icon vẫn accessible

---

### Phase 7: Custom scrollbar (nếu content overflow)

```css
:host ::ng-deep .p-tabview-panels::-webkit-scrollbar { width: 6px; }
:host ::ng-deep .p-tabview-panels::-webkit-scrollbar-track { background: var(--gray-100); }
:host ::ng-deep .p-tabview-panels::-webkit-scrollbar-thumb { background: var(--gray-400); border-radius: var(--radius-pill); }
```

---

## 5. Ràng buộc

- **KHÔNG** thay đổi logic nghiệp vụ (services, API calls).
- **KHÔNG** thay đổi 5 component con (sẽ có plan riêng cho từng cái).
- **KHÔNG** thay đổi `@Input/@Output` interface.
- **KHÔNG** thêm route mới.
- Lock/Unlock giữ style hiện tại (chỉ icon, không thêm text).
- Status giữ vị trí bên dưới tên tab.
- CSS viết lại hoàn toàn, loại bỏ 100% inline style.

---

## 6. Tiêu chí hoàn thành

- [ ] CSS Variables thay thế 100% hardcode màu/radius/shadow
- [ ] 0 inline styles trong HTML template
- [ ] Status badge → pill shape (border-radius, background nhạt)
- [ ] Lock/unlock icon có hover effect (circle bg + scale)
- [ ] Tab hover highlight
- [ ] Loading state (spinner/skeleton) khi đang load
- [ ] Empty state khi `list_tab` rỗng (icon + title + hint)
- [ ] `trackBy` cho `*ngFor`
- [ ] Precompute status view-model (không gọi hàm trong template)
- [ ] Responsive tại 992px và 576px
- [ ] Custom scrollbar cho overflow content
- [ ] Dead code CSS/TS đã xóa

---

## 7. Kế hoạch liên quan (sẽ tạo riêng)

| Plan | Component | Trạng thái |
|------|-----------|-----------|
| `plans/form-de-luyentap-uiux.md` | form-de-luyentap | Chưa tạo |
| `plans/form-de-dg-uiux.md` | form-de-dg | Chưa tạo |
| `plans/form-de-tn-tx-uiux.md` | form-de-tn-tx | Chưa tạo |
| `plans/form-de-tn-kthp-uiux.md` | form-de-tn-kthp | Chưa tạo |
| `plans/form-de-th-kthp-uiux.md` | form-de-th-kthp | Chưa tạo |

---

## 8. Changelog

### 2026-06-09 — Lần 1: Tạo kế hoạch
**Mục đích:** Lập plan cải tiến UI/UX cho form-de-manager wrapper.

**Kết quả:** Plan 7 phase sẵn sàng triển khai.

### 2026-06-09 — Lần 2: Cập nhật quyết định
**Mục đích:** Xác nhận loading style và tab active indicator.

**Các thay đổi:**
1. **Phase 3** — Loading dùng skeleton giả lập tab headers (không spinner)
2. **Phase 2** — Tab active dùng custom border-bottom 3px primary + background primary-light (override PrimeNG)

**Kết quả:** Plan đã cập nhật, sẵn sàng triển khai.
