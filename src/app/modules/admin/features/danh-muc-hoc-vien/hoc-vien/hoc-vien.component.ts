import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from 'src/app/core/services/auth.service';
import { HelperService } from 'src/app/core/services/helper.service';
import { ClassesService } from '../../../../shared/services/classes.service';
import { UserService } from 'src/app/core/services/user.service';
import { Classes } from '../../../../shared/models/classes';
import { ElnKhoaHoc } from '../../../../shared/models/elng-khoa-hoc';
import { User } from 'src/app/core/models/user';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';
import { OvicFlexibleColumn, OvicFlexibleTopbarRight, OvicMenu } from '../../../../shared/models/ovic-flexible-table';
import { OvicQueryCondition } from '../../../../../core/models/dto';
import { ElngUserProfile } from '../../../../shared/models/elng-user-profile';
import { ElngUserProfileService } from '../../../../shared/services/elearning-user-profile.service';
import { GENDER, ROLES } from '../../../../shared/utils/syscat';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver'
import { FileService } from 'src/app/core/services/file.service';
import { ElnChuyenMuc } from '../../../../shared/models/Elng';
import { ElnChuyenMucService } from '../../../../shared/services/elearning-chuyen-muc.service';
import { ClassStudentService } from '../../../../shared/services/class-student.service';
import { OvicTableStructure } from '../../../../shared/models/ovic-models';
import { MAXIMIZE_MODAL_OPTIONS } from '../../../../shared/utils/syscat';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@core/services/notification.service';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { OvicButton } from '@core/models/buttons';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { RoleService } from '@core/services/role.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { Router } from '@angular/router';
import { NORMAL_MODAL_OPTIONS_ROUND } from "@core/utils/syscat";
import { key_server } from "@env";
import { InputMaskModule } from 'primeng/inputmask';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        PaginatorModule,
        DialogModule,
        ReactiveFormsModule,
        FormsModule,
        MatProgressBarModule,
        TableModule,
        ProgressBarModule,
        InputMaskModule,
        RadioButtonModule
    ],
    selector: 'app-hoc-vien',
    templateUrl: './hoc-vien.component.html',
    styleUrls: ['./hoc-vien.component.css']
})
export class HocVienComponent implements OnInit {
    @ViewChild('inputImport') inputImport: ElementRef;
    @ViewChild('ImportStudent') importStudent: TemplateRef<any>;
    @ViewChild('ViewNewPass') viewNewPass: TemplateRef<any>;
    @ViewChild('templateUserProfile') templateUserProfile: TemplateRef<any>;
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    firstColTable: OvicMenu = {
        openState: false,
        cssClass: '',
        elements: [
            {
                hint: 'Sửa thông tin',
                label: '',
                icon: '<i class="fi-rr-edit"></i>',
                type: 'handleEvent',
                eventName: 'editDataClasses',
                cssClass: 'edit-color'
            },
            {
                hint: '',
                label: '',
                icon: '<i class="fi-rr-menu-burger"></i>',
                type: 'link',
                cssClass: '',
                child: {
                    cssClass: '',
                    elements: [
                        {
                            label: 'Xem lớp học phần đã đăng ký',
                            icon: '<i class="fa fa-eye" ></i>',
                            type: 'handleEvent',
                            eventName: 'showDetail',
                            cssClass: ''
                        },
                        {
                            label: 'Động bộ cache',
                            icon: '<i class="fa fa-refresh" ></i>',
                            type: 'handleEvent',
                            eventName: 'sync',
                            cssClass: ''
                        }
                    ],
                    openState: false
                }
            }
        ]
    };
    cols: OvicFlexibleColumn[];
    studentTable: OvicFlexibleColumn[];
    formUserProfile: FormGroup;
    formTitle = 'Thêm Sinh viên';
    topRightAction: OvicFlexibleTopbarRight[] = [
        // {
        //     type: 'handleEvent',
        //     eventName: 'downloadEx',
        //     label: 'Tải file mẫu',
        //     icon: '',
        //     btnClass: 'btn-open-form',
        //     templateName: ''
        // },
        // {
        //     type : 'handleEvent' ,
        //     eventName : 'addStudent' ,
        //     label : 'Thêm mới' ,
        //     icon : '' ,
        //     btnClass : 'btn-open-form' ,
        //     templateName : ''
        // } ,

    ];
    titleForm = 'Danh sách Sinh viên đã đăng ký khóa học';
    userId: number;
    donviId: number;
    userCourseId: number;
    isManager = false;
    myObj = {
        style: 'currency',
        currency: 'VND'
    };
    dmUser = [];
    dmCourse: ElnKhoaHoc[];
    dmClass: Classes[];
    fullUser = [];
    genderOption = GENDER;
    dmStudent: ElngUserProfile[];
    isUpdate = false;
    changePass = false;
    selectedStudent: ElngUserProfile;
    error = true;
    showButtonContinue = true;
    totalStudent: number;
    limitStudent = 20;
    objectStudent = {};
    pageIndex = 0;
    dmChuyenmuc = [];
    objectSearch = {};
    conditionFilter = [];
    canAdd = false;
    canEdit = false;
    importStarted = false;
    tblCols: OvicTableStructure[] = [
        {
            fieldType: 'normal',
            field: ['name'],
            rowClass: '',
            header: 'Tên lớp học phần',
            sortable: false,
            headClass: 'ovic-w-400px'
        },
        {
            fieldType: 'normal',
            field: ['id'],
            rowClass: 'text-center',
            header: 'Mã lớp',
            sortable: false,
            headClass: 'ovic-w-80px'
        },
        {
            fieldType: 'normal',
            field: ['manager_info'],
            rowClass: '',
            header: 'Giảng viên/ trợ giảng',
            sortable: false,
            innerData: true,
            headClass: ''
        }
    ];

