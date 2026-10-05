import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ROLES } from '@modules/shared/utils/syscat';

import { CoursePlanActivityTuluanService } from '@modules/shared/services/course-plan-activity-tuluan.service';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { CoursePlanTuluanCommentService } from '@modules/shared/services/course-plan-tuluan-comment.service';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { CoursePlanActivityTuluanTieuchicham } from '@modules/shared/models/course-plan-activity-tuluan-tieuchicham';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { HoidongThamdinhMonhocThanhvienService } from '@modules/shared/services/hoidong-thamdinh-monhoc-thanhvien.service';

import { SharedModule } from '@modules/shared/shared.module';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { OvicDateTimePipe } from '@modules/shared/pipes/ovic-date-time.pipe';
import { ViewThuongxuyenTuluanComponent } from '@modules/shared/components/view-thuongxuyen-tuluan/view-thuongxuyen-tuluan.component';

import { catchError, forkJoin, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';

// ── BroadcastChannel sync ─────────────────────────────────
const SYNC_CHANNEL_NAME = 'duyet-cauhoi-thuchanh-kthp-detail-sync';

// ── Constants ─────────────────────────────────────────────
const CAP_KHOA = 'cap_khoa';
const DEFAULT_APPROVE_COMMENT = 'Đồng ý duyệt';

// ── Interfaces ────────────────────────────────────────────
interface ReplyComment extends CoursePlanTuluanComment {
    display_name?: string;
    my_reply_comment?: boolean;
}

interface CouncilComment extends CoursePlanTuluanComment {
    display_name?: string;
    reply_open?: boolean;
    textarea_comment?: string;
    count_reply?: number;
    reply_comments?: ReplyComment[];
    children?: CoursePlanTuluanComment[];
}

interface PendingUndoAction {
    tuluanId: number;
    role: 'uy_vien' | 'chutich';
    action: 'approve' | 'request_change';
    commentId?: number;
    previousStatus?: number;
    previousApprovedBy?: number;
    previousApprovedAt?: string;
    expiresAt: number;
    isLastQuestion?: boolean;
}

@Component({
    selector: 'app-duyet-cauhoi-thuchanh-kthp-detail',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        LoadMediaOnTextDirective,
        KatexImgDirective,
        OvicDateTimePipe,
        ViewThuongxuyenTuluanComponent,
    ],
    templateUrl: './duyet-cauhoi-thuchanh-kthp-detail.component.html',
    styleUrls: ['./duyet-cauhoi-thuchanh-kthp-detail.component.css']
})
export class DuyetCauhoiThuchanhKthpDetailComponent implements OnInit, OnDestroy {
    private location = inject(Location);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private auth = inject(AuthService);
    private helperService = inject(HelperService);
    private notificationService = inject(NotificationService);
    private ovicDateTimeService = inject(OvicDateTimeService);
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);
    private coursePlanTuluanCommentService = inject(CoursePlanTuluanCommentService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private hoidongThamdinhMonhocThanhvienService = inject(HoidongThamdinhMonhocThanhvienService);
    private coursePlanActivityTuluanTieuchichamService = inject(CoursePlanActivityTuluanTieuchichamService);
    private titleService = inject(Title);

    // Route params
    tuluanId: string | null;
    courseId: string | null;

    // Data
    selectedTuluan: CoursePlanActivityTuluan | null = null;
    courseSelected: ElnKhoaHoc | null = null;
    list_de_tuluan: CoursePlanActivityTuluan[] = [];
    hoidong: HoidongThamdinhMonhocThanhvien[] = [];
    list_plan_tieu_chi_cham: CoursePlanActivityTuluanTieuchicham[] = [];
    list_tieuchi_cham_cau1: CoursePlanActivityTuluanTieuchicham[] = [];
    list_tieuchi_cham_cau2: CoursePlanActivityTuluanTieuchicham[] = [];

    // Roles & identity
    userId: number;
    kd_hoidong: boolean = false;
    kd_uyvien: boolean = false;
    isManager: boolean = false;
    isLanhDaoKhoa: boolean = false;
    isLanhDaoBomon: boolean = false;
    rejectRole: boolean = false;

    // UI
    selectedComment: CoursePlanTuluanComment;
    loading = false;
    pendingUndoAction: PendingUndoAction | null = null;
    undoRemainingSeconds = 0;
    showRequestChangeForm = false;

    // Sync
    private broadcastChannel: BroadcastChannel | null = null;
    private destroy$ = new Subject<void>();
    private undoTimer: any = null;

    // Track các đề mà ủy viên hiện tại đã từng nhận xét
    private commentedTuluanIds = new Set<number>();

    constructor() {
        this.userId = this.auth?.user?.id || 0;
        this.tuluanId = this.route.snapshot.paramMap.get('tuluanId');
        this.courseId = this.route.snapshot.queryParamMap.get('courseId');
    }

    ngOnInit(): void {
        this.initRoles();
        this.initBroadcastChannel();
        this.route.params.pipe(
            switchMap(params => {
                const newId = params['tuluanId'];
                if (newId && newId !== this.tuluanId) {
                    this.tuluanId = newId;
                }
                return this.loadFullContext();
            }),
            takeUntil(this.destroy$)
        ).subscribe();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.clearUndoTimer();
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
        }
    }

    // ── Roles ─────────────────────────────────────────────
    private initRoles() {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon);
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
        this.rejectRole = this.isManager;
        this.kd_hoidong = false;
        this.kd_uyvien = false;
    }

    private loadCouncilRoles(): Observable<HoidongThamdinhMonhocThanhvien[]> {
        if (!this.courseId) {
            this.hoidong = [];
            this.kd_hoidong = false;
            this.kd_uyvien = false;
            return of([]);
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString() },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' },
            ],
            page: null,
        };

        return this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(condition).pipe(
            map(result => {
                this.hoidong = result.data || [];
                const member = this.hoidong.find(item => item.user_id === this.userId);
                this.kd_hoidong = member?.chutich === 1;
                this.kd_uyvien = !!member && member.chutich !== 1;
                return this.hoidong;
            }),
            catchError(() => {
                this.hoidong = [];
                this.kd_hoidong = false;
                this.kd_uyvien = false;
                return of([]);
            })
        );
    }

    /**
     * Load id của các đề mà ủy viên hiện tại đã từng nhận xét (cấp gốc, cap_khoa).
     */
    private loadMyCommentedTuluanIds(): Observable<void> {
        this.commentedTuluanIds.clear();
        if (!this.kd_uyvien || !this.courseId || !this.userId) {
            return of(void 0);
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString() },
                { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
                { conditionName: 'cap_hoidong', condition: OvicQueryCondition.equal, value: CAP_KHOA, orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, course_plan_activity_tuluan_id' },
            ],
            page: null,
        };

        return this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition).pipe(
            map(result => {
                (result.data || []).forEach((c: any) => {
                    if (c?.course_plan_activity_tuluan_id) {
                        this.commentedTuluanIds.add(Number(c.course_plan_activity_tuluan_id));
                    }
                });
                return void 0;
            }),
            catchError(() => of(void 0))
        );
    }

    // ── BroadcastChannel sync ─────────────────────────────
    private initBroadcastChannel() {
        try {
            this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
            this.broadcastChannel.onmessage = (event: MessageEvent) => {
                const payload = event.data;
                if (payload?.type === 'THUCHANH_KTHP_REVIEW_UPDATED' &&
                    payload.tuluanId?.toString() === this.tuluanId &&
                    payload.updatedAt) {
                    this.loadCommentTuluan();
                }
            };
        } catch {
            // Fallback: localStorage
        }
    }

    private emitSyncEvent(tuluanId = this.tuluanId) {
        const payload = {
            type: 'THUCHANH_KTHP_REVIEW_UPDATED',
            tuluanId: tuluanId?.toString(),
            courseId: this.courseId,
            updatedAt: new Date().toISOString()
        };
        try {
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(payload);
            }
            localStorage.setItem('duyet-cauhoi-thuchanh-kthp-detail-updated', JSON.stringify(payload));
        } catch {
            // silent
        }
    }

    // ── Load data ─────────────────────────────────────────
    private loadFullContext(): Observable<null> {
        if (!this.tuluanId || !this.courseId) {
            return of(null);
        }

        this.loading = true;
        this.selectedTuluan = null;
        this.list_de_tuluan = [];
        this.showRequestChangeForm = false;

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.tuluanId }
            ],
            set: [{ label: 'limit', value: '1' }],
            page: '1'
        };

        return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition).pipe(
            switchMap(result => {
                if (!result.data || result.data.length === 0) {
                    this.loading = false;
                    this.notificationService.toastError('Không tìm thấy đề thực hành');
                    return of(null);
                }

                this.selectedTuluan = result.data[0];

                return forkJoin([
                    this.loadCourseSelected$(),
                    this.loadTuluanList$(),
                    this.loadTieuChiCham$(),
                    this.loadCouncilRoles().pipe(
                        switchMap(() => this.loadMyCommentedTuluanIds())
                    ),
                ]).pipe(
                    switchMap(() => {
                        return this.loadCommentTuluan$();
                    }),
                    map(() => null)
                );
            }),
            catchError(() => {
                this.loading = false;
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                return of(null);
            })
        );
    }

    private loadCourseSelected$(): Observable<ElnKhoaHoc | null> {
        if (!this.courseId) return of(null);

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.courseId }
            ],
            set: [{ label: 'limit', value: '1' }],
            page: '1'
        };

        return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition).pipe(
            map(result => {
                this.courseSelected = result.data?.[0] || null;
                this.applyTitleAndSecondaryFeature();
                return this.courseSelected;
            }),
            catchError(() => {
                this.courseSelected = null;
                return of(null);
            })
        );
    }

    /**
     * Set page title = "KTHP - " + hinhthucthi + " - " + course_name
     * Set secondary_feature = "Duyệt KTHP - " + hinhthucthi
     */
    private applyTitleAndSecondaryFeature(): void {
        const courseTitle = this.courseSelected?.title || '';
        const hinhthucthi = this.resolveHinhThucThi();

        this.auth.setFeatureSecondary('Duyệt KTHP - ' + hinhthucthi);

        if (courseTitle) {
            this.titleService.setTitle('KTHP - ' + hinhthucthi + ' - ' + courseTitle);
        } else {
            this.titleService.setTitle('KTHP - ' + hinhthucthi);
        }
    }

    /**
     * Xác định hinhthucthi từ course.params (exam_type hoặc exam_format)
     */
    private resolveHinhThucThi(): string {
        if (!this.courseSelected || !this.courseSelected['params']) {
            return 'Thực hành';
        }
        const params = this.courseSelected['params'];

        // Ưu tiên exam_type (id-based)
        if (params.exam_type) {
            const found = EXAMFORMAT.find(m => m.id === params.exam_type);
            if (found) return found.label;
        }

        // Fallback exam_format (key-based)
        if (params.exam_format) {
            const found = EXAMFORMAT.find(m => m.key === params.exam_format);
            if (found) return found.label;
        }

        return 'Thực hành';
    }

    private loadTuluanList$(): Observable<void> {
        if (!this.courseId) {
            this.list_de_tuluan = [];
            return of(void 0);
        }

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString(), orWhere: 'and' },
                { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
            ],
            page: null
        };

        return this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition).pipe(
            map(result => {
                this.list_de_tuluan = result.data || [];
                return void 0;
            }),
            catchError(() => {
                this.list_de_tuluan = [];
                return of(void 0);
            })
        );
    }

    private loadTieuChiCham$(): Observable<void> {
        if (!this.courseId || !this.selectedTuluan) {
            this.list_plan_tieu_chi_cham = [];
            this.list_tieuchi_cham_cau1 = [];
            this.list_tieuchi_cham_cau2 = [];
            return of(void 0);
        }

        const includeValue = this.selectedTuluan.tuluan_root_ids
            ? this.selectedTuluan.tuluan_root_ids.split('|').filter(m => m).toString()
            : this.selectedTuluan.id.toString();

        const condition_tieuchi: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.course_id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: includeValue },
                { label: 'include_by', value: 'course_plan_activity_tuluan_id' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: null,
        };

        return this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchi).pipe(
            map(result => {
                const data = result.data || [];
                if (this.selectedTuluan.tuluan_root_ids) {
                    const root_ids = this.selectedTuluan.tuluan_root_ids.split('|').filter(m => m);
                    this.list_tieuchi_cham_cau1 = data.filter(m => m.course_plan_activity_tuluan_id.toString() === root_ids[0]);
                    this.list_tieuchi_cham_cau2 = data.filter(m => m.course_plan_activity_tuluan_id.toString() === root_ids[1]);
                    this.list_plan_tieu_chi_cham = [];
                } else {
                    this.list_plan_tieu_chi_cham = data;
                    this.list_tieuchi_cham_cau1 = [];
                    this.list_tieuchi_cham_cau2 = [];
                }
                return void 0;
            }),
            catchError(() => {
                this.list_plan_tieu_chi_cham = [];
                this.list_tieuchi_cham_cau1 = [];
                this.list_tieuchi_cham_cau2 = [];
                return of(void 0);
            })
        );
    }

    // ── Load comments ─────────────────────────────────────
    private loadCommentTuluan$(): Observable<void> {
        if (!this.selectedTuluan || !this.courseId) {
            this.loading = false;
            return of(void 0);
        }

        const capturedTuluanId = this.selectedTuluan.id;

        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null
        };

        const condition_reply_comment: ConditionOption = {
            condition: [
                { conditionName: 'course_plan_activity_tuluan_id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.courseId.toString(), orWhere: 'and' },
                { conditionName: 'parent_id', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, parent_id' },
            ],
            page: null,
        };

        return forkJoin([
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment),
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_reply_comment),
        ]).pipe(
            map(([_comment, _comment_child]) => {
                // Guard stale
                if (!this.selectedTuluan || this.selectedTuluan.id !== capturedTuluanId) return;

                _comment.data.forEach((f: any) => {
                    f['display_name'] = f.user ? f.user.display_name : 'Không xác định';
                    f['reply_open'] = false;
                    f['textarea_comment'] = '';
                });

                const object_comment: any = {};
                _comment.data.forEach((c: any) => {
                    const count_reply = _comment_child.data.filter((m: any) => m.parent_id === c.id).length;
                    c['count_reply'] = count_reply;

                    const capHoiDong = c.cap_hoidong || CAP_KHOA;
                    if (!object_comment[c.user_id]) {
                        object_comment[c.user_id] = { [CAP_KHOA]: [], cap_truong: [], display_name: c['display_name'] };
                    }
                    if (!object_comment[c.user_id][capHoiDong]) {
                        object_comment[c.user_id][capHoiDong] = [];
                    }
                    object_comment[c.user_id][capHoiDong].push(c);
                });

                this.selectedTuluan['comments'] = [];
                let j = 0;
                Object.keys(object_comment).forEach((o, key) => {
                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                    if (this.kd_hoidong || this.isLanhDaoKhoa || this.isManager || this.isLanhDaoBomon) {
                        if (o.toString() === this.userId.toString()) {
                            display_name = 'Nhận xét của bạn';
                        } else {
                            display_name = object_comment[o] ? object_comment[o]['display_name'] : 'Không xác định';
                        }
                    } else if (o.toString() === this.userId.toString()) {
                        display_name = 'Nhận xét của bạn';
                    }

                    if (object_comment[o][CAP_KHOA] && object_comment[o][CAP_KHOA].length) {
                        this.selectedTuluan['comments'].push({
                            user_id: Number(o),
                            display_name: display_name,
                            cap_hoidong: CAP_KHOA,
                            children: object_comment[o][CAP_KHOA]
                        });
                    }

                    if (object_comment[o]['cap_truong'] && object_comment[o]['cap_truong'].length) {
                        j = j + 1;
                        this.selectedTuluan['comments'].push({
                            user_id: Number(o),
                            display_name: this.isManager ? display_name.concat(' (Cấp trường)') : 'Ủy viên trường '.concat((j).toString()),
                            cap_hoidong: 'cap_truong',
                            children: object_comment[o]['cap_truong']
                        });
                    }
                });

                this.selectedTuluan['textarea_comment'] = '';
                this.loading = false;
            }),
            catchError(() => {
                this.loading = false;
                this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                return of(void 0);
            })
        );
    }

    /** Public wrapper — reload comment (BroadcastChannel, reloadCurrentTuluan) */
    loadCommentTuluan() {
        this.loadCommentTuluan$()
            .pipe(takeUntil(this.destroy$))
            .subscribe();
    }

    // ── Helpers ───────────────────────────────────────────
    private extractCommentId(res: any): number | undefined {
        if (res === null || res === undefined) return undefined;
        if (typeof res === 'number' && !isNaN(res)) return res;
        if (typeof res === 'string') {
            const n = Number(res);
            return isNaN(n) ? undefined : n;
        }
        if (typeof res === 'object') {
            const candidate = res.id ?? res.insert_id ?? res.inserted_id ?? res.last_id ?? res.lastInsertId;
            if (candidate !== undefined && candidate !== null) {
                const n = Number(candidate);
                return isNaN(n) ? undefined : n;
            }
            if (res.data) return this.extractCommentId(res.data);
        }
        return undefined;
    }

    // ── Reply ─────────────────────────────────────────────
    openReply(comment: CoursePlanTuluanComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(comment, index_comment);
        }
    }

    loadReplyComment(comment: CoursePlanTuluanComment, index_comment: number) {
        const condition_comment: ConditionOption = {
            condition: [
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: comment.id.toString() },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null,
        };

        this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (_comment) => {
                    _comment.data.forEach((f: any) => {
                        if (f.cap_hoidong === 'cap_truong') {
                            if (this.isManager) {
                                f['display_name'] = f.user ? f.user.display_name.concat(' (Cấp trường)') : 'Uỷ viên (Cấp trường)';
                            } else {
                                f['display_name'] = 'Ủy viên cấp trường';
                            }
                        } else if (
                            f.user_id === this.courseSelected?.['creator_plan_id'] &&
                            this.userId !== f.user_id
                        ) {
                            f['display_name'] = this.courseSelected?.['display_name'] || 'Giảng viên';
                        } else if (f.user_id === this.userId) {
                            f['display_name'] = 'Phản hồi của bạn';
                            f['my_reply_comment'] = true;
                        } else {
                            if (this.kd_hoidong || this.isManager || this.isLanhDaoKhoa || this.isLanhDaoBomon) {
                                const idx = this.hoidong.findIndex(m => m.user_id === f.user_id);
                                f['display_name'] = idx !== -1 ? this.hoidong[idx]['display_name'] : 'Ủy viên khác';
                            } else {
                                f['display_name'] = 'Ủy viên '.concat((index_comment + 1).toString());
                            }
                        }
                    });
                    comment['reply_comments'] = _comment.data;
                    comment['count_reply'] = _comment.data.length;
                },
                error: () => {
                    this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                },
            });
    }

    // ── Save comment (ủy viên) ────────────────────────────
    saveComment(status: number, activity: CoursePlanActivityTuluan) {
        if (status === -1 && !this.showRequestChangeForm) {
            this.showRequestChangeForm = true;
            setTimeout(() => {
                const textarea = document.querySelector('.request-change-textarea') as HTMLTextAreaElement | null;
                textarea?.focus();
            });
            return;
        }

        const noidung = status === 1
            ? DEFAULT_APPROVE_COMMENT
            : (activity['textarea_comment'] ? activity['textarea_comment'].trim() : '');

        if (!noidung) {
            this.notificationService.toastWarning('Vui lòng nhập nội dung nhận xét');
            return;
        }
        this.doSaveComment(noidung, status, activity);
    }

    private doSaveComment(noidung: string, status: number, activity: CoursePlanActivityTuluan) {
        const data: CoursePlanTuluanComment = {
            course_plan_activity_id: 0,
            comment: noidung,
            status: status,
            user_id: this.userId,
            course_id: Number(this.courseId),
            parent_id: 0,
            course_plan_activity_tuluan_id: activity.id,
            cap_hoidong: CAP_KHOA
        };

        this.notificationService.isProcessing(true);
        this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (createdComment: any) => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess('Cập nhật thành công');
                    this.commentedTuluanIds.add(activity.id);
                    this.showRequestChangeForm = false;
                    this.registerUndoAction({
                        tuluanId: activity.id,
                        role: 'uy_vien',
                        action: status === 1 ? 'approve' : 'request_change',
                        commentId: this.extractCommentId(createdComment),
                        expiresAt: Date.now() + 10000,
                        isLastQuestion: this.isLastPendingTuluan()
                    });
                    this.emitSyncEvent(activity.id.toString());
                    this.navigateNextTuluan();
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError('Cập nhật thất bại, lỗi kết nối');
                },
            });
    }

    // ── Save reply ────────────────────────────────────────
    saveCommentReply(comment: CoursePlanTuluanComment, activity: CoursePlanActivityTuluan, index_comment: number) {
        const comment_content = comment['textarea_comment']
            ? comment['textarea_comment'].trim()
            : '';

        if (!comment_content) {
            this.notificationService.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
            return;
        }

        const data_comment: CoursePlanTuluanComment = {
            course_plan_activity_id: 0,
            comment: comment_content,
            status: 0,
            user_id: this.userId,
            course_id: Number(this.courseId),
            parent_id: comment.id,
            course_plan_activity_tuluan_id: activity.id
        };

        this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Đã gửi phản hồi thành công');
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(this.selectedComment, index_comment);
                },
                error: () => {
                    this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                },
            });
    }

    // ── Duyệt (chủ tịch) ─────────────────────────────────
    duyetNoidung(activity: CoursePlanActivityTuluan, status: number) {
        const previousStatus = activity.status;
        const previousApprovedBy = activity['approved_by'];
        const previousApprovedAt = activity['approved_at'];

        this.notificationService.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(
            switchMap((_date) => {
                const updateTuluan$ = this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(activity.id, {
                    status,
                    approved_by: this.userId,
                    approved_at: this.helperService.stringToDateSql(_date.toString()),
                });

                if (status === 1) {
                    const data_comment: CoursePlanTuluanComment = {
                        course_plan_activity_id: 0,
                        comment: DEFAULT_APPROVE_COMMENT,
                        status,
                        user_id: this.userId,
                        course_id: Number(this.courseId),
                        parent_id: 0,
                        course_plan_activity_tuluan_id: activity.id,
                        cap_hoidong: CAP_KHOA
                    };
                    return forkJoin([
                        updateTuluan$,
                        this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment)
                    ]).pipe(
                        map(([_updated, createdComment]) => createdComment)
                    );
                }
                return updateTuluan$.pipe(map(() => null));
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (createdComment: any) => {
                activity.status = status;
                activity['approved_at'] = new Date().toString();
                activity['approved_by'] = this.userId;
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess('Cập nhật thành công');
                this.registerUndoAction({
                    tuluanId: activity.id,
                    role: 'chutich',
                    action: status === 1 ? 'approve' : 'request_change',
                    commentId: this.extractCommentId(createdComment),
                    previousStatus,
                    previousApprovedBy,
                    previousApprovedAt,
                    expiresAt: Date.now() + 10000,
                    isLastQuestion: this.isLastPendingTuluan()
                });
                this.emitSyncEvent(activity.id.toString());
                this.navigateNextTuluan();
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Cập nhật thất bại, Lỗi kết nối');
            }
        });
    }

    // ── Undo ───────────────────────────────────────────────
    private registerUndoAction(action: PendingUndoAction) {
        this.clearUndoTimer();
        this.pendingUndoAction = action;
        this.undoRemainingSeconds = 10;
        this.undoTimer = setInterval(() => {
            if (!this.pendingUndoAction) {
                this.clearUndoTimer();
                return;
            }
            this.undoRemainingSeconds = Math.max(0, Math.ceil((this.pendingUndoAction.expiresAt - Date.now()) / 1000));
            if (this.undoRemainingSeconds <= 0) {
                this.pendingUndoAction = null;
                this.clearUndoTimer();
            }
        }, 1000);
    }

    private clearUndoTimer() {
        if (this.undoTimer) {
            clearInterval(this.undoTimer);
            this.undoTimer = null;
        }
        this.undoRemainingSeconds = 0;
    }

    restorePreviousQuestion() {
        const undoAction = this.pendingUndoAction;
        if (!undoAction) return;
        if (Date.now() > undoAction.expiresAt) {
            this.pendingUndoAction = null;
            this.clearUndoTimer();
            this.notificationService.toastWarning('Đã hết thời gian khôi phục');
            return;
        }

        const actions: Observable<any>[] = [];
        if (undoAction.commentId) {
            actions.push(this.coursePlanTuluanCommentService.deleteCoursePlanTuluanComment(undoAction.commentId));
        }
        if (undoAction.role === 'chutich') {
            actions.push(this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(undoAction.tuluanId, {
                status: undoAction.previousStatus ?? 0,
                approved_by: undoAction.previousApprovedBy ?? null,
                approved_at: undoAction.previousApprovedAt ?? null,
            }));
        }

        this.notificationService.isProcessing(true);
        (actions.length ? forkJoin(actions) : of(null))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess('Đã khôi phục đề trước');
                    if (undoAction.role === 'uy_vien') {
                        this.commentedTuluanIds.delete(undoAction.tuluanId);
                    }
                    this.pendingUndoAction = null;
                    this.clearUndoTimer();
                    this.emitSyncEvent(undoAction.tuluanId.toString());
                    this.navigateToTuluan(undoAction.tuluanId);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError('Khôi phục thất bại, vui lòng thử lại');
                }
            });
    }

    // ── Next / Back ───────────────────────────────────────
    private navigateToTuluan(tuluanId: number) {
        this.tuluanId = tuluanId.toString();
        this.router.navigate(
            ['/admin/hoi-dong/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail', this.tuluanId],
            {
                queryParams: {
                    courseId: this.courseId,
                },
                queryParamsHandling: 'merge',
            },
        );
    }

    /** Auto-advance to next pending tuluan */
    navigateNextTuluan() {
        if (!this.list_de_tuluan.length || !this.selectedTuluan) return;

        const nextPending = this.findNextPendingTuluan();
        if (nextPending) {
            this.navigateToTuluan(nextPending.id);
        } else {
            const msg = this.kd_uyvien
                ? 'Đã xử lý hết đề chờ duyệt mà bạn chưa nhận xét trong phạm vi hiện tại'
                : 'Đã xử lý hết đề chờ duyệt trong phạm vi hiện tại';
            this.notificationService.toastInfo(msg);
            this.reloadCurrentTuluan();
        }
    }

    private findNextPendingTuluan(): CoursePlanActivityTuluan | undefined {
        if (!this.list_de_tuluan.length || !this.selectedTuluan) return undefined;
        const currentIdx = this.list_de_tuluan.findIndex(q => q.id === this.selectedTuluan?.id);
        const startIdx = currentIdx === -1 ? 0 : currentIdx + 1;
        const currentId = this.selectedTuluan?.id;
        return this.list_de_tuluan
            .slice(startIdx)
            .find(q => q.status === 0
                && q.id !== currentId
                && (!this.kd_uyvien || !this.commentedTuluanIds.has(q.id))
            );
    }

    private isLastPendingTuluan(): boolean {
        return !this.findNextPendingTuluan();
    }

    private reloadCurrentTuluan() {
        if (!this.selectedTuluan || !this.courseId) return;

        const capturedTuluanId = this.selectedTuluan.id;
        const condition: ConditionOption = {
            condition: [
                { conditionName: 'id', condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString() }
            ],
            set: [{ label: 'limit', value: '1' }],
            page: '1'
        };

        this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (result) => {
                if (!this.selectedTuluan || this.selectedTuluan.id !== capturedTuluanId) return;
                if (result.data && result.data.length > 0) {
                    const fresh = result.data[0];
                    this.selectedTuluan.status = fresh.status;
                    this.selectedTuluan['approved_by'] = fresh['approved_by'];
                    this.selectedTuluan['approved_at'] = fresh['approved_at'];
                    const idx = this.list_de_tuluan.findIndex(q => q.id === fresh.id);
                    if (idx !== -1) {
                        this.list_de_tuluan[idx].status = fresh.status;
                    }
                }
                this.loadCommentTuluan();
            },
            error: () => {
                if (!this.selectedTuluan || this.selectedTuluan.id !== capturedTuluanId) return;
                this.loadCommentTuluan();
            }
        });
    }

    /** Navigate prev/next (wrap-around) */
    openNewQuestion(action: 'next' | 'back') {
        if (!this.list_de_tuluan.length || !this.selectedTuluan) {
            this.notificationService.toastWarning('Không có danh sách đề');
            return;
        }
        const idx = this.list_de_tuluan.findIndex(q => q.id === this.selectedTuluan.id);
        if (idx === -1) {
            this.notificationService.toastWarning('Không tìm thấy đề');
            return;
        }

        const nextQ = action === 'next'
            ? (idx + 1 >= this.list_de_tuluan.length ? this.list_de_tuluan[0] : this.list_de_tuluan[idx + 1])
            : (idx - 1 < 0 ? this.list_de_tuluan[this.list_de_tuluan.length - 1] : this.list_de_tuluan[idx - 1]);

        this.navigateToTuluan(nextQ.id);
    }

    // ── Navigation ────────────────────────────────────────
    goBack() {
        const code = this.route.snapshot.queryParamMap.get('code');
        if (code) {
            this.router.navigate(['/admin/hoi-dong/duyetnoidung/cauhoi'], { queryParams: { code } });
        } else {
            this.location.back();
        }
    }
}
