import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {InputSwitchModule} from "primeng/inputswitch";
import {MatLineModule} from "@angular/material/core";
import {MatListModule, MatSelectionListChange} from "@angular/material/list";
import {PaginatorModule} from "primeng/paginator";

import {SharedModule} from "@shared/shared.module";
import {TableModule} from "primeng/table";
import {NotificationService} from "@core/services/notification.service";
import {ClassManagementGvcnService} from "@shared/services/class-management-gvcn.service";
import {ClassManagement, ClassManagementService} from "@shared/services/class-management.service";
import {StudentCabiet, StudentsCabietService} from "@shared/services/students-cabiet.service";
import {
    StudentsCabietActivitiesService,
    StudentsCabietAvtivities
} from "@shared/services/students-cabiet-activities.service";
import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {AuthService} from "@core/services/auth.service";
import {ROUTERS} from "@shared/utils/syscat";
import {DonViService} from "@shared/services/don-vi.service";
import {DonVi} from "@shared/models/don-vi";
import {switchMap} from "rxjs";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {RadioButtonModule} from "primeng/radiobutton";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {CalendarModule} from "primeng/calendar";

@Component({
    selector: 'app-sinhvien-theodoi',
    standalone: true,
    imports: [CommonModule, FormsModule, InputSwitchModule, MatLineModule, MatListModule, PaginatorModule, SharedModule, SharedModule, TableModule, ButtonModule, RippleModule, RadioButtonModule, ReactiveFormsModule, MatCheckboxModule, CalendarModule],
    templateUrl: './sinhvien-theodoi.component.html',
    styleUrls: ['./sinhvien-theodoi.component.css']
})
export class SinhvienTheodoiComponent implements OnInit {
    @ViewChild('formInfo') formInfo: TemplateRef<any>;


    closeLeft: boolean = false;
    emptyMenu: string = 'Không có sinh viên nào cần theo dõi';
    listCabiet: StudentCabiet[];
    listCabietActivities: StudentsCabietAvtivities[] = [];

    recordTotalCabietActivies: number = 0;

    studentCabiet_select: StudentCabiet;
    limit: number = 20;
    recordTotal: number = 0;
    loadingActivitiesFail: boolean = false;
    loadingActiviti: boolean = false;
    page: number = 1;

    isManager: boolean = false;
    isChunhiem: boolean = false;
    listDonvi: DonVi[];

    listClassManagementByAdmin: ClassManagement[];
    classManagement_select: ClassManagement;
    form: FormGroup;

    list_hinhthuc_tuvan: { value: number, label: string }[] = [
        {value: 1, label: 'Tư vấn trực tiếp'},
        {value: 2, label: 'Tư vấn online(Email, mạng xã hội,...)'},
        {value: 3, label: 'Tư vấn qua điện thoại'},
    ];
    list_loi_vipham: { value: number, label: string, checker: boolean }[] = [
        {value: 1, label: 'Nghỉ quá số buổi quy định', checker: false},
        {value: 2, label: 'Không làm bài tập môn học', checker: false},
        {value: 3, label: 'Vi pham quy định của trường', checker: false},

    ]

    constructor(
        private noitifi: NotificationService,
        private classManagementService: ClassManagementService,
        private classManagementGvcnService: ClassManagementGvcnService,
        private studentsCabietService: StudentsCabietService,
        private studentsCabietActivitiesService: StudentsCabietActivitiesService,
        private auth: AuthService,
        private donViService: DonViService,
        private fb: FormBuilder
    ) {

        this.isManager = this.auth.hasRouter(ROUTERS.daotao) || this.auth.hasRouter(ROUTERS.admin) || this.auth.hasRouter(ROUTERS.cthssv);
        this.isChunhiem = this.auth.hasRouter(ROUTERS.chunhiem);

        this.form = this.fb.group({
            noidung_tuvan: ['', Validators.required],
            ketqua_tuvan: ['', Validators.required],
            loi_vipham: [null, Validators.required],
            hinhthuc_tuvan: [null, Validators.required],
            student_id: [0, Validators.required],
            students_cabiet_id: [0, Validators.required],
            class_management_id: [0, Validators.required],
            date_tuvan: ['', Validators.required],

        })

    }

