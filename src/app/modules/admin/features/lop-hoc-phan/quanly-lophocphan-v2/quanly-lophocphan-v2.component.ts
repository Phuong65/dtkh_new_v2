import {Component, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedModule} from '@modules/shared/shared.module';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {Router, RouterModule} from '@angular/router';
import {CheckboxModule} from 'primeng/checkbox';
import {Paginator, PaginatorModule} from 'primeng/paginator';
import {ProgressBarModule} from 'primeng/progressbar';
import {TableModule} from 'primeng/table';
import {TabViewModule} from 'primeng/tabview';
import {AuthService} from '@core/services/auth.service';
import {HelperService} from '@core/services/helper.service';
import {UserService} from '@core/services/user.service';
import {ClassesService} from '@modules/shared/services/classes.service';
import {ElnKhoaHocService} from '@modules/shared/services/elearning-khoa-hoc.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ROLES, ROUTERS} from '@modules/shared/utils/syscat';
import {NotificationService} from '@core/services/notification.service';
import {ElngUserProfile} from '@modules/shared/models/elng-user-profile';
import {HttpParamsHeplerService} from '@core/services/http-params-hepler.service';
import {OvicQueryCondition} from '@core/models/dto';
import {forkJoin, mergeMap, Observable, of, switchMap} from 'rxjs';
import {Classes} from '@modules/shared/models/classes';
import {RoleService} from '@core/services/role.service';
import {ConditionOption} from '@modules/shared/models/condition-option';
import {DonViService} from '@modules/shared/services/don-vi.service';
import {ElngUserProfileService} from '@modules/shared/services/elearning-user-profile.service';
import {User} from '@core/models/user';
import {DonVi} from '@modules/shared/models/don-vi';
import {DomSanitizer} from '@angular/platform-browser';
import {getLinkDownload_aws} from '@env';
import {ClassStudentService} from '@modules/shared/services/class-student.service';
import {ElnChuyenMucService} from '@modules/shared/services/elearning-chuyen-muc.service';
import {ElnChuyenMuc} from '@modules/shared/models/Elng';
import {ElnKhoaHoc} from '@modules/shared/models/elng-khoa-hoc';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {RptClassStudentPointsService} from "@shared/services/rpt-class-student-points.service";

@Component({
    selector: 'app-quanly-lophocphan-v2',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        ProgressBarModule,
        ReactiveFormsModule,
        FormsModule,
        PaginatorModule,
        MatMenuModule,
        MatIconModule,
        TabViewModule,
        CheckboxModule,
        RouterModule,
        MatButtonModule,
        OverlayPanelModule
    ],
    templateUrl: './quanly-lophocphan-v2.component.html',
    styleUrls: ['./quanly-lophocphan-v2.component.css']
})
export class QuanlyLophocphanV2Component implements OnInit, OnDestroy {
    @ViewChild('paginator') paginator: Paginator;

    @ViewChild('createClass') createClass: TemplateRef<any>;

    canAdd: boolean = false;

    canUpdate: boolean = false;

    canDelete: boolean = false;

    isUpdated: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerLanhdaobomon: boolean = false;

    formClass: FormGroup;

    arrayYear = [];

    user_profile: ElngUserProfile;

    pageIndex = 0;

    limitList = 20;

    listClass: Classes[];

    objectRoles = {};

    userId: number;

    listNamhoc = [];

    listHocky = [];

    objectTeacher = {};

    listTeacher: User[];

    list_donvi_chuyenmon: DonVi[];

    objectFilter = {};

    emptyList: string;

    countClass: number = 0;

    activeIndex_class: number = 0;

    selectedClass: Classes;

    cols_class = [];

    formTitle: string;

    donviId: number = 0;

    listCategory: ElnChuyenMuc[];

    listCourse: ElnKhoaHoc[];

    kyhieuIsValid: boolean = true;

    slugIsValid: boolean = true;

