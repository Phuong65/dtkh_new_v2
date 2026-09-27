import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatCheckboxChange, MatCheckboxModule} from "@angular/material/checkbox";
import {Paginator, PaginatorModule} from "primeng/paginator";
import {OvicTableComponent} from "@modules/shared/components/ovic-table/ovic-table.component";
import {SharedModule} from "@shared/shared.module";
import {Role} from "@core/models/role";
import {User} from "@core/models/user";
import {OvicTableStructure} from "@shared/models/ovic-models";
import {firstValueFrom, forkJoin, Observable, of, Subject, Subscription} from "rxjs";
import {OvicRightContextMenu} from "@shared/models/ovic-right-context-menu";
import {DonVi} from "@shared/models/don-vi";
import {ElnChuyenMuc} from "@shared/models/Elng";
import {NotificationService} from "@core/services/notification.service";
import {RoleService} from "@core/services/role.service";
import {UserService} from "@core/services/user.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ProfileService} from "@core/services/profile.service";
import {AuthService} from "@core/services/auth.service";
import {HttpParamsHeplerService} from "@core/services/http-params-hepler.service";
import {DonViService} from "@shared/services/don-vi.service";
import {HelperService} from "@core/services/helper.service";
import {ElngUserProfileService} from "@shared/services/elearning-user-profile.service";
import {ElnChuyenMucService} from "@shared/services/elearning-chuyen-muc.service";
import {Router} from "@angular/router";
import {ROLES} from "@shared/utils/syscat";
import {OvicQueryCondition} from "@core/models/dto";
import {ConditionOption} from "@shared/models/condition-option";
import {map, mergeMap} from "rxjs/operators";
import {ElngUserProfile} from "@shared/models/elng-user-profile";
import {OvicButton} from "@core/models/buttons";
import {APP_CONFIGS} from "@env";

@Component({
  selector: 'app-taikhoan-doitac',
  standalone: true,
    imports: [CommonModule, FormsModule, MatCheckboxModule, PaginatorModule, ReactiveFormsModule, SharedModule, OvicTableComponent],
  templateUrl: './taikhoan-doitac.component.html',
  styleUrls: ['./taikhoan-doitac.component.css']
})
export class TaikhoanDoitacComponent implements OnInit {

    @ViewChild('tplCreateAccount') tplCreateAccount: TemplateRef<any>;
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    formSave        : FormGroup;
    isUpdateForm    : boolean;
    formTitle       : string;
    editUserId      : number;
    dsNhomQuyen     : Role[] = [];
    data            : User[] = [];

    cols: OvicTableStructure[] = [
        {
            fieldType: 'media',
            field: ['avatar'],
            rowClass: 'ovic-img-minimal text-center img-child-max-width-30',
            header: 'Media',
            placeholder: true,
            sortable: false,
            headClass: 'ovic-w-90px text-center'
        },
        {
            fieldType: 'normal',
            field: ['username'],
            rowClass: '',
            header: 'Tên tài khoản',
            sortable: false,
            headClass: ''
        },
        {
            fieldType: 'normal',
            field: ['display_name'],
            rowClass: '',
            header: 'Tên hiển thị',
            sortable: false,
            headClass: ''
        },
        {
            fieldType: 'normal',
            field: ['email'],
            rowClass: '',
            header: 'Email',
            sortable: false,
            headClass: ''
        },
        {
            fieldType: 'normal',
            field: ['u_role'],
            innerData: true,
            rowClass: '',
            header: 'Vai trò',
            sortable: false,
            headClass: ''
        }
    ];