    ngOnInit(): void {

        if (this.isManager) {
            this.loadInitByManager()
        } else if (this.isChunhiem) {
            this.loadInitByChunhiem()
        }
    }

    get f() {
        return this.form.controls;
    }

    loadInitByManager() {
        const condition_donvi: ConditionOption = {
            condition: [
                {conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1'},
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.userDonViId.toString(),
                    orWhere: 'and'
                }
            ],
            set: [
                {label: 'limit', value: '-1'}
            ],
            page: null
        };

        this.donViService.getDonviByPageNew(condition_donvi).subscribe({
            next: (_donvi) => {
                this.listDonvi = _donvi.data;
            }
        })
    }

    getDataClassManagemnt(id: number) {

        const conditionGetLop: ConditionOption = {
            condition: [
                {
                    conditionName: 'donvi_id',
                    condition: OvicQueryCondition.equal,
                    value: id.toString()
                },
            ],
            set: [
                {label: 'limit', value: '-1'},
                {label: 'order', value: 'ASC'},
                {label: 'orderby', value: 'title'},
            ],
            page: '1'
        }

        this.noitifi.isProcessing(true);
        this.classManagementService.getDataByPageNew(conditionGetLop).subscribe({
            next: ({data}) => {

                this.listClassManagementByAdmin = data;
                this.noitifi.isProcessing(false);

            },
            error: () => {

                this.noitifi.isProcessing(false);

            }
        })

    }

    btnSelectDonvi(event) {
        this.getDataClassManagemnt(event['id']);
    }

    btnSelectClassByAdmin(event) {
        this.classManagement_select = event;
        this.loadStudentCabietByClassManagementId(event.id)
    }

    loadStudentCabietByClassManagementId(id: number) {
        this.noitifi.isProcessing(true);

        const condition: ConditionOption = {
            condition: [
                {conditionName: 'class_management_id', condition: OvicQueryCondition.equal, value: id.toString()},
                {conditionName: 'status', condition: OvicQueryCondition.equal, value: '1'},
            ],
            page: '1',
            set: [
                {label: 'limit', value: '-1'},
                {label: 'order', value: 'ASC'},
                {label: 'orderby', value: 'id'},
                {label: 'with', value: 'user'},
            ],
        }
        this.studentsCabietService.getDataByPageNew(condition).subscribe({
            next: ({data}) => {
                this.listCabiet = data.length>0 ? data.map(m=>{
                    const user = m['user'];
                    m['_phone'] = user? user['phone'] : '';
                    m['_email'] = user? user['email'] : '';
                    return m;
                }) : [];
                this.noitifi.isProcessing(false);

            }, error: () => {
                this.noitifi.isProcessing(false);

            }
        })
    }


