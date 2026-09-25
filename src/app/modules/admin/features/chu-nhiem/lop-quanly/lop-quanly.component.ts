import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from "primeng/button";
import {CheckboxModule} from "primeng/checkbox";
import {DropdownModule} from "primeng/dropdown";
import {GeneralModule} from "@modules/kiem-thu-ngan-hang-cau-hoi/general/general.module";
import {MatLineModule} from "@angular/material/core";
import {MatListModule, MatSelectionListChange} from "@angular/material/list";
import {NgbModal, NgbTooltipModule} from "@ng-bootstrap/ng-bootstrap";
import {PaginatorModule} from "primeng/paginator";
import {RippleModule} from "primeng/ripple";
import {SharedModule} from "@shared/shared.module";
import {SidebarModule} from "primeng/sidebar";
import {TooltipModule} from "primeng/tooltip";
import {ClassManagementService} from "@shared/services/class-management.service";
import {ClassManagementGvcn, ClassManagementGvcnService} from "@shared/services/class-management-gvcn.service";
import {NotificationService} from "@core/services/notification.service";
import {ElngUserProfileService} from "@shared/services/elearning-user-profile.service";

import {ConditionOption} from "@shared/models/condition-option";
import {OvicQueryCondition} from "@core/models/dto";
import {forkJoin, of, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {ElngUserProfile} from "@shared/models/elng-user-profile";
import {TableModule} from "primeng/table";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {StudentsCabietService} from "@shared/services/students-cabiet.service";
import {InputSwitchModule} from "primeng/inputswitch";
import {StudentsCabietActivitiesService} from "@shared/services/students-cabiet-activities.service";
import {AuthService} from "@core/services/auth.service";

@Component({
    selector: 'app-lop-quanly',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, DropdownModule, GeneralModule, MatLineModule, MatListModule, NgbTooltipModule, PaginatorModule, RippleModule, SharedModule, SidebarModule, TooltipModule, TableModule, InputSwitchModule],
    templateUrl: './lop-quanly.component.html',
    styleUrls: ['./lop-quanly.component.css']
})
export class LopQuanlyComponent implements OnInit {
    @ViewChild("formTheodoiSinhvien") formTheodoiSinhvien: ElementRef;

    closeLeft: boolean = false;
    textSearch: string = '';
    classSelected: ClassManagementGvcn;
    listClassGvcn: ClassManagementGvcn[];
    emptyMenu: string = 'Giảng viên chưa được phân công chủ nhiệm';
    limit: number = 20;
    recordTotal: number = 0;
    page: number = 1;
    pageByStudent: number = 1;
    recordsTotalByStudent: number = 0;
    dataStudents: ElngUserProfile[];
    loadingStudent: boolean = true;
    loadingStudentFail: boolean = false;

    listCabiet: { label: string, value: number }[] = [
        {
            label: 'Mức 1', value: 1,
        },
        {
            label: 'Mức 2', value: 2,
        }
    ];

    form: FormGroup;

    constructor(
        private classManagementService: ClassManagementService,
        private classManagementGvcnService: ClassManagementGvcnService,
        private notifi: NotificationService,
        private elngUserProfileService: ElngUserProfileService,
        private studentsCabietService: StudentsCabietService,
        private studentsCabietActivitiesService: StudentsCabietActivitiesService,
        private auth:AuthService
    ) {

    }

    ngOnInit(): void {
        this.loadInit(this.page)
    }


