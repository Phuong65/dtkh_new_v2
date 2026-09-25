import { UserService } from '@core/services/user.service';

import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { CalendarModule } from 'primeng/calendar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { ThiForm } from '@modules/shared/models/thi-form';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { firstValueFrom, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { SharedModule } from '@modules/shared/shared.module';
import { OvicQueryCondition } from '@core/models/dto';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { Router } from '@angular/router';
import { FormDeChitietComponent } from '../../form-de-chitiet/form-de-chitiet.component';
import { CourseFormKthpService } from '@modules/shared/services/course-form-kthp.service';
import { ThiFormDetailsService } from '@modules/shared/services/thi-form-details.service';
import { ThiFormService } from '@modules/shared/services/thi-form.service';
import { ThiQuestionBankTnService } from '@modules/shared/services/thi-question-bank-tn.service';
import { CourseFormKthp } from '@modules/shared/models/course-form-kthp';
import { ButtonModule } from 'primeng/button';
import { User } from '@core/models/user';
import { FormDeKthpIctuV2Component } from '../form-de-kthp-ictu-v2/form-de-kthp-ictu-v2.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LARGE_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ImportCanbothiComponent } from '@modules/admin/features/quanly-kehoach-hoctap/import-canbothi/import-canbothi.component';
import { ImportHoidongDuyetComponent } from '@modules/admin/features/quanly-kehoach-hoctap/import-hoidong-duyet/import-hoidong-duyet.component';
import { key_server } from '@env';

@Component({
    selector: 'app-form-de-v2',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        TableModule,
        PaginatorModule,
        ReactiveFormsModule,
        CalendarModule,
        MatMenuModule,
        OverlayPanelModule,
        FormDeChitietComponent,
        ButtonModule,
        FormDeKthpIctuV2Component,
        DialogModule,
        MatProgressBarModule,
        ImportCanbothiComponent,
        ImportHoidongDuyetComponent

    ],
    templateUrl: './form-de-v2.component.html',
    styleUrls: ['./form-de-v2.component.css']
})
export class FormDeV2Component implements OnInit {

    @ViewChild('paginator_form') paginator_form: Paginator;

    @ViewChild('createForm') createForm: TemplateRef<any>;

    @ViewChild('teampalteFormDetail') teampalteFormDetail: TemplateRef<any>;

    @ViewChild('templateFormKTHP') templateFormKTHP: ElementRef<any>;

    @ViewChild('templateImporCbthi') templateImporCbthi: TemplateRef<any>;

    @ViewChild('templateImporthoidong') templateImporthoidong: TemplateRef<any>;

    list_course: ElnKhoaHoc[] = [];

    formData: FormGroup;

    list_form: ThiForm[];

    selectedForm: ThiForm;

    isUpdate: boolean = false;

    canAdded: boolean = false;

    canUpdate: boolean = false;

    canDelete: boolean = false;

    pageIndex: number = 1;

    limit_form: number = 20;;

    total_form: number = 0;

    formTitle: string = 'Tạo ngân hàng đề';

    option_status = [
        { label: 'Chưa kích hoạt', id: 0 },
        { label: 'Đã kích hoạt', id: 1 },
    ];

    objectFillter = {
        course_id: null,
        name: null
    };

    list_donvi: DonVi[];

    selectedDonvi_id: number;

    list_form_kthp: CourseFormKthp[];

    _user_created_plan: User;

    selected_course_: ElnKhoaHoc;

    waitting_title: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    isManager: boolean = false;

    isAdmin: boolean = false;

    isLanhDaoKhaothi: boolean = false;

