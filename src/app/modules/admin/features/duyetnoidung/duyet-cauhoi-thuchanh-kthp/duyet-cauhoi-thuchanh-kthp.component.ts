import { CoursePlanTuluanCommentService } from './../../../../shared/services/course-plan-tuluan-comment.service';
import { CoursePlanActivityTuluanService } from './../../../../shared/services/course-plan-activity-tuluan.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges, inject, input } from '@angular/core';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { AuthService } from '@core/services/auth.service';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { HelperService } from '@core/services/helper.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TooltipModule } from "primeng/tooltip";
import { ActivatedRoute } from '@angular/router';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';

// ── BroadcastChannel sync ─────────────────────────────────
const SYNC_CHANNEL_NAME = 'duyet-cauhoi-thuchanh-kthp-detail-sync';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        DialogModule,
        MatProgressBarModule,
        TooltipModule
    ],
    selector: 'app-duyet-cauhoi-thuchanh-kthp',
    templateUrl: './duyet-cauhoi-thuchanh-kthp.component.html',
    styleUrls: ['./duyet-cauhoi-thuchanh-kthp.component.css']
})
export class DuyetCauhoiThuchanhKthpComponent implements OnInit, OnChanges, OnDestroy {
    private notificationService = inject(NotificationService);
    private coursePlanActivityTuluanService = inject(CoursePlanActivityTuluanService);
    private coursePlanTuluanCommentService = inject(CoursePlanTuluanCommentService);
    private auth = inject(AuthService);
    private helperService = inject(HelperService);
    private ovicDateTimeService = inject(OvicDateTimeService);
    private route = inject(ActivatedRoute);
    private ngZone = inject(NgZone);


    readonly selectedCourse = input<ElnKhoaHoc>(undefined);

    readonly planTuluan = input<CoursePlanActivities>(undefined);

    readonly listThamDInh = input<HoidongThamdinhMonhocThanhvien[]>(undefined);

    hoidong: HoidongThamdinhMonhocThanhvien[];

    list_plan_kynang: CoursePlanActivities[];

    list_de_tuluan: CoursePlanActivityTuluan[];

    kd_hoidong: boolean = false;

    kd_uyvien: boolean = false;

    userId: number;

    donviId: number;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    rejectRole: boolean = false;

    _chuanhanxet: number;

    progressValue: number = 0;

    displayModal: boolean = false;

    _daduyet: number = null;

    activeFilter: number = 100;

    isLoading: boolean = false;

    stats = { total: 0, approved: 0, pending: 0, rejected: 0 };

    list_check_status = [
        { id: 100, label: 'Tất cả' },
        { id: 1, label: 'Đã duyệt' },
        { id: 0, label: 'Chưa duyệt' }
    ]

    // ── BroadcastChannel / localStorage sync ─────────────
    private _syncListener?: (e: Event) => void;
    private _detailSyncChannel?: BroadcastChannel;

