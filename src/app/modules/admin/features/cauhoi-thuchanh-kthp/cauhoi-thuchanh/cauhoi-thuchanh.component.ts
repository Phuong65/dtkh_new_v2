import { CourseCloService } from './../../../../shared/services/course-clo.service';
import { CoursePlanActivityTuluanService } from '@shared/services/course-plan-activity-tuluan.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';

import { NotificationService } from '@core/services/notification.service';
import { Component, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ActivatedRoute, Router } from '@angular/router';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { OvicQueryCondition } from '@core/models/dto';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { HelperService } from '@core/services/helper.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CHUAN_DAU_RA, ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { TableModule } from 'primeng/table';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SplitterModule } from 'primeng/splitter';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { ButtonModule } from 'primeng/button';
import { CoursePlanActivityTuluanTieuchicham } from '@modules/shared/models/course-plan-activity-tuluan-tieuchicham';
import { PanelModule } from 'primeng/panel';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DividerModule } from 'primeng/divider';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { CoursePlanTuluanCommentService } from '@modules/shared/services/course-plan-tuluan-comment.service';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { CourseClo } from '@modules/shared/models/course-clo';
import { CourseFormThKthp } from '@modules/shared/models/course-form-th-kthp';
import { CourseFormThKthpService } from '@modules/shared/services/courrse-form-th-kthp.service';
import { KatexImgDirective } from "@modules/shared/directives/katex-img.directive";

@Component({
    selector: 'app-cauhoi-thuchanh',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        NgbTooltipModule,
        SplitterModule,
        LoadMediaOnTextDirective,
        ButtonModule,
        PanelModule,
        DropdownModule,
        DialogModule,
        MatProgressBarModule,
        DividerModule,
        MatListModule,
        KatexImgDirective
    ],
    templateUrl: './cauhoi-thuchanh.component.html',
    styleUrls: ['./cauhoi-thuchanh.component.css']
})
export class CauhoiThuchanhComponent implements OnInit {

    @ViewChild('templateQuestion') templateQuestion: TemplateRef<any>;

    @ViewChild('templateFormAddTieuchicham') templateFormAddTieuchicham: TemplateRef<any>;

    @ViewChild('templateViewTuluan') templateViewTuluan: TemplateRef<any>;

    @ViewChild('templatePmsDuan') templatePmsDuan: TemplateRef<any>;

    @ViewChildren('panel_tieuchi') panel_tieuchi: QueryList<any>;

    selectedCourse: ElnKhoaHoc;

    list_plan: CoursePlanActivities[];

    selectPlan: CoursePlanActivities;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    routerKhaothi: boolean = false;

    userId: number;

    canAdded: boolean = false;

    label_parent_kehoach: string = "Bài";

    closeLeft: boolean = false;

    limit_cauhoi: number = 25;

    total_cauhoi: number = 0;

    formData: FormGroup;

    list_cauhoi: CoursePlanActivityTuluan[];

    selectedCauhoi: CoursePlanActivityTuluan;

    formTitle: string;

    select_private = [
        { label: "Private", id: 1 },
        { label: "Public", id: 0 }
    ]

    chuandaura = CHUAN_DAU_RA;

    number_questions = [
        { key: 1 },
        { key: 2 },
        { key: 3 },
        { key: 4 },
        { key: 5 },
        { key: 6 },
        { key: 7 },
        { key: 8 },
        { key: 9 },
        { key: 10 }
    ]

    isUpdated: boolean = false;

    list_tieuchi_chamdiem: CoursePlanActivityTuluanTieuchicham[] = [];

    waitting_title: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    selectedComment: CoursePlanTuluanComment;

    searchCauhoi: string;

    copyTieuchiDuan: CoursePlanActivityTuluan;

    list_clo: CourseClo[];

    list_form: CourseFormThKthp[];

    selectedForm: CourseFormThKthp;

    search_id_question: string;


