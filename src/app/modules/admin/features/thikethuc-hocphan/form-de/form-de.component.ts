import { ThiFormDetailsService } from './../../../../shared/services/thi-form-details.service';
import { ThiQuestionBankTnService } from './../../../../shared/services/thi-question-bank-tn.service';
import { ThiFormService } from './../../../../shared/services/thi-form.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { forkJoin, mergeMap, of } from 'rxjs';
import { SharedModule } from '@modules/shared/shared.module';
import { OvicQueryCondition } from '@core/models/dto';
import { FormDeChitietComponent } from "../form-de-chitiet/form-de-chitiet.component";
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { Router } from '@angular/router';

@Component({
    selector: 'app-form-de',
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
    ],
    templateUrl: './form-de.component.html',
    styleUrls: ['./form-de.component.css']
})
export class FormDeComponent implements OnInit {

    @ViewChild('paginator_form') paginator_form: Paginator;

    @ViewChild('createForm') createForm: TemplateRef<any>;

    @ViewChild('teampalteFormDetail') teampalteFormDetail: TemplateRef<any>;



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

    formTitle: string = 'Tạo form đề';

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
        private router: Router
    ) {
        const url = this.router.url.substring(7).split('?')[0];

        this.canAdded = this.auth.userCanAdd(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.canDelete = this.auth.userCanDelete(url);

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
                { label: 'select', value: 'id,av,maso,title,id,category_ids' },
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
    }

    openAddForm() {
        this.formTitle = 'Tạo form đề';
        this.formReset();
        this.notificationService.openSideNavigationMenu({ template: this.createForm, size: 800, offsetTop: '0px' })
    }

    openEditForm(form: ThiForm) {
        this.selectedForm = form;
        this.formTitle = 'Sửa ca thi';
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
            if (this.isUpdate) {
                this.thiFormService.updateThiForm(this.selectedForm.id, data).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess("Sửa thành công");
                        this.returnToOrderPage(this.pageIndex);
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
                    next: () => {
                        this.notificationService.toastSuccess("Thêm thành công");
                        this.returnToOrderPage(1);
                        this.notificationService.isProcessing(false);
                    },
                    error: () => {
                        this.notificationService.toastError("Thêm thất bại");
                        this.notificationService.isProcessing(false);
                    }
                })
            }
        } else {
            this.notificationService.toastWarning("Vui lòng nhập đầy đủ thông tin các trường có đánh dấu *")
        }
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
        this.notificationService.confirm("Thầy/Cô có chắc chắn muốn sinh đề cho form đề <span class='font-weight-600'>" + form.name + "</span> không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
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
}
