# Plan: Thêm thao tác nhóm cho Thường xuyên - Tự luận

## 1. Mục tiêu

Áp dụng tính năng thao tác nhóm (hiện có ở `thuongxuyen-tracnghiem`) vào `thuongxuyen-tuluan`:
- Chọn nhóm từ dropdown
- Điểm danh vắng mặt nhóm (`lock = 1`)
- Điểm danh có mặt nhóm (`lock = 0`)
- **Không** áp dụng thu bài nhóm (`submit`) vì tự luận không có luồng thi realtime như trắc nghiệm

## 2. File cần sửa

| File | Vai trò |
|------|---------|
| `thuongxuyen-tuluan.component.ts` | Thêm logic nhóm, service, state, methods |
| `thuongxuyen-tuluan.component.html` | Thêm dropdown chọn nhóm + 2 nút action + dialog xác nhận |
| `thuongxuyen-tuluan.component.css` | *(không cần — đã có style kế thừa)* |

## 3. Thay đổi chi tiết

### 3.1. `thuongxuyen-tuluan.component.ts`

#### a) Import (thêm vào đầu file)
```typescript
import { ClassGroupService } from '@modules/shared/services/class-group.service';
import { ClassGroupMemberService } from '@modules/shared/services/class-group-member.service';
import { ClassGroup } from '@modules/shared/models/class-group';
import { finalize } from 'rxjs';
```

#### b) Inject (thêm vào constructor)
```typescript
private classGroupService: ClassGroupService,
private classGroupMemberService: ClassGroupMemberService
```

#### c) State properties (thêm sau `filter_status_html`)
```typescript
/** ===== Nhóm sinh viên ===== */
classGroups: ClassGroup[] = [];
selectedGroupId: number | null = null;
selectedGroupStudents: ClassStudent[] = [];
selectedGroupMemberStudentIds: number[] = [];
displayGroupActionConfirm: boolean = false;
groupActionType: 'diemdanh' | 'huy_diemdanh' = 'diemdanh';
groupActionMessage: string = '';
groupActionCount: number = 0;
showNew: boolean = true;
```

#### d) Methods cần thêm

1. **`loadGroups()`** — giống hệt bên tracnghiem, load danh sách nhóm theo `classSelected.id`
2. **`onGroupChange()`** — giống bên tracnghiem, lấy `student_id` từ `ClassGroupMemberService`
3. **`openGroupActionConfirm(actionType)`** — chỉ nhận `'diemdanh'` | `'huy_diemdanh'`, set message + show dialog
4. **`queryTestsByStudentIds(studentIds)`** — query bài test tự luận theo danh sách student_id (dùng `ClassPlanActivityTuluanService`)
5. **`confirmGroupAction()`** — xử lý 2 nhánh:
   - `diemdanh`: gọi `queryTestsByStudentIds()` → lọc test hợp lệ → gọi `updateClassPlanActivityTuluan(test.id, { lock: 1 })` tuần tự
   - `huy_diemdanh`: tương tự với `{ lock: 0 }`

#### e) Gọi `loadGroups()` trong lifecycle

Thêm `this.loadGroups()` vào `ngOnChanges()` sau `this.loadStudentAndTest()`, vì tại đó `classSelected` đã có.

#### f) Lưu ý khác biệt với tracnghiem

- Không dùng `ClassPlanActivitiesTestsService` — mà dùng `ClassPlanActivityTuluanService`
- Không có `loopAddFormWithTracking()` vì không cần tracking phức tạp (không có `submit`)
- Không cần `buildStudentUserMap()` (không có `received_by`)
- API update: `classPlanActivityTuluanService.updateClassPlanActivityTuluan(id, { lock: value })`
- Dùng `loopAddForm(request, 0)` đơn giản (đã có sẵn trong component, nhưng là của tracnghiem — cần tạo 1 version đơn giản cho tuluan) hoặc xử lý tuần tự bằng `mergeMap` + `from`

### 3.2. `thuongxuyen-tuluan.component.html`

#### a) Khu vực thao tác nhóm — thêm vào trong caption của p-table

Sau dòng caption `Tổng đề: {{tongtest+ ' / ' +tongsv}}` và trước search input, thêm:

