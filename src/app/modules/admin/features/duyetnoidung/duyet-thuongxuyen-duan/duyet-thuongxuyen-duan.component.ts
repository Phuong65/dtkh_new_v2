import { key_server } from './../../../../../../environments/environment';
import { CoursePlanTuluanCommentService } from './../../../../shared/services/course-plan-tuluan-comment.service';
import { CoursePlanActivityTuluanService } from './../../../../shared/services/course-plan-activity-tuluan.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, input, signal } from '@angular/core';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { forkJoin, mergeMap, of } from 'rxjs';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { AuthService } from '@core/services/auth.service';
import { HelperService } from '@core/services/helper.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { ROLES } from '@modules/shared/utils/syscat';

import { TableModule } from 'primeng/table';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from "primeng/tooltip";
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';

@Component({
    selector: 'app-duyet-thuongxuyen-duan',
    standalone: true,
    imports: [
    SharedModule,
    TableModule,
    ReactiveFormsModule,
    FormsModule,
    TooltipModule
],
    templateUrl: './duyet-thuongxuyen-duan.component.html',
    styleUrls: ['./duyet-thuongxuyen-duan.component.css']
})
export class DuyetThuongxuyenDuanComponent implements OnInit, OnDestroy, OnChanges {
    private notificationService = inject(NotificationService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);
    private coursePlanTuluanCommentService = inject(CoursePlanTuluanCommentService);
    private auth = inject(AuthService);
    private helperService = inject(HelperService);
    private ovicDateTimeService = inject(OvicDateTimeService);
    private ngZone = inject(NgZone);

    readonly selectedCourse = input<ElnKhoaHoc>(undefined);

    readonly planTuluan = input<CoursePlanActivities>(undefined);

    readonly listThamDInh = input<HoidongThamdinhMonhocThanhvien[]>(undefined);


    selectedTuluan: CoursePlanActivityTuluan;

    hoidong = signal<HoidongThamdinhMonhocThanhvien[]>(undefined);

    list_plan_kynang = signal<CoursePlanActivities[]>(undefined);

    list_de_tuluan = signal<CoursePlanActivityTuluan[]>(undefined);

    kd_hoidong = signal<boolean>(false);

    kd_uyvien = signal<boolean>(false);

    userId = signal<number>(undefined);

    donviId = signal<number>(undefined);

    isManager = signal<boolean>(false);

    isLanhDaoKhoa = signal<boolean>(false);

    isLanhDaoBomon = signal<boolean>(false);

    rejectRole = signal<boolean>(false);

    isLoading = signal<boolean>(false);

    activeFilter = signal<number>(100);

    stats = signal<{ total: number; approved: number; pending: number; rejected: number }>({ total: 0, approved: 0, pending: 0, rejected: 0 });

    _chuanhanxet = signal<number>(undefined);

    _chuaduyet = signal<number>(1);

    checkBoxChuaDuyet: boolean = true;

    _daduyet = signal<number>(null);

    list_check_status = [
        { id: 100, label: 'Tất cả' },
        { id: 1, label: 'Đã duyệt' },
        { id: 0, label: 'Chưa duyệt' },
        { id: -1, label: 'Chưa đạt' }
    ]

    key_server = key_server;

    list_plan_tieu_chi_cham: CoursePlanActivities[];

    selectPlanTuluan: CoursePlanActivities;

    // ── BroadcastChannel / localStorage sync ─────────────
    private _syncListener?: (e: Event) => void;
    private _detailSyncChannel?: BroadcastChannel;

    constructor() {
        this.rejectRole.set(this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['planTuluan']) {
            this.selectPlanTuluan = { ...this.planTuluan() };
            this.loadKynangTuluan(this.selectPlanTuluan);
        }

        if (changes['listThamDInh']) {
            this.hoidong.set(this.listThamDInh());
        }
    }

