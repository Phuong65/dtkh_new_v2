import { HelperService } from '@core/services/helper.service';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { CourseCloService } from './../../../../shared/services/course-clo.service';
import { Component, OnInit, inject, viewChild } from '@angular/core';

import { NotificationService } from '@core/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { mergeMap, forkJoin, of, Observable } from 'rxjs';
import { UserService } from '@core/services/user.service';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { key_server } from '@env';
import { AuthService } from '@core/services/auth.service';
import { CHUAN_DAU_RA, ROLES } from '@modules/shared/utils/syscat';
import { SharedModule } from '@modules/shared/shared.module';
import { ButtonModule } from 'primeng/button';
import { Panel, PanelModule } from 'primeng/panel';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseClo } from '@modules/shared/models/course-clo';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CdkDragDrop, CdkDragEnd, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { MatListModule } from '@angular/material/list';
import { PickListModule } from 'primeng/picklist';

@Component({
    selector: 'app-quanly-clo',
    standalone: true,
    imports: [
    SharedModule,
    ButtonModule,
    PanelModule,
    ReactiveFormsModule,
    FormsModule,
    NgbTooltipModule,
    DragDropModule,
    MatListModule,
    PickListModule
],
    templateUrl: './quanly-clo.component.html',
    styleUrls: ['./quanly-clo.component.css']
})
export class QuanlyCloComponent implements OnInit {

    readonly panelAddClo = viewChild<Panel>('panelAddClo');

    courseSelected: ElnKhoaHoc;

    indexByKeyServerInSotinchi: number;

    key_server = key_server;

    canAdded: boolean = false;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isAdmin: boolean = false;

    EXAMFORMAT = EXAMFORMAT;

    CHUAN_DAU_RA = CHUAN_DAU_RA;

    collapsedPanelAddClo: boolean = true;

    formClo: FormGroup;

    formReady: boolean = false;

    listClo: CourseClo[];

    selectedClo: CourseClo;

    isUpdated: boolean = false;

    listPlan: CoursePlanActivities[] = [];

    plan_no_clo: CoursePlanActivities[] = [];

    plan_in_clo: CoursePlanActivities[] = [];

    selectedClo_for_target: CourseClo;
    private notificationService = inject(NotificationService);
    private activatedRoute = inject(ActivatedRoute);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private donViService = inject(DonViService);
    private userService = inject(UserService);
    private auth = inject(AuthService);
    private router = inject(Router);
    formBuilder = inject(FormBuilder);
    private courseCloService = inject(CourseCloService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private helperService = inject(HelperService);

    constructor() {
        this.formClo = this.formBuilder.group(
            {
                title: ['', Validators.required],
                desc: [''],
                ordering: [''],
                kyhieu: ['', Validators.required],
                course_id: [''],
                cdr: ['']
            }
        );
    }

    get f() {
        return this.formClo.controls;
    }

    ngOnInit(): void {
        this.notificationService.setCloseLeftMenu(true);
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isAdmin = this.auth.userHasRole(ROLES.manager);
        this.initData();
    }

    initData() {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                this.notificationService.isProcessing(true);

                const courseId = params['code'];

                const condition_course: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'id',
                            condition: OvicQueryCondition.equal,
                            value: courseId,
                        },
                    ],

                    set: [],