    constructor(
        private activatedRoute: ActivatedRoute,
        private ElnKhoaHocService: ElnKhoaHocService,
        private notificationService: NotificationService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private helperService: HelperService,
        private router: Router,
        private auth: AuthService,
        private elngUserProfileService: ElngUserProfileService,
        private formBuilder: FormBuilder,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService,
        private coursePlanTuluanCommentService: CoursePlanTuluanCommentService,
        private courseCloService: CourseCloService,
        private courseFormThKthpService: CourseFormThKthpService,
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/danhsach-cauhoi');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/danhsach-cauhoi');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/danhsach-cauhoi');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/danhsach-cauhoi');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/danhsach-cauhoi');

        this.routerKhaothi = this.auth.hasRouter(ROUTERS.khaothi, '/danhsach-cauhoi');

        this.userId = this.auth.user.id;

        this.formData = this.formBuilder.group(
            {
                ordering: ['', Validators.required],
                course_plan_activity_id: ['', Validators.required],
                course_id: ['', Validators.required],
                type: [''],
                cdr: ['', Validators.required],
                private: [''],
                desc: ['', Validators.required],
                status: [''],
                point: ['', Validators.required],
                course_clo_id: ['', Validators.required],
                form_th_kthp_id: ['', Validators.required]
            }
        );
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {

                this.notificationService.isProcessing(true);

                const course_id = params['code'];

                const contition: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                const condition_user: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                // const condition_plan: ConditionOption = {
                //     condition: [
                //         { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                //         { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                //         { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                //         { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                //     ],
                //     set: [
                //         { label: 'limit', value: '-1' },
                //         { label: 'include', value: 'PLAN,ACTIVITY_CDR' },
                //         { label: 'include_by', value: 'type' },
                //         { label: 'order', value: 'ASC' },
                //         { label: 'orderby', value: 'week' }
                //     ],
                //     page: null
                // }

                const condition_clo: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                const condition_form: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' },
                        { label: 'with', value: 'questions' }
                    ],
                    page: null
                }

                forkJoin([
                    this.ElnKhoaHocService.getKhoaHocByPageNew_2(contition),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                    this.courseCloService.getCourseCloByPageNew(condition_clo),
                    this.courseFormThKthpService.getCourseFormThKthpByPageNew(condition_form)
                ]).subscribe({
                    next: ([_course, _user_profile, _clo, _form]) => {
                        if (_course.recordsFiltered) {
                            this.selectedCourse = _course.data[0];

                            if (this.routerLanhdaokhoa) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.category_ids !== _user_profile.data[0].donvi_chuyenmon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            if (this.routerLanhdaobomon) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.nganh_bomon_id !== _user_profile.data[0].bomon_id) {
                                    console.log("run 2");
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            if (this.routerKhaothi || this.routerDaotao || this.routerLanhdaobomon || this.routerLanhdaokhoa || this.userId === this.selectedCourse.creator_plan_id) {
                                this.canAdded = true;
                            } else {
                                this.notificationService.toastError("Không tìm thấy môn học");
                                this.router.navigate(['/admin/content-none']);
                            }

                            this.list_clo = _clo.data;

                            _form.data.forEach(f => {
                                f['duyet'] = f['questions'] ? f['questions'].filter(m => m.status === 1).length : 0;
                                f['tong'] = f['questions'] ? f['questions'].length : 0;
                            })

                            this.list_form = _form.data;

                            if (this.list_form.length) {
                                this.onChangeFormKthp(this.list_form[0]);
                            }

                            this.notificationService.isProcessing(false);

                        } else {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Không tìm thấy môn học");
                            this.router.navigate(['/admin/content-none']);
                        }

                    },

                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Không tìm thấy môn học");
                        this.router.navigate(['/admin/content-none']);
                    }
                })
            } else {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Không tìm thấy môn học");
                this.router.navigate(['/admin/content-none']);
            }
        })
    }

    get f() {
        return this.formData.controls;
    }

    loadCauhoi() {
        this.notificationService.isProcessing(true)
        const condition_tuluan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'course_clo_id', condition: OvicQueryCondition.equal, value: this.selectedForm.course_clo_id.toString(), orWhere: 'and' },
                { conditionName: 'form_th_kthp_id', condition: OvicQueryCondition.equal, value: this.selectedForm.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
                { label: 'with', value: 'tieuchi' }
            ],
            page: null
        }

        this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_tuluan).subscribe({
            next: (_cauhoi) => {
                this.notificationService.isProcessing(false);

                _cauhoi.data.forEach((f, key) => {
                    f["index_"] = key + 1;
                })

                this.selectedForm['tong'] = _cauhoi.recordsFiltered;

                this.list_cauhoi = _cauhoi.data;
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    onChangeFormKthp(_form: CourseFormThKthp) {
        this.selectedForm = _form;
        this.loadCauhoi();
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    closeSideMenu(reload: boolean = false) {
        this.notificationService.closeSideNavigationMenu();
        if (reload) {
            this.loadCauhoi();
        }
    }

    openAddCauhoi() {
        this.formTitle = "Thêm câu hỏi";
        this.formReset();
        this.selectedCauhoi = null;
        this.notificationService.openSideNavigationMenu({ template: this.templateQuestion, size: 1024, offsetTop: '0px' });
    }

    formReset() {
        this.formData.reset();
        this.f['course_plan_activity_id'].setValue(0);
        this.f['course_clo_id'].setValue(this.selectedForm.course_clo_id);
        this.f['course_id'].setValue(this.selectedCourse.id);
        this.f['type'].setValue('QUESTION');
        this.f['private'].setValue(1);
        this.f['point'].setValue(this.selectedForm.point);
        this.f['ordering'].setValue(this.selectedForm.ordering);
        this.f['status'].setValue(0);
        this.f['form_th_kthp_id'].setValue(this.selectedForm.id);
        this.f['cdr'].setValue(this.selectedForm.cdr);
        this.isUpdated = false;
    }

    editCauhoi(cauhoi: CoursePlanActivityTuluan) {
        this.formReset();
        this.selectedCauhoi = cauhoi;
        this.f['desc'].setValue(cauhoi.desc);
        this.isUpdated = true;
        this.notificationService.openSideNavigationMenu({ template: this.templateQuestion, size: 1024, offsetTop: '0px' });
    }

    saveCauhoi(yeucauduyet: boolean = false) {
        console.log(this.formData.getRawValue());
        if (this.formData.valid) {
            this.notificationService.isProcessing(true);

            const data = { ... this.formData.getRawValue() };

            if (yeucauduyet) {
                data['status'] = -2;
            }

            if (this.isUpdated) {
                this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(this.selectedCauhoi.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Sửa thành công");
                        this.closeSideMenu();
                        this.loadCauhoi();
                    },
                    error: () => {
                        this.notificationService.toastError("Sửa thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            } else {
                this.coursePlanActivityTuluanService.addCoursePlanActivityTuluan(data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Thêm thành công");
                        this.formReset();
                        this.loadCauhoi();
                    },
                    error: () => {
                        this.notificationService.toastError("Thêm thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng điền đầy đủ thông tin");
        }
    }

    deleteCauhoi(cauhoi: CoursePlanActivityTuluan) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                forkJoin([
                    this.coursePlanActivityTuluanService.deleteCoursePlanActivityTuluan(cauhoi.id),
                    this.coursePlanActivityTuluanTieuchichamService.deleteCoursePlanActivityTuluanTieuchichamByCol(cauhoi.id.toString(), "course_plan_activity_tuluan_id")
                ]).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.formReset();
                        this.loadCauhoi();
                    },
                    error: () => {
                        this.notificationService.toastError("Xóa thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
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

    pointQuestionKeyup(event, inputPoint_quest) {
        if (event) {
            if (!isNaN(Number(inputPoint_quest.value))) {
                if (Number(inputPoint_quest.value) > 10) {
                    this.f['point'].setValue(10);
                }
            } else {
                this.f['point'].setValue(0);
            }
        }
    }

    editTieuchi(cauhoi: CoursePlanActivityTuluan) {
        this.selectedCauhoi = cauhoi;
        this.formTitle = "Tạo tiêu chí chấm";
        this.notificationService.openSideNavigationMenu({ template: this.templateFormAddTieuchicham, size: window.innerWidth, offsetTop: '0px' });
        this.loadTieuchicham();
    }

    loadTieuchicham() {
        this.list_tieuchi_chamdiem = [];

        const condition_tieuchicham: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.selectedCauhoi.course_id.toString(), orWhere: "and" },
                { conditionName: "course_plan_activity_tuluan_id", condition: OvicQueryCondition.equal, value: this.selectedCauhoi.id.toString(), orWhere: "and" }
            ],
            set: [
                { label: "limit", value: "-1" },
                { label: "order", value: "ASC" },
                { label: "orderby", value: "ordering" }
            ],
            page: null
        }

        this.notificationService.isProcessing(true);

        this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchicham).subscribe({
            next: (tieuchi_cham) => {
                tieuchi_cham.data.forEach(f => {
                    f['collapsed'] = true;
                })

                this.list_tieuchi_chamdiem = tieuchi_cham.data;

                this.notificationService.isProcessing(false);
            }
        })
    }

    pointTieuchiKeyup(event, inputPoint_quest, item: CoursePlanActivityTuluanTieuchicham) {
        if (event) {
            if (!isNaN(Number(inputPoint_quest.value))) {
                if (Number(inputPoint_quest.value) > 1) {
                    item.point = 1
                }
            } else {

            }
        }
    }

    deleteTieuchi(id: number) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.coursePlanActivityTuluanTieuchichamService.deleteCoursePlanActivityTuluanTieuchicham(id).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadTieuchicham();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    openHuongdancham(panel, tieuchi: CoursePlanActivityTuluanTieuchicham) {

        tieuchi['collapsed'] = !tieuchi['collapsed'];

        if (this.panel_tieuchi && this.panel_tieuchi.toArray().length) {
            this.panel_tieuchi.toArray().forEach(f => {
                f['animating'] = true;
            })
        }

        if (tieuchi['collapsed'] === false) {
            this.list_tieuchi_chamdiem.filter(m => m.id !== tieuchi.id).map(m => {
                m['collapsed'] = true;
                return m;
            })
        }
    }

    onChangeEditorTieuchi(event, tieuchi: CoursePlanActivityTuluanTieuchicham) {
        tieuchi.desc = event;
    }

    addOneTieuchiChams() {
        const data: CoursePlanActivityTuluanTieuchicham = {
            course_id: this.selectedCourse.id,
            course_plan_activity_tuluan_id: this.selectedCauhoi.id,
            course_plan_activity_id: 0,
            title: '',
            cdr: this.selectedCauhoi.cdr,
            point: 0,
            desc: '',
            ordering: this.list_tieuchi_chamdiem && this.list_tieuchi_chamdiem.length ? this.list_tieuchi_chamdiem[this.list_tieuchi_chamdiem.length - 1].ordering + 1 : 1
        }

        this.notificationService.isProcessing(true);

        this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data).subscribe({
            next: () => {
                this.notificationService.toastSuccess("Tạo thành công")
                this.loadTieuchicham();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Tạo thất bại, vui lòng thử lại")
            }
        })
    }

    returnTotalPointTieuChi() {
        if (this.list_tieuchi_chamdiem.length) {
            return this.list_tieuchi_chamdiem.filter(m => m.point).map(m => Number(parseFloat(m.point.toString()).toFixed(2))).reduce((sum, num) => sum + num, 0);
        }
        return 0;
    }

    saveTieuchiChams() {
        const request: Observable<any>[] = [];

        if (this.returnTotalPointTieuChi().toString() !== this.selectedCauhoi.point.toString()) {
            return this.notificationService.toastWarning("Tổng điểm tiêu chỉ phải bằng " + this.selectedCauhoi.point);
        }

        this.list_tieuchi_chamdiem.forEach((f, key) => {

            const data: CoursePlanActivityTuluanTieuchicham = {
                course_id: f.course_id,
                course_plan_activity_tuluan_id: f.course_plan_activity_tuluan_id,
                course_plan_activity_id: 0,
                title: f.title,
                cdr: f.cdr,
                point: f.point,
                desc: f.desc,
                ordering: key + 1
            }

            request.push(this.coursePlanActivityTuluanTieuchichamService.updateCoursePlanActivityTuluanTieuchicham(f.id, data))

        })

        this.waitting_title = "Đang tạo tiêu chí chấm, vui lòng chờ";

        this.progressValue = 0;

        this.displayModal = true;

        if (request.length) {
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Tạo thành công");
                    this.loadTieuchicham();
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Tạo thất bại, vui lòng thử lại")
                }
            })
        }
    }

    loopAddForm(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopAddForm(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    viewTuluan(cauhoi: CoursePlanActivityTuluan) {
        this.selectedCauhoi = cauhoi;
        this.loadCommentTuluan();
    }

    loadCommentTuluan() {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedCauhoi.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        }

        const condition_reply_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedCauhoi.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, parent_id' },
            ],
            page: null,
        };

        this.notificationService.isProcessing(true);

        forkJoin([
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment),
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_reply_comment),
        ]).subscribe({
            next: ([_comment, _comment_child]) => {
                const object_comment = {};
                _comment.data.forEach((c) => {
                    const count_reply =
                        _comment_child.data.filter(
                            (m) => m.parent_id === c.id
                        ).length;

                    c['count_reply'] = count_reply;
                    c['reply_open'] = false;
                    if (!object_comment[c.user_id]) {
                        object_comment[c.user_id] = [];
                        object_comment[c.user_id].push(c);
                    } else {
                        object_comment[c.user_id].push(c);
                    }
                });

                this.selectedCauhoi['comments'] = [];

                Object.keys(object_comment).forEach(
                    (o, key) => {
                        let display_name = 'Ủy viên '.concat((key + 1).toString());
                        if (o.toString() === this.userId.toString()) {
                            display_name = 'Nhận xét của bạn';
                        }

                        this.selectedCauhoi['comments'].push({
                            user_id: o,
                            display_name: display_name,
                            children: object_comment[o],
                        });
                    }
                );

                this.notificationService.isProcessing(false);

                this.notificationService.openSideNavigationMenu({ template: this.templateViewTuluan, size: window.innerWidth, offsetTop: '0px' });
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    openReply(comment: CoursePlanTuluanComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CoursePlanTuluanComment, index_comment) {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: comment.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment).subscribe({
            next: (_comment) => {
                _comment.data.forEach(f => {
                    if (f.user_id === this.selectedCourse.creator_plan_id && this.userId !== f.user_id) {
                        f['display_name'] = this.selectedCourse['user_label'];
                    } else if (f.user_id === this.userId) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else if (comment.user_id === f.user_id) {
                        f['display_name'] = 'Ủy viên '.concat((index_comment + 1).toString());
                    } else {
                        f['display_name'] = 'Ủy viên khác'
                    }
                })

                comment['reply_comments'] = _comment.data;

                comment['count_reply'] = _comment.data.length;

            },

            error: () => {
                this.notificationService.toastError('Lỗi kết nôi, vui lòng thử lại');
            }
        })
    }


    saveCommentReply(comment: CoursePlanTuluanComment, question: CoursePlanActivityTuluan, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'].trim();
        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanTuluanComment = {
                course_plan_activity_id: question.course_plan_activity_id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.selectedCourse.id,
                parent_id: comment.id,
                course_plan_activity_tuluan_id: question.id
            }

            this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Đã gửi phản hồi thành công");
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(this.selectedComment, index_comment);
                },
                error: () => {
                    this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập phản hồi trước khi gửi")
        }
    }

    openListDuanTuCopyTieuchi(cauhoi: CoursePlanActivityTuluan) {
        this.selectedCauhoi = cauhoi;
        this.list_cauhoi.forEach(f => {
            f['hasTieuchi'] = false;
            if (f.tieuchi && f.tieuchi.length && cauhoi.id !== f.id) {
                f['hasTieuchi'] = true;
            }
        })
        console.log(this.list_cauhoi);
        this.notificationService.openSideNavigationMenu({ template: this.templatePmsDuan, size: 600, offsetTop: '0px' });
    }

    changeSelecDuan(event: MatSelectionListChange) {
        this.copyTieuchiDuan = event.options[0].value;
    }

    saveTieuchiChamCopy() {
        if (this.copyTieuchiDuan) {
            if (this.copyTieuchiDuan.tieuchi && this.copyTieuchiDuan.tieuchi.length) {
                const request: Observable<any>[] = [];
                this.displayModal = true;
                this.progressValue = 0;
                this.copyTieuchiDuan.tieuchi.forEach(f => {
                    const data: CoursePlanActivityTuluanTieuchicham = {
                        course_id: f.course_id,
                        course_plan_activity_tuluan_id: this.selectedCauhoi.id,
                        course_plan_activity_id: 0,
                        title: f.title,
                        cdr: f.cdr,
                        point: f.point,
                        desc: f.desc,
                        ordering: f.ordering,
                    }
                    request.push(this.coursePlanActivityTuluanTieuchichamService.addCoursePlanActivityTuluanTieuchicham(data));
                })

                this.loopAddForm(request, 0).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess("Sao chép thành công");
                        this.loadCauhoi();
                        this.closeSideMenu();
                    },
                    error: () => {
                        this.notificationService.toastSuccess("Sao chép thất bại, vui lòng thử lại");
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng chọn dự án");
        }
    }
}