    key_server = key_server;
    constructor(
        private notificationService: NotificationService,
        private helperService: HelperService,
        private formBuilder: FormBuilder,
        private auth: AuthService,
        private elnKhoaHocService: ElnKhoaHocService,
        private classesService: ClassesService,
        private thiFormService: ThiFormService,
        private thiQuestionBankTnService: ThiQuestionBankTnService,
        private thiFormDetailsService: ThiFormDetailsService,
        private donViService: DonViService,
        private router: Router,
        private courseFormKthpService: CourseFormKthpService,
        private userService: UserService,
        private modalService: NgbModal,
    ) {
        const url = this.router.url.substring(7).split('?')[0];

        this.canAdded = this.auth.userCanAdd(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.isManager = this.auth.userHasRole(ROLES.hoidongthi_lanhdao) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false;

        this.isAdmin = this.auth.userHasRole(ROLES.admin);

        this.formData = this.formBuilder.group(
            {
                name: ['', Validators.required],
                desc: [''],
                course_id: ['', Validators.required],
                status: ['', Validators.required],
                num_of_test: ['', Validators.required],
                time_of_test: ['', Validators.required]
            }
        );
    }

    ngOnInit(): void {
        this.initLoad();

    }

    get f() {
        return this.formData.controls;
    }

    initLoad() {
        const condition_course: ConditionOption = {
            condition: [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,av,maso,title,id,category_ids,creator_plan_id' },
            ],
            page: null
        }
        const condition_donvi: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.greaterThan,
                    value: '0',
                    orWhere: 'and',
                },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'title' }
            ],
            page: null,
        };

        this.notificationService.isProcessing(true);

        forkJoin([
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_course),
            this.donViService.getDonviByPageNew(condition_donvi),
        ]).subscribe({
            next: ([_course, _donvi]) => {
                this.list_course = [];
                this.list_donvi = [];
                this.list_donvi = _donvi.data;

                _course.data.forEach(f => {
                    f['label_name'] = "[".concat(f.maso, "] - ", f.title);
                })

                if (_course)
                    this.list_course = _course.data;
                this.loadFormPage(1);
            },

            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại")
            }
        })
    }

    loadFormPage(page: number) {
        const condition_form: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: this.limit_form.toString() },
                { label: 'order', value: 'DESC' },
                { label: 'orderby', value: 'id' },
                { label: 'withCount', value: '1' }
            ],

            page: page.toString()
        }

        const filter_like = { 'name': 1 };

        if (this.objectFillter && Object.keys(this.objectFillter)) {
            Object.keys(this.objectFillter).forEach(f => {
                if (this.objectFillter[f] !== null) {
                    if (filter_like[f]) {
                        condition_form.condition.push({ conditionName: f, condition: OvicQueryCondition.like, value: '%' + this.objectFillter[f] + '%', orWhere: 'and' })
                    } else {
                        condition_form.condition.push({ conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFillter[f], orWhere: 'and' })
                    }
                }
            })
        }

        this.notificationService.isProcessing(true);

        if (this.selectedDonvi_id && !this.objectFillter['course_id']) {
            const course_ids = this.list_course.filter(i => i.category_ids === this.selectedDonvi_id).map(m => m.id);
            course_ids.push(0);
            condition_form.set.push({ label: 'include', value: course_ids.toString() });
            condition_form.set.push({ label: 'include_by', value: 'course_id' })
        }

        this.thiFormService.getThiFormByPageNew(condition_form).subscribe({
            next: (_form) => {
                this.notificationService.isProcessing(false);
                const _index_start = (page - 1) * this.limit_form;
                _form.data.forEach((f, key) => {
                    f['index_'] = _index_start + key + 1;
                })
                this.list_form = _form.data;
                this.total_form = _form.recordsFiltered;
            },
            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                this.notificationService.isProcessing(false)
            }
        })
    }

    closeSideMenu() {
        this.notificationService.closeSideNavigationMenu();
    }

    numberKeyDown(event) {
        if (event) {
            if (!/[0-9]/.test(event.key) && event.key !== 'Backspace') {
                event.preventDefault();
            }
        }
    }

    formReset() {
        this.formData.reset();
        this.isUpdate = false;
        this.f['status'].setValue(0);
        this.list_form_kthp = [];
        this._user_created_plan = null;
        this.selected_course_ = null;
    }

    openAddForm() {
        this.formTitle = 'Tạo ngân hàng đề';
        this.formReset();
        this.notificationService.openSideNavigationMenu({ template: this.createForm, size: 800, offsetTop: '0px' })
    }

    openEditForm(form: ThiForm) {
        this.selectedForm = form;
        this.formTitle = 'Sửa ngân hàng đề';
        this.formReset();
        this.formData.setValue({
            name: form.name,
            desc: form.desc,
            course_id: form.course_id,
            status: form.status,
            num_of_test: form.num_of_test,
            time_of_test: form.time_of_test
        })
        this.isUpdate = true;
        this.selected_course_ = this.list_course.find(m => m.id === form.course_id);
        this.onChangeMonHoc(this.selected_course_);
        this.notificationService.openSideNavigationMenu({ template: this.createForm, size: 800, offsetTop: '0px' })
    }

    returnToOrderPage(page_order: number) {
        if (this.paginator_form) {
            if (!this.paginator_form.empty()) {
                this.paginator_form.changePage(page_order - 1);
            } else {
                this.loadFormPage(1);
            }
        } else {
            this.loadFormPage(1);
        }
    }

    saveForm() {
        if (this.formData.valid) {

            const data = this.formData.getRawValue();

            this.notificationService.isProcessing(true);

            const index = this.list_course.findIndex(m => m.id === data['course_id']);

            if (index !== -1) {
                data['av'] = this.list_course[index].av;
            }

            if (this.list_form_kthp && this.list_form_kthp.length) {
                if (this.isUpdate) {
                    this.thiFormService.updateThiForm(this.selectedForm.id, data).subscribe({
                        next: () => {
                            this.saveFormtkhpToFormThi(this.selectedForm.id);
                            this.closeSideMenu();
                            this.notificationService.isProcessing(false);
                        },
                        error: () => {
                            this.notificationService.toastError("Sửa thất bại");
                            this.notificationService.isProcessing(false);
                        }
                    })
                } else {
                    this.thiFormService.addThiForm(data).subscribe({
                        next: (_id) => {
                            this.saveFormtkhpToFormThi(_id);
                            this.notificationService.isProcessing(false);
                        },
                        error: () => {
                            this.notificationService.toastError("Thêm thất bại");
                            this.notificationService.isProcessing(false);
                        }
                    })
                }
            } else {
                this.notificationService.toastWarning("Môn học này không có form đề thi KTHP, không thể lưu");
            }
        } else {
            this.notificationService.toastWarning("Vui lòng nhập đầy đủ thông tin các trường có đánh dấu *")
        }
    }

    saveFormtkhpToFormThi(form_id: number) {
        const request: Observable<any>[] = [];

        if (form_id) {
            request.push(this.thiFormDetailsService.deleteThiFormDetailsByCol(form_id.toString(), 'form_id'));
        }

        this.list_form_kthp.forEach(f => {
            const data_form = {
                course_id: f.course_id,
                form_id: form_id,
                week: f.week,
                part: f.part,
                cdr: f.cdr,
                total_question_take: f.total_question_take,
                course_plan_activity_id: f.course_plan_activity_id,
                private: f.private
            }

            request.push(this.thiFormDetailsService.addThiFormDetails(data_form));
        })


        if (request.length > 1 && form_id) {
            this.progressValue = 0;
            this.displayModal = true;
            this.waitting_title = "Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt";
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Lưu thành công")
                    this.returnToOrderPage(this.pageIndex);
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
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



    startFilter(event, key) {
        if (event && event.toString().trim() || event === 0) {
            this.objectFillter[key] = event;
        } else {
            this.objectFillter[key] = null;
        }
        this.returnToOrderPage(1);
    }

    keyupForFilterByName(event) {
        if (!event) {
            this.objectFillter['name'] = event.toString().trim();
            this.returnToOrderPage(1);
        }
    }

    changePage_form(event) {
        this.pageIndex = event.page + 1;
        this.loadFormPage(event.page + 1)
    }


    deleteForm(form: ThiForm) {
        this.selectedForm = form
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.thiFormService.deleteThiForm(form.id).subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.returnToOrderPage(this.pageIndex);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    taoCauTrucDe(form: ThiForm) {
        this.selectedForm = form;

        const index = this.list_course.findIndex(m => m.id === form.course_id);

        if (index !== -1) {
            this.selected_course_ = this.list_course[index];
        }

        this.notificationService.openSideNavigationMenu({ template: this.teampalteFormDetail, size: 1024, offsetTop: '0px' })
    }

    changeStatusForm(form) {
        this.notificationService.isProcessing(true);
        this.thiFormService.updateThiForm(form.id, { status: form.status === 1 ? 0 : 1 }).subscribe({
            next: () => {
                this.loadFormPage(this.pageIndex);
                this.notificationService.toastSuccess("Cập nhật trạng thái thành công");
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, cập nhật thất bại");
            }
        })
    }

    createDethi(form: ThiForm) {
        this.notificationService.confirm("Thầy/Cô có chắc chắn muốn sinh đề cho đề <span class='font-weight-600'>" + form.name + "</span> không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                const condition_form: ConditionOption = {
                    condition: [
                        { conditionName: 'form_id', condition: OvicQueryCondition.equal, value: form.id.toString() }
                    ],
                    set: [
                        { label: 'limit', value: '1' },
                        { label: 'select', value: 'id' }
                    ],

                    page: null
                }

                let tx_ = false;

                const index = this.list_course.findIndex(m => m.id === form.course_id && m.category_ids === 99);

                if (index !== -1 && this.key_server === "ictu") {
                    tx_ = true;
                }

                // if (form.av === 0 && !tx_) {
                //     this.thiFormService.sinhdev2(form.id).subscribe({
                //         next: () => {
                //             this.notificationService.isProcessing(false);
                //             this.notificationService.toastSuccess("Sinh đề thành công");
                //             this.loadFormPage(this.pageIndex);
                //         },
                //         error: () => {
                //             this.notificationService.isProcessing(false);
                //             this.notificationService.toastError("Sinh đề thất bại");
                //         }
                //     })
                // } else {
                this.thiFormDetailsService.getThiFormDetailsByPageNew(condition_form).subscribe({
                    next: (_form) => {
                        if (_form.recordsFiltered) {
                            this.thiFormService.sinhde(form.id).subscribe({
                                next: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastSuccess("Sinh đề thành công");
                                    this.loadFormPage(this.pageIndex);
                                },
                                error: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastError("Sinh đề thất bại");
                                }
                            })
                        } else {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastWarning("Vui lòng tạo cấu trúc đề");
                        }
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Sinh đề thất bại");
                    }
                })
                // }
            }
        })

    }

    deleteToanbode(form: ThiForm) {
        this.selectedForm = form
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.thiQuestionBankTnService.deleteThiQuestionBankTnByCol(form.id.toString(), 'form_id').subscribe({
                    next: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess("Xóa thành công");
                        this.loadFormPage(this.pageIndex);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    getCourseFormDonvi(event) {
        this.selectedDonvi_id = event;
        delete this.objectFillter.course_id;
        this.returnToOrderPage(1);
    }

    async onChangeMonHoc(event: ElnKhoaHoc) {

        if (event && event.id) {

            this.selected_course_ = event;

            this.list_form_kthp = [];

            this._user_created_plan = null;

            const condtion_kthp: ConditionOption = {
                condition: [
                    { conditionName: "course_id", condition: OvicQueryCondition.equal, value: event.id.toString(), orWhere: "and" }
                ],
                set: [
                    { label: 'limit', value: "-1" }
                ],
                page: null
            }

            this.notificationService.isProcessing(true);

            const form_kthp = await firstValueFrom(
                forkJoin([
                    this.courseFormKthpService.getCourseFormKthpByPageNew(condtion_kthp),
                    this.userService.getUserByItem(event.creator_plan_id ? event.creator_plan_id.toString() : '0', "id")
                ])
            );

            this.notificationService.isProcessing(false);

            this.list_form_kthp = form_kthp[0].data;

            this._user_created_plan = form_kthp[1][0];

            if (form_kthp[0].recordsFiltered === 0) {
                return this.notificationService.toastWarning("Môn học này chưa được tạo form thi KTHP, vui lòng liên hệ đến giảng viên phụ trách");
            }
        }
    }

    viewFormKthp() {
        this.modalService.open(this.templateFormKTHP, LARGE_MODAL_OPTIONS);
    }

    getTongSoCau() {
        if (this.list_form_kthp && this.list_form_kthp.length) {
            return this.list_form_kthp.map(m => m.total_question_take).reduce((sum, num) => sum + num, 0);
        }
        return 0;
    }

    openTemplateImportCbthi() {
        this.notificationService.openSideNavigationMenu({ template: this.templateImporCbthi, size: window.innerWidth, offsetTop: '0px' })
    }

    onOpenImportTemplate() {
        this.notificationService.openSideNavigationMenu({ template: this.templateImporthoidong, size: window.innerWidth, offsetTop: '0px' });
    }

    async checkForm(form: ThiForm) {
        const index = this.list_course.findIndex(m => m.id.toString() === form.course_id.toString());
        if (index !== -1) {


            this.list_form_kthp = [];

            this._user_created_plan = null;

            const condtion_kthp: ConditionOption = {
                condition: [
                    { conditionName: "course_id", condition: OvicQueryCondition.equal, value: form.course_id.toString(), orWhere: "and" }
                ],
                set: [
                    { label: 'limit', value: "-1" }
                ],
                page: null
            }

            this.progressValue = 0;

            this.displayModal = true;

            this.waitting_title = "Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt";

            const a = await firstValueFrom(this.thiFormService.updateThiForm(form.id, { status: 0 }));

            const b = await firstValueFrom(this.thiQuestionBankTnService.deleteThiQuestionBankTnByCol(form.id.toString(), 'form_id'));

            this.courseFormKthpService.getCourseFormKthpByPageNew(condtion_kthp).subscribe({
                next: (form_kthp) => {
                    if (form_kthp.recordsFiltered) {

                        this.list_form_kthp = form_kthp.data;

                        const request: Observable<any>[] = [];

                        if (form.id) {
                            request.push(this.thiFormDetailsService.deleteThiFormDetailsByCol(form.id.toString(), 'form_id'));
                        }

                        this.list_form_kthp.forEach(f => {
                            const data_form = {
                                course_id: f.course_id,
                                form_id: form.id,
                                week: f.week,
                                part: f.part,
                                cdr: f.cdr,
                                total_question_take: f.total_question_take,
                                course_plan_activity_id: f.course_plan_activity_id,
                                private: f.private
                            }

                            request.push(this.thiFormDetailsService.addThiFormDetails(data_form));
                        })

                        if (request.length > 1 && form.id) {
                            this.loopAddForm(request, 0).subscribe({
                                next: () => {
                                    this.displayModal = false;
                                    this.notificationService.isProcessing(true);
                                    const condition_form: ConditionOption = {
                                        condition: [
                                            { conditionName: 'form_id', condition: OvicQueryCondition.equal, value: form.id.toString() }
                                        ],
                                        set: [
                                            { label: 'limit', value: '1' },
                                            { label: 'select', value: 'id' }
                                        ],

                                        page: null
                                    }

                                    this.thiFormDetailsService.getThiFormDetailsByPageNew(condition_form).subscribe({
                                        next: (_form) => {
                                            if (_form.recordsFiltered) {
                                                this.thiFormService.sinhde(form.id).subscribe({
                                                    next: () => {
                                                        this.notificationService.isProcessing(false);
                                                        this.notificationService.toastSuccess("Sinh đề thành công");
                                                        this.thiFormService.updateThiForm(form.id, { status: 1 }).subscribe({
                                                            next: () => {
                                                                this.loadFormPage(this.pageIndex);
                                                            },
                                                            error: () => {

                                                            }
                                                        })

                                                    },
                                                    error: () => {
                                                        this.notificationService.isProcessing(false);
                                                        this.displayModal = false;
                                                        this.notificationService.toastError("Sinh đề thất bại");
                                                    }
                                                })
                                            } else {
                                                this.notificationService.isProcessing(false);
                                                this.displayModal = false;
                                                this.notificationService.toastWarning("Vui lòng tạo cấu trúc đề");
                                            }
                                        },
                                        error: () => {
                                            this.notificationService.isProcessing(false);
                                            this.displayModal = false;
                                            this.notificationService.toastError("Sinh đề thất bại");
                                        }
                                    })
                                },
                                error: () => {
                                    this.displayModal = false;
                                    this.notificationService.toastError("Lưu thất bại, vui lòng thử lại")
                                }
                            })
                        }
                    } else {
                        this.displayModal = false;
                        return this.notificationService.toastWarning("Môn học này chưa được tạo form thi KTHP, vui lòng liên hệ đến giảng viên phụ trách");
                    }
                },
                error: () => {
                    this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                }
            })

            this.notificationService.isProcessing(false);
        }
    }
}
