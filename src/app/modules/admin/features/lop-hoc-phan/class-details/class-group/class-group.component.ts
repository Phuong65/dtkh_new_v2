import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ClassGroup } from '@modules/shared/models/class-group';
import { ClassGroupMember } from '@modules/shared/models/class-group-member';
import { ClassStudent } from '@modules/shared/models/class-student';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassGroupMemberService } from '@modules/shared/services/class-group-member.service';
import { ClassGroupService } from '@modules/shared/services/class-group.service';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { SharedModule } from '@modules/shared/shared.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Observable, forkJoin, of } from 'rxjs';
import { finalize, mergeMap } from 'rxjs/operators';

interface ClassGroupView extends ClassGroup {
    members: ClassGroupMember[];
    memberStudents: ClassStudent[];
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        DialogModule,
        TableModule,
        MatProgressBarModule,
    ],
    selector: 'app-class-group',
    templateUrl: './class-group.component.html',
    styleUrls: ['./class-group.component.css']
})
export class ClassGroupComponent implements OnInit, OnChanges {
    @Input() classSelected: Classes;

    listClassGroup: ClassGroupView[] = [];
    listStudent: ClassStudent[] = [];
    studentGroupName: { [studentId: number]: string } = {};
    selectedStudents: ClassStudent[] = [];
    selectedClassGroup: ClassGroupView = null;
    selectedStudentIds: number[] = [];
    selectedStudentMap: { [studentId: number]: boolean } = {};
    displayGroupDialog = false;
    displayBulkCreateDialog = false;
    displayStudentDialog = false;
    displayMemberDialog = false;
    displayProgressDialog = false;
    formTitle = 'Sửa nhóm';
    progressValue = 0;
    loading = false;
    groupTotal: number = null;
    groupForm: FormGroup;
    studentSearchTerm = '';
    filteredStudents: ClassStudent[] = [];

