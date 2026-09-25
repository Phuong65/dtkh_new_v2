import { ExportWordDanhSachService } from './../../../../../shared/services/export-word-ds-duan';
import { ElnChuyenMucService } from '@shared/services/elearning-chuyen-muc.service';
import { key_server } from '@env';
import { ExportWordChudeDuanService } from './../../../../../shared/services/export-word-chude-doan';
import { DonViService } from '@shared/services/don-vi.service';
import { CoursePlanActivityTuluanService } from './../../../../../shared/services/course-plan-activity-tuluan.service';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { ClassStudentService } from '@modules/shared/services/class-student.service';
import { ClassPlanActivityTuluanGroupService } from './../../../../../shared/services/class_plan_activity_tuluan_group.service';
import { data } from 'autoprefixer';
import { ClassPlanActivityTuluanPlanService } from './../../../../../shared/services/class-plan-activity-tuluan-plan.service';
import { request } from 'http';
import { ClassPlan } from '@app/modules/kiem-thu-ngan-hang-cau-hoi/models/class';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { CoursePlanActivitiesService } from '@shared/services/course-plan-activities.service';
import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import { ClassPlansService } from '@modules/shared/services/class-plans.service';
import { Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { OvicQueryCondition } from '@core/models/dto';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ClassPlanActivitiesService } from '@modules/shared/services/class-plan-activities.service';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { forkJoin, merge, mergeMap, Observable, of } from 'rxjs';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { BUTTON_CLOSED } from '@core/models/buttons';
import { ClassPlans } from '@modules/shared/models/class-plans';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ThuongxuyenTuluanComponent } from '../thuongxuyen-tuluan/thuongxuyen-tuluan.component';
import { MatIconModule } from '@angular/material/icon';
import { ThuongxuyenDuanComponent } from '../thuongxuyen-duan/thuongxuyen-duan.component';
import { ThuongxuyenDuanGroupComponent } from '../thuongxuyen-duan-group/thuongxuyen-duan-group.component';
import { ClassPlanActivityTuluanPlan } from '@modules/shared/models/class-plan-activity-tuluan-plan';
import { PanelModule } from 'primeng/panel';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { InputQuestionDirectionComponent } from "@modules/admin/features/cauhoi-tracnghiem/input-question-direction/input-question-direction.component";
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { ButtonModule } from 'primeng/button';
import { Tooltip, TooltipModule } from 'primeng/tooltip';
import { KatexImgDirective } from "@modules/shared/directives/katex-img.directive";
import { MatMenuModule } from '@angular/material/menu';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        PaginatorModule,
        NgbTooltipModule,
        MatListModule,
        CheckboxModule,
        DialogModule,
        DividerModule,
        MatProgressBarModule,
        ContextMenuModule,
        ThuongxuyenTuluanComponent,
        MatIconModule,
        ThuongxuyenDuanComponent,
        ThuongxuyenDuanGroupComponent,
        PanelModule,
        ReactiveFormsModule,
        FormsModule,
        CalendarModule,
        InputQuestionDirectionComponent,
        TableModule,
        LoadMediaOnTextDirective,
        ButtonModule,
        TooltipModule,
        KatexImgDirective,
        MatMenuModule
    ],
    selector: 'app-kiemtra-kynang',
    templateUrl: './kiemtra-kynang.component.html',
    styleUrls: ['./kiemtra-kynang.component.css']
})
export class KiemtraKynangComponent implements OnInit {

    @Input() classSelected: Classes;

    @ViewChild('templateListStudentTest') templateListStudentTest: TemplateRef<any>;

    @ViewChild('templateListPlanTest') templateListPlanTest: TemplateRef<any>;

    @ViewChild('panel_add') panel_add: ElementRef<any>;

    @ViewChild('scrollDiv') scrollDiv!: ElementRef;

