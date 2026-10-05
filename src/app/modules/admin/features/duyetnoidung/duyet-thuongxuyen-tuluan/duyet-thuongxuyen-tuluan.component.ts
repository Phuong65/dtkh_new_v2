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
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { HelperService } from '@core/services/helper.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { ROLES } from '@modules/shared/utils/syscat';

import { TableModule } from 'primeng/table';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from "primeng/tooltip";
import { key_server } from '@env';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';

@Component({
    standalone: true,
    imports: [SharedModule, TableModule, ReactiveFormsModule, FormsModule, TooltipModule],
    selector: 'app-duyet-thuongxuyen-tuluan',
    templateUrl: './duyet-thuongxuyen-tuluan.component.html',
    styleUrls: ['./duyet-thuongxuyen-tuluan.component.css'],
})
export class DuyetThuongxuyenTuluanComponent implements OnInit, OnChanges, OnDestroy {
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

    // ── BroadcastChannel / localStorage sync ─────────────
    private _syncListener?: (e: Event) => void;
    private _detailSyncChannel?: BroadcastChannel;

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

    stats = signal<{ total: number; approved: number; pending: number }>({ total: 0, approved: 0, pending: 0 });

    _chuanhanxet = signal<number>(undefined);

    _chuaduyet = signal<number>(1);

    _daduyet = signal<number>(null);

    list_check_status = [
        { id: 100, label: 'Tất cả' },
        { id: 1, label: 'Đã duyệt' },
        { id: 0, label: 'Chưa duyệt' }
    ]

    key_server = key_server;
    constructor() {
        this.rejectRole.set(this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['planTuluan']) {
            this.loadKynangTuluan(this.planTuluan());
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
                { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: plan_tuluan.id.toString() },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: plan_tuluan.course_id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'type',
                    condition: OvicQueryCondition.equal,
                    value: 'THUONGXUYEN_TULUAN',
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

            _plan_tuluan.data.forEach(f => {
                plan_tuluan_ids.push(f.id);

            })

            const condition_detuluan: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: [...new Set(plan_tuluan_ids)].toString() },
                    { label: 'include_by', value: 'course_plan_activity_id' },
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
                this.list_plan_kynang.set(_plan.data);
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

    onSelectDeTuluan(tuluan: CoursePlanActivityTuluan) {
        if (tuluan.status === 1 && !this.isManager()) {
            return this.notificationService.toastWarning("Câu hỏi đã được duyệt, không có quyền mở");
        }
        const baseUrl = window.location.origin;
        const activityId = tuluan.course_plan_activity_id;
        const courseId = this.selectedCourse()?.id;
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        let url = `${baseUrl}/admin/hoi-dong/duyetnoidung/duyet-thuongxuyen-tuluan-detail/${tuluan.id}?courseId=${courseId}&activityId=${activityId}`;
        if (code) {
            url += `&code=${code}`;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    }


    // ── BroadcastChannel / localStorage sync ─────────────
    private initDetailSync() {
        const shouldReload = (payload: any) => {
            return payload?.type === 'TULUAN_REVIEW_UPDATED'
                && payload.courseId === this.selectedCourse()?.id?.toString();
        };

        try {
            this._detailSyncChannel = new BroadcastChannel('duyet-thuongxuyen-tuluan-detail-sync');
            this._detailSyncChannel.onmessage = (event: MessageEvent) => {
                if (shouldReload(event.data)) {
                    this.ngZone.run(() => this.loadKynangTuluan(this.planTuluan()));
                }
            };
        } catch { /* BroadcastChannel fallback uses storage event */ }

        this._syncListener = (e: Event) => {
            const storageEvent = e as StorageEvent;
            if (storageEvent.key === 'duyet-thuongxuyen-tuluan-detail-updated' && storageEvent.newValue) {
                try {
                    const payload = JSON.parse(storageEvent.newValue);
                    if (shouldReload(payload)) {
                        this.ngZone.run(() => this.loadKynangTuluan(this.planTuluan()));
                    }
                } catch { /* ignore parse errors */ }
            }
        };
        window.addEventListener('storage', this._syncListener);
    }

    ngOnDestroy(): void {
        if (this._syncListener) {
            window.removeEventListener('storage', this._syncListener);
        }
        if (this._detailSyncChannel) {
            this._detailSyncChannel.close();
        }
    }


    huyTrangThai(activity) {
        this.notificationService.confirm(
            '<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác đưa nội dung về trạng thái chờ duyệt</span>' +
            '<span>- Bạn có chắc chắn thực hiện thao tác này?</span>' +
            '</div>',
            'Xác nhận hành động',
            [BUTTON_YES, BUTTON_NO]
        )
            .then((a) => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.ovicDateTimeService.getCurrentDateTime().pipe(
                        mergeMap((_date) => {
                            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(activity.id, {
                                status: 0,
                                approved_by: this.userId(),
                                approved_at: this.helperService.stringToDateSql(_date.toString()),
                            }).pipe(
                                mergeMap(() => {
                                    return of(null);
                                })
                            );
                        })
                    )
                        .subscribe({
                            next: () => {
                                this.loadKynangTuluan(this.planTuluan());
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
            });
    }

    onSelectStatus(event) {
        if (event === 100) {
            this._daduyet.set(null)
        } else {
            this._daduyet.set(event);
        }
    }

    computeStats() {
        let total = 0;
        let approved = 0;
        let pending = 0;
        if (this.list_plan_kynang()) {
            this.list_plan_kynang().forEach(kn => {
                const questions = kn['detuluan'] || [];
                questions.forEach(q => {
                    total++;
                    if (q.status === 1) {
                        approved++;
                    } else {
                        pending++;
                    }
                });
            });
        }
        this.stats.set({ total, approved, pending });
    }

    onFilterChipClick(id: number) {
        this.activeFilter.set(id);
        this.onSelectStatus(id);
    }

    toggleChuaNhanXet() {
        this._chuanhanxet.set(this._chuanhanxet() === 1 ? null : 1);
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
                    this.loadKynangTuluan(this.planTuluan());
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


    btnUpdateLockByActivityTuLuan(type: 1 | 0) {
        const dataContentMap = Array.from(this.list_de_tuluan()).filter(f => f.status >= 0 && f.status !== type);

        if (dataContentMap.length > 0) {
            this.notificationService.isProcessing(true);
            const step: number = 100 / dataContentMap.length;
            this.notificationService.loadingAnimationV2({ process: { percent: 0 } });
            this.ovicDateTimeService.getCurrentDateTime().pipe(
                mergeMap(date => this.loopUpdateStatusActivityQuestion(dataContentMap, type, date, step, 0))).subscribe({
                    next: () => {
                        // this.load(this._coursePlan);
                        this.loadKynangTuluan(this.planTuluan());
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
