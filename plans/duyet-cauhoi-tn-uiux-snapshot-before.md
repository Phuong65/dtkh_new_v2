# Snapshot UI/UX trước cải tiến — duyet-cauhoi-tn

> **Ngày tạo:** 2026-06-08  
> **Mục đích:** Ghi nhớ giao diện cũ để có thể quay lại nếu kế hoạch cải tiến không đạt yêu cầu.  
> **Kế hoạch cải tiến:** `plans/duyet-cauhoi-tn-uiux.md`

---

## 1. Cấu trúc tổng quan

### Component cha: `duyet-cauhoi`
```
┌─────────────────────────────────────────────────────────────┐
│ .layout_component_container (bg: #f2f2f2)                   │
│ ┌──────────────┬────────────────────────────────────────────┐│
│ │ LEFT PANEL   │ RIGHT PANEL                                ││
│ │ (500px)      │ (calc(100% - 500px))                       ││
│ │              │                                            ││
│ │ Menu danh    │ Nội dung child component:                  ││
│ │ sách Plan    │ - duyet-cauhoi-tn (mặc định)              ││
│ │ (list_plan)  │ - duyet-thuongxuyen-tuluan (week=1000)    ││
│ │              │ - duyet-thuongxuyen-duan                   ││
│ │ Có nút       │ - duyet-cauhoi-thuchanh-kthp              ││
│ │ collapse     │ - form-de-manager                         ││
│ │ (closeLeft)  │                                            ││
│ └──────────────┴────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Left Panel:**
- Width cố định 500px, border-right 1px solid #c8c8c8
- Nút collapse: btn-success, position absolute right -14px, shape mũi tên CSS (::before/::after)
- Menu list: `*ngFor="let parent of list_plan"` — hiển thị tên plan + badge "Duyệt: X/Y"
- Active item: class `.activity` → bg #d0e1fd, border-color #004ef9
- Badge duyệt: font-weight 500, class `red` nếu chưa đủ, `blue` nếu đủ

**Right Panel:**
- Width calc(100% - 500px), bg #EEEEEE
- Khi collapse: width 100%
- Dùng `[ngSwitch]="selectPlan.week"` để render child component tương ứng

---

## 2. Component con chính: `duyet-cauhoi-tn`

### 2.1 Layout HTML

```
┌─────────────────────────────────────────────────────────────┐
│ .duyet-cauhoi-layout                                        │
│ ┌───────────────────────────────────────────────────────────┐│
│ │ p-table [value]="list_cdr"                                ││
│ │ ┌─────────────────────────────────────────────────────────┐│
│ │ │ CAPTION (toolbar)                                       ││
│ │ │ [Lọc btn] ................ [Duyệt tất cả][Khóa][Mới]   ││
│ │ └─────────────────────────────────────────────────────────┘│
│ │ ┌─────────────────────────────────────────────────────────┐│
│ │ │ HEADER                                                  ││
│ │ │ │ Câu hỏi │ Mã │ Kết quả │ Chủ tịch │ UV1 │ UV2 │... ││
│ │ └─────────────────────────────────────────────────────────┘│
│ │ ┌─────────────────────────────────────────────────────────┐│
│ │ │ BODY (per CDR group)                                    ││
│ │ │ ╔═══════════════════════════════════════════════════════╗││
│ │ │ ║ CDR GROUP ROW (bg #faedc4, font-weight 600)          ║││
│ │ │ ║ "CLO1 | Tổng: (0 + 2 + 5 = 7)"                     ║││
│ │ │ ╚═══════════════════════════════════════════════════════╝││
│ │ │ │ - Câu 1 - CDR name │ #123 │ Đạt    │ Đã NX │ Chưa  │││
│ │ │ │ - Câu 2 - CDR name │ #124 │ Chờ    │ Chưa  │ Chưa  │││
│ │ │ │ ...                                                   ││
│ │ └─────────────────────────────────────────────────────────┘│
│ └───────────────────────────────────────────────────────────┘│
│                                                              │
│ [Filter OverlayPanel - ẩn]                                   │
│ [Dialog "Đang đồng bộ" - ẩn]                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Toolbar (Caption)

| Phần tử | Mô tả |
|---------|--------|
| Nút "Lọc" | `btn btn-success btn-icon` + icon `fa fa-filter`, mở `p-overlayPanel` |
| Nút "Duyệt tất cả" | `btn btn-primary`, chỉ hiện khi `config_check_hoidong_by_chutich && isChutichHoidong` |
| Nút Khóa | `p-button-danger p-button-rounded`, icon `pi pi-lock`, 30x30px bg #ff2b2b |
| Nút Mở khóa | `p-button-rounded`, icon `pi pi-lock-open`, 30x30px bg #3B82F6 |
| Nút "Làm mới" | `btn btn-success` + icon `fa fa-refresh` + text "Làm mới" |

### 2.3 Table Header

- Row 1 (rowspan=2): "Câu hỏi" (180px) | "Mã câu hỏi" (100px) | "Kết quả duyệt" (96px)
- Các cột thành viên hội đồng: min-width 100px, text "Chủ tịch (Tên)" hoặc "Ủy viên N (Tên)"
- StyleClass: `tbl-danhSachUser table-duyet table-scroll-able table-able-dropdown-p-table ovic-ui-table table-reBorder th-td-padding-5px`

### 2.4 Table Body

**CDR Group Row:**
- colspan full, font-weight 600, background `#faedc4` (vàng nhạt)
- Nội dung: `{kyhieu} | Tổng: {cdr_cauhoi_label}` (HTML string pre-built trong TS)

**Question Rows:**
- Cursor pointer, click → `chooseQuestion(question, i+1)`
- Cột "Câu hỏi": text "- Câu: {index_question} - {cdr_name}" + inline lock/unlock icon
- Cột "Mã": `#{question.id}`, text-align center
- Cột "Kết quả duyệt": ngSwitch theo status
- Cột nhận xét (per thành viên): "Đã nhận xét" (green) hoặc "Chưa nhận xét" (gray)

### 2.5 Status Display

| Status | Text | CSS class | Color |
|--------|------|-----------|-------|
| 0 | "Chờ duyệt" | `.status-is-deactive` | #BDBDBD |
| 1 | "Đạt" | `.status-is-active` | #28a745 |
| -1 | "Chưa đạt" | `.status-is-redo` | red |
| -2 | "Đã sửa" | `.status-is-require` | #8f48d2 |
| old_status=1 & status=0 | "Đạt / Đang sửa" | `.status-is-active` | #28a745 (cả 2) |

### 2.6 Comment Status (Nhận xét hội đồng)

| Trạng thái | Class | Color |
|------------|-------|-------|
| Đã nhận xét | `.danhanxet` | #188a42 |
| Chưa nhận xét | `.chuanhanxet` | #9e9e9e |

### 2.7 Lock/Unlock Icon (inline)

- Lock (status=1): icon `pi pi-lock`, class `.action-icon-redo .red`, 20x20px
- Unlock (status≠1): icon `pi pi-lock-open`, class `.action-icon-redo .gray`, 20x20px, font-size 16px

### 2.8 Filter Panel (OverlayPanel)

- Width 500px cố định
- Nội dung:
  - `ovic-groups-radio-v2`: defaultValue 100, columns 3, options `list_check_status`
  - `p-checkbox` "Lọc câu hỏi bạn chưa nhận xét" (chỉ hiện khi `kd_uyvien`)
- Filter binding: pipe `| filter : _chuanhanxet : ['_chuanhanxet'] | filter : _daduyet : ['_daduyet']`

### 2.9 Dialog "Đang đồng bộ"

- `p-dialog` width 50vw, modal, không header, không closable
- Nội dung: label "Đang đồng bộ dữ liệu, vui lòng chờ..." + `mat-progress-bar` mode determinate
- BaseZIndex: 1099

---

## 3. CSS Key Styles

### 3.1 Color Palette (hardcoded)

```
Primary actions:  #28a745 (btn-success), #007bff (btn-primary)
Status green:     #28a745 / #188a42
Status gray:      #BDBDBD / #9e9e9e  
Status red:       red / #FF0000
Status purple:    #8f48d2
CDR group bg:     #faedc4
Active/hover:     #d0e1fd
Background:       #f2f2f2 / #EEEEEE / #e8e5e5
Lock btn red:     #ff2b2b
Lock btn blue:    #3B82F6
Border general:   #c8c8c8 / #dee2e6
```

### 3.2 Typography

- Font-size chung: 14px
- Font-weight tiêu đề: 600-700
- Line-height: 1.25
- Font-family: Roboto, sans-serif (trong question view area)

### 3.3 Spacing & Sizing

- Table padding: 4-5px (`.th-td-padding-5px`)
- Lock icon area: 20x20px (quá nhỏ)
- Toolbar button lock/unlock: 30x30px
- Column widths: Câu hỏi=180px, Mã=100px, Kết quả=96px, Thành viên=min 100px

### 3.4 Borders & Shadows

- Không border-radius trên table
- Border general: 1px solid #c8c8c8 hoặc #dee2e6
- Không box-shadow trên table
- Question detail block: box-shadow subtle trong `.list-questions__contents__block`

### 3.5 Animations/Transitions

- Collapse left panel: `transition: all 0.3s`
- Comment show/hide: `max-height transition 0.3s ease-in/out`
- Không có row animation
- Không có hover transition trên table rows

---

## 4. TypeScript Properties & Logic

### 4.1 Key Properties

```typescript
// Inputs
@Input() hoidong: HoidongThamdinhMonhocThanhvien[];
@Input() courseSelected: ElnKhoaHoc;
@Input() activity: CoursePlanActivities;

// Data
list_cdr: CoursePlanActivities[];        // CDR groups for table
list_question: CourseQuestions[];         // All questions loaded

// Filter state
_chuanhanxet: boolean;                   // Filter chưa nhận xét
_daduyet: boolean;                       // Filter đã duyệt
checkBoxChuaDuyet: boolean;
list_check_status: [{id, label}];        // Radio options for status filter

// UI state
displayModal: boolean;                   // Dialog visibility
progressValue: number;                   // Progress bar value
closeLeft: boolean;                      // (in parent) collapse left panel

// Auth/Role
isChutichHoidong: boolean;
kd_uyvien: boolean;
rejectRole: boolean;
config_check_hoidong_by_chutich: boolean;
```

### 4.2 Data Flow

1. `ngOnChanges` → detect `activity` change → call `loadData()`
2. `loadData()`:
   - Query questions by `reference_id` (activity id) hoặc all nếu week=100
   - Query comments cho từng question
   - Build `list_cdr` (group questions by CDR)
   - Tính `cdr_cauhoi_label` (HTML string concat: "chờ + chưa đạt + đạt = tổng")
   - Map `hoidong_comment` per question per user
3. Filter: pipe `| filter` trong template, toggle bằng checkbox/radio

### 4.3 Key Methods

| Method | Mô tả |
|--------|--------|
| `loadData()` | Load questions + comments, build list_cdr |
| `chooseQuestion(q, i)` | Chọn câu hỏi → mở detail view |
| `approvedAll()` | Duyệt tất cả (hiện dialog + progress) |
| `btnUpdateLockQuestion(status)` | Lock/unlock tất cả question |
| `reDoAction($event, q, status)` | Lock/unlock 1 question |
| `onSelectStatus(e)` | Filter theo radio status |
| `checkValue(e, field)` | Toggle filter checkbox |

---

## 5. Danh sách file gốc (để restore nếu cần)

| File | Dòng | Vai trò |
|------|------|---------|
| `duyet-cauhoi/duyet-cauhoi.component.html` | 75 | Layout cha: left panel + right panel |
| `duyet-cauhoi/duyet-cauhoi.component.css` | ~1816 | CSS cha (rất dài, nhiều duplicate) |
| `duyet-cauhoi/duyet-cauhoi.component.ts` | 438 | Logic cha: load plans, route, switch |
| `duyet-cauhoi-tn/duyet-cauhoi-tn.component.html` | 180 | Template bảng duyệt TN |
| `duyet-cauhoi-tn/duyet-cauhoi-tn.component.css` | ~836 | CSS bảng + question detail view |
| `duyet-cauhoi-tn/duyet-cauhoi-tn.component.ts` | 663 | Logic load data, filter, actions |

---

## 6. Điểm đặc trưng cần lưu ý khi rollback

1. **CSS cha rất dài (~1816 dòng)** — nhiều selector bị duplicate (`.comment-box`, `.inner-comment`, `.class-duyet-layout` khai báo 2-3 lần). Đây là code gốc, không phải lỗi.
2. **Inline styles trong HTML** — rất nhiều `style="..."` trực tiếp trên elements (font-size, flex, gap, margin)
3. **Mix icon sets** — dùng cả `fa fa-*` (Font Awesome) và `pi pi-*` (PrimeNG)
4. **Mix button styles** — `btn btn-success`, `btn btn-primary`, `p-button`, `pButton directive`
5. **HTML string concat trong TS** — `selectedActivity['count_question']` được build bằng `.concat()` với HTML tags inline
6. **Filter bằng pipe** — `| filter : _chuanhanxet : ['_chuanhanxet']` — custom pipe, không phải Angular built-in
7. **OverlayPanel cho filter** — `p-overlayPanel #op appendTo="body"`
8. **Table PrimeNG** — dùng `p-table` với ng-template pTemplate, không phải native table

---

## 7. Screenshot mô tả (text-based)

```
╔══════════════════════════════════════════════════════════════════╗
║  [◁◁] │                                                        ║
║        │  [🔍Lọc]                    [Duyệt tất cả][🔒][🔓][🔄Mới] ║
║ Bài 1  │  ┌──────────────────────────────────────────────────┐  ║
║ Duyệt: │  │ Câu hỏi    │ Mã   │Kết quả│ CT(Nguyễn)│UV1(Trần)│  ║
║ 3/5    │  ├──────────────────────────────────────────────────┤  ║
║        │  │▓▓▓ CLO1 | Tổng: (2+1+3=6) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ║
║ Bài 2  │  │ - Câu 1 - CDR1  🔓 │ #101 │ Đạt   │ Đã NX │Chưa│  ║
║ Duyệt: │  │ - Câu 2 - CDR1  🔓 │ #102 │ Chờ   │ Chưa  │Chưa│  ║
║ 2/4    │  │ - Câu 3 - CDR1  🔓 │ #103 │Chưa đạt│ Đã NX│Đã NX│  ║
║        │  │▓▓▓ CLO2 | Tổng: (1+0+2=3) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ║
║ KTTX   │  │ - Câu 4 - CDR2  🔓 │ #104 │ Đã sửa│ Đã NX │Chưa│  ║
║ Duyệt: │  │ ...                                              │  ║
║ 1/3    │  └──────────────────────────────────────────────────┘  ║
║        │                                                        ║
║ KTHP   │                                                        ║
║ Cấu    │                                                        ║
║ trúc đề│                                                        ║
╚══════════════════════════════════════════════════════════════════╝
```

---

> ⚠️ **Cách rollback:** Copy lại 6 file gốc từ git history trước commit cải tiến.  
> Command: `git checkout <commit-before> -- src/app/modules/admin/features/duyetnoidung/duyet-cauhoi/ src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-tn/`
