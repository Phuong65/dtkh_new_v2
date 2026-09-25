import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { HoidongThamdinhMonhocThanhvienService } from '@modules/shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';

import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { firstValueFrom, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseCloService } from '@modules/shared/services/course-clo.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { AuthService } from '@core/services/auth.service';
import { CHUAN_DAU_RA, ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CourseFormThKthp } from '@modules/shared/models/course-form-th-kthp';
import { SharedModule } from '@modules/shared/shared.module';
import { CourseClo } from '@modules/shared/models/course-clo';
import { CourseFormThKthpService } from '@modules/shared/services/courrse-form-th-kthp.service';
import { ButtonModule } from 'primeng/button';
import { HoidongThamdinhThanhvien } from '@modules/shared/models/hoidong-thamdinh-thanhvien';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { DuyetFormDeComponent } from '../../duyetnoidung/duyet-form-de/duyet-form-de.component';
import { CourseFormDuyetService } from '@modules/shared/services/course-form-duyet.service';
import { CourseFormDuyet } from '@modules/shared/models/course-form-duyet';

@Component({
    selector: 'app-form-de-th-kthp',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DuyetFormDeComponent
    ],
    templateUrl: './form-de-th-kthp.component.html',
    styleUrls: ['./form-de-th-kthp.component.css']
})
export class FormDeThKthpComponent implements OnInit {
    @ViewChild('templateAddForm') templateAddForm: TemplateRef<any>;

    selectedCourse: ElnKhoaHoc;

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

    chuandaura = CHUAN_DAU_RA;

    list_form: CourseFormThKthp[];

    selectForm: CourseFormThKthp;

    formData: FormGroup;

    formTitle: string;

    list_clo: CourseClo[];

    isUpdated: boolean = false;

    thanhvien_hoidong: HoidongThamdinhMonhocThanhvien[] = [];

