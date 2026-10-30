import { ClassesService } from '@shared/services/classes.service';
import { CourseCloService } from '@modules/shared/services/course-clo.service';
import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { AfterViewChecked, AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CHUAN_DAU_RA, ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { AppState } from '@core-new/models/app-state';
import { AuthService } from '@core/services/auth.service';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { BehaviorSubject, concatMap, defer, distinctUntilChanged, finalize, firstValueFrom, forkJoin, from, map, mergeMap, Observable, of, tap, toArray } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { NotificationService as CoreNewNotificationService, ProgressAnimationEvent } from '@core-new/service/notification.service';
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
import { ChuandauraComponent } from '../chuandaura/chuandaura.component';
import { MatTabsModule } from '@angular/material/tabs';
import { CourseClo } from '@modules/shared/models/course-clo';
import { ClassPlanActivities } from '@modules/shared/models/class-plan-activities';
import { NhanxetNoidungComponent } from "../nhanxet-noidung/nhanxet-noidung.component";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NORMAL_MODAL_OPTIONS } from '@core/utils/syscat';
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { OpenFileManagerDraDropComponent } from "@modules/shared/components/open-file-manager-dra-drop/open-file-manager-dra-drop.component";
import { OpenFileManagerV2Component } from '@modules/shared/components/open-file-manager-v2/open-file-manager-v2.component';
import { OvicCkeditorDocumentComponent } from '@modules/shared/components/ovic-ckeditor-document/ovic-ckeditor-document.component';
import { OvicDateTimePipe } from '@modules/shared/pipes/ovic-date-time.pipe';
import { ShowLabelData } from '@modules/shared/pipes/show-label-data.pipe';

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
        ChuandauraComponent,
        MatTabsModule,
        NhanxetNoidungComponent,
        DragDropModule,
        MatIconModule,
        MatMenuModule,
        InputTextModule,
        LoadingProgressComponent,
        OpenFileManagerDraDropComponent,
        OpenFileManagerV2Component,
        OvicCkeditorDocumentComponent,
        OvicDateTimePipe,
        ShowLabelData
    ],
    templateUrl: './monhoc-noidung.component.html',
    styleUrls: ['./monhoc-noidung.component.css']
})
export class MonhocNoidungComponent implements OnInit, AfterViewChecked, AfterViewInit {
    private readonly destroyRef = inject(DestroyRef);
    private auth = inject(AuthService);
    private notificationService = inject(NotificationService);
    private coreNewNotification = inject(CoreNewNotificationService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private elngUserProfileService = inject(ElngUserProfileService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private helperService = inject(HelperService);
    private coursePlanCommentService = inject(CoursePlanCommentService);
    private formBuilder = inject(FormBuilder);
    private courseCloService = inject(CourseCloService);
    private modalService = inject(NgbModal);
    private courseQuestionsService = inject(CourseQuestionsService);
    private classesService = inject(ClassesService);

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

    readonly state = signal<AppState>('loading');
    readonly loadingHeading = signal<string>('Đang tải nội dung học phần...');
    readonly errorMessage = signal<string>('');
    readonly busyCount = signal(0);
    readonly busyHeading = signal('Đang xử lý...');
    readonly isBusy = computed(() => this.busyCount() > 0 || this.state() === 'loading');
    private progressControl: BehaviorSubject<ProgressAnimationEvent> | null = null;
    progressDialogOpened = false;
    displayComment: boolean = false;

    beginBusy(heading: string): void {
        this.busyHeading.set(heading);
        this.busyCount.update(count => count + 1);
    }

    endBusy(): void {
        this.busyCount.update(count => Math.max(0, count - 1));
    }

    private beginProgress(heading: string): void {
        if (this.progressDialogOpened) return;
        this.progressDialogOpened = true;
        this.progressControl = new BehaviorSubject<ProgressAnimationEvent>({ heading, percent: 0 });
        this.coreNewNotification.startProgressAnimation(this.progressControl.asObservable(), heading).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    private updateProgress(percent: number): void {
        this.progressControl?.next({ percent: Math.min(100, Math.max(0, percent)) });
    }

    private endProgress(completed = false): void {
        if (!this.progressDialogOpened) return;
        this.progressDialogOpened = false;
        if (completed) this.updateProgress(100);
        this.progressControl?.next({ disabled: true });
        this.progressControl?.complete();
        this.progressControl = null;
    }

    onChildBusy(event: { active: boolean; heading?: string }): void {
        if (event.active) {
            this.beginBusy(event.heading || 'Đang xử lý nội dung...');
        } else {
            this.endBusy();
        }
    }

    formTitle: string;

    titleWaiting: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    numberAddLesson: number;

    dragDropLesson: boolean = false;

    isDttx = APP_CONFIGS.isDttx;

    isAddThaoLuan: boolean = false;

    list_thaoluan: CoursePlanActivities[] = [];
    private loadVersion = 0;

    deletableLessonMap: Record<number, boolean> = {};
    deletableThaoluanMap: Record<number, boolean> = {};

    app_configs = APP_CONFIGS;

    /** Inserted by Angular inject() migration for backwards compatibility */
    constructor(...args: unknown[]);
    constructor() {
        this.isManager = this.auth.userHasRole(ROLES.manager)
            || this.auth.userHasRole(ROLES.admin)
            || this.auth.userHasRole(ROLES.troly_pdt)
            || this.auth.userHasRole(ROLES.chuyenvien_pdt)
            || this.auth.userHasRole(ROLES.daotao_new);

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/monhoc-noidung');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-noidung')
            || this.auth.hasRouter(ROUTERS.daotao);

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

    get hasValidCredits(): boolean {
        const credits = Number(this.selectedCourse?.params?.sotinchi);
        return Number.isFinite(credits) && credits > 0;
    }

    goToCourseInformation(): void {
        this.router.navigate([], {
            relativeTo: this.activatedRoute,
            queryParams: { tab: 'thong-tin' },
            queryParamsHandling: 'merge'
        });
    }

    reloadData(): void {
        if (this.state() === 'loading') return;
        void this.loadContent(this.activatedRoute.snapshot.queryParams?.['code']);
    }

    private setLoading(heading: string): void {
        this.loadingHeading.set(heading);
        this.errorMessage.set('');
        this.state.set('loading');
    }

    private setError(message: string): void {
        this.errorMessage.set(message);
        this.state.set('error');
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.pipe(
            distinctUntilChanged((previous, current) => previous['code'] === current['code']),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(params => {
            void this.loadContent(params?.['code']);
        });
    }

    private async loadContent(course_id: string | number | null): Promise<void> {
        const version = ++this.loadVersion;
        this.list_plan = [];
        this.list_thaoluan = [];
        this.selectPlan = null;
        this.selectedPlanActivity = null;
        this.selectedCourse = null;
        this.canAdded = false;
        this.dragDropLesson = false;
        this.errorMessage.set('');
        if (course_id) {
            this.setLoading('Đang tải nội dung học phần...');

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
                    { label: 'orderby', value: 'ordering' },
                    { label: 'cursor', value: '0' }
                ],
                page: null
            }

            const condition_comment: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString() },
                    { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                ],

                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'cursor', value: '0' }
                ],
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
                    { label: 'cursor', value: '0' }
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
                    { label: 'orderby', value: 'ordering' },
                    { label: 'cursor', value: '0' }
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

            let class_;
            try {
                class_ = await firstValueFrom(this.classesService.getClassesByPageNew(condition_class).pipe(takeUntilDestroyed(this.destroyRef)));
            } catch {
                if (this.destroyRef.destroyed || version !== this.loadVersion) return;
                this.setError('Lỗi kết nối, vui lòng thử lại');
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                return;
            }
            if (this.destroyRef.destroyed || version !== this.loadVersion) return;

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
            ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: async ([_course, _user_profile, _plan, _comment, _comment_child, _course_clo]) => {
                    if (this.destroyRef.destroyed || version !== this.loadVersion) return;
                    if (_course.recordsFiltered || _course.data?.length) {

                        this.selectedCourse = _course.data[0];

                        this.indexByKeyServerInSotinchi = key_server == 'hvu' ? (this.selectedCourse.params.sotinchi == 2 ? 1 : ([3, 4].includes(this.selectedCourse.params.sotinchi) ? 2 : null)) : this.selectedCourse.params.sotinchi;

                        if (this.routerLanhdaokhoa) {
                            if (_user_profile.recordsFiltered === 0 || this.selectedCourse.category_ids !== _user_profile.data[0].donvi_chuyenmon_id) {
                                this.setError("Không tìm thấy môn học");
                                this.notificationService.toastError("Không tìm thấy môn học");
                                this.router.navigate(['/admin/content-none']);
                                return;
                            }
                        }

                        if (this.routerLanhdaobomon) {
                            if (_user_profile.recordsFiltered === 0 || this.selectedCourse.nganh_bomon_id !== _user_profile.data[0].bomon_id) {
                                this.setError("Không tìm thấy môn học");
                                this.notificationService.toastError("Không tìm thấy môn học");
                                this.router.navigate(['/admin/content-none']);
                                return;
                            }
                        }

                        const hasContentCreationPermission = this.isManager
                            || this.isLanhDaoKhoa
                            || this.routerDaotao
                            || this.routerLanhdaokhoa
                            || this.routerLanhdaobomon
                            || this.userId === this.selectedCourse.creator_plan_id;
                        this.canAdded = hasContentCreationPermission;

                        this.list_plan = this.setNewData(_plan.data.filter(m => m.week !== 0), _comment.data, _comment_child.data);

                        if (this.list_plan.length)
                            this.onChangePlan(this.list_plan[0], 'muctieu');

                        this.list_clo = _course_clo.data;

                        this.list_thaoluan = await this.getThaoLuanPromise();
                        if (this.destroyRef.destroyed || version !== this.loadVersion) return;
                        this.updateDeletableState();

                        this.state.set('success');

                    } else {
                        this.setError("Không tìm thấy môn học");
                        this.notificationService.toastError("Không tìm thấy môn học");
                        this.router.navigate(['/admin/content-none']);
                    }
                },
                error: () => {
                    if (this.destroyRef.destroyed || version !== this.loadVersion) return;
                    this.setError("Lỗi kết nối, vui lòng thử lại");
                    this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                }
            })
        } else {
            this.setError("ID học phần không hợp lệ.");
            this.router.navigate(['/admin/content-none']);
        }
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
        this.beginBusy('Đang cập nhật nội dung học phần...');
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
                { label: 'orderby', value: 'ordering' },
                { label: 'cursor', value: '0' }
            ],
            page: null
        }

        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.toString() },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'cursor', value: '0' }
            ],
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
                { label: 'cursor', value: '0' }
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
                this.updateDeletableState();

                this.endBusy();
            },
            error: () => {
                this.endBusy();
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
                    { label: 'orderby', value: 'ordering' },
                    { label: 'cursor', value: '0' }
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
                this.beginBusy('Đang xóa thảo luận...');
                        this.coursePlanActivitiesService.deleteCoursePlanActivities(plan.id).subscribe({
                    next: async () => {
                        this.list_thaoluan = await this.getThaoLuanPromise();
                        this.updateDeletableState();
                        this.endBusy();
                                    },
                    error: () => {
                        this.endBusy();
                                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            }
        })
    }

    updateDeletableState(): void {
        this.deletableLessonMap = {};
        if (this.unlimitLesson && Array.isArray(this.list_plan)) {
            const data = this.list_plan.filter(m => m.week < 100);
            const lastIndex = data.length - 1;
            if (lastIndex >= 0 && this.list_plan[lastIndex] && this.list_plan[lastIndex].week !== 0) {
                this.deletableLessonMap[lastIndex] = true;
            }
        }

        this.deletableThaoluanMap = {};
        const firstThaoluan = this.list_thaoluan?.[0];
        if (firstThaoluan && Array.isArray(firstThaoluan.children) && firstThaoluan.children.length > 0) {
            this.deletableThaoluanMap[firstThaoluan.children.length - 1] = true;
        }
    }


    deletePlan(plan: CoursePlanActivities) {
        this.notificationService.confirmDelete().then((a) => {
            if (a) {
                this.beginBusy('Đang xóa bài học...');
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
                        { label: 'select', value: 'id' },
                        { label: 'cursor', value: '0' }
                    ],
                    page: null
                }

                this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).subscribe({
                    next: (a) => {
                        if (a.recordsFiltered) {
                            this.endBusy();
                                                this.notificationService.toastInfo("Bài này đã có câu hỏi, không thể xóa");
                        } else {
                            forkJoin([
                                this.coursePlanActivitiesService.deleteCoursePlanActivities(plan.id),
                                this.coursePlanActivitiesService.deleteCoursePlanActivitiesByCol(plan.id.toString(), 'parent_id'),
                            ]).subscribe({
                                next: () => {
                                    this.notificationService.toastSuccess('Xóa thành công');
                                    this.endBusy();
                                    this.loadPlan();
                                },
                                error: () => {
                                    this.endBusy();
                                                                this.notificationService.toastSuccess('Xóa thất bài');
                                },
                            });

                        }
                    },
                    error: () => {
                        this.endBusy();
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
        this.formMuctieu.reset();
        this.formThaoLuan.reset();
    }

    saveTailieu() {
        const data = { ...this.formTailieu.getRawValue() };
        if (((data['files'] && data['files'].length > 0) || (data['slides'] && data['slides'].length > 0)) && this.planTailieu) {
            this.beginBusy('Đang lưu tài liệu giảng dạy...');
                data['video'] = data['video'] && data['video'].length ? data['video'][0] : null;
            if (!APP_CONFIGS.isDttx || this.keyServer === 'hvu') {
                delete data['videos'];
            }
            this.coursePlanActivitiesService.updateCoursePlanActivities(this.planTailieu.id, data).subscribe({
                next: () => {
                    this.endBusy();
                                this.loadPlan();
                    this.notificationService.toastSuccess("Lưu thành công");
                },
                error: () => {
                    this.endBusy();
                                this.notificationService.toastError("Lưu thất bại");
                }
            })
        } else {
            this.notificationService.toastWarning("Vui lòng nhập tài liệu hoặc slide");
        }
    }

    saveMuctieu() {
        if (this.formMuctieu.valid) {
            this.beginBusy('Đang lưu mục tiêu bài học...');
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
                    this.endBusy();
                                this.loadPlan();
                    this.notificationService.toastSuccess("Lưu thành công");
                },
                error: () => {
                    this.endBusy();
                                this.notificationService.toastError("Lưu thất bại");
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
        if (!this.unlimitLesson && !this.hasValidCredits) {
            this.notificationService.toastWarning('Vui lòng nhập số tín chỉ trước khi khởi tạo nội dung giảng dạy');
            this.goToCourseInformation();
            return;
        }

        this.isAddThaoLuan = false;
        if (this.unlimitLesson) {
            this.formTitle = add_lesson ? "Tạo bài giảng" : "Thêm bài giảng";
            this.modalService.open(this.formAddBaigiang, NORMAL_MODAL_OPTIONS);
        } else {
            this.firstCreatePlan();
        }
    }

    firstCreatePlan(add_lesson?: number) {
        if (!this.unlimitLesson && !this.hasValidCredits) {
            this.notificationService.toastWarning('Vui lòng nhập số tín chỉ trước khi khởi tạo nội dung giảng dạy');
            this.goToCourseInformation();
            return;
        }

        this.beginProgress('Đang khởi tạo nội dung giảng dạy...');
        this.progressValue = 0;
        let lesson = add_lesson ? add_lesson : 9;
        if (!this.unlimitLesson) {
            lesson = Number(this.selectedCourse.params.sotinchi) * 3;
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
                    this.endProgress();
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
            this.updateProgress(this.progressValue);
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
                                this.endProgress();
                            },
                        });
                    } else {
                        this.loopAddPlan(key + 1, length);
                    }
                },
                error: () => {
                    this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                    this.endProgress();
                },
            });
        } else {
            this.updateProgress(100);
            this.endProgress();
            if (this.isLanhDaoKhoa || this.isManager) {
                this.elnKhoaHocService.updateElnKhoaHoc(this.selectedCourse.id, { creator_plan_id: this.auth.user.id }).subscribe({
                    next: () => {
                        this.notificationService.toastSuccess('Khởi tạo thành công');
                        this.loadPlan();
                    },
                    error: () => {
                        this.notificationService.toastError('Khởi tạo thất bại');
                    },
                });
            } else {
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
        this.updateDeletableState();
    }

    saveOrderingLesson() {
        const parent_id = this.list_plan.map(m => m.id);

        const condition_cdr: ConditionOption = {
            condition: [
                { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'cursor', value: '0' },
                { label: 'include', value: parent_id.toString() },
                { label: 'include_by', value: 'parent_id' }
            ],
            page: null
        }

        this.beginBusy('Đang cập nhật thứ tự nội dung...');
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
                            this.endBusy();
                            this.loadPlan();
                            this.notificationService.toastSuccess("Cập nhật thành công");
                        },
                        error: () => {
                            this.endBusy();
                            this.notificationService.toastError("Cập nhật thất bại");
                        }
                    })
                } else {
                    this.endBusy();
                }
            },
            error: () => {
                this.endBusy();
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
        this.beginBusy('Đang thêm bài thảo luận...');
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

            let id_parent: number;
            try {
                id_parent = await firstValueFrom(this.coursePlanActivitiesService.addCoursePlanActivities(_plan_thaoluan));
            } catch {
                this.endBusy();
                        return this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }

            if (!id_parent) {
                this.endBusy();
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
                this.updateDeletableState();
                this.endBusy();
                    },
            error: () => {
                this.endBusy();
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    saveThaoLuan() {
        if (this.formThaoLuan.valid) {
            const data = { ...this.formThaoLuan.getRawValue() };
            this.beginBusy('Đang lưu bài thảo luận...');
                this.coursePlanActivitiesService.updateCoursePlanActivities(this.selectedPlanActivity.id, data).subscribe({
                next: async () => {
                    this.list_thaoluan = await this.getThaoLuanPromise();
                    this.updateDeletableState();
                    this.endBusy();
                    this.notificationService.toastSuccess("Cập nhật thành công");
                            },
                error: () => {
                    this.endBusy();
                                this.notificationService.toastError("Cập nhật thất bại");
                }
            })
        }
    }
}