    formFields = {
        display_name: ['', Validators.required],
        // username     : [ '' , [ Validators.required , Validators.pattern( '^(?=.{3,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$' ) ] ] ,
        username: ['', [Validators.required, Validators.pattern('^\\S*$')]],
        phone: ['', Validators.required],
        email: ['', [Validators.required, Validators.pattern(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        donvi_id:['',Validators.required],
        role_ids: [null, Validators.required],
        status: [1, Validators.required],

    };



    canEdit         : boolean;
    canAdd          : boolean;
    canDelete       : boolean;
    isAdmin         : boolean;
    changPassState  : boolean;
    defaultPass     : string;
    schoolName      : string = '';
    userDonviId     : number;
    subscriptions   : Subscription = new Subscription();



    headButtons = [
        {
            label: 'Thêm mới',
            name: 'ADD_NEW_ROW',
            icon: 'pi-plus pi',
            class: 'p-button-rounded p-button-primary ml-3 mr-2',
            tooltip: 'Thêm tài khoản mới',
            tooltipPosition: 'left'
        }
    ];

    private _reloadData$ = new Subject<any>();


    object_condition = {};
    pag_first                   : number     = 0;
    limit_user                  : number     = 20;
    total_user                  : number     = 0;
    list_donvi_chuyenmon        : DonVi[];
    user_profile_id             : number;
    selected_page               : number = 0;
    list_bomon                  : ElnChuyenMuc[] = [];
    donvi_chuyenmon_id          : number;
    isManager                   : boolean = false;
    addDropdown                 : boolean = true;
    user_profile_ids = [];
    constructor(
        private notificationService: NotificationService,
        private roleService: RoleService,
        private userService: UserService,
        private fb: FormBuilder,
        private auth: AuthService,
        private httpHelper: HttpParamsHeplerService,
        private donViService: DonViService,
        private helperService: HelperService,
        private elngUserProfileService: ElngUserProfileService,
        private router: Router
    ) {
        this.formSave = this.fb.group(this.formFields);
        this.data = [];
        this.isUpdateForm = false;
        this.formTitle = 'Tạo tài khoản';
        // const listenReloadData = this._reloadData$.asObservable().pipe(debounceTime(200)).subscribe({ next: () => this.loadData() , error : ()=>{}});
        // this.subscriptions.add(listenReloadData);
    }

    ngOnInit(): void {
        const url = this.router.url.substring(7).split('?')[0];
        this.canEdit = this.auth.userCanEdit(url);
        this.canAdd = this.auth.userCanAdd(url);
        this.canDelete = this.auth.userCanDelete(url);
        this.isAdmin = this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole('admin_tuyensinh');
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) ;
        this.userDonviId = this.auth.user.donvi_id;
        this.f['donvi_id'].setValue(this.userDonviId);
        const actions = [];
        if (this.canEdit) {
            this.cols.push({
                fieldType: 'switch',
                field: ['status'],
                rowClass: 'round text-center',
                header: 'Active',
                sortable: false,
                headClass: 'ovic-w-80px text-center'
            });
            actions.push('edit');
        }

        if (this.canDelete) {
            actions.push('delete');
        }

        if (actions.length) {
            this.cols.push({
                tooltip: 'tài khoản',
                fieldType: 'actions',
                field: actions,
                rowClass: 'text-center',
                header: 'Thao tác',
                sortable: false,
                headClass: 'ovic-w-120px text-center'
            });
        }

        this.loadRolesValid();
    }

    loadRolesValid() {
        const condition = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
            { conditionName: 'name', condition: OvicQueryCondition.equal, value: ROLES.doitac, orWhere: 'and' },
        ]).set("select", "id,title").set("limit", -1).set("orderby", "ordering").set("order", "ASC")

        forkJoin([
            this.roleService.getRolesByCols(condition),

            this.donViService.getDonViById(this.userDonviId),
            this.elngUserProfileService.getElngUserProfileByCol('user_id', this.auth.user.id.toString())
        ]).subscribe({
            next: ([_resRoles, _resUserDonvi, _user]) => {
                this.dsNhomQuyen = _resRoles;

                this.schoolName = _resUserDonvi.title;
                // this.user_role_id = _resRoles.fin;


                if (this.isManager) {
                    this.addDropdown = true;
                    this.loadPageEvent(1);

                } else {
                    this.addDropdown = false;
                    this.onChangeDropdownEvent({
                        id: this.donvi_chuyenmon_id,
                        title: '',
                        parent_id: 0,
                        description: '',
                        status: 0
                    });
                }
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Load dữ liệu không thành công');
            }
        })
    }