    contextMenu: MenuItem[] = [
        {
            label: 'Mở đường liên kết trong tab mới',
            url: '#',
            command: (event) => {
                if (this.selected_class_plan_activity) {
                    const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
                    const url = this.router.serializeUrl(
                        this.router.createUrlTree(['admin/' + activeLink + '/room-test'], { queryParams: { code: this.classSelected.id, test: this.selected_class_plan_activity.id } })
                    );

                    window.open(url, '_blank');
                }
            },

        },
    ];

    list_class_plan_activities: ClassPlanActivities[] = [];

    selected_class_plan_activity: ClassPlanActivities;

    titleLayout = 'Đang tải dữ liệu, vui lòng chờ';

    class_plan_test: ClassPlans;

    list_tuluan_plan: ClassPlanActivityTuluanPlan[];

    formData: FormGroup;

    submit_type = [
        { label: 'Báo cáo trực tiếp', key: 0 },
        { label: 'Nộp file qua hệ thống', key: 1 }
    ]

    ckEditor: any = null;

    isUpdated: boolean = false;

    selectedPlanTuluan: ClassPlanActivityTuluanPlan;

    openForm: boolean = false;

    showDownloadDoan: boolean = false;

    key_server = key_server;
    constructor(
        private classPlanActivitiesService: ClassPlanActivitiesService,
        private classPlansService: ClassPlansService,
        private helperService: HelperService,
        private notificationService: NotificationService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private vicDateTimeService: OvicDateTimeService,
        private router: Router,
        private classPlanActivityTuluanPlanService: ClassPlanActivityTuluanPlanService,
        public formBuilder: FormBuilder,
        private classPlanActivityTuluanGroupService: ClassPlanActivityTuluanGroupService,
        private classStudentService: ClassStudentService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private donViService: DonViService,
        private exportWordChudeDuanService: ExportWordChudeDuanService,
        private elnChuyenMucService: ElnChuyenMucService,
        private exportWordDanhSachService: ExportWordDanhSachService
    ) {
        this.formData = this.formBuilder.group(
            {
                title: ['', Validators.required],
                desc: [''],
                date: ['', Validators.required],
                course_id: [''],
                class_id: [''],
                submit_file: ['']
            }
        );
    }

    get f() {
        return this.formData.controls;
    }

    ngOnInit(): void {
        if (this.classSelected && (this.classSelected.course_detail.params.exam_format === 'DOAN' || this.classSelected.course_detail.params.exam_format === 'DUAN')) {
            this.showDownloadDoan = true;
        }

        this.loadTestThuongXuyen();
    }

    loadTestThuongXuyen() {

        this.list_class_plan_activities = null;

        this.class_plan_test = null

        this.titleLayout = 'Đang tải dữ liệu, vui lòng chờ';

        const condition_activity: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'THUONGXUYEN_TRACNGHIEM,THUONGXUYEN_TULUAN,THUONGXUYEN_DUAN' },
                { label: 'include_by', value: 'type' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }

        this.notificationService.isProcessing(true);

