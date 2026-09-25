import { ClassesService } from '@shared/services/classes.service';
import { request } from 'http';
import { CourseCloService } from './../../../../shared/services/course-clo.service';
import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CHUAN_DAU_RA, ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { firstValueFrom, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { APP_CONFIGS, key_server } from '@env';
import { MatButtonModule } from '@angular/material/button';
import { HelperService } from '@core/services/helper.service';
import { CoursePlanComment } from '@modules/shared/models/course-plan-comment';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { EditorModule } from 'primeng/editor';
import { PanelModule } from 'primeng/panel';
import { TabViewModule } from 'primeng/tabview';
import { ChuandauraComponent } from '../chuandaura/chuandaura.component';
import { MatTabsModule } from '@angular/material/tabs';
import { CourseClo } from '@modules/shared/models/course-clo';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { NhanxetNoidungComponent } from "../nhanxet-noidung/nhanxet-noidung.component";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ButtonModule } from 'primeng/button';
import { OpenFileManagerDraDropComponent } from "@modules/shared/components/open-file-manager-dra-drop/open-file-manager-dra-drop.component";

@Component({
    selector: 'app-monhoc-noidung',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        FormsModule,
        MatButtonModule,
        MatListModule,
        EditorModule,
        PanelModule,
        TabViewModule,
        ChuandauraComponent,
        MatTabsModule,
        NhanxetNoidungComponent,
        DialogModule,
        MatProgressBarModule,
        DragDropModule,
        MatIconModule,
        MatMenuModule,
        OpenFileManagerDraDropComponent
    ],
    templateUrl: './monhoc-noidung.component.html',
    styleUrls: ['./monhoc-noidung.component.css']
})
export class MonhocNoidungComponent implements OnInit, AfterViewChecked, AfterViewInit {
    @ViewChild(ChuandauraComponent) chuandauraComponent: ChuandauraComponent;

    @ViewChild('formAddBaigiang') formAddBaigiang: ElementRef;

    @ViewChild('muctieuElm') muctieuElm!: ElementRef;

    @ViewChild('cpisElm') cpisElm!: ElementRef;

    @ViewChild('tailieuElm') tailieuElm!: ElementRef;

    @ViewChild('appNhanxetMuctieu') appNhanxetMuctieu: NhanxetNoidungComponent;

    @ViewChild('appNhanxetTailieu') appNhanxetTailieu: NhanxetNoidungComponent;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    userId: number;

    selectedCourse: ElnKhoaHoc;

    list_plan: CoursePlanActivities[] = [];

    canAdded: boolean = false;

    unlimitLesson: boolean = APP_CONFIGS.unlimitLesson;

    label_parent_kehoach: string = "Bài";

    keyServer = key_server;

    selectPlan: CoursePlanActivities;

    list_plan_activity: CoursePlanActivities[];

    indexByKeyServerInSotinchi: number = 0;

    closeLeft: boolean = false;

    plan_content = {
        muctieu: {
            mucdich_sinhvien: {
                label: "Bài học nhằm mục đích giúp sinh viên",
                noidung: null,
            },
            saukhihoanthanh: {
                label: "Sau khi hoàn thành bài học, sinh viên có thể",
                noidung: null,
            }
        }
    }

    activeIndex: number = 0;

    keyScroll: string = null;

    selectedPlanActivity: CoursePlanActivities;

    formTailieu: FormGroup;

    formMuctieu: FormGroup;

    formThaoLuan: FormGroup;

    planMuctieu: CoursePlanActivities;

    planTailieu: CoursePlanActivities;

    list_clo: CourseClo[];

    displayComment: boolean = false;

    loading: boolean = true;

    formTitle: string;

    titleWaiting: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    numberAddLesson: number;

    dragDropLesson: boolean = false;

    isDttx = APP_CONFIGS.isDttx;

    isAddThaoLuan: boolean = false;

    list_thaoluan: CoursePlanActivities[] = [];

