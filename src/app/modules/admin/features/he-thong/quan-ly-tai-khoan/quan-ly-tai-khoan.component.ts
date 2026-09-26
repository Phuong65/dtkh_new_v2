import { Component, inject, OnInit, viewChild, ElementRef, TemplateRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RoleService } from '@core/services/role.service';
import { UserService } from '@core/services/user.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { DEFAULT_MODAL_OPTIONS, ROLES } from '@shared/utils/syscat';
import { debounceTime, forkJoin, Observable, of, Subject, Subscription, switchMap, firstValueFrom } from 'rxjs';
import { User } from '@core/models/user';
import { Role } from '@core/models/role';
import { OvicRightContextMenu } from '@shared/models/ovic-right-context-menu';
import { ProfileService } from '@core/services/profile.service';
import { map, mergeMap } from 'rxjs/operators';
import { APP_CONFIGS } from '@env';
import { UnsubscribeAndCompleteObserversOnDestroy } from '@core/utils/decorator';
import { OvicTableStructure } from '@shared/models/ovic-models';
import { OvicButton } from '@core/models/buttons';
import { OvicQueryCondition } from '@core/models/dto';
import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { MatCheckboxChange, MatCheckboxDefaultOptions, MatCheckboxModule } from '@angular/material/checkbox';
import { GetUserinfoDirective } from '@modules/shared/directives/get-userinfo.directive';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { HelperService } from '@core/services/helper.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { ElnChuyenMucService } from '@modules/shared/services/elearning-chuyen-muc.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { Router } from '@angular/router';
import { OvicTableComponent } from '@modules/shared/components/ovic-table/ovic-table.component';
import { OvicRightContentMenuComponent } from '@modules/shared/components/ovic-right-content-menu/ovic-right-content-menu.component';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, ReactiveFormsModule, FormsModule, TableModule, PaginatorModule, MatCheckboxModule, OvicTableComponent, OvicRightContentMenuComponent],
    selector: 'app-quan-ly-tai-khoan',
    templateUrl: './quan-ly-tai-khoan.component.html',
    styleUrls: ['./quan-ly-tai-khoan.component.css']
})

@UnsubscribeAndCompleteObserversOnDestroy()
export class QuanLyTaiKhoanComponent implements OnInit {

    private notificationService = inject(NotificationService);
    private roleService = inject(RoleService);
    private userService = inject(UserService);
    private fb = inject(FormBuilder);
    private modalService = inject(NgbModal);
    private profileService = inject(ProfileService);
    private auth = inject(AuthService);
    private httpHelper = inject(HttpParamsHeplerService);
    private donViService = inject(DonViService);
    private helperService = inject(HelperService);
    private elngUserProfileService = inject(ElngUserProfileService);
    private elnChuyenMucService = inject(ElnChuyenMucService);
    private router = inject(Router);
    tplCreateAccount = viewChild.required<TemplateRef<any>>('tplCreateAccount');

    formSave: FormGroup;

    isUpdateForm: boolean;

    formTitle: string;

    editUserId: number;

    dsNhomQuyen: Role[] = [];

