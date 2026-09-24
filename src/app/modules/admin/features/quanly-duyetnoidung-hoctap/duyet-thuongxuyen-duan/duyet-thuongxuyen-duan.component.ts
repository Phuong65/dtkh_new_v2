import { key_server } from './../../../../../../environments/environment';
import { CoursePlanTuluanCommentService } from './../../../../shared/services/course-plan-tuluan-comment.service';
import { CoursePlanActivityTuluanService } from './../../../../shared/services/course-plan-activity-tuluan.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { CoursePlanActivities } from '@modules/shared/models/course-plan-activities';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { forkJoin, mergeMap, of } from 'rxjs';
import { CourseThanhvienService } from '@modules/shared/services/course-thanhvien.service';
import { CourseThanhvien } from '@modules/shared/models/course_thanhvien';
import { CoursePlanActivityTuluan } from '@modules/shared/models/course-plan-activity-tuluan';
import { AuthService } from '@core/services/auth.service';
import { CourseQuestionComment } from '@modules/shared/models/course-question-comment';
import { CoursePlanTuluanComment } from '@modules/shared/models/course-plan-tuluan-comment';
import { BUTTON_NO, BUTTON_YES } from '@core/models/buttons';
import { HelperService } from '@core/services/helper.service';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from "primeng/button";
import { RippleModule } from "primeng/ripple";
import { TooltipModule } from "primeng/tooltip";
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CoursePlanActivityTuluanTieuchichamService } from '@modules/shared/services/course-plan-activity-tuluan-tieuchicham.service';
import { DividerModule } from 'primeng/divider';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';

@Component({
    selector: 'app-duyet-thuongxuyen-duan',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        CheckboxModule,
        ReactiveFormsModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        TooltipModule,
        OverlayPanelModule,
        DividerModule,
        LoadMediaOnTextDirective
    ],
    templateUrl: './duyet-thuongxuyen-duan.component.html',
    styleUrls: ['./duyet-thuongxuyen-duan.component.css']
})
export class DuyetThuongxuyenDuanComponent implements OnInit {
    @Input() selectedCourse: ElnKhoaHoc;

    @Input() planTuluan: CoursePlanActivities;

    @Input() listThamDInh: CourseThanhvien[];

    @ViewChild('templateFormViewTuluan') templateFormViewTuluan: TemplateRef<any>;

    selectedComment: CoursePlanTuluanComment;

    selectedTuluan: CoursePlanActivityTuluan;

    hoidong: CourseThanhvien[];

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

    _chuaduyet: number = 1;

    checkBoxChuaDuyet: boolean = true;

    _daduyet: number = null;

    list_check_status = [
        { id: 100, label: 'Tất cả' },
        { id: 1, label: 'Đã duyệt' },
        { id: 0, label: 'Chưa duyệt' }
    ]

    key_server = key_server;

    list_plan_tieu_chi_cham: CoursePlanActivities[];

    selectPlanTuluan: CoursePlanActivities;