        forkJoin([
            this.classPlansService.getClassPlansByPageNew(condition_plan),
            this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_activity),
        ]).subscribe({
            next: ([_plans, _activities]) => {
                if (_activities.recordsFiltered) {
                    this.list_class_plan_activities = _activities.data;
                    this.class_plan_test = _plans.data[0];
                } else {
                    this.titleLayout = 'Đồng bộ bài kiểm tra thường xuyên';
                }
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    onSelectTest(item: ClassPlanActivities) {
        this.selected_class_plan_activity = item;
        if (item.type === 'THUONGXUYEN_TRACNGHIEM') {
            const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
            this.router.navigate(['admin/' + activeLink + '/room-test'], { queryParams: { code: this.classSelected.id, test: this.selected_class_plan_activity.id } });
        } else {
            this.notificationService.openSideNavigationMenu({ template: this.templateListStudentTest, size: 1024, offsetTop: '0px' });
        }
    }

    closeSideMenu() {
        this.notificationService.closeSideNavigationMenu();
        this.selected_class_plan_activity = null;
    }

    syncTest() {
        this.notificationService.isProcessing(true);
        const condition_course_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.notEqual, value: '100', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }


        const condition_activity: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'THUONGXUYEN_TRACNGHIEM,THUONGXUYEN_TULUAN,THUONGXUYEN_DUAN' },
                { label: 'include_by', value: 'type' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_course_plan),
            this.classPlansService.getClassPlansByPageNew(condition_plan),
            this.classPlanActivitiesService.getClassPlanActivitiesByPageNew(condition_activity),
        ]).subscribe({
            next: ([_course_plan, _res_plan, _res_plan_activity]) => {


                const __plan = _res_plan.data;
                const __plan_activity = _res_plan_activity.data;

                if (_course_plan.recordsFiltered) {
                    const index = _course_plan.data.findIndex(m => m.parent_id === 0);

                    if (index !== -1) {

                        const childrent = _course_plan.data.filter(m => m.parent_id !== 0);

                        const _plan = {
                            class_id: this.classSelected.id,
                            course_id: this.classSelected.course_id,
                            week: _course_plan.data[index].week,
                            title: _course_plan.data[index].title,
                            course_plan_activity_id: _course_plan.data[index].id,
                        }





                        if (__plan[0] && __plan[0].id) {
                            this.classPlansService.updateClassPlans(__plan[0].id, _plan).pipe(mergeMap(() => {
                                const request: Observable<any>[] = [];
                                childrent.forEach(f => {
                                    if (f.type === 'THUONGXUYEN_TRACNGHIEM' || f.type === 'THUONGXUYEN_TULUAN' || f.type === 'THUONGXUYEN_DUAN') {
                                        const data_activity = {
                                            class_id: this.classSelected.id,
                                            course_id: this.classSelected.course_id,
                                            plan_id: __plan[0].id,
                                            type: f.type,
                                            ordering: f.ordering,
                                            title: f.title,
                                            desc: f.desc,
                                            desc_title: f.desc_title,
                                            params: f.params,
                                            status: 0,
                                            course_plan_activity_id: f.id,
                                        }

                                        const index_c = __plan_activity.findIndex(m => m.course_plan_activity_id === f.id);

                                        if (index_c !== -1) {
                                            request.push(this.classPlanActivitiesService.updateClassPlanActivities(__plan_activity[index_c].id, data_activity))
                                        } else {
                                            request.push(this.classPlanActivitiesService.addClassPlanActivities(data_activity))
                                        }
                                    }
                                })
                                if (request.length)
                                    return forkJoin(request).pipe(mergeMap(() => {
                                        return of(null);
                                    }))
                                return of(null);
                            })).subscribe({
                                next: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastSuccess("Đồng bộ thành công");
                                    this.loadTestThuongXuyen();
                                },
                                error: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastError("Đồng bộ thất bại");
                                }
                            })
                        } else {
                            this.classPlansService.addClassPlans(_plan).pipe(mergeMap(_plan_id => {
                                const request: Observable<any>[] = [];
                                childrent.forEach(f => {
                                    if (f.type === 'THUONGXUYEN_TRACNGHIEM' || f.type === 'THUONGXUYEN_TULUAN' || f.type === 'THUONGXUYEN_DUAN') {
                                        const data_activity = {
                                            class_id: this.classSelected.id,
                                            course_id: this.classSelected.course_id,
                                            plan_id: _plan_id,
                                            type: f.type,
                                            ordering: f.ordering,
                                            title: f.title,
                                            desc: f.desc,
                                            desc_title: f.desc_title,
                                            params: f.params,
                                            status: 0,
                                            course_plan_activity_id: f.id,
                                        }
                                        request.push(this.classPlanActivitiesService.addClassPlanActivities(data_activity))
                                    }
                                })
                                if (request.length)
                                    return forkJoin(request).pipe(mergeMap(() => {
                                        return of(null);
                                    }))
                                return of(null);
                            })).subscribe({
                                next: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastSuccess("Đồng bộ thành công");
                                    this.loadTestThuongXuyen();
                                },
                                error: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastError("Đồng bộ thất bại");
                                }
                            });
                        }
                    } else {
                        this.notificationService.isProcessing(false);
                        this.notificationService.confirm('Bài kiểm tra thường xuyên chưa được tạo, vui lòng liên hệ đến <span class="comfirm-bold">GIẢNG VIÊN PHỤ TRÁCH MÔN HỌC</span>', 'Thông báo', [BUTTON_CLOSED]).then(() => {
                        })
                    }
                } else {
                    this.notificationService.isProcessing(false);
                    this.notificationService.confirm('Bài kiểm tra thường xuyên chưa được tạo, vui lòng liên hệ đến <span class="comfirm-bold">GIẢNG VIÊN PHỤ TRÁCH MÔN HỌC</span>', 'Thông báo', [BUTTON_CLOSED]).then(() => {
                    })
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Đồng bộ thất bại, vui lòng thử lại");
            }
        })
    }

    openContextMenu(event, cm, activity: ClassPlanActivities) {
        this.selected_class_plan_activity = activity;
        cm.show(event);
    }

    openPlanTest() {
        this.loadPlanTest();
    }

    loadPlanTest() {
        this.notificationService.isProcessing(true);

        const condition_test_plan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.classPlanActivityTuluanPlanService.getClassPlanActivityTuluanPlanByPageNew(condition_test_plan).subscribe({
            next: (_tuluan_plan) => {
                this.list_tuluan_plan = _tuluan_plan.data;
                this.notificationService.openSideNavigationMenu({ template: this.templateListPlanTest, size: 1024, offsetTop: "0px" });
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    pointQuestionKeyDown(event, inputPoint_quest) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === '.' || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0 && event.key === '.') {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    ckEditorSetup(ckEditor) {
        this.ckEditor = ckEditor;
    }

    openFormPlan(panel_add, event) {
        panel_add.toggle(event);
        this.openForm = !this.openForm;
        this.formPlanReset();
    }

    formPlanReset() {
        this.formData.patchValue({
            desc: null,
            date: null,
            course_id: this.classSelected.course_id,
            class_id: this.classSelected.id,
            submit_file: 0
        })

        if (this.ckEditor) {
            this.ckEditor.data.set('');
        }

        this.isUpdated = false;
    }

    savePlanDuan() {
        if (this.formData.valid) {
            const data = { ...this.formData.getRawValue() };
            data['date'] = this.helperService.stringToDateSql(data['date']);
            this.notificationService.isProcessing(true)
            if (this.isUpdated) {
                this.classPlanActivityTuluanPlanService.updateClassPlanActivityTuluanPlan(this.selectedPlanTuluan.id, data).subscribe({
                    next: () => {
                        this.loadPlanTest();
                        this.notificationService.toastSuccess("Sửa thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sửa thất bại");
                    }
                })
            } else {
                this.classPlanActivityTuluanPlanService.addClassPlanActivityTuluanPlan(data).subscribe({
                    next: () => {
                        this.f['title'].setValue(null);
                        this.formPlanReset();
                        this.loadPlanTest();
                        this.notificationService.toastSuccess("Thêm thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Thêm thất bại");
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng điền đầy đủ thông tin");
        }
    }

    deletePlanDuan(planT: ClassPlanActivityTuluanPlan) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.classPlanActivityTuluanPlanService.deleteClassPlanActivityTuluanPlan(planT.id).subscribe({
                    next: () => {
                        this.loadPlanTest();
                        this.notificationService.toastSuccess("Xóa thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(true);
                        this.notificationService.toastSuccess("Xóa thất bại")
                    }
                })
            }
        })
    }

    editPlanDuan(planT: ClassPlanActivityTuluanPlan) {
        this.panel_add['animating'] = true;
        this.formPlanReset();
        this.f['desc'].setValue(planT.desc);
        this.f['date'].setValue(planT.date ? new Date(planT.date) : null);
        this.f['title'].setValue(planT.title);
        this.f['submit_file'].setValue(planT.submit_file);

        if (this.ckEditor && this.ckEditor.data) {
            this.ckEditor.data.set(planT.desc ? planT.desc : '');
        }

        this.isUpdated = true;
        this.openForm = true;
        this.scrollToTop();
    }

    scrollToTop() {
        this.scrollDiv.nativeElement.scroll({
            top: 0,
            behavior: 'smooth'   // bỏ nếu không cần mượt
        });
    }

    downloadDuan(type: 'danhsach' | 'phancong') {
        this.notificationService.isProcessing(true);
        const condition_student: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],

            page: null
        }

        const condition_group_duan: ConditionOption = {
            condition: [
                { conditionName: 'class_id', condition: OvicQueryCondition.equal, value: this.classSelected.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }

        const condition_plan_duan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.equal, value: '1000', orWhere: 'and' },
                { conditionName: 'ordering', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_DUAN', orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }

        const condtion_khoa: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.classSelected.course_detail.category_ids.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }

        const condition_nganh: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.classSelected.course_detail.nganh_bomon_id.toString(), orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
            ],

            page: null
        }


        forkJoin([
            this.classStudentService.getClassStudentByPageNew(condition_student),
            this.classPlanActivityTuluanGroupService.getClassPlanActivityTuluanGroupByPageNew(condition_group_duan),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan_duan).pipe(mergeMap(_danhsach => {
                if (_danhsach.recordsFiltered) {
                    const condition_duan: ConditionOption = {
                        condition: [
                            { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.classSelected.course_id.toString(), orWhere: 'and' },
                            { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: _danhsach.data[0].id.toString(), orWhere: 'and' },
                            { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                        ],

                        set: [
                            { label: 'limit', value: '-1' },
                        ],
                        page: null
                    }
                    return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_duan);
                }
                return of(null)
            })),
            this.donViService.getDonviByPageNew(condtion_khoa),
            this.elnChuyenMucService.getChuyemucByPageNew(condition_nganh)
        ]).subscribe({
            next: ([_student, _group, _duan, _khoa, _nganh_bomon]) => {
                if (_duan) {
                    if (type === 'phancong') {
                        _student.data.forEach(f => {
                            f['tenduan'] = '';
                            const index = _group.data.findIndex(m =>m.student_ids && m.student_ids.includes(f.student_id));
                            if (index !== -1) {
                                const index_duan = _duan.data.findIndex(m => m.id === _group.data[index].course_plan_activity_tuluan_id);
                                if (index_duan !== -1) {
                                    f['tenduan'] = _duan.data[index_duan].title;
                                }
                            }
                            f['ngaysinh'] = f.user_info ? f.user_info.birthday : '';
                            f['hoten'] = f.user_info ? f.user_info.full_name : '';
                            f['masinhvien'] = f.user_info ? f.user_info.student_code : '';
                        });
                        this.exportWordChudeDuanService.exportDanhSach(this.classSelected, _khoa.recordsFiltered ? _khoa.data[0] : null, _nganh_bomon.recordsFiltered ? _nganh_bomon.data[0] : null, _student.data);
                    } else {
                        _duan.data.forEach(f => {
                            const _student_duan_this = _group.data.filter(m => m.course_plan_activity_tuluan_id === f.id);
                            let s = 0;
                            _student_duan_this.forEach(c => {
                                s = s + c.student_ids.length;
                            })
                            f['soluong_sinhvien'] = s;
                        })
                        this.exportWordDanhSachService.exportDanhSach(this.classSelected, _khoa.recordsFiltered ? _khoa.data[0] : null, _nganh_bomon.recordsFiltered ? _nganh_bomon.data[0] : null, _duan.data.filter(m => m['soluong_sinhvien']));
                    }
                }
                this.notificationService.isProcessing(false);
            },
            error: (e) => {
                console.log(e);
            }
        })
    }
}