    loadInitByChunhiem() {
        this.noitifi.isProcessing(true);

        const condition: ConditionOption = {
            condition: [
                {conditionName: 'status', condition: OvicQueryCondition.equal, value: '1'},
                {
                    conditionName: 'gvcn_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.id.toString(),
                    orWhere: 'and'
                },
            ], page: '1',
            set: [
                {label: 'groupby', value: 'class_management_id'},
                {label: 'limit', value: '-1'}
            ]
        }

        this.classManagementGvcnService.getDataByPageNew(condition).pipe(switchMap(m => {

            const ids = m.data.map(a => a.class_management_id);

            const conditionClassManagement: ConditionOption = {
                condition: [
                    {conditionName: 'id', condition: OvicQueryCondition.equal, value: ids.toString(), orWhere: "in"},

                ], page: '1',
                set: [
                    {label: 'limit', value: '-1'},
                    {label: 'select', value: 'id,title,kyhieu,khoa,nganh_id,donvi_id'},
                ]
            }
            return this.classManagementService.getDataByPageNew(conditionClassManagement)
        })).subscribe({
            next: ({data, recordsFiltered}) => {
                this.listClassManagementByAdmin = data;
                this.noitifi.isProcessing(false);

            }, error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Load dữ liệu không thành công');
            }
        })

    }


    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onSearchByTitle() {

    }

    changePage(event) {

    }

    onSelectCabiet(event: MatSelectionListChange) {
        this.listCabietActivities = [];
        this.studentCabiet_select = event.options[0].value;
        this.page = 1;
        this.getQuatrinhCabietByStudent(this.studentCabiet_select)
    }

    getQuatrinhCabietByStudent(item: StudentCabiet) {
        this.noitifi.isProcessing(true);

        const conditionActivities: ConditionOption = {
            condition: [
                {
                    conditionName: 'student_id',
                    condition: OvicQueryCondition.equal,
                    value: item.student_id.toString(),
                },
                {
                    conditionName: 'student_id',
                    condition: OvicQueryCondition.equal,
                    value: item.student_id.toString(),
                },

            ],
            page: this.page.toString(),
            set: [
                {label: 'limit', value: '10'},
                {label: 'orderby', value: 'id'},
                {label: 'order', value: 'DESC'},
            ]
        }

        this.noitifi.isProcessing(true);
        this.studentsCabietActivitiesService.getDataByPageNew(conditionActivities).subscribe({
            next: ({data, recordsFiltered}) => {
                this.recordTotalCabietActivies = recordsFiltered;

                const newData = data.length > 0 ? data.map(m => {
                    m['_date_theodoi'] = m.type !== null ? this.strToTime(m.created_at) : this.strToTime(m.date_tuvan);
                    m['_hinhthuc_tuvan'] = m.hinhthuc_tuvan ? this.list_hinhthuc_tuvan.find(f=>f.value === m.hinhthuc_tuvan).label : '';
                    m['_loi_vipham'] = m.loi_vipham ? this.list_loi_vipham.filter(f=> m.loi_vipham.includes(f.value)).map(m=>m.label).join(', '):'';

                    return m;
                }) : [];
                this.listCabietActivities = this.page == 1 ? newData : [...this.listCabietActivities, ...newData];

                this.noitifi.isProcessing(false);

            }, error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Load dữ liệu không thành công');
            }
        })
    }

    strToTime(input: string): string {
        const date = input ? new Date(input) : null;
        let result = '';
        if (date) {
            result += [date.getDate().toString().padStart(2, '0'), (date.getMonth() + 1).toString().padStart(2, '0'), date.getFullYear().toString()].join('/');
            // result += ' ' + [date.getHours().toString().padStart(2, '0'), date.getMinutes().toString().padStart(2, '0')].join(':');
        }
        return result;
    }

    reloadingGetStudent() {
        this.loadStudentCabietByClassManagementId(this.classManagement_select.id);

    }


    // ---------------------FORM-----------------------

    closeForm() {
        this.noitifi.closeSideNavigationMenu();
    }

    btnOpenFormAdd() {
        this.form.reset({
            noidung_tuvan: '',
            ketqua_tuvan: '',
            loi_vipham: null,
            hinhthuc_tuvan: null,
            student_id: this.studentCabiet_select.student_id,
            students_cabiet_id: this.studentCabiet_select.id,
            class_management_id: this.studentCabiet_select.class_management_id,
            date_tuvan: '',
        })
        this.noitifi.openSideNavigationMenu({template: this.formInfo, size: 600, offsetTop: '0px'})
    }



    onChangeLoivipham(event, item: { value: number, label: string }) {
        const arrOld = this.f['loi_vipham'].value;

        let arrNew: any[] = [];
        if (event.checked) {
            arrNew = Array.isArray(arrOld) ? Array.from(new Set([...arrOld, item.value])) : [item.value];

        } else {
            arrNew = Array.isArray(arrOld) ? arrOld.filter(f => f !== item.value) : [];
        }
        this.form.get('loi_vipham').setValue(arrNew)

    }

    saveFormData() {
        if (this.form.valid) {
            const objectAdd = this.form.value;
            if (objectAdd['loi_vipham'] && objectAdd['loi_vipham'].length > 0) {
                this.noitifi.isProcessing(true);

                this.studentsCabietActivitiesService.add(this.form.value).subscribe({
                    next: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastSuccess('Thêm mới thành công');

                    }, error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError('Thêm mới không thành công');
                    }
                })
            } else {
                this.noitifi.toastWarning('Chọn lỗi vi phạm của sinh viên');
            }

        } else {
            this.noitifi.toastWarning('Vui lòng nhập đủ thông tin');
        }

    }

    viewMoreCabietActivityByStudent(){
        this.page = this.page +1;
        this.getQuatrinhCabietByStudent(this.studentCabiet_select)
    }
}