    constructor() {
        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) ? true : false;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['planTuluan']) {
            this.loadKynangTuluan(this.planTuluan());
        }

        if (changes['listThamDInh']) {
            this.hoidong = this.listThamDInh();
        }
    }

    loadKynangTuluan(plan_tuluan: CoursePlanActivities) {
        this.isLoading = true;
        this.notificationService.isProcessing(true);
        this.list_plan_kynang = null;

        // const condition_tuluan: ConditionOption = {
        //     condition: [
        //         { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: plan_tuluan.id.toString() },
        //         { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: plan_tuluan.course_id.toString(), orWhere: 'and' },
        //         { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'THUONGXUYEN_TULUAN', orWhere: 'and' }
        //     ],
        //     set: [
        //         { label: 'limit', value: '-1' }
        //     ],
        //     page: null
        // }




        // this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_tuluan).pipe(mergeMap(_plan_tuluan => {
        // const plan_tuluan_ids = [0];

        // _plan_tuluan.data.forEach(f => {
        //     plan_tuluan_ids.push(f.id);
        // })

        const condition_detuluan: ConditionOption = {
            condition: [
                { conditionName: 'private', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse().id.toString(), orWhere: 'and' },
                { conditionName: 'course_plan_activity_id', condition: OvicQueryCondition.equal, value: '0', orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                // { label: 'include', value: [... new Set(plan_tuluan_ids)].toString() },
                // { label: 'include_by', value: 'course_plan_activity_id' },
            ],
            page: null
        }



        forkJoin([
            this.coursePlanActivityTuluanService.getCoursePlanActivityTuluanByPageNew(condition_detuluan).pipe(mergeMap(_tuluan => {
                const _tuluan_ids = [];
                _tuluan.data.forEach(f => {
                    _tuluan_ids.push(f.id);
                })
                if (_tuluan_ids.length) {
                    const condition_comment: ConditionOption = {
                        condition: [],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: [... new Set(_tuluan_ids)].toString() },
                            { label: 'include_by', value: 'course_plan_activity_tuluan_id' },
                            { label: 'select', value: 'course_plan_activity_tuluan_id,user_id,id' },
                            // { label: 'order', value: 'ASC' },
                            // { label: 'orderby', value: 'ordering' }
                        ],
                        page: null
                    }
                    return this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment).pipe(mergeMap(_comment => {
                        _tuluan.data.forEach(q => {
                            q['hoidong_comment'] = {};
                            q['_chuanhanxet'] = 1;
                            q['_chuaduyet'] = q.status !== 1 ? 1 : 0;
                            q['_daduyet'] = q.status === 1 ? 1 : (q.status === -1 ? -1 : 0);
                            this.hoidong.forEach(h => {
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
                        return of(_tuluan);
                    }))
                }
                return of(_tuluan);
            })),
        ]).subscribe(([_detuluan]) => {
            this.list_de_tuluan = _detuluan.data;
            this.isLoading = false;
            this.notificationService.isProcessing(false);
            this.computeStats();
            // _plan_tuluan.data.forEach(f => {
            // const detuluan = _detuluan.data.filter(m => m.course_plan_activity_id === f.id);

        })
        // return of(_plan_tuluan);
        // })
        // })).subscribe({
        //     next: (_plan) => {
        //         this.list_plan_kynang = _plan.data;
        //         this.notificationService.isProcessing(false);
        //     },
        //     error: () => {
        //         this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
        //     }
        // })
    }

    ngOnInit(): void {
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
        const index = this.hoidong.findIndex(m => m.user_id === this.auth.user.id);
        if (index !== -1) {
            this.kd_hoidong = this.hoidong[index].chutich === 1 ? true : false;
            this.kd_uyvien = this.hoidong[index].chutich !== 1 ? true : false;
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

    // ── BroadcastChannel / localStorage sync ─────────────
    private initDetailSync() {
        const shouldReload = (payload: any) => {
            return payload?.type === 'THUCHANH_KTHP_REVIEW_UPDATED'
                && payload.courseId === this.selectedCourse()?.id?.toString();
        };

        try {
            this._detailSyncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
            this._detailSyncChannel.onmessage = (event: MessageEvent) => {
                if (shouldReload(event.data)) {
                    this.ngZone.run(() => this.loadKynangTuluan(this.planTuluan()));
                }
            };
        } catch { /* BroadcastChannel fallback uses storage event */ }

        this._syncListener = (e: Event) => {
            const storageEvent = e as StorageEvent;
            if (storageEvent.key === 'duyet-cauhoi-thuchanh-kthp-detail-updated' && storageEvent.newValue) {
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

    computeStats() {
        this.stats = {
            total: this.list_de_tuluan?.length || 0,
            approved: this.list_de_tuluan?.filter(q => q.status === 1).length || 0,
            pending: this.list_de_tuluan?.filter(q => q.status === 0).length || 0,
            rejected: this.list_de_tuluan?.filter(q => q.status === -1).length || 0
        };
    }

    onFilterChipClick(id: number) {
        this.activeFilter = id;
        this.onSelectStatus(id);
    }

    toggleChuaNhanXet() {
        this._chuanhanxet = this._chuanhanxet === 1 ? null : 1;
    }

    onSelectDeTuluan(tuluan: CoursePlanActivityTuluan) {
        if (tuluan.status === 1 && !this.isManager) {
            return this.notificationService.toastWarning("Câu hỏi đã được duyệt, không có quyền mở");
        }
        const baseUrl = window.location.origin;
        const courseId = this.selectedCourse()?.id;
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        let url = `${baseUrl}/admin/hoi-dong/duyetnoidung/duyet-cauhoi-thuchanh-kthp-detail/${tuluan.id}?courseId=${courseId}`;
        if (code) {
            url += `&code=${code}`;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    }


    onSelectStatus(event) {
        if (event === 100) {
            this._daduyet = null;
        } else if (event === 1) {
            this._daduyet = 1;
        } else if (event === 0) {
            this._daduyet = 0;
        } else if (event === -1) {
            this._daduyet = -1;
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
                            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(activity.id, { status: 0, approved_by: this.userId, approved_at: this.helperService.stringToDateSql(_date.toString()), }).pipe(
                                mergeMap(() => {
                                    return of(null);
                                })
                            );
                        })
                    )
                        .subscribe({
                            next: () => {
                                this.loadKynangTuluan(this.planTuluan());
                                activity.status = 0;
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


    reDoAction(event, question: CoursePlanActivityTuluan, status: number) {
        event.preventDefault();
        event.stopPropagation();
        if (status === 1 && question.old_status !== 1) {
            return this.notificationService.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
        }
        this.notificationService.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(
            mergeMap((_date) => {
                return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(question.id, { old_status: question.status, status: status, accept_edit_id: this.userId, accept_edit_at: this.helperService.stringToDateSql(_date.toString()), }).pipe(
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

    approvedAll() {
        this.notificationService.confirm("Thầy/Cô có chắc chắn muốn duyệt tất cả không?", "Xác nhận hành động", [BUTTON_YES, BUTTON_NO]).then(a => {
            if (a.name === "yes") {
                this.displayModal = true;
                this.progressValue = 0;
                this.ovicDateTimeService.getCurrentDateTime().subscribe({
                    next: (date) => {
                        const request: Observable<any>[] = [];

                        this.list_de_tuluan.forEach(f => {
                            request.push(this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(f.id, { status: 1, approved_by: this.userId, approved_at: this.helperService.stringToDateSql(date.toString()) }));
                        })

                        if (request.length) {
                            this.loopAddForm(request, 0).subscribe({
                                next: () => {
                                    this.displayModal = false;
                                    this.loadKynangTuluan(this.planTuluan());
                                    this.notificationService.toastSuccess("Cập nhật thành công");
                                },
                                error: (e) => {
                                    console.log(e);
                                    this.displayModal = false;
                                    this.notificationService.toastError("Cập nhật thất bại, vui lòng thử lại");
                                }
                            })
                        } else {
                            this.displayModal = false;
                        }
                    },
                    error: () => {

                    }
                })


            }
        })
    }

    btnUpdateLockByActivityTuLuan(type: 1 | 0) {
        const dataContentMap = Array.from(this.list_de_tuluan).filter(f => f.status >= 0 && f.status !== type);

        if (dataContentMap.length > 0) {
            this.notificationService.isProcessing(true);
            const step: number = 100 / dataContentMap.length;
            this.notificationService.loadingAnimationV2({ process: { percent: 0 } });
            this.ovicDateTimeService.getCurrentDateTime().pipe(
                mergeMap(date => this.loopUpdateStatusActivityQuestion(dataContentMap, type, date, step, 0))).subscribe({
                    next: () => {
                        // this.load(this._coursePlan);
                        this.loadKynangTuluan(this.planTuluan());
                        this.notificationService.disableLoadingAnimationV2();
                        this.notificationService.isProcessing(false);
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