                    page: null,
                };

                this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course).pipe(mergeMap((_course) => {
                    if (_course.recordsFiltered) {
                        return forkJoin([
                            this.donViService.getDonViById(_course.data[0].category_ids),
                            this.userService.getUserByItem(_course.data[0].creator_plan_id.toString(), 'id'),
                        ]).pipe(
                            mergeMap(([_donvi, _user]) => {

                                if (_donvi) {
                                    _course.data[0]['khoa_label'] = _donvi.title;
                                }

                                if (_user.length) {
                                    _course.data[0]['user_label'] = _user[0].display_name;
                                }

                                return of(_course);
                            })
                        );
                    }
                    return of(_course);
                })).subscribe({
                    next: (_course) => {
                        this.notificationService.isProcessing(false);

                        this.formReady = true;

                        if (_course.recordsFiltered) {

                            this.courseSelected = _course.data[0];

                            this.indexByKeyServerInSotinchi = key_server == 'hvu' ? (this.courseSelected.params.sotinchi == 2 ? 1 : ([3, 4].includes(this.courseSelected.params.sotinchi) ? 2 : null)) : this.courseSelected.params.sotinchi;

                            this.auth.setFeatureSecondary(''.concat('[', this.courseSelected.maso, '] - ', this.courseSelected.title));

                            this.canAdded = this.isManager || this.isLanhDaoKhoa || this.auth.user.id === _course.data[0].creator_plan_id ? true : false;

                            if (this.canAdded) {
                                this.loadClo();
                            } else {
                                this.notificationService.toastError('Không tìm thấy nội dung giảng dạy, vui lòng kiểm tra lại');
                                this.router.navigate(['/admin/content-none']);
                            }

                        } else {
                            this.notificationService.toastError('Không tìm thấy nội dung giảng dạy, vui lòng kiểm tra lại');
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                        this.router.navigate(['/admin/content-none']);
                    }
                })
            } else {
                this.notificationService.toastError('Không tìm thấy môn học');
                this.router.navigate(['/admin/content-none']);
            }
        })
    }


    resetForm() {
        this.formClo.reset();
        this.f['course_id'].setValue(this.courseSelected.id);
        this.f['cdr'].setValue(this.courseSelected.params.cdr);
        this.isUpdated = false;
        if (this.listClo && this.listClo.length) {
            this.f['kyhieu'].setValue("CLO".concat((this.listClo.length + 1).toString()));
            this.f['ordering'].setValue(this.listClo.length + 1);
        } else {
            this.f['kyhieu'].setValue("CLO1");
            this.f['ordering'].setValue(1);
        }
    }

    openAddPanel() {
        this.panelAddClo()['animating'] = true;
        this.collapsedPanelAddClo = false;
        this.resetForm();
    }

    closeFormAdd() {
        this.panelAddClo()['animating'] = true;
        this.collapsedPanelAddClo = true;
    }

    loadClo() {
        const conditionClo: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }

        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'PLAN', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'week' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        }


        forkJoin([
            this.courseCloService.getCourseCloByPageNew(conditionClo),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan)
        ]).subscribe({
            next: ([_clo, _plan]) => {
                this.listClo = _clo.data;
                this.listPlan = _plan.data;
                this.plan_no_clo = _plan.data.filter(m => m.course_clo_id === 0);
                this.resetForm();
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    saveClo() {
        if (this.formClo.valid) {
            const data = { ... this.formClo.getRawValue() };
            this.notificationService.isProcessing(true);
            if (this.isUpdated) {
                this.courseCloService.updateCourseClo(this.selectedClo.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Sửa thành công");
                        this.closeFormAdd();
                        this.loadClo();
                    },
                    error: () => {
                        this.notificationService.toastError("Sửa thất bại, vui lòng thử lại");
                        this.notificationService.isProcessing(false);
                    }
                })
            } else {
                this.courseCloService.addCourseClo(data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Thêm thành công");
                        this.loadClo();
                    },
                    error: () => {
                        this.notificationService.toastError("Thêm thất bại, vui lòng thử lại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        }
    }

    deleteClo(clo: CourseClo) {
        this.notificationService.confirmDelete(
            '- Bạn đang thực hiện lệnh xóa dữ liệu.\n' +
            '- Số thứ tự và ký hiệu có thể bị thay đổi sau khi xóa. \n' +
            '- Nếu xóa, dữ liệu sẽ không thể khôi phục được. \n' +
            '- Bạn có chắc chắn muốn xóa không?',
        ).then(a => {
            this.notificationService.isProcessing(true);
            this.coursePlanActivitiesService.updateCoursePlanActivitiesByCol(clo.id, { course_clo_id: 0 }, 'course_clo_id').pipe(mergeMap(a => {
                return this.courseCloService.deleteCourseClo(clo.id).pipe(mergeMap(() => {
                    const filter_clos = this.listClo.filter(m => m.ordering > clo.ordering);
                    let i = clo.ordering - 1;
                    const request: Observable<any>[] = [];
                    filter_clos.forEach(f => {
                        i = i + 1;
                        request.push(this.courseCloService.updateCourseClo(f.id, { ordering: i, kyhieu: 'CLO'.concat(i.toString()) }))
                    })

                    if (request.length) {
                        return forkJoin(request).pipe(a => a);
                    } else {
                        return of(null);
                    }
                }))
            })).subscribe({
                next: () => {
                    this.loadClo()
                    this.notificationService.toastSuccess("Xóa thành công");
                },
                error: () => {
                    this.notificationService.toastError("Xóa thất bại");
                }
            })
        })
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.listClo, event.previousIndex, event.currentIndex);
        const request: Observable<any>[] = [];

        this.listClo.forEach((f, key) => {
            console.log(f);
            request.push(this.courseCloService.updateCourseClo(f.id, { ordering: key + 1, kyhieu: 'CLO'.concat((key + 1).toString()) }))
        })

        if (request.length) {
            this.notificationService.isProcessing(true);
            forkJoin(request).subscribe({
                next: () => {
                    this.loadClo()
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Cập nhật thất bại");
                }
            })
        }
    }

    cdkDragStarted() {

    }

    onMoveToTarget() {
        this.plan_in_clo = this.helperService.sort(this.plan_in_clo, 'week');
    }

    onMoveToSource() {
        this.plan_no_clo = this.helperService.sort(this.plan_no_clo, 'week');
    }

    onSelectClo(clo: CourseClo) {
        this.selectedClo_for_target = clo;
    }
}