    constructor(
        private helperService: HelperService,
        public formBuilder: FormBuilder,
        private auth: AuthService,
        private classesService: ClassesService,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private modalService: NgbModal,
        private router: Router,
        private noitifi: NotificationService,
        private httpHelper: HttpParamsHeplerService,
        private roleService: RoleService,
        private donViService: DonViService,
        private elngUserProfileService: ElngUserProfileService,
        private sanitizer: DomSanitizer,
        private classStudentService: ClassStudentService,
        private elnChuyenMucService: ElnChuyenMucService,
        private rptClassStudentPointsService: RptClassStudentPointsService
    ) {

        const url = this.router.url.substring(7).split('?')[0];

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin);

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao);

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa);

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien);

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon);

        this.canAdd = this.auth.userCanAdd(url);

        this.canDelete = this.auth.userCanDelete(url);

        this.canUpdate = this.auth.userCanEdit(url);

        this.userId = this.auth.user.id;

        this.donviId = this.auth.user.donvi_id;

        this.formClass = this.formBuilder.group({
            category_id: ['', Validators.required],
            course_id: ['', Validators.required],
            name: ['', Validators.required],
            slug: [''],
            course_info: [''],
            manager_ids: ['', Validators.required],
            manager_info: [''],
            user_id: [''],
            status: [''],
            image: [''],
            kyhieu: ['', Validators.required],
            sotinchi: ['', Validators.required],
            namhoc: ['', Validators.required],
            hocky: ['', Validators.required],
            khoa: [''],
            dothoc: [''],
            nganh_bomon_id: [''],
        });

        const today = new Date();
        const year = today.getFullYear();
        const dataYear = [
            { value: Number(year - 1).toString().concat('_', year.toString()) },
            { value: year.toString().concat('_', Number(year + 1).toString()) },
        ];

        this.arrayYear = dataYear;

        this.cols_class = [
            { label: 'TT', class: 'text-center', key: 'index_', width: '50' },
            { label: 'Tên lớp học phần', class: 'text-left', key: 'name', width: '400' },
            { label: 'Môn học', class: 'text-left', key: 'show_mon', width: '300' },
            { label: 'Số tín chỉ', class: 'text-center', key: 'sotinchi', width: '100' },
            { label: 'Giảng viên', class: 'text-left', key: 'mainTeacher', width: '250' },
            { label: 'Số ĐTGV', class: 'text-center', key: 'sdt_teacher', width: '150' },
            { label: 'Năm học', class: 'text-center', key: 'namhoc', width: '100' },
            { label: 'Học kỳ', class: 'text-center', key: 'hocky', width: '100' }
        ];
    }

    ngOnDestroy(): void {

    }

    ngOnInit(): void {
        this.initData();
        // this.btngetClass()
    }


    btngetClass(){
        const condtion: ConditionOption = {
            condition:[
                {
                    conditionName:'namhoc',
                    condition: OvicQueryCondition.equal,
                    value:'2025_2026'
                },
                {
                    conditionName:'hocky',
                    condition: OvicQueryCondition.equal,
                    value:'2'
                }
            ],page:'1',
            set:[
                {
                    label:'limit', 'value' :'-1'
                }
            ]
        }
        this.classesService.getClassesByPageNew(condtion).pipe(switchMap(m=>{
            return forkJoin([of(m.data), this.getStudent(m.data,[])])
            }

        )).subscribe({
            next:([dataClass, dataStudent])=>{
                console.log(dataClass)
                console.log(dataStudent)

            }
        })
    }

    private getStudent(classes: Classes[], data: any[]): Observable<any[]> {
        const index = classes.findIndex(f => !f['haveGet']);

        if (index !== -1) {
            const currentClass = classes[index];

            const condtion: ConditionOption = {
                condition: [
                    {
                        conditionName: 'class_id',
                        condition: OvicQueryCondition.equal,
                        value: currentClass.id.toString()
                    },
                    {
                        conditionName: 'check_ban',
                        condition: OvicQueryCondition.equal,
                        value: 'CAM'
                    },
                    {
                        conditionName: 'nghi_20_pecent',
                        condition: OvicQueryCondition.equal,
                        value: 'CẤM THI',
                        orWhere: 'or'
                    }
                ],
                page: '1',
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'select', value: 'id,class_id,so_buoinghi,check_ban,nghi_20_pecent' }
                ]
            };

            return this.rptClassStudentPointsService.getDataByPageNew(condtion).pipe(
                switchMap(m => {
                    classes[index]['haveGet'] = true;

                    data.push(...m.data); // FIX

                    return this.getStudent(classes, data);
                })
            );
        } else {
            return of(data);
        }
    }

    get fC() {
        return this.formClass.controls;
    }

    getRolesPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.objectRoles = {};

            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: ROLES.giangvien },
                    { label: 'include_by', value: 'name' },
                ],
                page: null,
            };

            this.roleService.getRolesByPageNew(condition).subscribe({
                next: (_role) => {

                    _role.data.forEach((f) => {
                        this.objectRoles[f.name] = f;
                    });

                    resolve(this.objectRoles);
                },
                error: () => {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công');
                    resolve(null);
                },
            });
        });
    }

    async initData() {
        this.listClass = [];
        this.pageIndex = 0;
        this.noitifi.isProcessing(true);
        const t = await this.getRolesPromise();
        const condition_group_namhoc = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        ]).set('order', 'DESC').set('orderby', 'namhoc').set('groupby', 'namhoc').set('limit', -1);

        const condition_group_hocky = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        ]).set('order', 'DESC').set('orderby', 'hocky').set('groupby', 'hocky').set('limit', -1);

        const condition_donvi = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
        ]).set('limit', -1).set("order", "ASC").set("orderby", "title");

        const roleATeacher = this.auth.roles.find((r) => r.name === ROLES.giangvien);

        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
            this.userService.getUserByCol('role_ids', roleATeacher ? roleATeacher['id'] : this.objectRoles[ROLES.giangvien].id),
            this.donViService.getDonViByCols(condition_donvi),
            this.elngUserProfileService.getElngUserProfileByItem(this.userId.toString(), 'user_id'),
        ]).subscribe({
            next: ([_resNamhoc, _resHocky, _resUser, _resCategory, _userProfile]) => {

                const tmpNamHoc = [];

                const tmpHocky = [];

                _resNamhoc.forEach((f) => {
                    if (f['namhoc']) {
                        tmpNamHoc.push({
                            value: f['namhoc'],
                            label: 'Năm học '.concat(f['namhoc']),
                        });
                    }
                });

                _resHocky.forEach((f) => {
                    if (f['hocky']) {
                        tmpHocky.push({
                            value: f['hocky'],
                            label: 'HK '.concat(f['hocky']),
                        });
                    }
                });

                this.listNamhoc = tmpNamHoc;

                this.listHocky = tmpHocky;

                this.user_profile = _userProfile[0];
                //
                const objectTeacher = {};

                const tmpUser = [];

                _resUser.forEach((f, key) => {
                    if (f.status !== -1) {
                        f['show_name'] = f.display_name.concat(' (', f.email, ')');
                        if (!objectTeacher[f.id]) {
                            objectTeacher[f.id] = f;
                        }
                        tmpUser.push(f);
                    }
                });

                this.objectTeacher = objectTeacher;

                this.listTeacher = tmpUser;

                this.list_donvi_chuyenmon = _resCategory;

                if (this.listNamhoc && this.listNamhoc[0] && this.listNamhoc[0]['value']) {
                    const condition_group_hocky_end = this.httpHelper.paramsConditionBuilder([
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1' },
                        { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: this.listNamhoc[0]['value'], orWhere: 'and' },
                    ]).set('order', 'DESC').set('orderby', 'hocky').set('groupby', 'hocky');

                    this.classesService.getClassesByCols(condition_group_hocky_end).subscribe({
                        next: (_res) => {

                            const hocky_first = this.listHocky && this.listHocky[0] && this.listHocky[0]['value'] ? this.listHocky[0]['value'] : null;

                            this.objectFilter['namhoc'] = this.listNamhoc && this.listNamhoc[0] && this.listNamhoc[0]['value'] ? this.listNamhoc[0]['value'] : null;

                            this.objectFilter['hocky'] = _res.length && _res[0] && _res[0]['hocky'] ? _res[0]['hocky'] : hocky_first;

                            this.loadPageClass(1);
                        },
                        error: () => {
                            this.noitifi.toastError('Lỗi kết nối');
                            this.noitifi.isProcessing(false);
                        }
                    });
                } else {
                    this.noitifi.isProcessing(false);
                }
            },
            error: () => {
                this.noitifi.toastError('Lỗi kết nối');
                this.noitifi.isProcessing(false);
            },
        });
    }

    loadPageClass(page) {
        this.noitifi.isProcessing(true);
        if (this.routerLanhdaokhoa && (!this.user_profile || !this.user_profile.donvi_chuyenmon_id || this.user_profile.donvi_chuyenmon_id === 0)) {
            this.noitifi.isProcessing(false);
            return this.noitifi.toastInfo("Thầy/Cô chưa được phân khoa trên hệ thống, vui lòng liên hệ phòng Đào tạo");
        }

        if (this.routerLanhdaobomon && (!this.user_profile || !this.user_profile.bomon_id)) {
            this.noitifi.isProcessing(false);
            return this.noitifi.toastInfo("Thầy/Cô chưa được phân bộ môn trên hệ thống, vui lòng liên hệ phòng Đào tạo");
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: this.limitList.toString() }
            ],
            page: page,
        };

        if (this.user_profile && this.user_profile.donvi_chuyenmon_id && this.routerLanhdaokhoa) {
            condition.condition.push(
                { conditionName: 'category_id', condition: OvicQueryCondition.equal, value: this.user_profile.donvi_chuyenmon_id.toString(), orWhere: 'and' }
            );
        }

        if (this.user_profile && this.user_profile.bomon_id && this.routerLanhdaobomon) {
            condition.condition.push(
                { conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.user_profile.bomon_id.toString(), orWhere: 'and' }
            );
        }

        const arr_like = ['name'];

        Object.keys(this.objectFilter).forEach((f) => {
            if (f !== "manager_ids") {
                const index = arr_like.findIndex((m) => m === f);
                if (index !== -1) {
                    condition.condition.push(
                        { conditionName: f, condition: OvicQueryCondition.like, value: '%'.concat(this.objectFilter[f], '%'), orWhere: 'and' }
                    );
                } else {
                    condition.condition.push(
                        { conditionName: f, condition: OvicQueryCondition.equal, value: this.objectFilter[f].toString(), orWhere: 'and' }
                    );
                }
            } else {
                condition.condition.push(
                    { conditionName: f, condition: OvicQueryCondition.like, value: '%|'.concat(this.objectFilter[f], '|%'), orWhere: 'and' }
                );
            }
        });

        if (this.routerGiangvien) {
            condition.condition.push(
                { conditionName: 'manager_ids', condition: OvicQueryCondition.like, value: '%|'.concat(this.userId.toString(), '|%'), orWhere: 'and' }
            )
        }

        forkJoin([
            this.classesService.getClassesByPageNew(condition).pipe(
                mergeMap((_class) => {

                    const manager_ids = [0];

                    const couse_ids = [0];

                    _class.data.forEach((f) => {
                        couse_ids.push(f.course_id);
                        if (f.manager_ids) {
                            const teacher_id = f.manager_ids ? f.manager_ids.split('|').filter((m) => m) : null;
                            manager_ids.push(teacher_id);
                        }
                    });

                    const new_couse_ids = [...new Set(couse_ids)];

                    const new_manager_ids = [...new Set(manager_ids)];

                    const condition_meet: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'include', value: new_manager_ids.toString() },
                            { label: 'include_by', value: 'user_id' },
                            { label: 'limit', value: '-1' },
                        ],
                        page: null,
                    };

                    const condition_mon: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'include', value: new_couse_ids.toString() },
                            { label: 'include_by', value: 'id' },
                            { label: 'limit', value: '-1' },
                        ],
                        page: null,
                    };

                    if (_class.recordsFiltered) {
                        return forkJoin([
                            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_mon),
                            this.elngUserProfileService.getUserProfileByPageNewV2(condition_meet),
                        ]).pipe(
                            mergeMap(([_mon, _user]) => {
                                _class.data.forEach((f) => {

                                    const index_mon = _mon.data.findIndex((m) => m.id === f.course_id);

                                    if (index_mon !== -1) {
                                        f['show_mon'] = '['.concat(_mon.data[index_mon].maso, '] - ', _mon.data[index_mon].title);
                                    } else {
                                        f['show_mon'] = '';
                                    }

                                    if (f.manager_ids) {
                                        const teacher_id = f.manager_ids ? f.manager_ids.split('|').filter((m) => m) : null;
                                        const index_meet = _user.data.findIndex((m) => m.user_id.toString() === teacher_id.toString());
                                        f['google_meet'] = index_meet !== -1 ? _user.data[index_meet]['google_meet'] : null;
                                    }
                                });
                                return of(_class);
                            })
                        );
                    }
                    return of(_class);
                })
            ),
        ]).subscribe(([_resClass]) => {

            const tmpClass = [];

            if (!_resClass.recordsFiltered) {
                this.emptyList =
                    'Đến thời điểm hiện tại, Học kỳ ' +
                    this.objectFilter['hocky'] +
                    ' năm học ' +
                    this.objectFilter['namhoc'] +
                    ' Thầy/cô chưa có lớp học phần nào được phân công, vui lòng liên hệ với phòng Đào tạo nếu thấy thiếu sót, trân trọng cảm ơn!';
            }

            this.countClass = _resClass.recordsFiltered;

            const _index_start = (page - 1) * this.limitList;

            const user_ids = [];

            _resClass.data.forEach((f, key) => {
                f['index_'] = _index_start + key + 1;
                f['blob'] = f.image && f.image['id'] ? this.sanitizer.bypassSecurityTrustUrl(getLinkDownload_aws(f.image['id'].toString()).concat('?token=', this.auth.accessToken)) : '..\\assets\\images\\class_avatar.jpg';
                f.manager_ids = f.manager_ids ? f.manager_ids.split('|').filter((m) => m) : null;
                if (f.manager_info) {
                    f['mainTeacher'] = f.manager_info.replace(/\*/gi, '').replace(/\,/gi, ', ');
                }

                if (f.manager_ids) {
                    f['sdt_teacher'] = this.objectTeacher[f.manager_ids[0]] && this.objectTeacher[f.manager_ids[0]]['phone'] ? this.objectTeacher[f.manager_ids[0]]['phone'] : 'Chưa xác định';
                }

                if (f.course_id && f.course_info && f.course_info['title']) {
                    f['course_name'] = f.course_info['title'];
                }

                if (f['mainTeacher']) {
                    user_ids.push(f['mainTeacher']);
                }

                tmpClass.push(f);
            });

            this.listClass = tmpClass;

            this.noitifi.isProcessing(false);
        });
    }

    searchClass(event) {
        if (event) {
            if (event.code === 'Enter' || event.code === "NumpadEnter") {
                const value = event.target.value.trim();
                this.objectFilter['name'] = value;
                this.onResetPage();
            }

            if (!event.target.value || !event.target.value.trim()) {
                delete this.objectFilter['name']
                this.onResetPage();
            }
        } else {
            delete this.objectFilter['name']
            this.onResetPage();
        }

    }

    onChangeFilter(event, keyName: string) {
        if (event) {
            this.objectFilter[keyName] = event['value'] ? event['value'] : event['id'];
        } else {
            delete this.objectFilter[keyName];
        }
        this.onResetPage();
    }

    onResetPage() {
        if (!this.paginator.empty()) {
            this.paginator.changePage(0);
        } else {
            this.loadPageClass(1);
        }
    }

    async resetForm() {
        this.formClass.reset();
        this.fC['user_id'].setValue(this.userId);
        this.fC['status'].setValue(1);
        this.isUpdated = false;
        this.fC['image'].setValue({
            ext: 'jpg',
            file_size: '77.3 KB',
            id: 21271,
            name: 'upload_c5f9b0067cbea71bd6fa8ca7445cd03d.jpg',
            size: 36142,
            title: 'cartoon-background-with-empty-classroom-interior-inside_1441-1735.jpg',
            type: 'image/jpg',
        });

        this.fC['manager_ids'].setValue(this.userId);

        this.fC['manager_info'].setValue(this.auth.user.display_name.concat(' *'));

        if (this.user_profile && this.user_profile.donvi_chuyenmon_id) {
            this.fC['category_id'].setValue(this.user_profile.donvi_chuyenmon_id);
            this.noitifi.isProcessing(true);
            this.listCategory = await this.getDonviPromise(this.user_profile.donvi_chuyenmon_id);
            this.listCourse = await this.getCoursePromise('category_ids', this.user_profile.donvi_chuyenmon_id);
            this.noitifi.isProcessing(false);
        }

        if (this.user_profile && this.user_profile.bomon_id) {
            this.fC['nganh_bomon_id'].setValue(this.user_profile.bomon_id);
        }
    }

    actionsEvent(require, object: Classes) {
        if (require) {
            this.selectedClass = object;
            switch (require.key) {
                case 'editDataClasses':
                    this.resetForm();
                    if (this.routerDaotao || this.routerLanhdaokhoa || this.routerAdmin) {
                        this.isUpdated = true;
                        this.editClass(this.selectedClass);
                        this.noitifi.openSideNavigationMenu({ template: this.createClass, size: 700, offsetTop: '0px' });
                    } else {
                        this.noitifi.toastError('Bạn không có quyền');
                    }
                    break;
                case 'requireDelete':
                    if (this.routerDaotao || this.routerLanhdaokhoa || this.routerAdmin) {
                        this.deleteClass(this.selectedClass);
                    } else {
                        this.noitifi.toastError('Bạn không có quyền');
                    }
                    break;
                case 'google_meet':
                    if (object['google_meet']) {
                        const url = 'https://meet.google.com/'.concat(object['google_meet']);
                        window.open(url, '_blank');
                    }
                    break;
                default:
                    break;
            }
        }
    }

    async editClass(object: Classes) {
        this.formTitle = 'Sửa thông tin lớp học';
        this.selectedClass = object;
        // this.fC['donvi_chuyenmon_id'].setValue(object.donvi_chuyenmon_id);
        this.fC['category_id'].setValue(object.category_id);
        this.fC['nganh_bomon_id'].setValue(object.nganh_bomon_id);
        this.fC['course_id'].setValue(object.course_id);
        this.fC['image'].setValue(object.image);
        this.fC['kyhieu'].setValue(object.kyhieu);
        this.fC['sotinchi'].setValue(object.sotinchi);
        this.fC['status'].setValue(object.status);
        this.fC['namhoc'].setValue(object.namhoc);
        this.fC['manager_ids'].setValue(object.manager_ids ? Number(object.manager_ids[0]) : null);
        this.fC['manager_info'].setValue(object.manager_info ? object.manager_info.split(',')[0] : null);
        this.fC['hocky'].setValue(object.hocky);
        this.fC['name'].setValue(object.name);
        this.fC['khoa'].setValue(object.khoa);
        this.fC['dothoc'].setValue(object.dothoc);
        if (object.category_id) {
            const index = this.list_donvi_chuyenmon.findIndex((m) => m.id === object.category_id);
            if (index !== -1) {
                this.noitifi.isProcessing(true);
                this.listCategory = await this.getDonviPromise(this.list_donvi_chuyenmon[index].id);
                this.listCourse = await this.getCoursePromise('category_ids', this.list_donvi_chuyenmon[index].id);
                this.noitifi.isProcessing(false);
            }
        }
    }

    deleteClass(object: Classes) {
        this.noitifi.confirmDelete().then(
            (a) => {
                if (a) {
                    this.noitifi.isProcessing(true)
                    forkJoin([
                        this.classesService.deleteDataClasses(object.id),
                        this.classStudentService.deleteClassStudentByCol(object.id.toString(), 'class_id'),
                    ]).subscribe({
                        next: () => {
                            this.noitifi.toastSuccess('Xóa thành công');
                            this.loadPageClass(this.pageIndex);
                        },
                        error: () => {
                            this.noitifi.toastError('Xóa thất bại, lỗi kết nối');
                            this.noitifi.isProcessing(false)
                        },
                    });
                }
            },
            () => null
        );
    }



    getDonviPromise(donvi_chuyenmon_id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const arr_condition = [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
                {
                    conditionName: 'donvi_id',
                    condition: OvicQueryCondition.equal,
                    value: this.donviId.toString(),
                    orWhere: 'and',
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: 'bomon',
                    orWhere: 'and',
                },
                {
                    conditionName: 'donvi_chuyenmon_id',
                    condition: OvicQueryCondition.equal,
                    value: donvi_chuyenmon_id.toString(),
                    orWhere: 'and',
                },
            ];

            const condition_nganh = this.httpHelper.paramsConditionBuilder(arr_condition).set('limit', '-1');

            this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh).subscribe({
                next: (_category) => {
                    resolve(_category);
                },
                error: () => {
                    resolve([])
                },
            });
        });
    }

    getCoursePromise(col: string, id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.elnKhoaHocService.getElnKhoaHocByCol(col, id.toString()).subscribe({
                next: (_resCourse) => {
                    const tmp = _resCourse.filter((m) => m.status > -1);
                    tmp.forEach((f) => {
                        f['title'] = f.title.concat(' - [', f.maso, ']');
                    });
                    resolve(tmp);
                },
                error: () => {
                    this.noitifi.toastError('Lỗi kết nối');
                    resolve([]);
                },
            });
        });
    }

    async onChangeDonviCM(event) {
        if (event) {
            this.noitifi.isProcessing(true);
            this.listCategory = await this.getDonviPromise(event.id);
            this.listCourse = await this.getCoursePromise('category_ids', event.id);
            this.noitifi.isProcessing(false);
        } else {
            this.listCategory = [];
        }
    }

    async loadCourse(event, col) {
        if (event) {
            this.noitifi.isProcessing(true);
            this.listCourse = await this.getCoursePromise('category_ids', event.id);
            this.noitifi.isProcessing(false);
        } else {
            this.listCourse = [];
        }
    }

    changePage(event) {
        this.pageIndex = event.page + 1;
        this.loadPageClass(event.page + 1);
    }

    openFormAddClass(flag: boolean, event?: Classes) {
        this.resetForm();
        this.formTitle = 'Thêm lớp học';
        this.isUpdated = flag;
        this.noitifi.openSideNavigationMenu({ template: this.createClass, size: 700, offsetTop: '0px' });
        if (this.isUpdated) {
            this.editClass(event);
        }
    }

    chooseStyleClass(index: number) {
        this.activeIndex_class = index;
    }

    cancelFilter() {
        delete this.objectFilter['name'];
        if (this.routerDaotao || this.routerAdmin) {
            delete this.objectFilter['category_id']
        }
        this.onResetPage();
    }

    closeSideMenu() {
        this.noitifi.closeSideNavigationMenu();
    }

    onChangeCourse(event) {
        if (event) {
            this.fC['course_id'].setValue(event.id);
            this.fC['course_info'].setValue({ title: event.title });
        } else {
            this.fC['course_id'].setValue(null);
            this.fC['course_info'].setValue(null);
        }
    }

    onFocusoutTitle(key: string, valid: any) {
        if (this.fC[key].value) {
            let slug = this.fC[key].value;
            let key_ = key;
            if (key === 'name') {
                slug = this.helperService.slugVietnamese(this.fC[key].value);
                key_ = 'slug';
                this.checkIsValid(key_, slug, this.slugIsValid);
            } else {
                this.checkIsValid(key_, slug, this.kyhieuIsValid);
            }
        }
    }

    checkIsValid(col: string, item: string, valid) {
        if (item) {
            const arrayCondition = [
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
                {
                    conditionName: col,
                    condition: OvicQueryCondition.equal,
                    value: item,
                    orWhere: 'and',
                },
            ];
            if (this.isUpdated) {
                if (this.selectedClass)
                    arrayCondition.push({
                        conditionName: 'id',
                        condition: OvicQueryCondition.notEqual,
                        value: this.selectedClass.id.toString(),
                        orWhere: 'and',
                    });
            }
            const condition = this.httpHelper.paramsConditionBuilder(arrayCondition);
            setTimeout(() => {
                this.classesService.getClassesByCols(condition).subscribe((_res) => {
                    if (_res.length) {
                        if (col === 'slug') {
                            this.slugIsValid = false;
                        } else {
                            this.kyhieuIsValid = false;
                        }
                    } else {
                        if (col === 'slug') {
                            this.slugIsValid = true;
                        } else {
                            this.kyhieuIsValid = true;
                        }
                    }
                });
            }, 1000);
        }
    }

    onChangeTeacher(event) {
        if (event) {
            this.fC['manager_ids'].setValue(event.id);
            this.fC['manager_info'].setValue(event.display_name.concat(' *'));
        } else {
            this.fC['manager_ids'].setValue(this.userId);
            this.fC['manager_info'].setValue(
                this.auth.user.display_name.concat(' *')
            );
        }
    }

    addClass() {
        if (this.formClass.valid) {

            const data = this.formClass.getRawValue();

            data['slug'] = this.helperService.slugVietnamese(data['name']);

            data['manager_ids'] = !data['manager_ids'] ? [this.userId] : [data['manager_ids']];

            data['manager_info'] = !data['manager_ids'] ? this.auth.user.display_name.concat(' *') : data['manager_info'];

            if (!data['course_info']) {
                delete data['course_info'];
            }

            if (!data['image']) {
                delete data['image'];
            }

            this.noitifi.isProcessing(true);
            if (this.isUpdated) {
                if (this.selectedClass.manager_ids) {
                    const manager_ids = this.selectedClass.manager_ids.splice(1, this.selectedClass.manager_ids.length);
                    const manager_info = this.selectedClass.manager_info.split(',').splice(1, this.selectedClass.manager_info.split(',').length);
                    data['manager_ids'] = data['manager_ids'].concat(manager_ids);
                    data['manager_info'] = data['manager_info'].concat(',', manager_info.toString());
                    data['manager_ids'] = data['manager_ids'] ? '|'.concat(data['manager_ids'].join('|'), '|') : '';
                } else if (Array.isArray(data['manager_ids']) && data['manager_ids'].length === 1) {
                    data['manager_ids'] = data['manager_ids'] ? '|'.concat(data['manager_ids'].join('|'), '|') : '';
                }

                this.classesService.updateDataClasses(this.selectedClass.id, data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Cập nhật thành công');
                        this.resetForm();
                        this.loadPageClass(this.pageIndex);
                        this.closeSideMenu();
                    },
                    error: () => {
                        this.noitifi.toastWarning('Cập nhật thất bại');
                        this.noitifi.isProcessing(false)
                    }
                });
            } else {
                data['manager_ids'] = data['manager_ids'] ? '|'.concat(data['manager_ids'].join('|'), '|') : '';
                this.classesService.createDataClasses(data).subscribe({
                    next: () => {
                        this.noitifi.toastSuccess('Thêm thành công');
                        this.resetForm();
                        this.onResetPage();
                        this.closeSideMenu();
                    },
                    error: () => {
                        this.noitifi.toastWarning('Thêm thất bại');
                        this.noitifi.isProcessing(false)
                    }
                });
            }
        } else {
            this.noitifi.toastWarning('Vui lòng điền đầy đủ thông tin cần thiết');
        }
    }
}