    data: User[] = [];

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
        donvi_id: [''],
        role_ids: [null, Validators.required],
        status: [1, Validators.required],
        donvi_chuyenmon_id: ['', Validators.required],
        bomon_id: ['']
    };

    /*
     ^(?=.{3,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$
     └─────┬────┘└───┬──┘└─────┬─────┘└─────┬─────┘ └───┬───┘
     │         │         │            │           no _ or . at the end
     │         │         │            │
     │         │         │            allowed characters
     │         │         │
     │         │         no __ or _. or ._ or .. inside
     │         │
     │         no _ or . at the beginning
     │
     username is 3-20 characters long
     */

    canEdit: boolean;

    canAdd: boolean;

    canDelete: boolean;

    isAdmin: boolean;

    changPassState: boolean;

    defaultPass: string;

    highestRoleIdUser: any;

    schoolName = '';

    userDonviId: number;

    subscriptions = new Subscription();

    rightContextMenu: OvicRightContextMenu[] = [
        {
            label: 'Xem trước',
            icon: 'fa fa-eye',
            slug: 'preview'
        },
        {
            label: 'Chi tiết',
            icon: 'fa fa-info-circle',
            slug: 'detail'
        },
        {
            label: 'Tải xuống',
            icon: 'fa fa-cloud-download',
            slug: 'download'
        },
        {
            label: 'Share',
            icon: 'fa fa-share-alt',
            slug: 'shared',
            child: [
                { label: 'Công khai', icon: 'fa fa-globe', slug: 'SharedPublic' },
                { label: 'Trong nhóm', icon: 'fa fa-users', slug: 'sharedGroup' },
                { label: 'Chỉ mình tôi', icon: 'fa fa-lock', slug: 'private' }
            ]
        },
        {
            label: 'Link file',
            icon: 'fa fa-link',
            slug: 'linkFile'
        },
        {
            label: 'Xóa file',
            icon: 'fa fa-trash',
            slug: 'deleteFile'
        }
    ];

    headButtons = [
        // {
        //     label: 'Import',
        //     name: 'ADD_NEW_ROW_FROM_EXCEL',
        //     icon: 'pi-file-excel pi',
        //     class: 'p-button-rounded p-button-success',
        //     tooltip: 'Thêm mới tài khoản từ file excel',
        //     tooltipPosition: 'left'
        // },
        // {
        //     label: 'Refresh',
        //     name: 'REFRESH_LIST',
        //     icon: 'pi-refresh pi',
        //     class: 'p-button-rounded p-button-secondary ml-3',
        //     tooltip: 'Làm mới danh sách',
        //     tooltipPosition: 'left'
        // },
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


    paginator = viewChild.required<Paginator>('paginator');
    object_condition = {};
    pag_first = 0;
    limit_user = 20;
    total_user = 0;
    list_donvi_chuyenmon: DonVi[];
    user_profile_id: number;
    user_role_id: number;
    user_profile_ids = [];
    selected_page: number = 0;
    list_bomon: ElnChuyenMuc[] = [];
    donvi_chuyenmon_id: number;
    isManager = false;
    addDropdown = true;
    constructor(
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
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.daotao_cv_1)  ?  true : false;
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
            { conditionName: 'name', condition: OvicQueryCondition.notEqual, value: ROLES.student, orWhere: 'and' },
        ]).set("select", "id,title").set("limit", -1).set("orderby", "ordering").set("order", "ASC")

        const condition_donvi = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.userDonviId.toString(), orWhere: 'and' },
        ]).set("limit", -1).set("order", "ASC").set("orderby", "title")

        forkJoin([
            this.roleService.getRolesByCols(condition),
            this.donViService.getDonViByCols(condition_donvi),
            this.donViService.getDonViById(this.userDonviId),
            this.elngUserProfileService.getElngUserProfileByCol('user_id', this.auth.user.id.toString())
        ]).subscribe({
            next: ([_resRoles, _resDonvi, _resUserDonvi, _user]) => {
                this.dsNhomQuyen = _resRoles;
                this.list_donvi_chuyenmon = _resDonvi;
                this.schoolName = _resUserDonvi.title;
                // this.user_role_id = _resRoles.fin;
                if (_user.length) {
                    this.donvi_chuyenmon_id = _user[0].donvi_chuyenmon_id;
                }
                if (_resDonvi.length)
                    this.loadBomon(_resDonvi[0]);

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

        const arr_condition_profile = [
            { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
            // { conditionName: 'role_ids', condition: OvicQueryCondition.notLike, value: '%"'.concat(this.auth.user.role_ids[0], '"%'), orWhere: 'and' }
        ]

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
        // forkJoin([
        //     this.elngUserProfileService.getElngUserProfileByCols(condition_profile).pipe(map(res => {
        //         const data_user = res.filter(m => m.role_ids.findIndex(i => this.dsNhomQuyen.findIndex(ti => ti.id.toString() === i.toString()) !== -1) !== -1 && m.role_ids.findIndex(i => i.toString() === this.auth.user.role_ids[0].toString()) === -1);
        //         return data_user.splice(start, limit);
        //     })),
        //     this.elngUserProfileService.getElngUserProfileByCols(condition_user_total).pipe(map(res => {
        //         const data_user = res.filter(m => m.role_ids.findIndex(i => this.dsNhomQuyen.findIndex(ti => ti.id.toString() === i.toString()) !== -1) !== -1 && m.role_ids.findIndex(i => i.toString() === this.auth.user.role_ids[0].toString()) === -1);
        //         return data_user;
        //     })),
        // ]).subscribe({
        //     next: ([_profile, _userTotal]) => {
        //         this.total_user = _userTotal.length;
        //         const id_user = [0];
        //         _profile.forEach(f => {
        //             id_user.push(f.user_id)
        //         });

        //         const array_condition = [
        //             { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        //         ]

        //         const condition_user = this.httpHelper.paramsConditionBuilder(array_condition).set("include", id_user.toString()).set("include_by", "id").set('limit', -1)//.set('role_ids', role_ids.toString())
        //         //.set('role_ids', role_ids.toString());
        //         forkJoin([
        //             this.userService.getUserByCols(condition_user),
        //             // this.userService.getTotalUserByCols(condition_user_total)
        //         ]).subscribe({
        //             next: ([_resUser]) => {
        //                 // this.total_user = _resUserTotal.recordsFiltered;
        //                 _resUser.map((u, key) => {
        //                     const uRoles = [];
        //                     u['index_'] = start + key + 1;
        //                     if (u.role_ids && u.role_ids.length) {
        //                         u.role_ids.forEach(r => {
        //                             const index = r ? this.dsNhomQuyen.findIndex(i => i.id === parseInt(r, 10)) : -1;
        //                             if (index !== -1) {
        //                                 uRoles.push('<span class="--user-role-label --role-">' + this.dsNhomQuyen[index].title + '</span>');
        //                             }
        //                         }, []);
        //                     }
        //                     u.avatar = '../../../assets/images/a_none.jpg'
        //                     u['u_role'] = uRoles.join(', ');
        //                     return u;
        //                 });
        //                 this.data = _resUser;
        //                 this.notificationService.isProcessing(false);
        //             }, error: () => {
        //                 this.notificationService.isProcessing(false);
        //                 this.notificationService.toastError('Load dữ liệu không thành công');
        //             }
        //         })

        //     },
        //     error: () => {
        //         this.notificationService.isProcessing(false);
        //         this.notificationService.toastError('Load dữ liệu không thành công');
        //     }
        // })


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

    editUser(id) {
        this.changPassState = false;
        const user = this.data.find(u => u.id === id);
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
                        this.f['donvi_chuyenmon_id'].setValue(_profile.data[0].donvi_chuyenmon_id);
                        this.f['bomon_id'].setValue(_profile.data[0].bomon_id);
                        this.user_profile_id = _profile.data[0].id;
                        this.loadBomon({ id: _profile.data[0].donvi_chuyenmon_id })
                    }
                },
                error: () => null
            })
            this.notificationService.openSideNavigationMenu({ template: this.tplCreateAccount(), size: 700, offsetTop: '0px' });
            this.defaultPass = user.password;
        }
    }

    async deleteUser(id) {
        const confirm = await this.notificationService.confirmDelete();
        if (confirm) {
            forkJoin([
                this.userService.deleteUser(id),
                this.elngUserProfileService.deleteTnStudentByUserId(id)
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
        if (this.donvi_chuyenmon_id) {
            this.f['donvi_chuyenmon_id'].setValue(this.donvi_chuyenmon_id);
            this.loadBomon({ id: this.donvi_chuyenmon_id });
        }
        this.notificationService.openSideNavigationMenu({ template: this.tplCreateAccount(), size: 700, offsetTop: '0px' });
    }

    get f() {
        return this.formSave.controls;
    }

    passwordValidator(password) {
        if (!password.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?!.*?[\s])(?=.*?[#?!@$%^&*-]).{8,30}$/)) {
            return false;
        }
        return true;
    }

    taoTaiKhoan(form: FormGroup) {
        form.get('donvi_id').setValue(this.userDonviId);
        this.getRoleIdsValue();
        if (this.passwordValidator(form.value.password)) {
            if (form.valid) {
                const data = { ...form.value };
                const donvi_chuyenmon_id = data.donvi_chuyenmon_id;
                const role_ids = data.role_ids;
                const bomon_id = data.bomon_id;
                delete data.role_ids;
                delete data.donvi_chuyenmon_id;
                delete data.bomon_id;
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
                            donvi_chuyenmon_id: donvi_chuyenmon_id,
                            created_by: this.auth.user.id,
                            updated_by: this.auth.user.id,
                            teacher: 1,
                            bomon_id: bomon_id
                        }

                        this.elngUserProfileService.addElngUserProfile(data_).subscribe({
                            next: () => {
                                this.notificationService.toastSuccess('Thêm mới tài khoản thành công')
                            },
                            error: () => {
                                // this.notificationService.toastError('Thêm mới tài khoản thất bại')
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

            const donvi_chuyenmon_id = data.donvi_chuyenmon_id && data.donvi_chuyenmon_id !== '' ? data.donvi_chuyenmon_id : 0;
            const role_ids = data.role_ids;
            const bomon_id = data.bomon_id && data.bomon_id !== '' ? data.bomon_id : 0;
            delete data.role_ids;
            delete data.donvi_chuyenmon_id;
            delete data.bomon_id;

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
                donvi_chuyenmon_id: donvi_chuyenmon_id && donvi_chuyenmon_id !== '' ? donvi_chuyenmon_id : 0,
                created_by: this.auth.user.id,
                updated_by: this.auth.user.id,
                teacher: 1,
                bomon_id: bomon_id && bomon_id !== '' ? bomon_id : 0,
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
        this.f['donvi_chuyenmon_id'].setValue(this.list_donvi_chuyenmon && this.list_donvi_chuyenmon.length ? this.list_donvi_chuyenmon[0].id : 0);
        this.user_profile_id = null;
    }

    clickChangedPass() {
        const state = this.changPassState;
        this.changPassState = !state;
        if (!this.changPassState) {
            this.f['password'].setValue(this.defaultPass);
        }
    }

    menuItemClick(event: MouseEvent, data) {
        event.preventDefault();
        event.stopPropagation();
        // console.log( data );
    }

    rClick(data) {
        // console.log( data );
    }

    creatUserChangeActive(value: number) {
        this.f['status'].setValue(value);
    }

    userActions(btn: OvicButton) {
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
                void this.creatUser(this.tplCreateAccount());
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

    async loadRolesUserCanSet(): Promise<{ roles: Role[], error: boolean }> {
        const userRoleIds = this.auth.user.role_ids;
        if (Array.isArray(userRoleIds) && userRoleIds.length > 1) {
            const u = userRoleIds.map(u => parseInt(u, 10));
            const min = Math.min(...u);
            const s = u.filter(e => e !== min);
            this.notificationService.startLoading();
            try {
                const error = false;
                const roles = await firstValueFrom(this.roleService.listRolesFiltered(s.join(','), 'id,title,realm').pipe(map(r => r.filter(r => r.realm === APP_CONFIGS.realm))));
                this.notificationService.stopLoading();
                return Promise.resolve({ error, roles });
            } catch (e) {
                this.notificationService.stopLoading();
                return Promise.resolve({ error: true, roles: [] });
            }
        } else {
            return Promise.resolve({ error: false, roles: [] });
        }
    }

    onPageChangeUser(event) {
        this.selected_page = event.page;
        this.loadPageEvent(event.page + 1);
    }

    onFirstPageLoad() {
        // if (!this.paginator.empty()) {
        //     this.paginator.changePage(0);
        // } else {
        if (this.selected_page) {
            this.loadPageEvent(this.selected_page + 1);
        } else {
            this.loadPageEvent(1);
        }

        // }
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

    getAllTeacher() {
        const data = [];
        this.loopUserStudent(data, 1, 1000)
    }

    loadBomon(event) {
        const arr_condition = [
            { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'bomon', orWhere: 'and' },
            { conditionName: 'donvi_chuyenmon_id', condition: OvicQueryCondition.equal, value: event.id.toString(), orWhere: 'and' }
        ]
        const condition_nganh = this.httpHelper.paramsConditionBuilder(arr_condition).set('limit', '-1');
        this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh).subscribe({
            next: (_nganh_bomon) => {
                this.list_bomon = _nganh_bomon;
            },
            error: () => {

            }
        })
    }


    loopUserStudent(data, page, count) {
        if (data.length < count) {
            console.log(data);
            const option: ConditionOption = {
                condition: [{ conditionName: 'student_code', condition: OvicQueryCondition.equal, value: 'adminift@gmail.com', orWhere: 'and' }],
                set: [
                    // { label: "role_ids", value: "65" }
                ],
                page: page
            }

            this.elngUserProfileService.getElngUserProfileByCol('student_code', 'adminift@gmail.com').subscribe({
                next: (_resUser) => {
                    let i = 0;
                    // this.loopUpdateUser(_resUser[i + 1], _resUser, 0);
                    // this.loopUserStudent(data.concat(_resUser.data), page + 1, _resUser.recordsFiltered);
                    this.notificationService.isProcessing(false);
                }, error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError('Load dữ liệu không thành công');
                }
            })
        } else {
            // let i = 0;
            // const data_ = [];
            // data_[i] = [];
            // data.forEach(f => {
            //     if (data_[i].length < 6) {
            //         data_[i].push(f);
            //     } else {
            //         i = i + 1;
            //         data_[i] = [];
            //         data_[i].push(f);
            //     }
            // })

            // this.loopUpdateUser(data_[0], data_, 0);
        }
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