    app_configs = APP_CONFIGS;
    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private elnKhoaHocService: ElnKhoaHocService,
        private elngUserProfileService: ElngUserProfileService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private helperService: HelperService,
        private coursePlanCommentService: CoursePlanCommentService,
        private formBuilder: FormBuilder,
        private courseCloService: CourseCloService,
        private modalService: NgbModal,
        private courseQuestionsService: CourseQuestionsService,
        private classesService: ClassesService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/monhoc-noidung');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-noidung');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-noidung');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-noidung');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-noidung');

        this.userId = this.auth.user.id;

        this.formTailieu = this.formBuilder.group({
            files: ['', Validators.required],
            slides: ['', Validators.required],
            desc: [''],
            video: [''],
            videos: ['']
        });

        this.formMuctieu = this.formBuilder.group({
            title: ['', Validators.required],
            kienthuc: [''],
            kynang: [''],
            course_clo_id: ['', Validators.required],
            desc: ['']
        });

        this.formThaoLuan = this.formBuilder.group({
            desc: ['', Validators.required],
            files: [''],
            video: [''],
        });
    }

    get fT() {
        return this.formTailieu.controls;
    }

    get fM() {
        return this.formMuctieu.controls;
    }

    get fTl() {
        return this.formThaoLuan.controls;
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe(async (params) => {
            if (params && params['code']) {
                this.notificationService.isProcessing(true);

                const course_id = params['code'];

                const contition_course: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                if (this.routerGiangvien) {
                    contition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' })
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

                const condition_plan: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                        { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                        { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'ACTIVITY_TEST', orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                const condition_comment: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString() },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                    ],

                    set: [{ label: 'limit', value: '-1' }],
                    page: null,
                };

                const condition_reply_comment: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString() },
                        { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'select', value: 'id, parent_id' },
                    ],
                    page: null,
                };

                const condition_clo: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                const condition_class: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '1' },
                    ],
                    page: null
                }

                const class_ = await firstValueFrom(this.classesService.getClassesByPageNew(condition_class))

                if (class_ && class_.recordsFiltered === 0 && APP_CONFIGS.dragDropLesson) {
                    this.dragDropLesson = true;
                }

                forkJoin([
                    this.elnKhoaHocService.getKhoaHocByPageNew_2(contition_course),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                    this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
                    this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_comment),
                    this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_reply_comment),
                    this.courseCloService.getCourseCloByPageNew(condition_clo)
                ]).subscribe({
                    next: async ([_course, _user_profile, _plan, _comment, _comment_child, _course_clo]) => {
                        if (_course.recordsFiltered) {

                            this.selectedCourse = _course.data[0];

                            this.indexByKeyServerInSotinchi = key_server == 'hvu' ? (this.selectedCourse.params.sotinchi == 2 ? 1 : ([3, 4].includes(this.selectedCourse.params.sotinchi) ? 2 : null)) : this.selectedCourse.params.sotinchi;

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

                            if (this.routerDaotao || this.routerLanhdaobomon || this.routerLanhdaokhoa || this.userId === this.selectedCourse.creator_plan_id) {
                                this.canAdded = true;
                            } else {
                                this.canAdded = false;
                            }

                            this.list_plan = this.setNewData(_plan.data.filter(m => m.week !== 0), _comment.data, _comment_child.data);

                            if (this.list_plan.length)
                                this.onChangePlan(this.list_plan[0], 'muctieu');

                            this.list_clo = _course_clo.data;

                            this.loading = false;

                            this.list_thaoluan = await this.getThaoLuanPromise();

                            this.notificationService.isProcessing(false);

                        } else {
                            this.notificationService.toastError("Không tìm thấy môn học");
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.router.navigate(['/admin/content-none']);
            }
        })
    }


    ngAfterViewChecked() {
        if (this.keyScroll) {
            setTimeout(() => {
                this.scroll(this.keyScroll);
                this.keyScroll = null;
            }, 300)
        }
    }

    ngAfterViewInit() {

    }




    loadPlan() {
        this.notificationService.isProcessing(true);
        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'ACTIVITY_TEST', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.toString() },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],

            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };

        const condition_reply_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.toString() },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, parent_id' },
            ],
            page: null,
        };

        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan),
            this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_comment),
            this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_reply_comment),
        ]).subscribe({
            next: ([_plan, _comment, _comment_child]) => {

                this.list_plan = this.setNewData(_plan.data.filter(m => m.week !== 0), _comment.data, _comment_child.data);

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    getThaoLuanPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const condition_thaoluan: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
                    { conditionName: 'week', condition: OvicQueryCondition.equal, value: '2000', orWhere: 'and' },
                    { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
                    { conditionName: 'type', condition: OvicQueryCondition.notEqual, value: 'ACTIVITY_TEST', orWhere: 'and' }
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'ordering' }
                ],
                page: null
            }

            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_thaoluan).subscribe({
                next: (_thaoluan) => {
                    const parent = [..._thaoluan.data].filter((m) => m.parent_id === 0);

                    parent.forEach((f, index) => {
                        f['checked'] = false;

                        const nodes = [..._thaoluan.data].filter((m) => m.parent_id === f.id);

                        f['children'] = nodes;

                        f['children'].forEach((c) => {
                            f['checked'] = false;
                            c['icon'] = 'fa fa-comments-o';
                        });
                    });

                    resolve(parent);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(
                        'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
                    );
                    resolve([]);
                },
            });
        });
    }

    setNewData(data: CoursePlanActivities[], _comment: CoursePlanComment[], _comment_child: CoursePlanComment[]): CoursePlanActivities[] {
        if (data) {
            if (data.length > 0) {
                this.helperService.sort(data, 'ordering');
            }

            const parent = [...data].filter((m) => m.parent_id === 0);

            parent.forEach((f, index) => {
                if (f.week === 0) {
                    const comments = _comment.filter((m) => m.course_plan_activity_id === f.id || m.course_plan_activity_id === f.course_plan_activity_id);

                    const object_comment = {};

                    comments.forEach((c) => {
                        const count_reply = _comment_child.filter((m) => m.parent_id === c.id).length;

                        c['count_reply'] = count_reply;

                        if (!object_comment[c.user_id]) {
                            object_comment[c.user_id] = [];
                            object_comment[c.user_id].push(c);
                        } else {
                            object_comment[c.user_id].push(c);
                        }
                    });

                    f['comments'] = [];

                    Object.keys(object_comment).forEach((o) => {
                        f['comments'].push({
                            user_id: o,
                            children: object_comment[o],
                        });
                    });

                    // f['comments'] = comments;
                }

                f['checked'] = false;

                const nodes = [...data].filter((m) => m.parent_id === f.id && m.type !== 'ACTIVITY_CDR');

                f['children'] = nodes;

                f['show_name'] = this.label_parent_kehoach.concat(' ', f.week.toString());

                f['children'].forEach((c) => {
                    f['checked'] = false;
                    switch (c['type']) {
                        case 'LESSON':
                            c['icon'] = 'fa fa-file-text-o';
                            break;
                        case 'LESSON_TEST':
                            c['icon'] = 'fa fa-clock-o';
                            break;
                        case 'MEET':
                            c['icon'] = 'fa fa-video-camera';
                            break;
                        case 'OFFLINE_TEST':
                            c['icon'] = 'fa fa-pencil-square-o';
                            break;
                        case 'ACTIVITY_TEST':
                            c['icon'] = 'fa fa-clock-o';
                            break;
                        case 'THUONGXUYEN_TRACNGHIEM':
                            c['icon'] = 'fa fa-clock-o';
                            break;
                        case 'THUONGXUYEN_TULUAN':
                            c['icon'] = 'fa fa-pencil-square-o';
                            break;
                        case 'THUONGXUYEN_DUAN':
                            c['icon'] = 'fa fa-book';
                            break;
                        case 'ACTIVITY':
                            c['keyScroll'] = "tailieu";
                            c['icon'] = c['video'] && Object.keys(c['video']).length ? 'fa fa-file-video-o' : 'fa fa-file-text-o';
                            break;
                        case 'MUCTIEU':
                            c['keyScroll'] = "muctieu";
                            c['icon'] = c['video'] && Object.keys(c['video']).length ? 'fa fa-file-video-o' : 'fa fa-file-text-o';
                            break;
                        default:
                            break;
                    }

                    const comments = _comment.filter((m) => m.course_plan_activity_id === c.id);

                    const object_comment = {};

                    comments.forEach((t) => {
                        const count_reply = _comment_child.filter((m) => m.parent_id === t.id).length;

                        t['count_reply'] = count_reply;

                        if (!object_comment[t.user_id]) {
                            object_comment[t.user_id] = [];
                            object_comment[t.user_id].push(t);
                        } else {
                            object_comment[t.user_id].push(t);
                        }
                    });

                    c['comments'] = [];

                    Object.keys(object_comment).forEach((o) => {
                        c['comments'].push({
                            user_id: o,
                            children: object_comment[o],
                        });
                    });
                });

                if (f['children'].length && f.week !== 0 && f.week < 1000) {
                    const CDR: CoursePlanActivities = {
                        id: f.id * -1,
                        course_id: this.selectedCourse.id,
                        week: f.week,
                        desc: '',
                        title: 'Chuẩn đầu ra - CPIs',
                        ordering: 0,
                        parent_id: f.id,
                        type: 'CDR',
                        icon: 'fa fa-list-alt',
                        children: [...data].filter((m) => m.parent_id === f.id && m.type === 'ACTIVITY_CDR'),
                        video: null,
                        files: [],
                        status: 0,
                        course_lesson_id: 0,
                        desc_title: '',
                        edit: 0,
                        slides: [],
                        keyScroll: 'cpis'
                    };

                    if (CDR['children'].length !== 0) {
                        const index_s = CDR['children'].filter((m) => m.status === 1);

                        const status_notactivity = CDR['children'].filter((m) => m.status === 0);

                        const status_redo = CDR['children'].filter((m) => m.status === -1);

                        const stauts_edit = CDR['children'].filter((m) => m.status === -2);

                        if (status_notactivity.length) {
                            CDR['status'] = 0;
                            f['status'] = 0;
                        }

                        if (status_redo.length) {
                            CDR['status'] = -1;
                            f['status'] = -1;
                        }

                        if (stauts_edit.length) {
                            CDR['status'] = -2;
                            f['status'] = -2;
                        }

                        if (index_s.length === CDR['children'].length && CDR['children'].length !== 0) {
                            CDR['status'] = 1;
                            f['status'] = 1;
                        }
                    } else {
                        CDR['status'] = 0;
                        f['status'] = 0;
                    }

                    f['children'].splice(1, 0, CDR);
                }
            });
            return parent;
        } else {
            return null;
        }
    }

    onChangePlan(plan: CoursePlanActivities, name: string, children?: CoursePlanActivities) {
        this.selectPlan = plan;
        this.selectedPlanActivity = children;
        this.keyScroll = name;
        this.planMuctieu = null;
        this.planTailieu = null;
        if (plan.week < 1000) {
            this.resetForm();
            if (Array.isArray(plan.children)) {
                const tailieu = plan.children.find(m => m.type === 'ACTIVITY');
                if (tailieu) {
                    this.planTailieu = tailieu;
                    this.fT['files'].setValue(tailieu.files);
                    this.fT['slides'].setValue(tailieu.slides);
                    this.fT['desc'].setValue(tailieu.desc);
                    this.fT['videos'].setValue(tailieu.videos);
                    if (typeof tailieu.video === 'object' && tailieu.video !== null && !Array.isArray(tailieu.video)) {
                        this.fT['video'].setValue([tailieu.video]);
                    } else if (Array.isArray(tailieu.video)) {
                        this.fT['video'].setValue(tailieu.video);
                    }
                }

                this.fM['title'].setValue(plan.title);
                this.fM['course_clo_id'].setValue(plan.course_clo_id);
                this.fM['desc'].setValue(plan.desc);
                const muctieu = plan.children.find(m => m.type === 'MUCTIEU');
                if (muctieu) {
                    this.planMuctieu = muctieu;
                    this.fM['kienthuc'].setValue(muctieu.kienthuc);
                    this.fM['kynang'].setValue(muctieu.kynang);
                }
            }
        } else {
            this.formThaoLuan.reset();
            this.fTl['files'].setValue(this.selectedPlanActivity.files);
            this.fTl['desc'].setValue(this.selectedPlanActivity.desc);
            if (typeof this.selectedPlanActivity.video === 'object' && this.selectedPlanActivity.video !== null && !Array.isArray(this.selectedPlanActivity.video)) {
                this.fTl['video'].setValue([this.selectedPlanActivity.video]);
            } else if (Array.isArray(this.selectedPlanActivity.video)) {
                this.fTl['video'].setValue(this.selectedPlanActivity.video);
            }
        }
    }

    deleteThaoLuan(plan: CoursePlanActivities) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.coursePlanActivitiesService.deleteCoursePlanActivities(plan.id).subscribe({
                    next: async () => {
                        this.list_thaoluan = await this.getThaoLuanPromise();
                        this.notificationService.isProcessing(false);
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            }
        })
    }

    checkDeleteThaoluan(index: number) {
        let result = false;
        if (this.list_thaoluan[0]) {
            const data = this.list_thaoluan[0].children;

            if (index === data.length - 1) {
                result = true;
            }
        }
        return result;
    }

    checkDeleteBaigiang(index: number) {
        let result = false;

        const data = this.list_plan.filter(m => m.week < 100);

        if (index === data.length - 1 && this.list_plan[index] && this.list_plan[index].week !== 0 && this.unlimitLesson) {
            result = true;
        }

        return result;
    }

    deletePlan(plan: CoursePlanActivities) {
        this.notificationService.confirmDelete().then((a) => {
            if (a) {
                this.notificationService.isProcessing(true);
                const condition_question: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'week',
                            condition: OvicQueryCondition.equal,
                            value: plan.week.toString(),
                            orWhere: "and"
                        },
                        {
                            conditionName: 'course_id',
                            condition: OvicQueryCondition.equal,
                            value: this.selectedCourse.id.toString(),
                            orWhere: "and"
                        },
                    ],
                    set: [
                        { label: 'limit', value: '1' },
                        { label: 'select', value: 'id' }
                    ],
                    page: null
                }

                this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).subscribe({
                    next: (a) => {
                        if (a.recordsFiltered) {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastInfo("Bài này đã có câu hỏi, không thể xóa");
                        } else {
                            forkJoin([
                                this.coursePlanActivitiesService.deleteCoursePlanActivities(plan.id),
                                this.coursePlanActivitiesService.deleteCoursePlanActivitiesByCol(plan.id.toString(), 'parent_id'),
                            ]).subscribe({
                                next: () => {
                                    this.notificationService.toastSuccess('Xóa thành công');
                                    this.loadPlan();
                                },
                                error: () => {
                                    this.notificationService.isProcessing(false);
                                    this.notificationService.toastSuccess('Xóa thất bài');
                                },
                            });

                        }
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess('Xóa thất bài');
                    }
                })

            }
        });
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onOpenAddCdr() {
        this.chuandauraComponent.onOpenAddCdr();
    }
    // loadPlanChildren() {
    //     this.notificationService.isProcessing(true);
    //     const condition_child: ConditionOption = {
    //         condition: [
    //             { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
    //             { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.selectPlan.id.toString(), orWhere: 'and' },
    //             { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
    //         ],
    //         set: [
    //             { label: 'limit', value: '-1' }
    //         ],
    //         page: null
    //     }

    //     forkJoin([
    //         this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_child)
    //     ]).subscribe({
    //         next: ([_plan_child]) => {
    //             this.list_plan_activity = _plan_child.data;
    //             this.notificationService.isProcessing(false);
    //         },
    //         error: () => {
    //             this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
    //             this.notificationService.isProcessing(false);
    //         }
    //     })
    // }

    autoResize(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    tapViewLesson() {

    }

    scroll(name: string) {
        switch (name) {
            case 'muctieu':
                if (this.muctieuElm)
                    this.muctieuElm.nativeElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                break;
            case 'cpis':
                if (this.cpisElm)
                    this.cpisElm.nativeElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                break;
            case 'tailieu':
                if (this.tailieuElm)
                    this.tailieuElm.nativeElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                break;
            default:
                break;
        }
    }

    resetForm() {
        this.formTailieu.reset();
    }

    saveTailieu() {
        const data = { ...this.formTailieu.getRawValue() };
        if (((data['files'] && data['files'].length > 0) || (data['slides'] && data['slides'].length > 0)) && this.planTailieu) {
            this.notificationService.isProcessing(true);
            const data = { ...this.formTailieu.getRawValue() };
            data['video'] = data['video'] && data['video'].length ? data['video'][0] : null;
            if (!APP_CONFIGS.isDttx || this.keyServer === 'hvu') {
                delete data['videos'];
            }
            this.coursePlanActivitiesService.updateCoursePlanActivities(this.planTailieu.id, data).subscribe({
                next: () => {
                    this.loadPlan();
                    this.notificationService.toastSuccess("Lưu thành công");
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess("Lưu thất bại");
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập tài liệu hoặc slide");
        }
    }

    saveMuctieu() {
        if (this.formMuctieu.valid) {
            this.notificationService.isProcessing(true);
            const data = { ...this.formMuctieu.getRawValue() };
            const data_muctieu = {
                kynang: data['kynang'],
                kienthuc: data['kienthuc']
            }

            const data_plan = {
                title: data['title'],
                course_clo_id: data['course_clo_id'],
                desc: data['desc']
            }

            forkJoin([
                this.coursePlanActivitiesService.updateCoursePlanActivities(this.planMuctieu.id, data_muctieu),
                this.coursePlanActivitiesService.updateCoursePlanActivities(this.selectPlan.id, data_plan)
            ]).subscribe({
                next: () => {
                    this.loadPlan();
                    this.notificationService.toastSuccess("Lưu thành công");
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess("Lưu thất bại");
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập đầy đủ thông tin");
        }
    }

    showComment(key: string) {
        switch (key) {
            case 'muctieu':
                this.appNhanxetMuctieu.showComment();
                break;
            case 'tailieu':
                this.appNhanxetTailieu.showComment();
                break;
        }

    }

    openFormAddLesson(add_lesson: boolean = false) {
        this.isAddThaoLuan = false;
        if (this.unlimitLesson) {
            this.formTitle = add_lesson ? "Tạo bài giảng" : "Thêm bài giảng";
            this.modalService.open(this.formAddBaigiang, NORMAL_MODAL_OPTIONS);
        } else {
            this.firstCreatePlan();
        }
    }

    firstCreatePlan(add_lesson?: number) {
        this.notificationService.isProcessing(false);
        this.progressValue = 0;
        this.displayModal = true;
        this.titleWaiting = 'Đang khởi tạo, vui lòng chờ';
        let lesson = add_lesson ? add_lesson : 9;
        if (this.selectedCourse && this.selectedCourse.params && this.selectedCourse.params.sotinchi && !this.unlimitLesson) {
            lesson = this.selectedCourse.params.sotinchi * 3;
        }

        let first = 1;

        if (this.list_plan.length) {
            const _plan = this.list_plan.filter(m => m.week !== 1000);
            if (_plan.length !== 0) {
                if (lesson + 1 > _plan.length) {
                    first = _plan[_plan.length - 1].week + 1;
                    this.loopAddPlan(first, lesson);
                } else {
                    this.notificationService.toastWarning('Bài học cho môn học này đã đạt số lượng tối đa, không thể thêm');
                    this.displayModal = false;
                }
            } else {
                this.loopAddPlan(first, lesson);
            }
        } else {
            this.loopAddPlan(first, lesson);
        }
    }

    loopAddPlan(key: number, length: number) {
        if (key <= length) {
            this.progressValue = (key / length) * 100;
            const data = {
                ordering: key,
                course_id: this.selectedCourse.id,
                week: key,
                parent_id: 0,
                type: 'PLAN',
            };

            this.coursePlanActivitiesService.addCoursePlanActivities(data).subscribe({
                next: (_id) => {
                    if (_id) {
                        const muctieu = {
                            ordering: 0,
                            course_id: this.selectedCourse.id,
                            week: key,
                            parent_id: _id,
                            title: 'Mục tiêu',
                            type: 'MUCTIEU',
                            edit: 0,
                        };

                        const tailieu = {
                            ordering: 1,
                            course_id: this.selectedCourse.id,
                            week: key,
                            parent_id: _id,
                            title: 'Tài liệu giảng dạy',
                            type: 'ACTIVITY',
                            edit: 0,
                        };

                        const baikiemtra = {
                            ordering: 2,
                            course_id: this.selectedCourse.id,
                            week: key,
                            parent_id: _id,
                            title: this.keyServer == 'hvu' ? 'Bài tập theo tuần' : 'Bài tập chuyên đề',
                            type: 'ACTIVITY_TEST',
                            edit: 0,
                        };

                        forkJoin([
                            this.coursePlanActivitiesService.addCoursePlanActivities(muctieu),
                            this.coursePlanActivitiesService.addCoursePlanActivities(tailieu),
                            this.coursePlanActivitiesService.addCoursePlanActivities(baikiemtra),
                        ]).subscribe({
                            next: () => {
                                this.loopAddPlan(key + 1, length);
                            },
                            error: () => {
                                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                                this.displayModal = false;
                            },
                        });
                    } else {
                        this.loopAddPlan(key + 1, length);
                    }
                },
                error: () => {
                    this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                    this.displayModal = false;
                },
            });
        } else {
            if (this.isLanhDaoKhoa || this.isManager) {
                this.elnKhoaHocService.updateElnKhoaHoc(this.selectedCourse.id, { creator_plan_id: this.auth.user.id }).subscribe({
                    next: () => {
                        this.displayModal = false;
                        this.notificationService.toastSuccess('Khởi tạo thành công');
                        this.loadPlan();
                    },
                    error: () => {
                        this.displayModal = false;
                        this.notificationService.toastError('Khởi tạo thất bại');
                    },
                });
            } else {
                this.displayModal = false;
                this.notificationService.toastSuccess('Khởi tạo thành công');
                this.loadPlan();
            }
        }
    }

    saveAddLesson(d) {
        if (this.numberAddLesson) {
            d(true);
            if (!this.isAddThaoLuan) {
                const number_lesson = this.list_plan ? this.list_plan.filter(m => m.week > 0 && m.week < 100).length + parseInt(this.numberAddLesson.toString()) : parseInt(this.numberAddLesson.toString())
                this.firstCreatePlan(number_lesson);
            } else {
                this.onAddThaoLuan();
            }
        } else {
            this.notificationService.toastWarning("Vui lòng nhập vào số bài giảng lớn hơn 0");
        }
    }

    numberCheck(event, inputPoint_quest) {
        if (event) {
            if (/[0-9]/.test(event.key) || event.key === 'Backspace') {
                if (inputPoint_quest.value.replace(/\d/gi, '').length > 0) {
                    event.preventDefault();
                }
            } else {
                event.preventDefault();
            }
        }
    }

    closeForm(d) {
        d(true);
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.list_plan, event.previousIndex, event.currentIndex);
    }

    saveOrderingLesson() {
        const parent_id = this.list_plan.map(m => m.id);

        const condition_cdr: ConditionOption = {
            condition: [
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: parent_id.toString() },
                { label: 'include_by', value: 'parent_id' }
            ],
            page: null
        }

        this.displayModal = true;
        this.progressValue = 0;
        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_cdr).subscribe({
            next: (_cdr) => {
                const request: Observable<any>[] = [];

                this.list_plan.forEach((f, key) => {

                    request.push(this.coursePlanActivitiesService.updateCoursePlanActivities(f.id, { week: key + 1, ordering: key + 1 }))

                    const cdr = _cdr.data.filter(m => m.parent_id === f.id);

                    cdr.forEach(c => {
                        c['stt'] = c.kyhieu.replace(/\D/g, '');
                    })

                    this.helperService.sort(cdr, 'stt').forEach((c: CoursePlanActivities, ckey) => {
                        const kyhieu = 'CPI '.concat((key + 1).toString(), '.', (ckey + 1).toString());
                        request.push(this.coursePlanActivitiesService.updateCoursePlanActivities(c.id, { week: key + 1, ordering: ckey + 1, kyhieu: kyhieu }));
                        request.push(this.courseQuestionsService.updateCourseQuestionsByCol(c.id, { week: key + 1 }, 'reference_id'));
                    })
                })

                if (request.length) {
                    this.loopAddForm(request, 0).subscribe({
                        next: () => {
                            this.displayModal = false;
                            this.loadPlan();
                            this.notificationService.toastSuccess("Cập nhật thành công");
                        },
                        error: () => {
                            this.notificationService.toastSuccess("Cập nhật thất bại");
                            this.displayModal = false;
                        }
                    })
                }
            },
            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
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

    onOpenAddThaoLuan() {
        this.isAddThaoLuan = true;
        this.formTitle = "Thêm thảo luận";
        this.modalService.open(this.formAddBaigiang, NORMAL_MODAL_OPTIONS);
    }

    async onAddThaoLuan() {
        this.notificationService.isProcessing(true);
        const number_lesson = parseInt(this.numberAddLesson.toString());
        const request: Observable<any>[] = [];
        if (this.list_thaoluan.length) {
            if (this.list_thaoluan[0].children) {
                let i = this.list_thaoluan[0].children.length + 1;
                let j = number_lesson;
                while (j > 0) {
                    const child: CoursePlanActivities = {
                        course_id: this.selectedCourse.id,
                        week: 2000,
                        title: 'Bài thảo luận số '.concat(i.toString()),
                        desc: null,
                        video: null,
                        files: null,
                        ordering: i,
                        status: 1,
                        course_lesson_id: 0,
                        parent_id: this.list_thaoluan[0].id,
                        type: "THAOLUAN",
                        desc_title: null,
                        edit: 1,
                        slides: null,
                        exam_type: this.selectedCourse.params.exam_type
                    }
                    i++;
                    j--;
                    request.push(this.coursePlanActivitiesService.addCoursePlanActivities(child));
                }
            }
        } else {
            const _plan_thaoluan: CoursePlanActivities = {
                course_id: this.selectedCourse.id,
                week: 2000,
                title: 'Thảo luận',
                desc: null,
                video: null,
                files: null,
                ordering: 2000,
                status: 1,
                course_lesson_id: 0,
                parent_id: 0,
                type: 'PLAN',
                desc_title: null,
                edit: 1,
                slides: null,
                exam_type: this.selectedCourse.params.exam_type
            }

            const id_parent = await firstValueFrom(this.coursePlanActivitiesService.addCoursePlanActivities(_plan_thaoluan));

            if (!id_parent) {
                this.notificationService.isProcessing(false);
                return this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }

            for (let i = 1; i <= number_lesson; i++) {
                const child: CoursePlanActivities = {
                    course_id: this.selectedCourse.id,
                    week: 2000,
                    title: 'Bài thảo luận số '.concat(i.toString()),
                    desc: null,
                    video: null,
                    files: null,
                    ordering: i,
                    status: 1,
                    course_lesson_id: 0,
                    parent_id: id_parent,
                    type: "THAOLUAN",
                    desc_title: null,
                    edit: 1,
                    slides: null,
                    exam_type: this.selectedCourse.params.exam_type
                }
                request.push(this.coursePlanActivitiesService.addCoursePlanActivities(child))
            }
        }

        forkJoin(request).subscribe({
            next: async () => {
                this.list_thaoluan = await this.getThaoLuanPromise();
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    saveThaoLuan() {
        if (this.formThaoLuan.valid) {
            const data = { ...this.formThaoLuan.getRawValue() };
            this.notificationService.isProcessing(true);
            this.coursePlanActivitiesService.updateCoursePlanActivities(this.selectedPlanActivity.id, data).subscribe({
                next: async () => {
                    this.list_thaoluan = await this.getThaoLuanPromise();
                    this.notificationService.toastSuccess("Cập nhật thành công");
                    this.notificationService.isProcessing(false);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Cập nhật thất bại");
                }
            })
        }
    }
}
