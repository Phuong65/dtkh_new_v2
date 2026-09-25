
import { CourseQuestionsService } from '@modules/shared/services/course-questions.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CourseThanhvien } from "@shared/models/course_thanhvien";
import { CoursePlanActivities } from "@shared/models/course-plan-activities";
import { CoursePlanActivitiesService } from "@shared/services/course-plan-activities.service";
import { forkJoin, from, mergeMap, Observable, of, toArray } from "rxjs";
import { CoursePlanComment } from "@shared/models/course-plan-comment";
import { CoursePlanCommentService } from "@shared/services/course-plan-comment.service";
import { map } from "rxjs/operators";
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { HelperService } from '@core/services/helper.service';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { BUTTON_YES, BUTTON_NO } from '@core/models/buttons';
import { OvicDateTimeService } from '@modules/shared/services/ovic-date-time.service';
import { AuthService } from '@core/services/auth.service';
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ROLES } from '@modules/shared/utils/syscat';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule],
    selector: 'ket-qua-tham-dinh',
    templateUrl: './ket-qua-tham-dinh.component.html',
    styleUrls: ['./ket-qua-tham-dinh.component.css']
})

export class KetQuaThamDinhComponent implements OnInit, OnChanges {

    @Input() coursePlan: CoursePlanActivities;

    @Input() listThamDInh: CourseThanhvien[];

    @Input() courseSelected: ElnKhoaHoc;

    _coursePlan: CoursePlanActivities;
    _courseThanhVien: CourseThanhvien[];
    selectedCourse: ElnKhoaHoc;
    dataCDR: CoursePlanActivities[] = [];
    dataContentOrther: CoursePlanActivities[] = [];
    headerTable: { label: string, type: string }[] = [];
    headerTableContentOrther: { label: string, type: string }[] = [];
    dataAllContent: CoursePlanActivities[] = [];
    typeShow: "PLAN" | "ALL" = "PLAN";

    question_info = {
        dat: 0,
        lamlai: 0,
        chuadat: 0,
        tong: 0,

    }

    rejectRole: boolean = false;