    tblCols_sinhvien: OvicTableStructure[] = [
        {
            fieldType: 'normal',
            field: ['full_name'],
            rowClass: 'text-left',
            header: 'Tên sinh viên',
            sortable: false,
            headClass: 'ovic-w-250px'
        },
        {
            fieldType: 'normal',
            field: ['student_code'],
            rowClass: 'text-left',
            header: 'Mã sinh viên',
            sortable: false,
            innerData: true,
            headClass: 'ovic-w-200px'
        },
        {
            fieldType: 'normal',
            field: ['birthday_format'],
            rowClass: 'text-center',
            header: 'Ngày sinh',
            sortable: false,
            innerData: true,
            headClass: 'ovic-w-100px text-center'
        },
        {
            fieldType: 'normal',
            field: ['email'],
            rowClass: 'text-left',
            header: 'Email',
            sortable: false,
            innerData: true,
            headClass: 'ovic-w-250px'
        },
        // {
        //     fieldType: 'normal',
        //     field: ['totalClass'],
        //     rowClass: 'text-center',
        //     header: 'Số LHP',
        //     sortable: false,
        //     innerData: true,
        //     headClass: 'ovic-w-80px text-center'
        // },
        {
            fieldType: 'normal',
            field: ['category_name'],
            rowClass: 'text-left',
            header: 'Tên ngành học',
            sortable: false,
            innerData: true,
            headClass: 'ovic-w-250px'
        },
        {
            fieldType: 'normal',
            field: ['tenlop_quanly'],
            rowClass: 'text-center',
            header: 'Lớp',
            sortable: false,
            innerData: true,
            headClass: 'ovic-w-100px text-center'
        },
        {
            fieldType: 'normal',
            field: ['khoadaotao'],
            rowClass: 'text-center',
            header: 'Khóa',
            sortable: false,
            innerData: true,
            headClass: 'ovic-w-80px text-center'
        },

    ];

    progressValue = 0;
    startProgress = false;
    countProgressValue = 0;
    duplicateStudent = [];
    noStudentData = [];
    inputImportValue: any;
    selectedValue = 0;/// ghi đè hoặc ko ghi đè
    selected_page = 0;
    selectedStudents: ElngUserProfile[] = [];
    canDelete = false;
    waitting_title = 'Vui lòng không tắt máy';
    displayModal = false;
    role_student_id: number;

    keyServer = key_server;