    loadPageEvent(page) {
        // this.notificationService.isProcessing(true);
        const option: ConditionOption = {
            condition: [{ conditionName: 'role_ids', condition: OvicQueryCondition.notLike, value: '%"'.concat(this.auth.user.role_ids[0], '"%'), orWhere: 'and' }],
            set: [],
            page: page
        }
        const role_ids = []
        // this.auth.user.role_ids[0]
        this.dsNhomQuyen.forEach(f => {
            role_ids.push(f.id);
        })


        const filter_label_like = ['display_name', 'email', 'username', 'phone'];
        Object.keys(this.object_condition).forEach(f => {
            const index_label = filter_label_like.findIndex(i => i === f);
            if (index_label !== -1) {
                option.condition.push({ conditionName: f, condition: OvicQueryCondition.like, value: '%'.concat(this.object_condition[f], '%'), orWhere: 'and' })
            } else {
                option.condition.push({ conditionName: f, condition: OvicQueryCondition.equal, value: this.object_condition[f], orWhere: 'and' })
            }
        })

        if (role_ids.length) {
            option.set.push({ label: 'role_ids', value: role_ids.toString() });
        }

        if (this.user_profile_ids.length) {
            option.set.push({ label: "include", value: this.user_profile_ids.toString() });
            option.set.push({ label: "include_by", value: "id" });
        }

        this.userService.getUserByPageNew(option).subscribe({
            next: (_user) => {
                this.total_user = _user.recordsFiltered;
                const start = (page - 1) * 20;
                _user.data.map((u, key) => {
                    const uRoles = [];
                    u['index_'] = start + key + 1;
                    if (u.role_ids && u.role_ids.length) {
                        u.role_ids.forEach(r => {
                            const index = r ? this.dsNhomQuyen.findIndex(i => i.id === parseInt(r, 10)) : -1;
                            if (index !== -1) {
                                uRoles.push('<span class="--user-role-label --role-">' + this.dsNhomQuyen[index].title + '</span>');
                            }
                        }, []);
                    }
                    u.avatar = '../../../assets/images/a_none.jpg'
                    u['u_role'] = uRoles.join(', ');
                    return u;
                });
                this.data = _user.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Load dữ liệu không thành công');
            }
        })

    }



    switchEvent(id) {
        const index = this.data.findIndex(dt => dt.id === id);
        if (index !== -1) {
            const status = this.data[index].status ? 0 : 1;
            const username = this.data[index].username;
            this.userService.updateUserS(id, { status: status }).subscribe({
                next: () => {
                    this.data[index].status = status;
                    this.closeForm();
                    this.notificationService.toastSuccess('Thay đổi trạng thái tài khoản thành công');
                },
                error: () => this.notificationService.toastError('Thay đổi trạng thái thất bại')
            });
        }
    }

    editUser(id:number) {
        this.changPassState = false;
        const user = this.data.find(u => u.id == id);
        if (user) {
            this.f['role_ids'].setValue(user.role_ids);
            if (Array.isArray(this.f['role_ids'].value)) {
                this.dsNhomQuyen.forEach(f => {
                    const index = this.f['role_ids'].value.findIndex(m => m.toString() === f.id.toString());
                    if (index !== -1) {
                        f['checked'] = true;
                    } else {
                        f['checked'] = false;
                    }
                })
            }
            this.editUserId = id;
            this.isUpdateForm = true;
            this.formTitle = 'Cập nhật tài khoản';
            this.f['display_name'].setValue(user.display_name);
            this.f['username'].setValue(user.username);
            this.f['phone'].setValue(user.phone);
            this.f['email'].setValue(user.email);
            this.f['password'].setValue(user.password);
            this.f['donvi_id'].setValue(user.donvi_id);
            this.f['role_ids'].setValue(user.role_ids.toString());
            this.f['status'].setValue(user.status);
            const condition: ConditionOption = {
                condition: [
                    { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: user.id.toString() }
                ],
                set: [],
                page: ''
            }
            this.elngUserProfileService.getUserProfileByPageNewV2(condition).subscribe({
                next: (_profile) => {
                    if (_profile.data.length) {
                        this.user_profile_id = _profile.data[0].id;
                    }
                },
                error: () => null
            })
            this.notificationService.openSideNavigationMenu({ template: this.tplCreateAccount, size: 700, offsetTop: '0px' });
            this.defaultPass = user.password;
        }
    }

    async deleteUser(id:number) {
        const confirm = await this.notificationService.confirmDelete();
        if (confirm) {
            forkJoin([
                this.userService.deleteUser(id),
                this.elngUserProfileService.deleteTnStudentByUserId(id.toString())
            ]).subscribe(
                {
                    next: () => {
                        this.notificationService.toastSuccess('Xóa tài khoản thành công');
                        this.onFirstPageLoad();
                    },
                    // error: () => this.notificationService.toastError('Xóa tài khoản thất bại')
                }
            );
        }
    }

    async creatUser(frmTemplate) {
        this.changPassState = true;
        this.isUpdateForm = false;
        this.formTitle = 'Tạo tài khoản';
        this.resetForm(this.formSave);
        this.f['status'].setValue(1);

        this.notificationService.openSideNavigationMenu({ template: this.tplCreateAccount, size: 700, offsetTop: '0px' });
    }