```html
<!-- Khu vực thao tác nhóm -->
<div *ngIf="showNew && selectedActivity && selectedActivity.nhapdiem_tructiep === 0 && classGroups.length" class="flex" style="align-items: center; margin-left: 10px;">
    <p-dropdown [options]="classGroups" optionLabel="name" optionValue="id"
        [(ngModel)]="selectedGroupId" placeholder="Chọn nhóm..." appendTo="body"
        (onChange)="onGroupChange()" styleClass="p-dropdown-sm" [style]="{'min-width': '140px'}">
    </p-dropdown>
    <button (click)="openGroupActionConfirm('diemdanh')"
        style="margin-left: 3px;" class="btn btn-warning btn-icon"
        ngbTooltip="Đánh dấu vắng mặt cho tất cả thành viên trong nhóm" container="body">
        <i class="fa fa-square-o"></i>
    </button>
    <button (click)="openGroupActionConfirm('huy_diemdanh')"
        style="margin-left: 3px;" class="btn btn-primary btn-icon"
        ngbTooltip="Đánh dấu có mặt cho tất cả thành viên trong nhóm" container="body">
        <i class="fa fa-check-square-o"></i>
    </button>
</div>
```

#### b) Dialog xác nhận — thêm vào cuối template (trước thẻ đóng file)

```html
<!-- Dialog xác nhận thao tác nhóm -->
<p-dialog maskStyleClass="zindex-1000" styleClass="report-create-plan-dialog" [showHeader]="false" appendTo="body"
    position="center" [draggable]="false" [resizable]="false" [modal]="true" [(visible)]="displayGroupActionConfirm"
    [style]="{width: '500px'}" [closable]="false">
    <div class="step-sync-plans" style="background-color: #fff;">
        <div class="step-sync-plans-header" style="display: flex; align-items: center;">
            <span style="flex: 1;">Xác nhận thao tác nhóm</span>
            <span (click)="displayGroupActionConfirm = false" class="action-span"
                style="margin-right: 0px; height: 20px; width: 20px; padding: 0px; line-height: 20px;text-align: center; cursor: pointer;">
                <i style="color: red; margin: 0px;" class="fa fa-times"></i>
            </span>
        </div>
        <div class="step-sync-plans-body">
            <div class="row form-row form-row-flex-row">
                <div class="col-12 flex-div" style="font-size: 15px; text-align: center;">
                    <p>{{groupActionMessage}}</p>
                </div>
            </div>
            <div class="row form-row form-row-flex-row" style="margin-top: 10px;">
                <div class="col-12" style="text-align: right;">
                    <button style="line-height: 1; margin-right: 10px;" (click)="confirmGroupAction()"
                        class="btn btn-primary">Xác nhận</button>
                    <button (click)="displayGroupActionConfirm = false" style="line-height: 1;"
                        class="btn btn-success">Hủy</button>
                </div>
            </div>
        </div>
    </div>
</p-dialog>
```

## 4. Luồng xử lý

1. `ngOnChanges()` → `loadGroups()` → API lấy nhóm theo `classSelected.id`
2. User chọn nhóm từ dropdown → `onGroupChange()` → API lấy `student_id` của nhóm từ `ClassGroupMemberService`
3. User click "Vắng mặt" hoặc "Có mặt" → `openGroupActionConfirm()` → hiển thị dialog xác nhận với message
4. User click "Xác nhận" → `confirmGroupAction()`:
   - Gọi `queryTestsByStudentIds(allGroupMemberIds)` lấy tất cả bài test của nhóm
   - Lọc ra các test hợp lệ (có `test_info`)
   - Tạo mảng request `updateClassPlanActivityTuluan(test.id, { lock: 1/0 })`
   - Dùng `from(requests).pipe(concatMap(...))` xử lý tuần tự
   - Toast kết quả (số thành công / tổng số)
   - Refresh lại danh sách: `loadStudentAndTest()`

## 5. Quyết định nghiệp vụ

| Quyết định | Giá trị |
|-----------|---------|
| Chỉ điểm danh nhóm, không thu bài nhóm | ✅ Vì tự luận không có realtime thi |
| Nguồn danh sách sv nhóm | `ClassGroupMemberService` — toàn bộ thành viên, không phụ thuộc trang/bộ lọc |
| Sinh viên không có bài test | Bỏ qua khi điểm danh nhóm |
| API điểm danh | `updateClassPlanActivityTuluan(id, { lock: 1/0 })` |
| Refresh sau thao tác | `loadStudentAndTest()` để đồng bộ thống kê |
| Dialog xác nhận | Giống tracnghiem, hiển thị tên nhóm + số lượng |

## 6. Kiểm tra sau khi code

1. Load component có nhóm → dropdown hiển thị đúng
2. Chọn nhóm → lấy đúng danh sách member
3. Điểm danh vắng nhóm → lock=1 cho tất cả sv có bài test
4. Điểm danh có nhóm → lock=0 cho tất cả sv có bài test
5. Sinh viên không có bài test → bỏ qua, không crash
6. Refresh sau thao tác → thống kê `tongtest/tongsv` đúng
7. Responsive: nhóm dropdown + buttons không vỡ layout ở màn hình hẹp
