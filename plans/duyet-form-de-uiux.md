# Kế hoạch cải tiến UI/UX — `duyet-form-de`

> **Tham chiếu:** `src/app/modules/admin/features/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail/`
> **Mục tiêu:** Đồng bộ phong cách card-based với module Council comments của `duyet-cauhoi-thuchanh-kthp-detail`, không thay shell tổng (component vẫn là sub-component nhúng vào trang ngoài).
> **Phạm vi đã chốt:** Comments list + Action cards. Bỏ bubble bo góc 0/10/10/10. Không thêm status tag tổng.

---

## 1. Hiện trạng

**File:** `duyet-form-de.component.html` / `.css` / `.ts`

Cấu trúc hiện tại (mức cao):
```
.layout-duyet-form-de
└── .list-comment-layout (#f5f5f5, padding 10px)
    ├── .comment-edit-layout            ← textarea + 2 nút (Đồng ý / Yêu cầu sửa) — chỉ ủy viên / hội đồng
    ├── div (kết luận của chủ tịch)     ← 2 nút inline-style, label whitesmoke
    └── *ngFor .comment-box
        └── .inner-comment
            ├── .inner-comment-header   ← display_name (underline)
            └── *ngFor children
                ├── .conten-comment-box (.duyet-comment | .yeucausua-comment)  ← bubble #CDECFF / #FFD8D8
                ├── meta (created_at + nút "Phản hồi (n)")
                └── .reply-layout (khi reply_open)
                    ├── *ngFor reply_comments
                    │   ├── display_name (text-align right)
                    │   ├── .conten-comment-box-left (.my-reply-comment)
                    │   └── created_at
                    └── reply form: avatar 40px + textarea + nút "Gửi phản hồi"
```