    constructor(
        private coursePlanActivitiesService: CoursePlanActivitiesService,
        private coursePlanCommentService: CoursePlanCommentService,
        private noitifi: NotificationService,
        private helperService: HelperService,
        private courseQuestionsService: CourseQuestionsService,
        private ovicDateTimeService: OvicDateTimeService,
        private auth: AuthService
    ) {
        this.rejectRole = this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.lanhdaokhoa) || this.auth.userHasRole(ROLES.lanhdaobomon) ? true : false;
    }

    ngOnChanges(changes: SimpleChanges): void {

        if (changes['coursePlan'] || changes['listThamDInh']) {

            this._coursePlan = this.coursePlan;

            this._courseThanhVien = this.listThamDInh;

            this.selectedCourse = this.courseSelected;

            this.headerTable = [
                { label: 'CELO', type: '' },
                { label: 'KẾT QUẢ CẤP KHOA', type: '' },
                { label: 'KẾT QUẢ CẤP TRƯỜNG', type: '' },
            ]

            this.headerTableContentOrther = [
                { label: 'Nội dung khác', type: '' },
                { label: 'KẾT QUẢ CẤP KHOA', type: '' },
                { label: 'KẾT QUẢ CẤP TRƯỜNG', type: '' },
            ]

            if (this._courseThanhVien && this._courseThanhVien.length > 0) {

                this.sapxepThanhVien(this._courseThanhVien);


                this._courseThanhVien.forEach(e => {
                    this.headerTable.push({
                        label: e['display_name'],
                        type: e.vaitro === 'CHUTICH' ? '(Chủ tịch HĐ)' : (e.vaitro === 'UYVIEN' ? '( Ủy viên )' : ''),
                    })
                    this.headerTableContentOrther.push(
                        {
                            label: e['display_name'],
                            type: e.vaitro === 'CHUTICH' ? '(Chủ tịch HĐ)' : (e.vaitro === 'UYVIEN' ? '( Ủy viên )' : ''),
                        }
                    )
                })
            }

            if (this._coursePlan.id === 0) {
                this.loadParent(this._coursePlan)
            } else {
                this.load(this._coursePlan);
            }
        }
    }

    ngOnInit(): void {
        this.dataCDR = [];
        this.dataContentOrther = [];
        this.dataAllContent = [];
    }

    load(item: CoursePlanActivities) {
        this.noitifi.isProcessing(true);

        // const condition_get_cdr: ConditionOption = {
        //     condition: [
        //         { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: item.id.toString() },
        //         { conditionName: 'type', condition: OvicQueryCondition.equal, value: 'ACTIVITY_CDR', orWhere: 'and' },
        //         { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
        //     ],
        //     set: [
        //         { label: 'limit', value: '-1' },
        //     ],
        //     page: null
        // }



        forkJoin([
            this.coursePlanActivitiesService.getCoursePlanActivitiesByparendIdAndType(item.id,).pipe(mergeMap(_res => {
                const reference_ids = [];
                _res.forEach(f => {
                    if (f.type === 'ACTIVITY_CDR')
                        reference_ids.push(f.id);
                })
                const condition_question: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: item.course_id.toString() },
                        { conditionName: 'reference', condition: OvicQueryCondition.equal, value: 'course_plan_activities', orWhere: 'and' },
                        { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-3', orWhere: 'and' }
                        // { conditionName: 'group_id', condition: this.selectedCourse.av === 0 ? OvicQueryCondition.equal : OvicQueryCondition.notEqual, value: '0', orWhere: 'and' },
                    ],

                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'include', value: reference_ids.toString() },
                        { label: 'include_by', value: 'reference_id' }
                    ],

                    page: null
                }

                return this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question).pipe(mergeMap(_question => {
                    // if ( this.selectedCourse.av !== 1 ) {
                    this.question_info.tong = _question.data.filter(m => m.group_id === 0).length;
                    this.question_info.chuadat = _question.data.filter(m => m.group_id === 0 && (m.status_captruong === 0 || m.status_captruong === -2)).length;
                    this.question_info.dat = _question.data.filter(m => m.group_id === 0 && m.status_captruong === 1).length;
                    this.question_info.lamlai = _question.data.filter(m => m.group_id === 0 && m.status_captruong === -1).length;
                    // } else {
                    //     this.question_info.tong = _question
                    // }

                    return of(_res);

                }))
            })),
            this.coursePlanCommentService.getCoursePlanCommentByCourse_idAndCourse_plan_activity_id(item.course_id, item.id, true),
            // this.courseQuestionsService.getCourseQuestionsByPageNew(condition_question)
        ]).subscribe({
            next: ([activity, comment]) => {

                const dataActivity = activity ? activity.map(m => {
                    m['_status_class'] = m.status_captruong === 1 ? 'Dat' : (m.status_captruong === 0 ? 'choduyet' : (m.status_captruong === -1 ? 'chuadat' : ''))
                    m['_status_label'] = m.status_captruong === 1 ? 'Đạt' : (m.status_captruong === 0 ? ' Chờ duyệt ' : (m.status_captruong === -1 ? ' Chưa đạt' : '_'));
                    m['_status_class'] = m.status_captruong === -2 ? 'dasua' : m['_status_class'];
                    m['_status_label'] = m.status_captruong === -2 ? 'Đã sửa' : m['_status_label'];

                    const _comment_cdr = comment.filter(i => i.course_plan_activity_id === m.id || i.course_plan_activity_id === m.course_plan_activity_id);

                    this._courseThanhVien.sort((a, b) => {
                        if (a.vaitro === "CHUTICH" && b.vaitro !== "CHUTICH") {
                            return -1;
                        }
                        if (a.vaitro !== "CHUTICH" && b.vaitro === "CHUTICH") {
                            return 1;
                        }
                        return 0;
                    }).forEach(a => {
                        m[a.vaitro + a.user_id] = _comment_cdr.findIndex(i => i.user_id === a.user_id) !== -1 ? 'Đã nhận xét' : 'Chưa nhận xét';
                        m[(a.vaitro + a.user_id).concat('_class')] = _comment_cdr.findIndex(i => i.user_id === a.user_id) !== -1 ? 'danhanxet' : 'chuanhanxet';
                    })

                    m['stt'] = m.kyhieu ? m.kyhieu.replace(/\D/g, '') : 0;

                    return m;
                }) : [];
                const data_cdr = dataActivity && dataActivity.length ? dataActivity.filter(f => f.type === "ACTIVITY_CDR") : [];
                this.dataCDR = this.helperService.sort(data_cdr, 'stt');
                this.dataContentOrther = dataActivity && dataActivity.length ? dataActivity.filter(f => f.type === "MUCTIEU" || f.type === "ACTIVITY") : [];
                this.noitifi.isProcessing(false);
            }, error: (e) => {
                this.dataCDR = [];
                this.dataContentOrther = [];
                this.noitifi.isProcessing(false);
                this.noitifi.toastError("Lỗi kết nối, vui lòng thử lại");
            }
        })

    }

    sapxepThanhVien(data: CourseThanhvien[]): CourseThanhvien[] {
        return data.sort((a, b) => {
            if (a.vaitro === "CHUTICH" && b.vaitro !== "CHUTICH") {
                return -1;
            }
            if (a.vaitro !== "CHUTICH" && b.vaitro === "CHUTICH") {
                return 1;
            }
            return 0;
        })
    }

    loadParent(item: CoursePlanActivities): void {
        this.noitifi.isProcessing(true);
        this.coursePlanActivitiesService.getCoursePlanActivityBycourseId(item.course_id, item.type).pipe(
            mergeMap(m => from(m).pipe(
                mergeMap(a => this.getDataActivity(a)),
                toArray()
            ))
        ).subscribe({
            next: (data) => {
                this.dataAllContent = data.sort((a, b) => (a.week - b.week)).map(m => {
                    const child = m['__data'];
                    const cdr = child.length > 0 ? child.filter(f => f.type === 'ACTIVITY_CDR') : [];
                    const muctieu = child.length > 0 ? child.filter(f => f.type === 'MUCTIEU') : [];
                    const tailieu = child.length > 0 ? child.filter(f => f.type === 'ACTIVITY') : [];
                    const baitap = child.length > 0 ? child.filter(f => f.type === 'ACTIVITY_TEST') : [];
                    m['_cdr'] = cdr && cdr.length > 0 ? (cdr.filter(a => a.status_captruong === 1).length === cdr.length ? ' Đạt ' : (cdr.filter(a => a.status_captruong === 1).length + '/' + cdr.length)) : '-';
                    m['_cdr_class'] = cdr && cdr.length > 0 ? (cdr.filter(a => a.status_captruong === 1).length === cdr.length ? ' DAT ' : '') : '';

                    m['_muctieu'] = '-' //muctieu && muctieu.length > 0 ? (muctieu.filter(a => a.status_captruong === 1).length === muctieu.length ? ' Đạt ' : (muctieu.filter(a => a.status_captruong === 1).length + '/' + muctieu.length)) : '-';
                    m['_muctieu_class'] = muctieu && muctieu.length > 0 ? (muctieu.filter(a => a.status_captruong === 1).length === muctieu.length ? ' DAT ' : '') : '';

                    m['_tailieu'] = '-' // tailieu && tailieu.length > 0 ? (tailieu.filter(a => a.status_captruong === 1).length === tailieu.length ? ' Đạt ' : (tailieu.filter(a => a.status_captruong === 1).length + '/' + tailieu.length)) : '-';
                    m['_tailieu_class'] = tailieu && tailieu.length > 0 ? (tailieu.filter(a => a.status_captruong === 1).length === tailieu.length ? ' DAT ' : '') : '';

                    m['_baitap'] = '-' // baitap && baitap.length > 0 ? (baitap.filter(a => a.status_captruong === 1).length === baitap.length ? ' Đạt ' : (baitap.filter(a => a.status_captruong === 1).length + '/' + baitap.length)) : '-';
                    m['_baitap_class'] = baitap && baitap.length > 0 ? (baitap.filter(a => a.status_captruong === 1).length === baitap.length ? ' DAT ' : '') : '';

                    return m;
                })
                this.noitifi.isProcessing(false);
            },
            error: (err) => {
                this.dataAllContent = [];
                this.noitifi.isProcessing(false);
            }
        });
    }

    private getDataActivity(item: CoursePlanActivities): Observable<CoursePlanActivities> {
        return this.coursePlanActivitiesService.getCoursePlanActivitiesByparendIdAndType(item.id,).pipe(
            map(m => {
                item['__data'] = m.filter(f => f.type === "MUCTIEU" || f.type === "ACTIVITY" || f.type === "ACTIVITY_TEST" || f.type === 'ACTIVITY_CDR');
                return item;
            })
        );
    }

    huyTrangThai(activity: CoursePlanActivities, status: number) {
        // this.noitifi.confirm( '<div class="alert-duyetnoidung">' +
        //     '<span>- Bạn đang thực hiện thao tác đưa nội dung về trạng thái chờ duyệt</span>' +
        //     '<span>- Bạn có chắc chắn thực hiện thao tác này?</span>' +
        //     '</div>', 'Xác nhận hành động', [ BUTTON_YES, BUTTON_NO ] ).then( a => {
        //         if ( a.name === 'yes' ) {

        //         }
        //     } )

        if (status === 1 && activity.old_status !== 1) {
            return this.noitifi.toastWarning("Nội dung này chưa từng được duyệt, không thể khóa");
        }

        this.noitifi.isProcessing(true);
        this.ovicDateTimeService.getCurrentDateTime().pipe(mergeMap(_date => {
            return this.coursePlanActivitiesService.updateCoursePlanActivities(activity.id, { old_status: activity.status_captruong, status: status, accept_edit_id: this.auth.user.id, accept_edit_at: this.helperService.stringToDateSql(_date.toString()) }).pipe(mergeMap(() => {
                return of(null);
            }))
        })).subscribe({
            next: () => {
                this.load(this._coursePlan);
                this.noitifi.isProcessing(false);
                this.noitifi.toastSuccess('Cập nhật thành công');
            },
            error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastError('Cập nhật thất bại, Lỗi kết nối');
            }
        })
    }

    // reDoStatus ( activity ) {
    //     this.noitifi.isProcessing( true );
    //     this.ovicDateTimeService.getCurrentDateTime().pipe( mergeMap( _date => {
    //         return this.coursePlanActivitiesService.updateCoursePlanActivities( activity.id, { old_status: activity.status_captruong, status: 1, accept_edit_id: this.auth.user.id, accept_edit_at: this.helperService.stringToDateSql( _date.toString() ) } ).pipe( mergeMap( () => {
    //             return of( null );
    //         } ) )
    //     } ) ).subscribe( {
    //         next: () => {
    //             this.load( this._coursePlan );
    //             this.noitifi.isProcessing( false );
    //             this.noitifi.toastSuccess( 'Cập nhật thành công' );
    //         },
    //         error: () => {
    //             this.noitifi.isProcessing( false );
    //             this.noitifi.toastError( 'Cập nhật thất bại, Lỗi kết nối' );
    //         }
    //     } )
    // }

}