    constructor(
        private formBuilder: FormBuilder,
        private helperService: HelperService,
        private notificationService: NotificationService,
        private classGroupService: ClassGroupService,
        private classStudentService: ClassStudentService,
        private classGroupMemberService: ClassGroupMemberService
    ) {
        this.groupForm = this.formBuilder.group({
            name: ['', Validators.required],
            ordering: [1, [Validators.required, Validators.min(1)]],
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    onStudentSearchChange(): void {
        this.filterStudents();
    }

    private filterStudents(): void {
        const term = this.helperService.slugVietnamese(this.studentSearchTerm.trim().toLowerCase());
        if (!term) {
            this.filteredStudents = [...this.listStudent];
            return;
        }
        this.filteredStudents = this.listStudent.filter(student => {
            const name = this.helperService.slugVietnamese((student.user_info?.full_name || student.user_info?.name || '').toLowerCase());
            const code = (student.user_info?.student_code || '').toLowerCase();
            return name.includes(term) || code.includes(term);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['classSelected'] && !changes['classSelected'].firstChange) {
            this.resetState();
            this.loadData();
        }
    }

    loadData(): void {
        if (!this.classSelected || !this.classSelected.id) {
            this.resetState();
            return;
        }
        this.loading = true;
        this.notificationService.isProcessing(true);
        forkJoin([
            this.classGroupService.getClassGroupByPageNew(this.buildClassGroupCondition()),
            this.classStudentService.getClassStudentByPageNew(this.buildClassStudentCondition()),
            this.classGroupMemberService.getClassGroupMemberByPageNew(this.buildClassGroupMemberCondition()),
        ]).pipe(finalize(() => {
            this.loading = false;
            this.notificationService.isProcessing(false);
        })).subscribe({
            next: ([_group, _student, _member]) => {
                const members = _member.data || [];
                this.listStudent = (_student.data || []);
                this.listClassGroup = (_group.data || []).map(group => {
                    const groupMembers = members.filter(member => member.class_group_id === group.id);
                    const memberStudentIds = groupMembers.map(member => member.student_id);
                    return {
                        ...group,
                        members: groupMembers,
                        memberStudents: this.listStudent.filter(student => memberStudentIds.includes(student.student_id)),
                    };
                }).sort((a, b) => a.ordering - b.ordering);
                this.updateStudentGroupNameMap();
                this.updateSelectedStudents();
                this.filterStudents();
            },
            error: () => this.notificationService.toastError('Tải dữ liệu nhóm thất bại'),
        });
    }

    openEditGroup(classGroup: ClassGroupView): void {
        this.formTitle = 'Sửa nhóm';
        this.selectedClassGroup = classGroup;
        this.groupForm.reset({ name: classGroup.name, ordering: classGroup.ordering });
        this.displayGroupDialog = true;
    }

    saveGroup(): void {
        if (!this.ensureClassSelected() || !this.selectedClassGroup || this.groupForm.invalid) {
            this.groupForm.markAllAsTouched();
            return;
        }
        if (this.hasDuplicateGroupName()) {
            this.notificationService.toastWarning('Tên nhóm đã tồn tại trong lớp');
            return;
        }
        const payload = {
            class_id: this.classSelected.id,
            name: this.groupForm.value.name.trim(),
            ordering: Number(this.groupForm.value.ordering),
        };
        this.loading = true;
        this.classGroupService.updateClassGroup(this.selectedClassGroup.id, payload).pipe(finalize(() => this.loading = false)).subscribe({
            next: () => {
                this.notificationService.toastSuccess('Lưu nhóm thành công');
                this.displayGroupDialog = false;
                this.loadData();
            },
            error: () => this.notificationService.toastError('Lưu nhóm thất bại'),
        });
    }

    openBulkCreate(): void {
        if (!this.ensureClassSelected()) {
            return;
        }
        this.groupTotal = null;
        this.displayBulkCreateDialog = true;
    }

    createGroups(): void {
        if (!this.ensureClassSelected() || !this.groupTotal || this.groupTotal < 1) {
            this.notificationService.toastWarning('Vui lòng nhập số nhóm lớn hơn 0');
            return;
        }
        const runCreate = () => {
            const requests: Observable<any>[] = this.buildClearClassGroupRequests();
            for (let i = 1; i <= this.groupTotal; i++) {
                requests.push(this.classGroupService.addClassGroup({
                    class_id: this.classSelected.id,
                    name: 'Nhóm '.concat(i.toString()),
                    ordering: i,
                }));
            }
            this.runSequential(requests).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Tạo nhóm thành công');
                    this.displayBulkCreateDialog = false;
                    this.loadData();
                },
                error: () => this.notificationService.toastError('Tạo nhóm thất bại'),
            });
        };
        if (this.listClassGroup.length) {
            this.notificationService.confirmDelete('Lớp đã có nhóm. Tạo lại nhóm sẽ xóa toàn bộ nhóm và thành viên nhóm hiện tại. Bạn có chắc chắn?').then(confirmed => {
                if (confirmed) {
                    runCreate();
                }
            }, () => null);
        } else {
            runCreate();
        }
    }

    deleteGroup(classGroup: ClassGroupView): void {
        this.notificationService.confirmDelete('Bạn có chắc chắn muốn xóa nhóm này?').then(confirmed => {
            if (!confirmed) {
                return;
            }
            this.runSequential([
                this.classGroupMemberService.deleteClassGroupMemberByCol(classGroup.id.toString(), 'class_group_id'),
                this.classGroupService.deleteClassGroup(classGroup.id),
            ]).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Xóa nhóm thành công');
                    this.loadData();
                },
                error: () => this.notificationService.toastError('Xóa nhóm thất bại'),
            });
        }, () => null);
    }

    openStudentDialog(classGroup: ClassGroupView): void {
        if (!this.listStudent.length) {
            this.notificationService.toastWarning('Lớp chưa có sinh viên để phân nhóm');
            return;
        }
        this.selectedClassGroup = classGroup;
        this.selectedStudentIds = classGroup.members.map(member => member.student_id);
        this.updateSelectedStudents();
        this.displayStudentDialog = true;
    }

    openMemberList(classGroup: ClassGroupView): void {
        this.selectedClassGroup = classGroup;
        this.displayMemberDialog = true;
    }

    toggleStudent(student: ClassStudent): void {
        const index = this.selectedStudentIds.indexOf(student.student_id);
        if (index === -1) {
            this.selectedStudentIds.push(student.student_id);
        } else {
            this.selectedStudentIds.splice(index, 1);
        }
        this.updateSelectedStudents();
    }

    saveStudentsForGroup(): void {
        if (!this.ensureClassSelected() || !this.selectedClassGroup) {
            return;
        }
        const requests = this.buildSaveGroupMemberRequests();
        this.runSequential(requests).subscribe({
            next: () => {
                this.notificationService.toastSuccess('Lưu sinh viên vào nhóm thành công');
                this.displayStudentDialog = false;
                this.loadData();
            },
            error: () => this.notificationService.toastError('Lưu sinh viên vào nhóm thất bại'),
        });
    }

    randomClassGroup(): void {
        if (!this.ensureClassSelected()) {
            return;
        }
        if (!this.listClassGroup.length) {
            this.notificationService.toastWarning('Vui lòng tạo nhóm trước khi phân nhóm ngẫu nhiên');
            return;
        }
        if (!this.listStudent.length) {
            this.notificationService.toastWarning('Lớp chưa có sinh viên để phân nhóm');
            return;
        }
        this.notificationService.confirmDelete('Phân nhóm ngẫu nhiên sẽ thay đổi toàn bộ thành viên nhóm hiện tại. Bạn có chắc chắn?').then(confirmed => {
            if (!confirmed) {
                return;
            }
            const shuffledStudents = this.shuffleStudents(this.listStudent);
            const members = shuffledStudents.map((student, index) => ({
                class_id: this.classSelected.id,
                class_group_id: this.listClassGroup[index % this.listClassGroup.length].id,
                student_id: student.student_id,
            }));
            this.replaceClassMembers(members).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Phân nhóm ngẫu nhiên thành công');
                    this.loadData();
                },
                error: () => this.notificationService.toastError('Phân nhóm ngẫu nhiên thất bại'),
            });
        }, () => null);
    }

    trackByStudentId(index: number, item: ClassStudent): number {
        return item.student_id || index;
    }

    private buildSaveGroupMemberRequests(): Observable<any>[] {
        const requests: Observable<any>[] = [
            this.classGroupMemberService.deleteClassGroupMemberByCol(this.selectedClassGroup.id.toString(), 'class_group_id'),
        ];
        this.listClassGroup.forEach(group => {
            if (group.id !== this.selectedClassGroup.id) {
                group.members.filter(member => this.selectedStudentIds.includes(member.student_id)).forEach(member => {
                    requests.push(this.classGroupMemberService.deleteClassGroupMember(member.id));
                });
            }
        });
        this.selectedStudentIds.forEach(studentId => requests.push(this.classGroupMemberService.addClassGroupMember({
            class_id: this.classSelected.id,
            class_group_id: this.selectedClassGroup.id,
            student_id: studentId,
        })));
        return requests;
    }

    private replaceClassMembers(members: ClassGroupMember[]): Observable<any> {
        return this.runSequential([
            this.classGroupMemberService.deleteClassGroupMemberByCol(this.classSelected.id.toString(), 'class_id'),
            ...members.map(member => this.classGroupMemberService.addClassGroupMember({
                class_id: member.class_id,
                class_group_id: member.class_group_id,
                student_id: member.student_id,
            })),
        ]);
    }

    private buildClearClassGroupRequests(): Observable<any>[] {
        return [
            this.classGroupMemberService.deleteClassGroupMemberByCol(this.classSelected.id.toString(), 'class_id'),
            this.classGroupService.deleteClassGroupByCol(this.classSelected.id.toString(), 'class_id'),
        ];
    }

    private runSequential(requests: Observable<any>[]): Observable<any> {
        if (!requests.length) {
            return of(null);
        }
        this.progressValue = 0;
        this.displayProgressDialog = true;
        return requests.reduce((previous, request, index) => previous.pipe(mergeMap(() => {
            this.progressValue = index / requests.length * 100;
            return request;
        })), of(null)).pipe(mergeMap(() => {
            this.progressValue = 100;
            this.displayProgressDialog = false;
            return of(null);
        }), finalize(() => this.displayProgressDialog = false));
    }

    private buildClassGroupCondition(): ConditionOption {
        return {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null,
        };
    }

    private buildClassStudentCondition(): ConditionOption {
        return {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'student_id,user_info,ordering' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null,
        };
    }

    private buildClassGroupMemberCondition(): ConditionOption {
        return {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null,
        };
    }

    private updateStudentGroupNameMap(): void {
        this.studentGroupName = {};
        this.listClassGroup.forEach(group => {
            group.members.forEach(member => {
                this.studentGroupName[member.student_id] = group.name;
            });
        });
    }

    private updateSelectedStudents(): void {
        this.selectedStudentMap = {};
        this.selectedStudentIds.forEach(studentId => this.selectedStudentMap[studentId] = true);
        this.selectedStudents = this.listStudent.filter(student => this.selectedStudentMap[student.student_id]);
    }

    private hasDuplicateGroupName(): boolean {
        const name = this.groupForm.value.name ? this.groupForm.value.name.trim() : '';
        const slug = this.helperService.slugVietnamese(name);
        return this.listClassGroup.some(group => {
            if (this.selectedClassGroup && group.id === this.selectedClassGroup.id) {
                return false;
            }
            return this.helperService.slugVietnamese(group.name) === slug;
        });
    }

    private shuffleStudents(students: ClassStudent[]): ClassStudent[] {
        const result = [...students];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    private ensureClassSelected(): boolean {
        if (!this.classSelected || !this.classSelected.id) {
            this.notificationService.toastWarning('Vui lòng chọn lớp học phần');
            return false;
        }
        return true;
    }

    private resetState(): void {
        this.listClassGroup = [];
        this.listStudent = [];
        this.studentGroupName = {};
        this.selectedStudents = [];
        this.selectedStudentMap = {};
        this.selectedClassGroup = null;
        this.selectedStudentIds = [];
        this.displayGroupDialog = false;
        this.displayBulkCreateDialog = false;
        this.displayStudentDialog = false;
        this.displayMemberDialog = false;
        this.displayProgressDialog = false;
        this.studentSearchTerm = '';
        this.filteredStudents = [];
    }
}