    loadInit(page: number) {
        this.classSelected = null;
        this.dataStudents = [];
        this.notifi.isProcessing(true);
        const condition: ConditionOption = {
            condition: [
                {conditionName: 'status', condition: OvicQueryCondition.equal, value: '1'},
                {conditionName: 'gvcn_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere:'and'},
            ],
            page: page.toString(),
            set: [
                {label: 'search', value: this.textSearch ? this.textSearch : ''},
                {label: 'order', value: 'ASC'},
                {label: 'orderby', value: 'date_start'},
                {label: 'groupby', value: 'class_management_id'},
            ]
        }
        this.classManagementGvcnService.getDataByPageNew(condition).pipe(switchMap(m => {
            const management_ids = m.data.map(m => m.class_management_id);
            const conditionManagment: ConditionOption = {
                condition: [


                    {
                        conditionName: 'id',
                        condition: OvicQueryCondition.equal,
                        value: management_ids.toString(),
                        orWhere: 'in'
                    },
                ],
                page: '1',
                set: [
                    {label: 'limit', value: '-1',},
                    {label: 'select', value: 'id,title,khoa,donvi_id,kyhieu,nganh_id',},
                    {label: 'search', value: this.textSearch ? this.textSearch : ''}

                ]
            }
            return forkJoin([
                of(m),
                this.classManagementService.getDataByPageNew(conditionManagment).pipe(map(m => m.data))
            ])
        })).subscribe({
            next: ([{data, recordsFiltered}, dataClManagements]) => {

                this.listClassGvcn = data.length > 0 ? data.map(m => {
                    const classMngment = dataClManagements.find(f => f.id === m.class_management_id);
                    m['_classManagement'] = classMngment;
                    m['_title'] = classMngment ? classMngment.title : '';
                    m['_time_use'] = this.strToTime(m.date_start) + ' - ' + (m.date_end ? this.strToTime(m.date_end) : '');
                    return m;
                }) : [];

                this.recordTotal = recordsFiltered;

                this.notifi.isProcessing(false);
            }, error: () => {
                this.notifi.isProcessing(false);
                this.notifi.toastError('Load dữ liệu không thành công');
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

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onSearchByTitle() {
        this.page = 1;
        this.loadInit(this.page);
    }


    changePage(event) {
        this.page = event.page + 1;
        this.loadInit(event.page + 1);
    }

    onSelectClass(event: MatSelectionListChange) {
        this.classSelected = event.options[0].value;
        this.pageByStudent = 1;
        console.log(this.classSelected);
        this.getstudentByClass(this.pageByStudent, '');
    }

    // onSelectCourse ( event : MatSelectionListChange ) : void {
    //     this.menu.selected = event.options[ 0 ].value;
    //     this.collectTestReports();
    // }

    reloadingGetStudent() {
        this.pageByStudent = 1;
        this.getstudentByClass(this.pageByStudent, '');
    }

    getstudentByClass(page: number, search?: string) {
        this.loadingStudent = true
        // this.loadingStudentFail= false
        // this.notifi.isProcessing(true);

        const condition: ConditionOption = {
            condition: [
                {
                    conditionName: 'class_management_id',
                    condition: OvicQueryCondition.equal,
                    value: this.classSelected.class_management_id.toString(),
                },
                {
                    conditionName: 'teacher',
                    condition: OvicQueryCondition.notEqual,
                    value: '1',
                }
            ],
            page: page.toString(),
            set: [
                {label: 'limit', value: this.limit.toString()},
                {label: 'orderby', value: 'name'},
                {label: 'order', value: 'ASC'},
                {label: 'select', value: 'id,full_name,name,birthday,gender,class_management_id,student_code,user_id'}
            ]
        }


        this.elngUserProfileService.getElngUserProfileByPageNew(condition.condition, parseInt(condition.page), condition.set)
            .pipe(switchMap(m => {
                const conditionCabiet: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'student_id',
                            condition: OvicQueryCondition.equal,
                            value: m.data.map(m => m.id).toString(),
                            orWhere: 'in'
                        },

                        {
                            conditionName: 'status',
                            condition: OvicQueryCondition.equal,
                            value: '1',
                        },

                    ],
                    page: page.toString(),
                    set: [
                        {label: 'limit', value: '-1'},
                        {label: 'order', value: 'id'},

                    ]
                }

                return forkJoin([
                    of(m),
                    this.studentsCabietService.getDataByPageNew(conditionCabiet).pipe(map(m => m.data))

                ])
            })).subscribe({
            next: ([{data, recordsFiltered}, dataCabiet]) => {


                this.dataStudents = data.length > 0 ? data.map((m, index) => {
                    m['_index'] = index + 1;
                    const cabietByStudent = dataCabiet.find(f => f.student_id == m.id);
                    m['_cabietView'] = !!cabietByStudent;
                    m['_dataCabiet'] = cabietByStudent;
                    return m;
                }) : [];
                this.recordsTotalByStudent = recordsFiltered;
                console.log(this.dataStudents);

                this.loadingStudentFail = false;
                this.loadingStudent = false;

            }, error: () => {
                this.loadingStudent = false;
                this.loadingStudentFail = true;
                // this.notifi.isProcessing(false);
                this.notifi.toastError('Load dữ liệu không thành công');
            }
        })

    }

    changePageByStudent(event) {
        this.pageByStudent = event.page + 1;
        this.getstudentByClass(event.page + 1);
    }

    searchStudents(text: string) {
        console.log(text)
    }

    closeForm(d) {
        d(true);
    }

    onchangeDrd(event) {
        console.log(event);
        this.form.get('mucdo').setValue(event['value'])
    }

    saveFormTheodoi() {
        console.log(this.form.value);

        if (this.form.valid) {
            this.notifi.isProcessing(true);
            this.studentsCabietService.add({...this.form.value, type: 'start'}).subscribe({
                next: () => {
                    this.notifi.isProcessing(false)
                    this.notifi.toastSuccess('Thao tác thành công');
                    this.page = 1;
                    this.getstudentByClass(1)
                    this.closeForm(true);
                }, error: () => {
                    this.notifi.isProcessing(false);
                    this.notifi.toastError('Thao tác không thành công');
                    this.closeForm(true);

                }
            })
        } else {
            this.notifi.isProcessing(false)
            this.notifi.toastError('Vui lòng chọn mức độ cá biệt');
        }
    }

    btnChangeCabiet(event, row: ElngUserProfile) {
        const object = {
            class_management_id: row.class_management_id,
            student_id: row.id,
            status: event.checked ? 1 : 0,
            student_info: {
                id: row.id,
                class_management_id: row.class_management_id,
                student_code: row.student_code,
                full_name: row.full_name,
                name: row.name,
                birthday: row.birthday,
                gender: row.gender,
                user_id: row.user_id,
            },
            user_id: row.user_id,

        }
        console.log(object);
        this.notifi.isProcessing(true);

        this.studentsCabietService.add(object).pipe(switchMap(m => {
            return this.studentsCabietActivitiesService.add({
                student_id: row.id,
                class_management_id: row.class_management_id,
                title: object.status == 1 ? 'Bắt đầu theo dõi sinh viên cá biệt' : 'Kết thúc theo dõi sinh viên cá biệt',
                students_cabiet_id: m,
                type:object.status == 1 ?'start':'end',
            })
        })).subscribe({
            next: () => {
                this.notifi.isProcessing(false)
                this.notifi.toastSuccess('Thao tác thành công');

                this.getstudentByClass(this.page);


                // this.closeForm(true);
            }, error: () => {
                this.notifi.isProcessing(false);
                this.notifi.toastError('Thao tác không thành công');


            }
        })
    }
}