    get f() {
        return this.formSave.controls;
    }

    passwordValidator(password:string) {
        if (!password.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?!.*?[\s])(?=.*?[#?!@$%^&*-]).{8,30}$/)) {
            return false;
        }
        return true;
    }

    taoTaiKhoan(form: FormGroup) {
        form.get('donvi_id').setValue(this.userDonviId);
        // this.getRoleIdsValue();

        form.get('role_ids')?.setValue(this.dsNhomQuyen.length > 0 ? [this.dsNhomQuyen[0].id] : '');

        console.log(form)
        if (this.passwordValidator(form.value.password)) {
            if (form.valid) {
                const data = { ...form.value };
                const role_ids = data.role_ids;
                delete data.role_ids;
                this.userService.creatUser(data).pipe(mergeMap((_res_) => {
                    return this.userService.addRoles(_res_, role_ids).pipe(mergeMap(() => {
                        return of(_res_)
                    }))
                })).subscribe({
                    next: (_res) => {
                        const data_: ElngUserProfile = {
                            user_id: _res,
                            student_code: data.email,
                            full_name: data.display_name,
                            full_name_slug: this.helperService.slugVietnamese(data.display_name),
                            name: data.display_name.split(" ")[data.display_name.split(" ").length - 1],
                            birthday: null,
                            gender: null,
                            address: null,
                            social_link: null,

                            created_by: this.auth.user.id,
                            updated_by: this.auth.user.id,
                            teacher: 1,

                        }

                        this.elngUserProfileService.addElngUserProfile(data_).subscribe({
                            next: () => {
                                this.notificationService.toastSuccess('Thêm mới tài khoản thành công')

                                this.closeForm();
                                this.loadPageEvent(1)
                            },
                            error: () => {
                                this.notificationService.toastError('Thêm mới tài khoản thất bại')
                            }
                        })
                    },
                    error: (error) => {
                        console.log(error.message)
                    }
                });
            } else {
                if (form.get('role_ids').invalid) {
                    return this.notificationService.toastInfo('Chọn nhóm quyền cho tài khoản');
                }
                if (form.get('email').invalid) {
                    return this.notificationService.toastInfo('Email chưa đúng định dạng');
                }
                form.markAllAsTouched();
                this.notificationService.toastError('Vui lòng kiểm tra lại', 'Lỗi nhập liệu');
            }
        } else {
            this.notificationService.toastError('Vui lòng kiểm tra lại mật khẩu', 'Lỗi nhập liệu');
        }
    }

    capNhatTaiKhoan(form: FormGroup) {
        this.getRoleIdsValue();

        if (form.valid) {
            const data = { ...form.value };
            if (!this.changPassState) {
                delete data.password;
            } else {
                if (!this.passwordValidator(data.password)) {
                    this.notificationService.toastError('Vui lòng kiểm tra lại mật khẩu', 'Lỗi nhập liệu');
                    return;
                }
            }
            const currentUser = this.data.find(u => u.id === this.editUserId);

            if (!currentUser) { return; }

            if (currentUser.email === data.email) {
                delete data.email;
            }

            if (currentUser.phone === data.phone) {
                delete data.phone;
            }

            const role_ids = data.role_ids;
            delete data.role_ids;

            let request: Observable<any> = null;

            const data_: ElngUserProfile = {
                user_id: this.editUserId,
                student_code: data.username,
                full_name: data.display_name,
                full_name_slug: this.helperService.slugVietnamese(data.display_name),
                name: data.display_name.split(" ")[data.display_name.split(" ").length - 1],
                birthday: null,
                gender: null,
                address: null,
                social_link: null,
                created_by: this.auth.user.id,
                updated_by: this.auth.user.id,
                teacher: 1,
            }

            if (!this.user_profile_id) {
                request = this.elngUserProfileService.addElngUserProfile(data_);
            } else {
                request = this.elngUserProfileService.updateElngUserProfile(this.user_profile_id, data_)
            }

            this.notificationService.isProcessing(true);
            forkJoin([
                this.userService.updateUserS(this.editUserId, data),
                this.userService.deleteRoles(this.editUserId, currentUser.role_ids).pipe(mergeMap(() => {
                    return this.userService.addRoles(this.editUserId, role_ids).pipe(mergeMap(() => {
                        return of(null)
                    }))
                })),
                request
            ]).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Cập nhật tài khoản thành công');
                    this.notificationService.isProcessing(false);
                    this.closeForm();
                },
                error: () => {
                    this.notificationService.isProcessing(true);
                    this.notificationService.toastError('Cập nhật tài khoản thất bại')
                }
            });
        } else if (form.get('role_ids').invalid) {
            return this.notificationService.toastInfo('Chọn nhóm quyền cho tài khoản');
        }
    }

    resetForm(form: FormGroup) {
        form.reset({ role_ids: null, status: 0 });
        this.dsNhomQuyen.forEach(f => {
            f['checked'] = false;
        })
        this.user_profile_id = null;
    }

    clickChangedPass() {
        const state = this.changPassState;
        this.changPassState = !state;
        if (!this.changPassState) {
            this.f['password'].setValue(this.defaultPass);
        }
    }


    creatUserChangeActive(value: number) {
        this.f['status'].setValue(value);
    }

    userActions(btn: { name?: string; data?: any }) {
        switch (btn.name) {
            case 'DELETE':
                void this.deleteUser(btn.data);
                break;
            case 'EDIT':
                this.editUser(btn.data);
                break;
            case 'SWITCH':
                this.switchEvent(btn.data);
                break;
            case 'ADD_NEW_ROW':
                // this.getAllTeacher();
                void this.creatUser(this.tplCreateAccount);
                break;
            case 'ADD_NEW_ROW_FROM_EXCEL':
                // console.log('ADD_NEW_ROW_FROM_EXCEL');
                break;
            case 'REFRESH_LIST':
                this.triggerReloadData();
                break;
            default:
                break;
        }
    }

    triggerReloadData() {
        this._reloadData$.next('');
    }

    onPageChangeUser(event) {
        this.selected_page = event.page;
        this.loadPageEvent(event.page + 1);
    }

    onFirstPageLoad() {
        // if (!this.paginator.empty()) {
        //     this.paginator.changePage(0);
        // } else {}
        if (this.selected_page) {
            this.loadPageEvent(this.selected_page + 1);
        } else {
            this.loadPageEvent(1);
        }
    }

    onChangeDropdownEvent(event: DonVi) {
        if (event) {
            // this.object_condition['donvi_chuyenmon_id'] = event.id;
            const array_condition = [
                { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '1' },
                { conditionName: 'donvi_chuyenmon_id', condition: OvicQueryCondition.equal, value: event.id.toString(), orWhere: 'and' },
            ]

            const condition_user = this.httpHelper.paramsConditionBuilder(array_condition).set('limit', '-1');

            this.elngUserProfileService.getElngUserProfileByCols(condition_user).subscribe({
                next: (_resUser) => {
                    const tmp = [0];
                    _resUser.forEach(f => {
                        tmp.push(f.user_id);
                    })
                    this.user_profile_ids = tmp;
                    this.onFirstPageLoad();
                },
                error: () => {
                    this.notificationService.toastError("Tải dữ liệu thất bại")
                }
            })
        } else {
            this.user_profile_ids = [];
            // delete this.object_condition['donvi_chuyenmon_id'];
            this.onFirstPageLoad();
        }

    }

    onSearchUser(event) {
        if (event) {
            this.object_condition['display_name'] = event;
        } else {
            delete this.object_condition['display_name'];
        }
        this.onFirstPageLoad();
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
        this.onFirstPageLoad();
    }

    onChangeCheckRole(event: MatCheckboxChange, role: Role) {
        role['checked'] = event.checked;
    }

    getRoleIdsValue() {
        const id_role = [];
        this.dsNhomQuyen.forEach(f => {
            if (f['checked']) {
                id_role.push(f.id.toString());
            }
        })
        this.f['role_ids'].setValue(id_role);
    }

    loopUpdateUser(data: User[], datas, i) {
        if (i < datas.length) {
            const request: Observable<any>[] = [];
            data.forEach(u => {
                let username = u.username;
                const index = u.username.indexOf('@');
                if (index !== -1) {
                    username = u.username.split('@')[0];
                }
                request.push(this.userService.updateUserS(u.id, { username: username.toLowerCase() }));
            })
            if (request.length) {
                forkJoin(request).subscribe({
                    next: () => {
                        this.loopUpdateUser(datas[i + 1], datas, i + 1)
                    },
                    error: () => {
                        this.loopUpdateUser(datas[i + 1], datas, i + 1)
                    }
                })
            } else {
                this.loopUpdateUser(datas[i + 1], datas, i + 1)
            }
        }
    }

}