    constructor(
        private fileService: FileService,
        private helperService: HelperService,
        public formBuilder: FormBuilder,
        private auth: AuthService,
        private classesService: ClassesService,
        private userService: UserService,
        private elngUserProfileService: ElngUserProfileService,
        private elnChuyenMucService: ElnChuyenMucService,
        private classStudentService: ClassStudentService,
        private modalService: NgbModal,
        private noitify: NotificationService,
        private httpHelper: HttpParamsHeplerService,
        private roleService: RoleService,
        private router: Router,
    ) {
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        const url = this.router.url.substring(7).split('?')[0];
        this.canAdd = this.auth.userCanAdd(url);
        this.canEdit = this.auth.userCanEdit(url);
        this.canDelete = this.auth.userCanDelete(url);
        this.noitify.closeOvicFlexibleTemplate();
        this.formUserProfile = this.formBuilder.group(
            {
                user_id: [''],
                full_name: ['', Validators.required],
                student_code: [''],
                birthday: [''],
                gender: ['', Validators.required],
                address: [''],
                username: ['', Validators.required],
                password: ['', Validators.required],
                email: ['', Validators.required],
                roles_ids: [''],
                donvi_ids: [''],
                status: [''],
                donvi_id: [''],
                display_name: ['', Validators.required],
                phone: ['', Validators.required],
                facebook: [''],
                twitter: [''],
                instagram: ['']
            }
        );

        if (this.canEdit) {
            this.tblCols_sinhvien.push(
                {
                    fieldType: 'switch',
                    field: ['status'],
                    rowClass: 'round text-center',
                    header: 'Active',
                    sortable: false,
                    headClass: 'ovic-w-80px text-center'
                },
                {
                    tooltip: '',
                    fieldType: 'buttons',
                    field: [],
                    rowClass: 'ovic-w-110px text-center',
                    checker: 'fieldName',
                    header: 'Thao tác',
                    sortable: false,
                    headClass: 'ovic-w-120px text-center',
                    buttons: [
                        {
                            tooltip: 'Cập nhật mật khẩu',
                            label: '',
                            icon: 'pi pi-refresh',
                            name: 'RESET_PASS',
                            cssClass: 'btn-warning rounded'
                        },
                        {
                            tooltip: 'Cập nhật',
                            label: '',
                            icon: 'pi pi-file-edit',
                            name: 'EDIT',
                            cssClass: 'btn-primary rounded'
                        },

                    ]
                }
            );

            // this.tblCols_sinhvien.push({
            //     tooltip: 'edit',
            //     fieldType: 'actions',
            //     field: ['edit'],
            //     rowClass: 'text-center',
            //     header: 'Thao tác',
            //     sortable: false,
            //     headClass: 'ovic-w-80px text-center',
            // }
            // );
        }
    }


    get f() {
        return this.formUserProfile.controls;
    }

    ngOnInit(): void {
        // this.loadData();
        this.firstLoadData();
    }