    loadKynangTuluan(plan_tuluan: CoursePlanActivities) {
        this.notificationService.isProcessing(true);
        this.isLoading.set(true);
        this.list_plan_kynang.set(null);

        const condition_tuluan: ConditionOption = {
            condition: [
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: plan_tuluan.parent_id.toString() },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: plan_tuluan.course_id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: 'THUONGXUYEN_DUAN',
                    orWhere: 'and'
                }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }



        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_tuluan).pipe(mergeMap(_plan_tuluan => {
            const plan_tuluan_ids = [-1];

            let plan_duan_id = 0;

            _plan_tuluan.data.forEach(f => {
                plan_tuluan_ids.push(f.id);
                if (f.ordering === 0) {
                    plan_duan_id = f.id
                }
            })

            const condition_detuluan: ConditionOption = {
                condition: [
                    { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: plan_duan_id.toString() },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                ],
                page: null
            }

            const condition_comment: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: [...new Set(plan_tuluan_ids)].toString() },
                    { label: 'include_by', value: 'course_plan_activity_id' },
                    { label: 'select', value: 'course_plan_activity_tuluan_id,user_id,id' }
                ],
                page: null
            }



            return forkJoin([
                this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_detuluan),
                this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment),

            ]).pipe(mergeMap(([_detuluan, _comment]) => {
                this.list_de_tuluan.set(_detuluan.data);
                _plan_tuluan.data.forEach(f => {
                    f['detuluan'] = _detuluan.data.filter(m => m.course_plan_activity_id === f.id);

                    f['detuluan'].forEach(q => {
                        q['hoidong_comment'] = {};
                        q['_chuanhanxet'] = 1;
                        q['_chuaduyet'] = q.status !== 1 ? 1 : 0;
                        q['_daduyet'] = q.status === 1 ? 1 : 0;
                        this.hoidong().forEach(h => {
                            q['hoidong_comment'][h.user_id] = false;
                            const index = _comment.data.findIndex(m => m.course_plan_activity_tuluan_id === q.id && m.user_id === h.user_id);
                            if (index !== -1) {
                                q['hoidong_comment'][h.user_id] = true;
                                if (h.user_id === this.auth.user.id) {
                                    q['_chuanhanxet'] = 0;
                                }
                            }
                        })

                    })
                })
                return of(_plan_tuluan);
            }))
        })).subscribe({
            next: (_plan) => {
                this.list_plan_kynang.set(_plan.data.filter(m => m.ordering === 0));
                this.list_plan_tieu_chi_cham = _plan.data.filter(m => m.ordering !== 0);
                this.isLoading.set(false);
                this.computeStats();
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    ngOnInit(): void {
        this.userId.set(this.auth.user.id);
        this.donviId.set(this.auth.user.donvi_id);
        this.isManager.set(this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false);
        this.isLanhDaoKhoa.set(this.auth.userHasRole(ROLES.lanhdaokhoa));
        this.isLanhDaoBomon.set(this.auth.userHasRole(ROLES.lanhdaobomon));
        const index = this.hoidong().findIndex(m => m.user_id === this.auth.user.id);
        if (index !== -1) {
            this.kd_hoidong.set(this.hoidong()[index].chutich === 1 ? true : false);
            this.kd_uyvien.set(this.hoidong()[index].chutich !== 1 ? true : false);
        }
        this.initDetailSync();
    }

    ngOnDestroy(): void {
        if (this._syncListener) {
            window.removeEventListener('storage', this._syncListener);
        }
        if (this._detailSyncChannel) {
            this._detailSyncChannel.close();
        }
    }

    private initDetailSync() {
        const shouldReload = (payload: any) => {
            return payload?.type === 'TULUAN_REVIEW_UPDATED'
                && payload.courseId === this.selectedCourse()?.id?.toString();
        };

        try {
            this._detailSyncChannel = new BroadcastChannel('duyet-thuongxuyen-duan-detail-sync');
            this._detailSyncChannel.onmessage = (event: MessageEvent) => {
                if (shouldReload(event.data)) {
                    this.ngZone.run(() => this.loadKynangTuluan(this.selectPlanTuluan));
                }
            };
        } catch { /* BroadcastChannel fallback uses storage event */ }

        this._syncListener = (e: Event) => {
            const storageEvent = e as StorageEvent;
            if (storageEvent.key === 'duyet-thuongxuyen-duan-detail-updated' && storageEvent.newValue) {
                try {
                    const payload = JSON.parse(storageEvent.newValue);
                    if (shouldReload(payload)) {
                        this.ngZone.run(() => this.loadKynangTuluan(this.selectPlanTuluan));
                    }
                } catch { /* ignore parse errors */ }
            }
        };
        window.addEventListener('storage', this._syncListener);
    }

    onSelectDeTuluan(tuluan: CoursePlanActivityTuluan) {
        if (tuluan.status === 1 && !this.isManager()) {
            return this.notificationService.toastWarning("Câu hỏi đã được duyệt, không có quyền mở");
        }
        // Mở tab mới với route detail
        const baseUrl = window.location.origin;
        const activityId = this.selectPlanTuluan?.id || tuluan.course_plan_activity_id;
        const courseId = this.selectedCourse()?.id;
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        let url = `${baseUrl}/admin/hoi-dong/duyetnoidung/duyet-thuongxuyen-duan-detail/${tuluan.id}?courseId=${courseId}&activityId=${activityId}`;
        if (code) {
            url += `&code=${code}`;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    // ── Filter chip methods ─────────────
    onFilterChipClick(id: number) {
        this.activeFilter.set(id);
        this.onSelectStatus(id);
    }

    onSelectStatus(event: number) {
        if (event === 100) {
            this._daduyet.set(null);
        } else if (event === -1) {
            // Chưa đạt: filter trực tiếp trên status === -1
            // Sử dụng _daduyet = 0 kết hợp filter hiện có (status !== 1 → _daduyet = 0)
            this._daduyet.set(0);
        } else {
            this._daduyet.set(event);
        }
    }

    toggleChuaNhanXet() {
        this._chuanhanxet.set(this._chuanhanxet() === 1 ? null : 1);
    }

    computeStats() {
        if (this.list_de_tuluan() && this.list_de_tuluan().length > 0) {
            this.stats.set({
                total: this.list_de_tuluan().length,
                approved: this.list_de_tuluan().filter(q => q.status === 1).length,
                pending: this.list_de_tuluan().filter(q => q.status === 0).length,
                rejected: this.list_de_tuluan().filter(q => q.status === -1).length
            });
        } else {
            this.stats.set({ total: 0, approved: 0, pending: 0, rejected: 0 });
        }
    }

    reDoAction(event, question: CoursePlanActivityTuluan, status: number) {
        event.preventDefault();
        event.stopPropagation();
        if (status === 1 && question.old_status !== 1) {
            return this.notificationService.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
        }
        this.notificationService.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(
            mergeMap((_date) => {
                return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(question.id, {
                    old_status: question.status,
                    status: status,
                    accept_edit_id: this.userId(),
                    accept_edit_at: this.helperService.stringToDateSql(_date.toString()),
                }).pipe(
                    mergeMap(() => {
                        return of(null);
                    })
                );
            })
        )
            .subscribe({
                next: () => {
                    this.loadKynangTuluan(this.selectPlanTuluan);
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastSuccess(
                        'Cập nhật thành công'
                    );
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(
                        'Cập nhật thất bại, Lỗi kết nối'
                    );
                },
            });
    }

    checkValue(event, key: string) {
        if (event.checked === true) {
            switch (key) {
                case '_chuanhanxet':
                    this._chuanhanxet.set(1)
                    break;
                case '_chuaduyet':
                    this._chuaduyet.set(1);
                    break;
                default:
                    break;
            }
        } else {
            switch (key) {
                case '_chuanhanxet':
                    this._chuanhanxet.set(null);
                    break;
                case '_chuaduyet':
                    this._chuaduyet.set(null)
                    break;
                default:
                    break;
            }
        }
    }

    btnUpdateLockByActivityTuLuan(type: 1 | 0) {
        const dataContentMap = Array.from(this.list_de_tuluan()).filter(f => f.status >= 0 && f.status !== type);

        if (dataContentMap.length > 0) {
            this.notificationService.isProcessing(true);
            const step: number = 100 / dataContentMap.length;
            this.notificationService.loadingAnimationV2({ process: { percent: 0 } });
            this.ovicDateTimeService.getCurrentDateTime().pipe(
                mergeMap(date => this.loopUpdateStatusActivityQuestion(dataContentMap, type, date, step, 0))).subscribe({
                    next: () => {
                        this.loadKynangTuluan(this.selectPlanTuluan);
                        this.notificationService.isProcessing(false);
                        this.notificationService.disableLoadingAnimationV2();

                        this.notificationService.toastSuccess('Cập nhật thành công');
                    }, error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.disableLoadingAnimationV2();

                        this.notificationService.toastError('Cập nhật thất bại, Lỗi kết nối');
                    }
                })

        } else {
            this.notificationService.toastWarning(type == 1 ? 'Không có đề nào đang mở khóa' : 'Không có đề nào đang bị khóa');
        }
    }

    private loopUpdateStatusActivityQuestion(data: any[], status: number, _date: any, step: number, percent: number) {

        const index = data.findIndex(f => !f['_haveUpdate']);
        if (index !== -1) {
            const activity = data[index];
            activity['_haveUpdate'] = true; // đánh dấu đã xử lý
            const newPercent: number = percent + step;
            this.notificationService.loadingAnimationV2({ process: { percent: newPercent } });
            if (status === 1 && activity.old_status !== 1) {
                this.notificationService.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
                return this.loopUpdateStatusActivityQuestion(data, status, _date, step, newPercent);
            }
            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(activity.id, {
                old_status: activity.status,
                status: status,
                accept_edit_id: this.auth.user.id,
                accept_edit_at: this.helperService.stringToDateSql(_date.toString())
            }).pipe(mergeMap(() => this.loopUpdateStatusActivityQuestion(data, status, _date, step, newPercent)));
        } else {
            return of(data);
        }
    }
}