### Vấn đề UX/UI
1. **Inline style nặng** (`style="..."` rải khắp HTML) — khó duy trì, không nhất quán với phần còn lại của module.
2. **Bubble màu nguyên khối** (#CDECFF / #FFD8D8) — chiếm chú ý không cần thiết, không đồng bộ với reference (neutral background + border-left status).
3. **Hai khối action không phân tách** — textarea ủy viên và 2 nút kết luận chủ tịch trộn trực tiếp trong cùng panel xám, không có header/card boundary.
4. **Action cho ủy viên thiếu icon** (`pi-check`, `pi-pencil`) → kém affordance.
5. **Avatar mặc định** `a_none.jpg` được nhúng inline — phá nhịp khi reply form mở; reference không dùng avatar.
6. **Reply form** dùng `position: absolute` cho nút gửi → fragile khi textarea thay đổi chiều cao, mobile dễ vỡ.
7. **Không có empty state** khi `list_comment` rỗng (component vẫn render khối xám trống).
8. **Không có separator/grouping** giữa các user comment ngoài `border-bottom` mảnh.

---

## 2. Định hướng (theo reference)

Áp dụng các pattern sau từ `duyet-cauhoi-thuchanh-kthp-detail.component.css`:

| Reference token | Áp dụng cho |
|---|---|
| `.card`, `.card-header`, `.card-body` | Khối nhập nhận xét, khối kết luận, khối comments list |
| `.action-edit-layout` (flex + gap 8px) | Hàng nút Đồng ý / Yêu cầu sửa |
| `.comment-box` + `border-bottom: 1px solid #f1f5f9` | Mỗi comment cha (theo user) |
| `.content-comment-box` + `.duyet-comment` / `.yeucausua-comment` (border-left 3px) | Body từng comment con |
| `.comment-actions` (flex meta hàng) | Hàng created_at + "Phản hồi" |
| `.reply-layout`, `.reply-item`, `.content-comment-box-left`, `.my-reply-comment` | Toàn bộ phần reply |
| `.reply-form` (flex, gap 8px, align flex-end) | Form gửi phản hồi |
| `.chairman-card` | Khối kết luận chủ tịch |

**Không** đưa vào: `.detail-shell`, `.detail-header`, sticky header, 2-column grid, `.stat-tag`, `.undo-banner` (ngoài phạm vi đã chốt).

---

## 3. Cấu trúc mới (template)

```html
<div *ngIf="kd_hoidong || kd_uyvien || (list_comment?.length)" class="layout-duyet-form-de">

  <!-- A. Card: Nhập nhận xét (ủy viên / hội đồng, status ≠ 1) -->
  <div class="card comment-card"
       *ngIf="(kd_uyvien || kd_hoidong) && (!courseFormDuyet || courseFormDuyet.status !== 1)">
    <div class="card-header">
      <h6 class="mb-0">Nhập nhận xét</h6>
    </div>
    <div class="card-body">
      <textarea class="form-control comment-textarea"
                placeholder="Nhập nội dung nhận xét trước khi duyệt hoặc yêu cầu sửa..."
                [(ngModel)]="textComment"></textarea>
      <div class="action-edit-layout">
        <button (click)="saveComment(1)" class="btn btn-primary">
          <i class="pi pi-check"></i> Đồng ý duyệt
        </button>
        <button (click)="saveComment(-1)" class="btn btn-danger">
          <i class="pi pi-pencil"></i> Yêu cầu sửa
        </button>
      </div>
    </div>
  </div>

  <!-- B. Card: Kết luận chủ tịch hội đồng (kd_hoidong, status ≠ ±1) -->
  <div class="card chairman-card"
       *ngIf="kd_hoidong && (!courseFormDuyet || (courseFormDuyet.status !== -1 && courseFormDuyet.status !== 1))">
    <div class="card-header">
      <h6 class="mb-0">Kết luận của chủ tịch hội đồng</h6>
    </div>
    <div class="card-body">
      <button class="btn btn-primary" (click)="duyetNoidung(1)">
        <i class="pi pi-check"></i> Đồng ý duyệt
      </button>
      <button class="btn btn-danger" (click)="duyetNoidung(-1)">
        <i class="pi pi-pencil"></i> Yêu cầu sửa
      </button>
    </div>
  </div>

  <!-- C. Card: Danh sách nhận xét -->
  <div class="card comments-list-card" *ngIf="list_comment?.length">
    <div class="card-header">
      <h6 class="mb-0">Nhận xét hội đồng ({{ list_comment.length }})</h6>
    </div>
    <div class="card-body">
      <div *ngFor="let comment of list_comment; index as index" class="comment-box">
        <div class="comment-header">
          <span class="comment-author">{{ comment.display_name }}:</span>
        </div>

        <div *ngIf="comment.children?.length">
          <div *ngFor="let children of comment.children" class="comment-child">
            <!-- bubble status -->
            <div class="content-comment-box"
                 [ngClass]="children.status === 1 ? 'duyet-comment' : 'yeucausua-comment'">
              <div class="content-comment-inner-box" [innerHTML]="children.comment"></div>
            </div>

            <div class="comment-actions">
              <span class="comment-date">{{ children.created_at | ovicDateTime }}</span>
              <span class="comment-reply-btn" (click)="openReply(children, index)">
                Phản hồi ({{ children.count_reply }})
              </span>
            </div>

            <!-- Reply -->
            <div *ngIf="children.reply_open === true" class="reply-layout">
              <div class="list-reply-comments">
                <div *ngFor="let reply of children.reply_comments" class="reply-item">
                  <div class="reply-author">{{ reply.display_name }}</div>
                  <div class="content-comment-box-left"
                       [ngClass]="reply.my_reply_comment ? 'my-reply-comment' : ''">
                    <div class="content-comment-inner-box-left" [innerHTML]="reply.comment"></div>
                  </div>
                  <div class="reply-date">{{ reply.created_at | ovicDateTime }}</div>
                </div>
              </div>

              <div class="reply-form"
                   *ngIf="kd_hoidong || kd_uyvien || (selectedCourse && userId === selectedCourse.creator_plan_id)">
                <textarea class="form-control reply-textarea"
                          placeholder="Nhập phản hồi..."
                          [(ngModel)]="children.textarea_comment"></textarea>
                <button class="btn btn-primary btn-sm" (click)="saveCommentReply(children, index)">
                  <i class="pi pi-send"></i> Gửi phản hồi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>
```

### Khác biệt so với reference (cố ý)
- **Bỏ** `text-decoration: underline` mặc định trên `.comment-author` để tránh cảm giác "link"; vẫn giữ font-weight 600 + màu `#1e293b`.
- **Bỏ** avatar `a_none.jpg` trong reply form (reference không dùng).
- **Bỏ** `position: absolute` cho nút gửi reply; nút nằm dưới textarea theo `.reply-form { display: flex; gap: 8px; align-items: flex-end; }` của reference.
- **Bỏ** khối `<div class="hozion-lay">` chứa label "KẾT LUẬN CỦA CHỦ TỊCH HỘI ĐỒNG:" → label được dời lên `.card-header h6` của `chairman-card`.

---

## 4. CSS thay thế (`duyet-form-de.component.css`)

Xoá toàn bộ file cũ. Định nghĩa mới (copy/đối chiếu reference, scope theo `.layout-duyet-form-de`):

```css
.layout-duyet-form-de {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 14px;
  line-height: 1.5;
}

/* ── Card primitives ──────────────────────────────── */
.layout-duyet-form-de .card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}
.layout-duyet-form-de .card-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}
.layout-duyet-form-de .card-header h6 { margin: 0; color: #1e293b; }
.layout-duyet-form-de .card-body { padding: 16px; }

/* ── Comment form ────────────────────────────────── */
.comment-card .comment-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  resize: vertical;
  font-size: 14px;
  margin-bottom: 12px;
}
.comment-card .comment-textarea:focus { border-color: #3b82f6; outline: none; }
.action-edit-layout {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.action-edit-layout .btn { line-height: 1; }

/* ── Chairman card ───────────────────────────────── */
.chairman-card .card-body {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.chairman-card .btn { line-height: 1; min-width: 150px; }

/* ── Comments list ───────────────────────────────── */
.comment-box {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}
.comment-box:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

.comment-header { margin-bottom: 8px; }
.comment-author { font-weight: 600; color: #1e293b; }

.comment-child { margin-top: 8px; }
.comment-child + .comment-child { margin-top: 12px; }

.content-comment-box {
  padding: 10px 14px;
  border-radius: 6px;
  background: #f8fafc;
}
.duyet-comment { border-left: 3px solid #22c55e; }
.yeucausua-comment { border-left: 3px solid #ef4444; }

.content-comment-inner-box {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  white-space: break-spaces;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 6px;
  margin-left: 14px;
}
.comment-date { font-size: 12px; color: #898989; font-style: italic; }
.comment-reply-btn { font-size: 13px; color: #3b82f6; cursor: pointer; }
.comment-reply-btn:hover { text-decoration: underline; }

/* ── Reply ───────────────────────────────────────── */
.reply-layout { margin-top: 12px; margin-left: 14px; }
.reply-item { margin-bottom: 12px; }
.reply-author {
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 4px;
}
.content-comment-box-left {
  padding: 8px 12px;
  border-radius: 6px;
  background: #f0f9ff;
}
.my-reply-comment { background: #e0f2fe; }
.content-comment-inner-box-left {
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
  white-space: break-spaces;
}
.reply-date {
  text-align: right;
  font-size: 12px;
  color: #898989;
  font-style: italic;
  margin-top: 4px;
  margin-right: 10px;
}
.reply-form {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-top: 12px;
}
.reply-textarea {
  flex: 1;
  min-height: 36px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  resize: none;
}
```

---

## 5. Không đụng tới `.ts`

Tất cả logic (`saveComment`, `duyetNoidung`, `openReply`, `saveCommentReply`, `loadCommentAndStatus`) giữ nguyên. Bindings không đổi:
- `[(ngModel)]="textComment"` ✅
- `[(ngModel)]="children['textarea_comment']"` ✅
- `(click)="openReply(children, index)"` ✅
- `(click)="saveCommentReply(children, index)"` ✅

→ Plan tuân thủ `feedback_question_answer_parser_changes` (không đổi answer parser).

---

## 6. Acceptance criteria

1. Khi không có comment và user không phải ủy viên/hội đồng → component không render (giữ `*ngIf` ngoài cùng).
2. 3 khối A/B/C luôn nằm dọc với `gap: 16px`, mỗi khối là một `.card`.
3. Comment con duyệt → border-left xanh `#22c55e`; yêu cầu sửa → đỏ `#ef4444`. Background neutral `#f8fafc`.
4. Hàng meta (ngày + Phản hồi) thẳng hàng, không xuống dòng trên desktop ≥ 1024px.
5. Reply textarea + nút "Gửi phản hồi" cùng hàng (không còn `position: absolute`), nút không che textarea khi resize.
6. Click nút Đồng ý/Yêu cầu sửa của ủy viên hoặc hội đồng → vẫn gọi đúng `saveComment(±1)` / `duyetNoidung(±1)` như cũ.
7. Khi `courseFormDuyet.status === 1` → cả khối A và B ẩn (như cũ).
8. Không còn `style="..."` inline trong template (trừ các thuộc tính do thư viện third-party yêu cầu — không có).

---

## 7. Thứ tự triển khai

1. **CSS:** ghi đè toàn bộ `duyet-form-de.component.css` theo mục 4.
2. **HTML:** thay nội dung `duyet-form-de.component.html` theo mục 3.
3. **TS:** không sửa.
4. **Static review:** tự kiểm tra binding & ngClass còn khớp với TS (không build/test theo memory).

---

## Quyết định cuối (chốt từ Open questions)

1. **Nút "Đồng ý duyệt" của ủy viên** → dùng `.btn-primary` (project chưa có `.btn-success`).
2. **Header card A** → giữ nguyên text `"Nhập nhận xét"`, không append label động theo `typeForm`.
3. **Status -1 banner** → KHÔNG thêm. Giữ im lặng như hiện tại.
4. **Empty state card C** → CÓ. Khi `list_comment?.length === 0` vẫn render card C với:
   ```html
   <div class="text-muted text-center py-3">Chưa có nhận xét hội đồng</div>
   ```
   Cập nhật điều kiện ngoài cùng để card C luôn hiển thị nếu user là ủy viên/hội đồng (kể cả khi list rỗng).
5. **Icon library** → hợp nhất `pi pi-*` (PrimeIcons). Thay `<i class="fa fa-paper-plane"></i>` ở nút "Gửi phản hồi" → `<i class="pi pi-send"></i>`.

### Điều chỉnh template theo các quyết định trên

**Nút Đồng ý duyệt (mục 3 — card A):**
```html
<button (click)="saveComment(1)" class="btn btn-primary">
  <i class="pi pi-check"></i> Đồng ý duyệt
</button>
```

**Card C (empty state):**
```html
<div class="card comments-list-card"
     *ngIf="kd_hoidong || kd_uyvien || list_comment?.length">
  <div class="card-header">
    <h6 class="mb-0">Nhận xét hội đồng ({{ list_comment?.length || 0 }})</h6>
  </div>
  <div class="card-body">
    <div *ngIf="!list_comment?.length" class="text-muted text-center py-3">
      Chưa có nhận xét hội đồng
    </div>
    <div *ngFor="let comment of list_comment; index as index" class="comment-box">
      ...
    </div>
  </div>
</div>
```

**Nút Gửi phản hồi:**
```html
<button class="btn btn-primary btn-sm" (click)="saveCommentReply(children, index)">
  <i class="pi pi-send"></i> Gửi phản hồi
</button>
```

### Cập nhật điều kiện `*ngIf` ngoài cùng `.layout-duyet-form-de`

Vì card C hiển thị empty state khi user là ủy viên/hội đồng, điều kiện hiện tại đã phủ:
```
*ngIf="kd_hoidong || kd_uyvien || (list_comment && list_comment.length)"
```
→ giữ nguyên, không cần thay đổi.
