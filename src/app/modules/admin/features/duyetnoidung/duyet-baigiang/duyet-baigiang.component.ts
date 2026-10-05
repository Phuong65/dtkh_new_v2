import { CoursePlanCommentService } from '@modules/shared/services/course-plan-comment.service';
import { HoidongThamdinhMonhocThanhvienService } from './../../../../shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { CoursePlanActivitiesService } from '@modules/shared/services/course-plan-activities.service';
import { CoursePlanActivities } from '@shared/models/course-plan-activities';
import { AfterViewChecked, Component, ElementRef, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { ActivatedRoute, Router } from '@angular/router';
import { HoidongThamdinhMonhocService } from '@modules/shared/services/hoidong-thamdinh-monhoc.service';
import { HoidongThamdinhMonhoc } from '@modules/shared/models/hoidong-thamdinh-monhoc';
import { forkJoin, mergeMap, of } from 'rxjs';
import { LARGE_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { PanelModule } from 'primeng/panel';
import { HoidongThamdinhMonhocThanhvien } from '@modules/shared/models/hoidong-thamdinh-monhoc-thanhvien';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { CoursePlanComment } from '@modules/shared/models/course-plan-comment';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { OvicDocument } from '@core/models/file';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ViewDocumentComponent } from '@modules/shared/components/view-document/view-document.component';
import { AudioViewerComponent } from '@modules/shared/components/audio-viewer/audio-viewer.component';
import { OvicDateTimePipe } from '../../../../shared/pipes/ovic-date-time.pipe';
import { OvicFileIconPipe } from '../../../../shared/pipes/ovic-file-icon.pipe';

@Component({
    selector: 'app-duyet-baigiang',
    standalone: true,
    imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    PanelModule,
    ViewDocumentComponent,
    AudioViewerComponent,
    OvicDateTimePipe,
    OvicFileIconPipe
],
    templateUrl: './duyet-baigiang.component.html',
    styleUrls: ['./duyet-baigiang.component.css']
})
export class DuyetBaigiangComponent implements OnInit, AfterViewChecked {
    private activatedRoute = inject(ActivatedRoute);
    private hoidongThamdinhMonhocService = inject(HoidongThamdinhMonhocService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private notificationService = inject(NotificationService);
    private helperService = inject(HelperService);
    private router = inject(Router);
    private hoidongThamdinhMonhocThanhvienService = inject(HoidongThamdinhMonhocThanhvienService);
    private auth = inject(AuthService);
    private coursePlanCommentService = inject(CoursePlanCommentService);
    private ovicDateTimeService = inject(OvicDateTimeService);
    private modalService = inject(NgbModal);
    private elngUserProfileService = inject(ElngUserProfileService);

    readonly filesLessonReview = viewChild<ElementRef>('filesLessonReview');

    selectedMonhocThamdinh: HoidongThamdinhMonhoc;

    list_plan: CoursePlanActivities[];

    selectPlan: CoursePlanActivities;

    selectedPlanActivity: CoursePlanActivities;

    closeLeft: boolean = false;

    label_parent_kehoach: string = "Bài";

    isManager: boolean = false;

    isDaotao: boolean = false;

    list_thanhvien: HoidongThamdinhMonhocThanhvien[];

    rejectRole: boolean = false;

    kd_hoidong: boolean = false;

    kd_uyvien: boolean = false;

    selectedComment: CoursePlanComment;

    userId: number;

    keyScroll: string;

    selectedFileReview: OvicDocument;

    isLanhdaokhoa: boolean = false;
    constructor() {
        this.isManager = this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.manager) ? true : false;

        this.isDaotao = this.auth.userHasRole(ROLES.chuyenvien_pdt);

        this.isLanhdaokhoa = this.auth.userHasRole(ROLES.lanhdaokhoa) ? true : false;

        this.rejectRole = this.isManager || this.isDaotao || this.isLanhdaokhoa ? true : false;

        this.userId = this.auth.user.id;
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {

                this.notificationService.isProcessing(true);

                const course_id = params['code'];

                const contition: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '1' },
                        { label: 'with', value: 'course' }
                    ],
                    page: null
                }

                const condition_thanhvien: ConditionOption = {
                    condition: [
                        { conditionName: 'hoidong_thamdinh_monhoc_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'with', value: 'user' },
                        { label: 'order', value: 'DESC' },
                        { label: 'orderby', value: 'chutich' }
                    ],
                    page: null
                }

                const condition_user_profile: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                forkJoin([
                    this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(condition_thanhvien),
                    this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(contition),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user_profile)
                ]).subscribe({
                    next: ([_thanhvien, _course, _user_profile]) => {
                        if (_course.recordsFiltered && _course.data[0].course) {

                            const index = _thanhvien.data.findIndex(m => m.user_id === this.auth.user.id);

                            this.list_thanhvien = _thanhvien.data;

                            if (index === -1 && !this.isManager && !this.isDaotao && this.isLanhdaokhoa && _user_profile.recordsFiltered && _user_profile.data[0].donvi_chuyenmon_id !== _course.data[0].course.category_ids && _course.data[0].course.creator_plan_id !== this.auth.user.id) {
                                this.notificationService.isProcessing(false);
                                this.router.navigate(['/admin/content-none']);
                            }

                            if (index === -1 && !this.isManager && !this.isDaotao && !this.isLanhdaokhoa) {
                                this.notificationService.isProcessing(false);
                                this.router.navigate(['/admin/content-none']);
                            } else {
                                if (index !== -1) {
                                    this.kd_uyvien = true;
                                    this.kd_hoidong = _thanhvien.data[index].chutich ? true : false;
                                }
                            }

                            this.auth.setFeatureSecondary("Duyệt Bài giảng");

                            this.selectedMonhocThamdinh = _course.data[0];

                            this.loadBaigiang();
                        } else {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Không tìm thấy môn học");
                            this.router.navigate(['/admin/content-none']);
                        }

                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Không tìm thấy môn học");
                        this.router.navigate(['/admin/content-none']);
                    }
                })
            } else {

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

    scroll(name: string) {
        switch (name) {
            case 'plan':
                const elPlan = document.getElementById('plan');
                elPlan?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                break;
            case 'cdr':
                if (this.selectedPlanActivity) {
                    const el = document.getElementById('cdr_'.concat(this.selectedPlanActivity.id.toString()));
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                break;
            default:
                break;
        }
    }


    loadBaigiang() {
        this.notificationService.isProcessing(true);

        const condition_plan: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedMonhocThamdinh.course.id.toString(), orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.lessThan, value: '100', orWhere: 'and' },
                { conditionName: 'week', condition: OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'PLAN,MUCTIEU,ACTIVITY' },
                { label: 'include_by', value: 'type' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' }
            ],
            page: null
        }

        this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_plan).subscribe({
            next: (_plan) => {

                const parent_plan = _plan.data.filter(m => m.parent_id === 0);

                parent_plan.forEach(f => {
                    f.children = _plan.data.filter(m => m.parent_id === f.id);
                    f.children.forEach(c => {
                        c['_status_class'] = c.status === 1 ? 'Dat' : (c.status === 0 ? 'choduyet' : (c.status === -1 ? 'chuadat' : ''))
                        c['_status_label'] = c.status === 1 ? 'Đạt' : (c.status === 0 ? ' Chờ duyệt ' : (c.status === -1 ? ' Chưa đạt' : '_'));
                        c['_status_class'] = c.status === -2 ? 'dasua' : c['_status_class'];
                        c['_status_label'] = c.status === -2 ? 'Đã sửa' : c['_status_label'];
                    })
                    f.children = this.helperService.sort(f.children, 'ordering');
                })

                this.list_plan = parent_plan;

                if (this.selectPlan) {
                    const index = this.list_plan.findIndex(m => m.id === this.selectPlan.id);

                    if (index !== -1) {
                        this.onChangePlan(this.list_plan[index])
                    }
                } else {
                    if (this.list_plan.length) {
                        this.onChangePlan(this.list_plan[0]);
                    }
                }
                this.notificationService.isProcessing(false);
            },

            error: () => {

            }
        })
    }

    onChangePlan(parent, children?, index?: number) {
        this.selectedPlanActivity = null;
        this.selectPlan = null;
        this.keyScroll = null;
        this.selectPlan = parent;
        if (children) {
            this.selectedPlanActivity = children;
            this.keyScroll = 'cdr';
        } else {
            this.keyScroll = 'plan';
        }
        this.loadComment();
    }

    loadComment() {
        this.notificationService.isProcessing(true);

        const ids = this.selectPlan.children.map(m => m.id);

        if (ids.length) {
            const condition_comment: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedMonhocThamdinh.course.id.toString(), orWhere: 'and' },
                ],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: ids.toString() },
                    { label: 'include_by', value: 'course_plan_activity_id' },
                    { label: 'with', value: 'user' }
                ],
                page: null
            }

            this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_comment).subscribe({
                next: (_comment) => {

                    const _comment_parent = _comment.data.filter(m => m.parent_id === 0);

                    const _comment_child = _comment.data.filter(m => m.parent_id !== 0);

                    _comment_parent.forEach((f) => {

                        f['display_name'] = f.user ? f.user.display_name : 'Không xác định';

                        f['reply_open'] = false;

                        f['textarea_comment'] = '';

                    });

                    this.selectPlan.children.forEach((f) => {

                        f['expandView'] = f['status'] === 1 ? false : true

                        const comments = _comment_parent.filter((m) => m.course_plan_activity_id === f.id || m.course_plan_activity_id === f.course_plan_activity_id);

                        const object_comment = {};

                        comments.forEach((c) => {
                            const count_reply = _comment_child.filter((m) => m.parent_id === c.id).length;

                            c['count_reply'] = count_reply;

                            if (!object_comment[c.user_id]) {
                                object_comment[c.user_id] = { cap_khoa: [], cap_truong: [], display_name: c['display_name'] };
                                object_comment[c.user_id][c.cap_hoidong].push(c);
                            } else {
                                object_comment[c.user_id][c.cap_hoidong].push(c);
                            }
                        });

                        f['comments'] = [];

                        let j = 0;

                        Object.keys(object_comment).forEach((o, key) => {
                            let display_name = 'Ủy viên '.concat((key + 1).toString());
                            if (this.kd_hoidong || this.isManager || this.isDaotao) {
                                if (o.toString() === this.userId.toString()) {
                                    display_name = 'Nhận xét của bạn';
                                } else {
                                    display_name = object_comment[o] ? object_comment[o].display_name : 'Không xác định';
                                }
                            } else if (o.toString() === this.userId.toString()) {
                                display_name = object_comment[o] ? object_comment[o]['display_name'] : 'Không xác định';
                            }

                            if (object_comment[o]['cap_khoa'] && object_comment[o]['cap_khoa'].length) {
                                f['comments'].push({ user_id: Number(o), display_name: display_name, cap_hoidong: 'cap_khoa', children: object_comment[o]['cap_khoa'] });
                            }
                        });

                        f['textarea_comment'] = '';
                    });

                    this.list_thanhvien.forEach(f => {
                        f['checkComment'] = {};
                        _comment.data.forEach(c => {
                            if (c.user_id === f.user_id) {
                                if (!f['checkComment'][c.course_plan_activity_id]) {
                                    f['checkComment'][c.course_plan_activity_id] = true;
                                }
                            }
                        })
                    })

                    this.notificationService.isProcessing(false);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                }
            })

        }
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    saveComment(status, activity: CoursePlanActivities) {
        let noidung = activity['textarea_comment'] ? activity['textarea_comment'].trim() : activity['textarea_comment'];
        if (!noidung && status === 1) {
            noidung = "Đồng ý duyệt";
        }
        if (noidung) {
            this.notificationService.confirm(status === -1 ? 'Thầy / Cô có chắc chắn yêu cầu sửa' : 'Thầy / Cô có chắc chắn đồng ý duyệt', 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO])
                .then((a) => {
                    if (a.name === 'yes') {
                        const data: CoursePlanComment = {
                            course_plan_activity_id: activity.id,
                            comment: noidung,
                            status: status,
                            user_id: this.auth.user.id,
                            course_id: this.selectedMonhocThamdinh.course_id,
                            parent_id: 0,
                        };

                        this.coursePlanCommentService.addCoursePlanComment(data).subscribe({
                            next: () => {
                                this.notificationService.toastSuccess('Cập nhật thành công');
                                this.loadComment();
                            },
                            error: () => {
                                this.notificationService.toastError('Cập nhật thất bại, lỗi kết nối');
                            },
                        });
                    }
                });
        } else {
            this.notificationService.toastWarning('Vui lòng nhập nội dung');
        }
    }

    duyetNoidung(activity: CoursePlanActivities, status) {
        const confirm_data = status === 1
            ? '<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác duyệt nội dung giảng dạy</span>' +
            '<span>- Chức năng nhận xét cho nội dung giảng dạy sẽ bị đóng</span>' +
            '<span>- Thao tác này không thể hoàn tác</span>' +
            '<span>- Bạn có chắc chắn duyệt nội dung giảng dạy này?</span>' +
            '</div>'
            : '<div class="alert-duyetnoidung">' +
            '<span>- Bạn đang thực hiện thao tác yêu cầu sửa nội dung giảng dạy</span>' +
            '<span>- Chức năng nhận xét cho nội dung giảng dạy sẽ bị đóng</span>' +
            '<span>- Thao tác này không thể hoàn tác</span>' +
            '<span>- Bạn có chắc chắn yêu cầu sửa nội dung giảng dạy này?</span>' +
            '</div>';

        this.notificationService.confirm(confirm_data, 'Xác nhận hành động', [BUTTON_YES, BUTTON_NO]).then((a) => {
            if (a.name === 'yes') {
                this.notificationService.isProcessing(true);
                this.ovicDateTimeService.getCurrentDateTime().pipe(
                    mergeMap((_date) => {
                        return this.coursePlanActivitiesService.updateCoursePlanActivities(activity.id, { status: status, approved_by: this.auth.user.id, approved_at: this.helperService.stringToDateSql(_date.toString()) }).pipe(
                            mergeMap(() => {
                                return of(null);
                            })
                        );
                    })
                ).subscribe({
                    next: () => {
                        this.loadBaigiang();
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastSuccess('Cập nhật thành công');
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError('Cập nhật thất bại, Lỗi kết nối');
                    },
                });
            }
        });
    }

    actionViewComment(activity: CoursePlanActivities) {
        activity['expandView'] = !activity['expandView'];
    }

    openReply(comment: CoursePlanComment, index_comment: number) {
        comment['reply_open'] = !comment['reply_open'];
        this.selectedComment = comment;
        if (comment['reply_open'] === true) {
            this.loadReplyComment(this.selectedComment, index_comment);
        }
    }

    loadReplyComment(comment: CoursePlanComment, index_comment) {
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

        this.coursePlanCommentService.getCoursePlanCommentByPageNew(condition_comment).subscribe({
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
                    } else if (f.user_id === this.selectedMonhocThamdinh.course.creator_plan_id && this.auth.user.id !== f.user_id) {
                        f['display_name'] = this.selectedMonhocThamdinh.course['display_name'];
                    } else if (f.user_id === this.auth.user.id) {
                        f['display_name'] = 'Phản hồi của bạn';
                        f['my_reply_comment'] = true;
                    } else {
                        if (this.kd_hoidong || this.isManager || this.isDaotao) {
                            const index = this.list_thanhvien.findIndex((m) => m.user_id === f.user_id);
                            f['display_name'] = this.list_thanhvien[index]['display_name'];
                        } else {
                            if (comment.user_id === f.user_id) {
                                f['display_name'] = 'Ủy viên '.concat((index_comment + 1).toString());
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

    saveCommentReply(comment: CoursePlanComment, activity: CoursePlanActivities, index_comment: number) {
        const comment_content = comment['textarea_comment'] ? comment['textarea_comment'].trim() : comment['textarea_comment'].trim();

        if (comment_content && comment_content !== '') {
            const data_comment: CoursePlanComment = {
                course_plan_activity_id: activity.id,
                comment: comment_content,
                status: 0,
                user_id: this.auth.user.id,
                course_id: this.selectedMonhocThamdinh.course_id,
                parent_id: comment.id,
            };

            this.coursePlanCommentService.addCoursePlanComment(data_comment).subscribe({
                next: () => {
                    this.notificationService.toastSuccess('Đã gửi phản hồi thành công');
                    comment['textarea_comment'] = '';
                    this.loadReplyComment(this.selectedComment, index_comment);
                },
                error: () => {
                    this.notificationService.toastError('Lỗi kết nối, vui lòng thử lại');
                },
            });
        } else {
            this.notificationService.toastWarning('Vui lòng nhập phản hồi trước khi gửi');
        }
    }

    huyTrangThai(activity: CoursePlanActivities, status: number) {
        if (status === 1 && activity.old_status !== 1) {
            return this.notificationService.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
        }

        this.notificationService.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(mergeMap(_date => {
            return this.coursePlanActivitiesService.updateCoursePlanActivities(activity.id, {
                old_status: activity.status,
                status: status,
                accept_edit_id: this.auth.user.id,
                accept_edit_at: this.helperService.stringToDateSql(_date.toString())
            }).pipe(mergeMap(() => {
                return of(null);
            }))
        })).subscribe({
            next: () => {
                this.loadBaigiang();
                this.notificationService.toastSuccess('Cập nhật thành công');
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastError('Cập nhật thất bại, Lỗi kết nối');
            }
        })
    }

    onSelectFileReview(file: OvicDocument) {
        this.selectedFileReview = null;
        this.selectedFileReview = file;
        this.modalService.open(this.filesLessonReview(), LARGE_MODAL_OPTIONS);
    }
}