    constructor(
        private notificationService: NotificationService,
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanActivityTuluanService: CoursePlanActivityTuluanService,
        private coursePlanTuluanCommentService: CoursePlanTuluanCommentService,
        private auth: AuthService,
        private helperService: HelperService,
        private ovicDateTimeService: OvicDateTimeService,
        private coursePlanActivityTuluanTieuchichamService: CoursePlanActivityTuluanTieuchichamService
    ) {
        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) ? true : false;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['planTuluan']) {
            this.selectPlanTuluan = { ...this.planTuluan };
            this.selectPlanTuluan.id = this.selectPlanTuluan.key;
            this.loadKynangTuluan(this.selectPlanTuluan);
        }

        if (changes['listThamDInh']) {
            this.hoidong = this.listThamDInh;
        }
    }

    loadKynangTuluan(plan_tuluan: CoursePlanActivities) {
        this.notificationService.isProcessing(true);

        this.list_plan_kynang = null;

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
                this.list_de_tuluan = _detuluan.data;
                _plan_tuluan.data.forEach(f => {
                    f['detuluan'] = _detuluan.data.filter(m => m.course_plan_activity_id === f.id);

                    // _tieuchicham.data.filter(m => m.course_plan_activity_id === f.id).forEach(c => {
                    //     c['ordering'] = f.ordering;
                    // })

                    f['detuluan'].forEach(q => {
                        q['hoidong_comment'] = {};
                        q['_chuanhanxet'] = 1;
                        q['_chuaduyet'] = q.status !== 1 ? 1 : 0;
                        q['_daduyet'] = q.status === 1 ? 1 : 0;
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
                })
                return of(_plan_tuluan);
            }))
        })).subscribe({
            next: (_plan) => {
                this.list_plan_kynang = _plan.data.filter(m => m.ordering === 0);
                this.list_plan_tieu_chi_cham = _plan.data.filter(m => m.ordering !== 0);
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })
    }

    ngOnInit(): void {
        this.userId = this.auth.user.id;
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
        const index = this.hoidong.findIndex(m => m.user_id === this.auth.user.id);
        if (index !== -1) {
            this.kd_hoidong = this.hoidong[index].vaitro === 'CHUTICH' ? true : false;
            this.kd_uyvien = this.hoidong[index].vaitro === 'UYVIEN' ? true : false;
        }
    }

    onSelectDeTuluan(tuluan: CoursePlanActivityTuluan) {
        this.selectedTuluan = tuluan;
        this.list_plan_tieu_chi_cham.forEach(f => {
            f['_tieuchicham'] = null;
        })
        this.loadCommentTuluan();
    }


    loadCommentTuluan() {
        const condition_comment: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_plan_activity_tuluan_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedTuluan.id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedCourse.id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: '0',
                    orWhere: 'and',
                },

            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null
        }

        const condition_reply_comment: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_plan_activity_tuluan_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedTuluan.id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: this.selectedCourse.id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.notEqual,
                    value: '0',
                    orWhere: 'and',
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id, parent_id' },
            ],
            page: null,
        };

        const condition_tieuchicham: ConditionOption = {
            condition: [
                { conditionName: "course_id", condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: "and" },
                { conditionName: "course_plan_activity_tuluan_id", condition: OvicQueryCondition.equal, value: this.selectedTuluan.id.toString(), orWhere: "and" },

            ],

            set: [
                { label: "limit", value: "-1" },
                { label: "order", value: "ASC" },
                { label: "orderby", value: "ordering" },
            ],
            page: null
        }

        this.notificationService.isProcessing(true);
        forkJoin([
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment),
            this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_reply_comment),
            this.coursePlanActivityTuluanTieuchichamService.getCoursePlanActivityTuluanTieuchichamByPageNew(condition_tieuchicham)
        ]).subscribe({
            next: ([_comment, _comment_child, _tieuchicham]) => {
                _comment.data.forEach((f) => {
                    // const index = this.hoidong.findIndex(
                    //     (m) => m.user_id === f.user_id
                    // );

                    // if (index !== -1) {
                    //     f['display_name'] =
                    //         this.hoidong[index][
                    //         'display_name'
                    //         ];
                    // }
                    f['display_name'] = f.user ? f.user.display_name : 'Không xác định';

                    f['reply_open'] = false;

                    f['textarea_comment'] = '';
                });


                const object_comment = {};

                _comment.data.forEach((c) => {
                    const count_reply = _comment_child.data.filter((m) => m.parent_id === c.id).length;

                    c['count_reply'] = count_reply;

                    if (!object_comment[c.user_id]) {
                        object_comment[c.user_id] = { cap_khoa: [], cap_truong: [], display_name: c['display_name'] };
                        object_comment[c.user_id][c.cap_hoidong].push(c);
                    } else {
                        object_comment[c.user_id][c.cap_hoidong].push(c);
                    }
                });

                this.selectedTuluan['comments'] = [];

                let j = 0;

                Object.keys(object_comment).forEach((o, key) => {
                    let display_name = 'Ủy viên '.concat((key + 1).toString());
                    if (this.kd_hoidong || this.isLanhDaoKhoa || this.isManager || this.isLanhDaoBomon) {
                        if (o.toString() === this.userId.toString()) {
                            display_name = 'Nhận xét của bạn';
                        } else {
                            display_name = object_comment[o] ? object_comment[o].display_name : 'Không xác định';
                        }
                    } else if (
                        o.toString() === this.userId.toString()
                    ) {
                        display_name = 'Nhận xét của bạn';
                    }

                    if (object_comment[o]['cap_khoa'] && object_comment[o]['cap_khoa'].length) {
                        this.selectedTuluan['comments'].push({
                            user_id: Number(o),
                            display_name: display_name,
                            cap_hoidong: 'cap_khoa',
                            children: object_comment[o]['cap_khoa']
                        });
                    }

                    if (object_comment[o]['cap_truong'] && object_comment[o]['cap_truong'].length) {
                        j = j + 1;
                        this.selectedTuluan['comments'].push({
                            user_id: Number(o),
                            display_name: this.isManager ? display_name.concat(" (Cấp trường)") : 'Ủy viên trường '.concat((j).toString()),
                            cap_hoidong: 'cap_truong',
                            children: object_comment[o]['cap_truong']
                        });
                    }

                    // this.selectedTuluan['comments'].push({
                    //     user_id: o,
                    //     display_name: display_name,
                    //     children: object_comment[o],
                    // });
                }
                );

                this.list_plan_tieu_chi_cham.forEach(f => {
                    f['_tieuchicham'] = _tieuchicham.data.filter(m => m.course_plan_activity_id === f.id);
                })

                this.selectedTuluan['textarea_comment'] = '';
                this.notificationService.isProcessing(false);
                this.notificationService.openSideNavigationMenu({
                    template: this.templateFormViewTuluan,
                    size: window.innerWidth,
                    offsetTop: '0px'
                });
            },
            error: () => {

            }
        })
    }


    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }


    openReply(comment: CourseQuestionComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CoursePlanTuluanComment, index_comment) {
        const condition_comment: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: comment.id.toString(),
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null,
        };

        this.coursePlanTuluanCommentService.getCoursePlanTuluanCommentByPageNew(condition_comment).subscribe({
            next: (_comment) => {
                _comment.data.forEach((f) => {
                    if (f.cap_hoidong === 'cap_truong') {
                        if (this.isManager) {
                            f['display_name'] = f.user ? f.user.display_name.concat(' (Cấp trường)') : 'Uỷ viên (Cấp trường)';
                        } else if (comment.user_id === f.user_id) {
                            f['display_name'] = 'Ủy viên cấp trường '.concat((index_comment + 1).toString());
                        } else {
                            f['display_name'] = 'Ủy viên cấp trường';
                        }
                    } else if (
                        f.user_id === this.selectedCourse.creator_plan_id &&
                        this.userId !== f.user_id
                    ) {
                        f['display_name'] =
                            this.selectedCourse['display_name'];
                    } else if (f.user_id === this.userId) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else {
                        if (
                            this.kd_hoidong || this.isManager || this.isLanhDaoKhoa || this.isLanhDaoBomon
                        ) {
                            const index = this.hoidong.findIndex(
                                (m) => m.user_id === f.user_id
                            );
                            f['display_name'] =
                                this.hoidong[index]['display_name'];
                        } else {
                            if (comment.user_id === f.user_id) {
                                f['display_name'] = 'Ủy viên '.concat(
                                    (index_comment + 1).toString()
                                );
                            } else {
                                f['display_name'] = 'Ủy viên khác';
                            }
                        }
                    }
                });

                comment['reply_comments'] = _comment.data;
                comment['count_reply'] = _comment.data.length;
            },

            error: () => {
                this.notificationService.toastError('Lỗi kết nôi, vui lòng thử lại');
            },
        });
    }

    saveCommentReply(comment: CoursePlanTuluanComment, activity: CoursePlanActivityTuluan, index_comment: number) {
        const comment_content = comment['textarea_comment']
            ? comment['textarea_comment'].trim()
            : comment['textarea_comment'].trim();

        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanTuluanComment = {
                course_plan_activity_id: activity.course_plan_activity_id,
                comment: comment_content,
                status: 0,
                user_id: this.userId,
                course_id: this.selectedCourse.id,
                parent_id: comment.id,
                course_plan_activity_tuluan_id: activity.id
            };

            this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data_comment).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Đã gửi phản hồi thành công');
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(
                        this.selectedComment,
                        index_comment
                    );
                },
                error: () => {
                    this.notificationService.toastError(
                        'Lỗi kết nối, vui lòng thử lại'
                    );
                },
            });
        } else {
            this.notificationService.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
        }
    }

    saveComment(status, activity: CoursePlanActivityTuluan) {
        const noidung = activity['textarea_comment']
            ? activity['textarea_comment'].trim()
            : activity['textarea_comment'];
        if (noidung) {
            this.notificationService.confirm(status === -1 ? 'Thầy / Cô có chắc chắn yêu cầu sửa' : 'Thầy / Cô có chắc chắn đồng ý duyệt', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then((a) => {
                if (a.name === 'yes') {
                    const data: CoursePlanTuluanComment = {
                        course_plan_activity_id: activity.course_plan_activity_id,
                        comment: noidung,
                        status: status,
                        user_id: this.auth.user.id,
                        course_id: this.selectedCourse.id,
                        parent_id: 0,
                        course_plan_activity_tuluan_id: activity.id
                    };

                    this.coursePlanTuluanCommentService.addCoursePlanTuluanComment(data).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess(
                                'Cập nhật thành công'
                            );

                            this.loadCommentTuluan();
                        },
                        error: () => {
                            this.notificationService.toastError(
                                'Cập nhật thất bại, lỗi kết nối'
                            );
                        },
                    });
                }
            });
        } else {
            this.notificationService.toastWarning('Vui lòng nhập nội dung');
        }
    }


    duyetNoidung(activity: CoursePlanActivityTuluan, status) {
        const confirm_data =
            status === 1
                ? '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác duyệt câu hỏi</span>' +
                '<span>- Chức năng nhận xét cho câu hỏi này sẽ bị đóng</span>' +
                '<span>- Thao tác này không thể hoàn tác</span>' +
                '<span>- Bạn có chắc chắn duyệt câu hỏi này?</span>' +
                '</div>'
                : '<div class="alert-duyetnoidung">' +
                '<span>- Bạn đang thực hiện thao tác yêu cầu sửa câu hỏi</span>' +
                '<span>- Chức năng nhận xét cho câu hỏi sẽ bị đóng</span>' +
                '<span>- Thao tác này không thể hoàn tác</span>' +
                '<span>- Bạn có chắc chắn yêu cầu sửa câu hỏi này?</span>' +
                '</div>';

        this.notificationService
            .confirm(confirm_data, 'Xác nhận hành động', [
                BUTTON_YES,
                BUTTON_NO,
            ])
            .then((a) => {
                if (a.name === 'yes') {
                    this.notificationService.isProcessing(true);
                    this.ovicDateTimeService.getCurrentDateTime().pipe(
                        mergeMap((_date) => {
                            return this.coursePlanActivityTuluanService.updateCoursePlanActivityTuluan(activity.id, {
                                status: status,
                                approved_by: this.userId,
                                approved_at:
                                    this.helperService.stringToDateSql(
                                        _date.toString()
                                    ),
                            })
                                .pipe(
                                    mergeMap(() => {
                                        return of(null);
                                    })
                                );
                        })
                    )
                        .subscribe({
                            next: () => {
                                this.loadKynangTuluan(this.selectPlanTuluan);
                                this.selectedTuluan.status = status;
                                this.selectedTuluan.approved_at = new Date().toString();
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
                                approved_by: this.userId,
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
                                this.loadKynangTuluan(this.selectPlanTuluan);
                                this.selectedTuluan.status = 0;
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
            this._daduyet = null
        } else {
            this._daduyet = event;
        }
    }

    openNewQuestion(action: string) {
        let data = this.list_de_tuluan;
        const index = data.findIndex(m => m.id === this.selectedTuluan.id);
        if (index !== -1) {
            if (action === 'next') {
                if (index + 1 >= data.length) {
                    this.selectedTuluan = data[0];
                } else {
                    this.selectedTuluan = data[index + 1];
                }
            } else if (action === 'back') {
                if (index - 1 < 0) {
                    this.selectedTuluan = data[data.length - 1];
                } else {
                    this.selectedTuluan = data[index - 1];
                }
            }
            this.onSelectDeTuluan(this.selectedTuluan);
        } else {
            this.notificationService.toastWarning('Không tìm thấy câu hỏi');
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
                    accept_edit_id: this.userId,
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
                    this._chuanhanxet = 1
                    break;
                case '_chuaduyet':
                    this._chuaduyet = 1;
                    break;
                default:
                    break;
            }
        } else {
            switch (key) {
                case '_chuanhanxet':
                    this._chuanhanxet = null;
                    break;
                case '_chuaduyet':
                    this._chuaduyet = null
                    break;
                default:
                    break;
            }
        }
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