    form_duyet: CourseFormDuyet;
    constructor(
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private elnKhoaHocService: ElnKhoaHocService,
        private elngUserProfileService: ElngUserProfileService,
        private courseCloService: CourseCloService,
        private router: Router,
        private auth: AuthService,
        private courseFormThKthpService: CourseFormThKthpService,
        private formBuilder: FormBuilder,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private hoidongThamdinhMonhocThanhvienService: HoidongThamdinhMonhocThanhvienService,
        private hoidongThamdinhService: HoidongThamdinhService,
        private courseFormDuyetService: CourseFormDuyetService,
    ) {

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/form-th-kthp');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/form-th-kthp');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/form-th-kthp');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/form-th-kthp');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/form-th-kthp');

        this.routerKhaothi = this.auth.hasRouter(ROUTERS.khaothi, '/form-th-kthp');

        this.userId = this.auth.user.id;

        this.formData = this.formBuilder.group(
            {
                ordering: ['', Validators.required],
                course_id: ['', Validators.required],
                cdr: ['', Validators.required],
                point: ['', Validators.required],
                course_clo_id: ['', Validators.required],
                question_take: ['', Validators.required],
            }
        );
    }

    get f() {
        return this.formData.controls;
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

                const condition_thanhvien: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'DESC' },
                        { label: 'orderby', value: 'chutich' },
                        { label: 'with', value: 'user' }
                    ],
                    page: null
                }

                const condition_course_form_duyet: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                        { conditionName: 'form_type', condition: OvicQueryCondition.equal, value: 'TH_KTHP', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                }

                forkJoin([
                    this.elnKhoaHocService.getKhoaHocByPageNew_2(contition),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                    this.courseCloService.getCourseCloByPageNew(condition_clo),
                    this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(condition_thanhvien).pipe(mergeMap(_thanhvien => {
                        const hoidongthamdinh_ids = [... new Set(_thanhvien.data.map(m => m.hoidong_thamdinh_id))];
                        if (hoidongthamdinh_ids.length) {
                            const condition_hoidong: ConditionOption = {
                                condition: [
                                    { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'cauhoi', orWhere: 'and' },
                                ],
                                set: [
                                    { label: 'limit', value: '-1' },
                                    { label: 'include', value: hoidongthamdinh_ids.toString() },
                                    { label: 'include_by', value: 'id' },
                                ],
                                page: null
                            }
                            return this.hoidongThamdinhService.getHoidongThamdinhByPageNew(condition_hoidong).pipe(mergeMap(_hoidong => {
                                if (_hoidong.recordsFiltered) {
                                    _thanhvien.data = _thanhvien.data.filter(m => m.hoidong_thamdinh_id === _hoidong.data[0].id);
                                    return of(_thanhvien);
                                }
                                return of(null)
                            }))
                        }
                        return of(null)
                    })),
                    this.courseFormDuyetService.getCourseFormDuyetByPageNew(condition_course_form_duyet)
                ]).subscribe({
                    next: ([_course, _user_profile, _clo, _thanhvien, _form_duyet]) => {
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

                            _clo.data.forEach(f => {
                                f['show_name'] = f.kyhieu.concat(" - ", f.noidung ? f.noidung : 'Chưa có nội dung');
                            })

                            this.list_clo = _clo.data;

                            if (_thanhvien) {
                                this.thanhvien_hoidong = _thanhvien.data;
                            }

                            if (_form_duyet.recordsFiltered)
                                this.form_duyet = _form_duyet.data[0];

                            this.loadForm();

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

    loadForm() {
        this.notificationService.isProcessing(true);

        const condition_form: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null
        }

        this.courseFormThKthpService.getCourseFormThKthpByPageNew(condition_form).subscribe({
            next: (_course_form) => {
                this.list_form = _course_form.data;
                this.formReset();
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    get totalScore(): number {
        return this.list_form && this.list_form.length ? this.list_form.reduce((sum, x) => sum + (x.point * x.question_take || 0), 0) : 0;
    }

    get totalTake(): number {
        return this.list_form && this.list_form.length ? this.list_form.reduce((sum, x) => sum + (x.question_take || 0), 0) : 0;
    }

    formReset() {
        this.formData.reset();
        if (this.list_form && this.list_form.length) {
            this.f['ordering'].setValue(this.list_form.length + 1);
        } else {
            this.f['ordering'].setValue(1);
        }
        this.f['course_id'].setValue(this.selectedCourse.id);
        this.f['question_take'].setValue(1);
        this.isUpdated = false;
    }

    closeSideMenu() {
        this.notificationService.closeSideNavigationMenu();
    }

    addFormQuestion() {
        this.formReset();
        this.formTitle = "Thêm nhóm câu hỏi";
        this.notificationService.openSideNavigationMenu({ template: this.templateAddForm, size: 700, offsetTop: '0px' });
    }

    editForm(form_kthp: CourseFormThKthp) {
        this.formReset();
        this.selectForm = form_kthp;
        this.isUpdated = true;
        this.f['ordering'].setValue(form_kthp.ordering);
        this.f['point'].setValue(form_kthp.point);
        this.f['question_take'].setValue(form_kthp.question_take);
        this.f['course_clo_id'].setValue(form_kthp.course_clo_id);
        this.f['cdr'].setValue(form_kthp.cdr);
        this.formTitle = "Sửa nhóm câu hỏi";
        this.notificationService.openSideNavigationMenu({ template: this.templateAddForm, size: 700, offsetTop: '0px' });
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

    numberQuestionKeyDown(event) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === 'Backspace') {

            } else {
                event.preventDefault();
            }
        }
    }

    saveForm() {
        if (this.formData.valid) {
            this.notificationService.isProcessing(true);
            const data = { ... this.formData.getRawValue() };
            if (this.isUpdated) {
                this.courseFormThKthpService.updateCourseFormThKthp(this.selectForm.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Sửa thành công");
                        this.closeSideMenu();
                        this.loadForm();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sửa thất bại");
                    }
                })
            } else {
                this.courseFormThKthpService.addCourseFormThKthp(data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Thêm thành công");
                        this.loadForm();
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

    async deleteGroupQuestion(form_kthp: CourseFormThKthp) {
        const constition_question: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'form_th_kthp_id', condition: OvicQueryCondition.equal, value: form_kthp.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '1' }
            ],
            page: null
        }

        const question = await firstValueFrom(this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(constition_question));

        if (question.recordsFiltered !== 0) {
            return this.notificationService.toastWarning("Nhóm câu hỏi ".concat(form_kthp.ordering.toString(), " đã có câu hỏi, vui lòng xóa hết câu hỏi thuộc nhóm này trước khi xóa nhóm"));
        }

        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.courseFormThKthpService.deleteCourseFormThKthp(form_kthp.id).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadForm();
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    saveOrderingForm() {
        this.notificationService.isProcessing(true)
        const request: Observable<any>[] = [];
        this.list_form.forEach((f, key) => {
            const data = {
                ordering: key + 1,
            }
            request.push(this.courseFormThKthpService.updateCourseFormThKthp(f.id, data))
        })

        if (request.length) {
            forkJoin(request).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Lưu thành công");
                    this.loadForm();
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Lưu thất bại");
                }
            })
        }
    }
}