    firstLoadData() {
        this.noitify.isProcessing(true);
        const condition_role_sinhvien: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: ROLES.student },
                { label: 'include_by', value: 'name' }
            ],
            page: null
        }

        const condition = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ]).set('limit', -1).set("groupby", "category_name").set("orderby", "category_name").set("order", "ASC").set('select', 'category_name');

        forkJoin([
            this.elngUserProfileService.getElngUserProfileByCols(condition),
            this.roleService.getRolesByPageNew(condition_role_sinhvien)
        ]).subscribe({
            next: ([_chuyenmuc, _roles]) => {
                this.noitify.isProcessing(false);
                this.dmChuyenmuc = _chuyenmuc.filter(m => m['category_name']);
                const index = _roles.data.findIndex(m => m.name === 'student');
                this.role_student_id = _roles.data[index].id;
                this.loadMainData(1, this.limitStudent);
            },
            error: () => {
                this.noitify.toastError("Không load được giữ liệu");
                this.noitify.isProcessing(false);
            }
        })
    }

    loadMainData(page: number, limit) {
        this.noitify.isProcessing(true);
        const arr_condition_profile = [
            { conditionName: 'teacher', condition: OvicQueryCondition.notEqual, value: '1', orWhere: 'and' },
        ]

        Object.keys(this.objectSearch).forEach(f => {
            if (this.objectSearch[f]) {
                if (f === 'khoadaotao' || f === 'category_id') {
                    arr_condition_profile.push({
                        conditionName: f,
                        condition: OvicQueryCondition.equal,
                        value: this.objectSearch[f],
                        orWhere: 'and'
                    })
                } else {
                    arr_condition_profile.push({
                        conditionName: f,
                        condition: OvicQueryCondition.like,
                        value: '%'.concat(this.objectSearch[f], '%'),
                        orWhere: 'and'
                    })
                }
            }
        })

        const setCondition = [
            { label: 'limit', value: limit.toString() }
        ]

        this.elngUserProfileService.getElngUserProfileByPageNew(arr_condition_profile, page, setCondition).pipe(mergeMap(_student => {
            const userids = [];
            const usernames = [];
            _student.data.forEach((f, key) => {
                userids.push(f.user_id);
                usernames.push(f.student_code);
            })

            const condition_user = this.httpHelper.paramsConditionBuilder(
                [
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                ]).set("include", usernames.toString()).set("include_by", "username").set("limit", limit);

            return this.userService.getUserByCols(condition_user).pipe(mergeMap(_resUser => {
                if (_resUser.length) {
                    const _resObject = {};
                    _resUser.forEach((f, key) => {
                        if (!_resObject[f.username]) {
                            _resObject[f.username] = f;
                        }
                    })
                    _student.data = this.merData(_student.data, _resObject, page);
                }
                return of(_student);
            }))
        })).subscribe({
            next: (_resProfile) => {
                this.dmStudent = _resProfile.data;
                this.totalStudent = _resProfile.recordsFiltered;
                this.noitify.isProcessing(false);
                // const userids = [];
                // userProfile.forEach((f, key) => {
                //     userids.push(f.user_id);
                //     const condition_class_student = this.httpHelper.paramsConditionBuilder(
                //         [
                //             { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: f.user_id.toString() },
                //             { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                //         ]).set("pluck", "class_id");
                // })

                // const condition_user = this.httpHelper.paramsConditionBuilder(
                //     [
                //         { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
                //     ]).set("include", userids.toString()).set("include_by", "id");

                // this.userService.getUserByCols(condition_user).subscribe(_resUser => {
                //     if (_resUser.length) {
                //         const _resObject = {};
                //         _resUser.forEach((f, key) => {
                //             if (!_resObject[f.id]) {
                //                 _resObject[f.id] = f;
                //             }
                //         })
                //         this.dmStudent = this.merData(userProfile, _resObject, page);
                //     }
                // })
            },
            error: () => {
                this.noitify.isProcessing(false);
                this.noitify.toastError("Không load được giữ liệu")
            }
        })
    }

    userActions(btn: OvicButton) {
        switch (btn.name) {
            case 'SWITCH':
                this.switchEvent(btn.data);
                break;
            case 'EDIT':
                if (this.canAdd) {
                    this.editform(btn.data);
                } else {
                    this.noitify.toastError('Bạn không có quyền');
                }
                break;
            case 'RESET_PASS':
                this.btnResetPass(btn.data)
                break;
            default:
                break;
        }
    }

    switchEvent(id) {
        this.noitify.isProcessing(true);
        const index = this.dmStudent.findIndex(dt => dt.id === id);
        if (index !== -1) {
            const status = this.dmStudent[index]['status'] ? 0 : 1;
            this.userService.updateUserS(this.dmStudent[index]['user_id'], { status: status }).subscribe({
                next: () => {
                    this.loadMainData(this.selected_page + 1, this.limitStudent);
                    this.closeForm();
                    this.noitify.toastSuccess('Thay đổi trạng thái tài khoản thành công');
                },
                error: () => {
                    this.noitify.isProcessing(false);
                    this.noitify.toastError('Thay đổi trạng thái thất bại')
                }
            });
        }
    }

    merData(student: ElngUserProfile[], object, page?) {
        const start = (page - 1) * this.limitStudent;
        const result = student.map((m, key) => {
            m['index_'] = start + 1 + key;
            if (object[m.student_code]) {
                m['username'] = object[m.student_code].username;
                m['display_name'] = object[m.student_code].display_name;
                m['phone'] = object[m.student_code].phone;
                m['email'] = object[m.student_code].email;
                m['password'] = object[m.student_code].password;
                m['role_ids'] = object[m.student_code].role_ids;
                m['donvi_id'] = object[m.student_code].donvi_id;
                m['donvi_ids'] = object[m.student_code].donvi_id;
                m['status'] = object[m.student_code].status;
                m['user_id'] = object[m.student_code].id;
            }
            const d = new Date();
            const dateString = d.toLocaleString('en-GB');
            m['reGender'] = this.genderOption.find(i => i.value === m.gender) ? this.genderOption.find(i => i.value === m.gender)['label'] : '';
            m['birthday_format'] = m.birthday;
            return m;
        });
        return result;
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onloadend = (event) => {
                const localUrl = reader.result;
                const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                const wsname: string = wb.SheetNames[0];
                const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                this.convertToSqlData(data.filter(m => m[1] && m[2] && m[4] && m[5] && m[6] && m[7] && m[11]));
            };
        }
    }

    convertToSqlData(data) {
        this.startProgress = true;
        this.progressValue = 0;
        this.countProgressValue = 0;
        data.splice(0, 1);
        const objectDuplicate = {};
        this.noStudentData = [];
        this.duplicateStudent = [];
        data.forEach((f, key) => {
            if (!objectDuplicate[f[6]]) {
                objectDuplicate[f[6]] = { ...f };
            } else {
                objectDuplicate[f[6]]['duplicate'] = true;
                this.duplicateStudent.push(objectDuplicate[f[6]]);
                this.duplicateStudent.push(f);
            }
            if (!objectDuplicate[f[6]]['duplicate']) {
                const user = {
                    display_name: f[1] ? f[1] : null,
                    email: f[6] ? f[6].toLowerCase() : null, //this.helperService.convertToSqlServerTime ( f[ 4 ].split ( /.|-/ ).join ( '/' ) ) ,
                    username: f[5].toLowerCase() ? f[5].toLowerCase() : f[6].toLowerCase(),
                    password: f[2] ? f[2].trim().replace(/\D/g, '').concat('@Ictu') : null,
                    phone: f[4] ? f[4] : f[5],
                    donvi_id: 1,
                    status: 1,
                    role_ids: [this.role_student_id.toString()],
                };

                const userProfile = {
                    user_id: null,
                    full_name: f[1].trim(),
                    full_name_slug: this.helperService.slugVietnamese(f[1].trim()),
                    name: f[1] ? f[1].trim().split(' ')[f[1].trim().split(' ').length - 1] : null,
                    birthday: f[2] ? f[2].trim().replace(/\D/g, '/') : null,
                    gender: f[3] ? f[3] : null,
                    student_code: f[5] ? f[5].toLowerCase() : null,
                    tenlop_quanly: f[7] ? f[7] : null,
                    khoadaotao: f[11] ? f[11] : null,
                    category_name: f[9] ? f[9] : null,
                    teacher: 0,
                };
                setTimeout(() => {
                    this.userService.getUserByCol('email', user.email).subscribe(res => {
                        if (res.length) {
                            userProfile.user_id = res[0].id;
                            this.addStudentInUserProfile(userProfile.user_id, userProfile, data.length, f, user);
                        } else {
                            this.userService.creatUser(user).subscribe({
                                next: (id) => {
                                    userProfile.user_id = id;
                                    this.elngUserProfileService.addElngUserProfile(userProfile).subscribe({
                                        next: () => {
                                            this.countProgressStudent(data.length)
                                        },

                                        error: () => {
                                            this.noStudentData.push(f);
                                            this.countProgressStudent(data.length);
                                        }
                                    });
                                },
                                error: () => {
                                    this.noStudentData.push(f);
                                    this.countProgressStudent(data.length);
                                }
                            });
                        }
                    });
                }, 100 * key);
            } else {
                this.countProgressStudent(data.length);
            }
        });
    }

    addStudentInUserProfile(userId, userProfile, length, f, user) {
        this.elngUserProfileService.getElngUserProfileByItem(userId, "user_id").subscribe(_res => {
            if (_res.length) {
                if (Number(this.selectedValue)) {
                    const data = { ...user };
                    delete data.email;
                    delete data.username;
                    delete data.phone;
                    forkJoin([
                        this.elngUserProfileService.updateElngUserProfile(_res[0].id, userProfile),
                        this.userService.updateUserS(userId, data)
                    ]).subscribe({
                        next: () => {
                            this.countProgressStudent(length);
                        },
                        error: () => {
                            this.noStudentData.push(data);
                            this.countProgressStudent(length);
                        }
                    })
                } else {
                    this.countProgressStudent(length);
                }
            } else {
                this.elngUserProfileService.addElngUserProfile(userProfile).subscribe({
                    next: () => {
                        this.countProgressStudent(length)
                    },
                    error: () => {
                        this.noStudentData.push(f);
                        this.countProgressStudent(length);
                    }
                });
            }
        })
    }

    countProgressStudent(maxLength: number) {
        this.countProgressValue = this.countProgressValue + 1;
        this.progressValue = this.countProgressValue / maxLength * 100;
        if (this.countProgressValue === maxLength) {
            this.noitify.toastSuccess('Thêm thành công');
            this.startProgress = false;
            this.progressValue = 0;
            this.countProgressValue = 0;
            this.importStarted = true;
            this.loadFirstPage();
        }
    }


    clearFormData() {
        this.formUserProfile.reset();
        this.isUpdate = false;
        this.changePass = false;
    }

    topBarRightEvent(event_name: string) {
        if (event_name) {
            switch (event_name) {
                case 'addStudent':
                    if (this.isManager) {
                        this.clearFormData();
                        this.noitify.openSideNavigationMenu({
                            template: this.templateUserProfile,
                            size: 600,
                            offsetTop: '0px'
                        });
                    } else {
                        this.noitify.toastWarning('Bạn không có quyền');
                    }

                    break;
                case 'importStudent':
                    if (this.isManager) {
                        this.inputImport.nativeElement.value = '';
                        this.inputImport.nativeElement.click();
                    } else {
                        this.noitify.toastWarning('Bạn không có quyền');
                    }
                    break;
                default:
                    break;
            }
        }
    }

    closeForm() {
        this.noitify.closeSideNavigationMenu();
    }

    editform(id: number) {
        this.isUpdate = true;
        const object = this.dmStudent.find(m => m.id === id);
        this.selectedStudent = object;
        this.changePass = false;
        this.f['email'].setValue(object['email']);
        this.f['full_name'].setValue(object.full_name);
        this.f['birthday'].setValue(object['birthday_format']);
        this.f['student_code'].setValue(object.student_code);
        this.f['username'].setValue(object['username']);
        this.f['password'].setValue(object['password']);
        this.f['display_name'].setValue(object['display_name']);
        this.f['phone'].setValue(object['phone']);
        this.f['email'].setValue(object['email']);
        this.f['address'].setValue(object.address);
        this.f['gender'].setValue(object.gender);
        this.f['facebook'].setValue(object.social_link ? object.social_link.facebook : '');
        this.f['twitter'].setValue(object.social_link ? object.social_link.twitter : '');
        this.f['instagram'].setValue(object.social_link ? object.social_link.instagram : '');
        this.noitify.openSideNavigationMenu({ template: this.templateUserProfile, size: 600, offsetTop: '0px' });
    }

    taoTaiKhoan(form: FormGroup, user, userProfile) {
        if (form.valid) {
            this.userService.creatUser({ ...user }).subscribe({
                next: (res) => {
                    if (res['error']) {
                        //let mess = '';
                        // if ( res.data.error.username ) {
                        //     form.get( 'username' ).setErrors( { 'incorrect' : true } );
                        //     mess = ''.concat( 'Tên tài khoản đã tồn tại' , '<br/>' );
                        // }
                        // if ( res.data.error.email ) {
                        //     form.get( 'email' ).setErrors( { 'incorrect' : true } );
                        //     mess = ''.concat( mess , 'Địa chỉ email đã tồn tại.' , '<br/>' );
                        //     // mess = ''.concat( mess , res.data.error.email );
                        // }
                        // if ( res.data.error.phone ) {
                        //     form.get( 'email' ).setErrors( { 'incorrect' : true } );
                        //     mess = ''.concat( mess , res.data.error.phone );
                        //     // mess = ''.concat( mess , res.data.error.email );
                        // }
                        //return this.helperService.showError( mess , 'Lỗi tạo tài khoản' );
                    } else {
                        userProfile.user_id = res;
                        this.elngUserProfileService.addElngUserProfile(userProfile).subscribe(() => {
                            this.noitify.toastSuccess('Thêm mới tài khoản thành công');
                            this.loadFirstPage();
                        });
                    }
                },
                error: () => {
                    return this.noitify.toastError('Thêm mới tài khoản thất bại');
                }
            });
        } else {
            if (form.get('role_ids').invalid) {
                return this.noitify.toastInfo('Chọn nhóm quyền cho tài khoản');
            }
            form.markAllAsTouched();
            this.noitify.toastError('Vui lòng kiểm tra lại', 'Lỗi nhập liệu');
        }
    }

    passwordValidator(password) {
        if (!password.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?!.*?[\s])(?=.*?[#?!@$%^&*-]).{8,30}$/)) {
            return false;
        }
        return true;
    }

    submitData() {
        if (this.formUserProfile.valid) {
            const user = {
                username: this.f['username'].value.trim(),
                password: this.f['password'].value.trim(),
                display_name: this.f['display_name'].value.trim(),
                phone: this.f['phone'].value ? this.f['phone'].value.trim() : null,
                email: this.f['email'].value ? this.f['email'].value.trim().toLowerCase() : null,
                donvi_id: this.donviId,
                role_ids: [this.role_student_id.toString()],
                status: 1
            };
            const userProfile = {
                user_id: null,
                student_code: this.f['student_code'].value ? this.f['student_code'].value.toLowerCase().trim() : null,
                full_name: this.f['full_name'].value ? this.f['full_name'].value.trim() : null,
                full_name_slug: this.f['full_name'].value ? this.helperService.slugVietnamese(this.f['full_name'].value.trim()) : null,
                name: this.f['full_name'].value ? this.f['full_name'].value.trim().split(' ')[this.f['full_name'].value.trim().split(' ').length - 1] : null,
                birthday: this.f['birthday'].value,
                gender: this.f['gender'].value,
                address: this.f['address'].value ? this.f['address'].value.trim() : null,
                teacher: 0,
            };
            if (this.isUpdate) {
                if (!this.changePass) {
                    delete user.password;
                } else {
                    if (!this.passwordValidator(user.password)) {
                        this.noitify.toastError('Vui lòng kiểm tra lại mật khẩu', 'Lỗi nhập liệu');
                        return;
                    }
                }
                userProfile.user_id = this.selectedStudent.user_id;
                user['id'] = userProfile.user_id;

                if (user.email === this.selectedStudent['email']) {
                    delete user.email;
                }

                if (user.username === this.selectedStudent['username']) {
                    delete user.username;
                }

                forkJoin([
                    this.userService.updateUserS(user['id'], user),
                    this.elngUserProfileService.updateElngUserProfile(this.selectedStudent.id, userProfile),
                ]).subscribe(() => {
                    // this.syncCache(userProfile);
                    this.noitify.toastSuccess('Cập nhật thành công');
                    this.loadFirstPage();
                });
            } else {
                this.taoTaiKhoan(this.formUserProfile, user, userProfile);
            }
        } else {
            this.noitify.toastError('Lỗi nhập liệu');
        }
    }

    clickChangedPass() {
        const state = this.changePass;
        this.changePass = !state;
    }

    changePage(event) {
        this.limitStudent = event.rows;
        this.selected_page = event.page;
        this.loadMainData(event.page + 1, this.limitStudent);
    }

    onFirstPageLoad() {
        this.loadMainData(this.selected_page + 1, this.limitStudent);
    }

    searchChange(event, name) {
        if (event) {
            if (name === "category_name") {
                this.objectSearch['category_name'] = event.category_name;
            } else {
                if (event.target.value.trim() !== '') {
                    this.objectSearch[name] = event.target.value.trim();
                } else {
                    this.objectSearch[name] = null;
                }
            }
        } else {
            delete this.objectSearch[name];
        }
        this.loadMainData(1, this.limitStudent)
    }

    openImportSinhvien() {
        this.selectedValue = 0;
        this.noitify.openSideNavigationMenu({ template: this.importStudent, size: window.innerWidth });
    }

    openExpolerImport() {
        this.inputImportValue = null;
        this.importStarted = false;
        this.inputImport.nativeElement.click();
    }

    resetImport() {
        this.importStarted = false;
        this.inputImportValue = null;
    }

    downLoadFileEx() {
        this.fileService.getFileContent('..\\assets\\files\\Danh_sach_sinh_vien_import_mau.xlsx').subscribe(res => {
            saveAs(res, 'Danh_sach_sinh_vien_import_mau.xlsx');
        });
    }

    syncCache(student: ElngUserProfile) {
        const data = {
            name: student.name,
            full_name: student.full_name,
            birthday: student['birthday'],
            student_code: student.student_code,
            email: student['email']
        }

        this.classStudentService.updateClassStudentByCol(student.id, { user_info: data }, 'student_id').subscribe(_res => {
            this.noitify.toastSuccess("Đồng bộ thành công")
        })
    }

    loadFirstPage() {
        this.loadMainData(this.selected_page + 1, this.limitStudent);
    }

    onCheckBoxStudentTable(event) {
        this.selectedStudents = event;
    }

    deleteSinhvien() {
        if (this.selectedStudents.length) {
            this.noitify.confirmDelete().then(a => {
                if (a) {
                    this.displayModal = true;
                    this.progressValue = 0;
                    const user_ids = [];
                    const student_ids = [];
                    let i = 0;
                    user_ids[i] = [];
                    student_ids[i] = [];
                    this.selectedStudents.forEach(f => {
                        if (user_ids[i].length < 100) {
                            user_ids[i].push(f.user_id);
                            student_ids[i].push(f.id);
                        } else {
                            i = i + 1;
                            user_ids[i] = [];
                            student_ids[i] = [];
                            user_ids[i].push(f.user_id);
                            student_ids[i].push(f.id);
                        }
                    })

                    this.loopDelete(user_ids[0], student_ids[0], user_ids, student_ids, 0);
                }
            })
        } else {
            this.noitify.toastWarning("Vui lòng chọn sinh viên")
        }
    }

    loopDelete(data_user: any[], data_profile: any[], data_users: any[], data_profiles: any[], key: number) {
        if (key < data_users.length) {
            this.progressValue = (key + 1) / data_users.length * 100;
            const user_ids = [];
            const student_ids = [];
            data_user.forEach(f => {
                user_ids.push(f);
            });
            data_profile.forEach(f => {
                student_ids.push(f);
            })
            forkJoin([
                this.userService.deleteUser(user_ids.toString()),
                this.elngUserProfileService.deleteElngUserProfile(student_ids.toString()),
            ]).subscribe({
                next: () => {
                    this.loopDelete(data_users[key + 1], data_profiles[key + 1], data_users, data_profiles, key + 1);
                },
                error: () => {
                    this.loopDelete(data_users[key + 1], data_profiles[key + 1], data_users, data_profiles, key + 1);
                }
            })
        } else {
            this.displayModal = false;
            this.noitify.toastSuccess("Xóa thành công");
            this.loadFirstPage();
        }
    }


    noteNewPass: string = '';
    btnResetPass(id: number) {
        const object = this.dmStudent.find(m => m.id === id);
        this.selectedStudent = object;
        const newPass = object.birthday.replace(/\//g, '') + (this.keyServer == 'hvu' ? '@Hvu' : '@Ictu');
        this.noitify.isProcessing(true);
        this.userService.updateUserS(object.user_id, { password: newPass }).subscribe({
            next: () => {
                this.noitify.isProcessing(false);
                this.noitify.toastSuccess('Thao tác thành công');
                this.loadFirstPage();
                this.noteNewPass = newPass;
                this.modalService.open(this.viewNewPass, NORMAL_MODAL_OPTIONS_ROUND)
            }, error: () => {
                this.noitify.isProcessing(false);
                this.noitify.toastError('Thao tác thất bại');
            }
        })
    }

    closeFormViewQuestion(d) {
        d(true);
    }

    btncopy() {
        navigator.clipboard.writeText(this.noteNewPass).then(() => {
            this.noitify.toastSuccess('Đã sao chép')
        }).catch(err => {
            this.noitify.toastError('Không thể sao chép');
        });

    }

}
