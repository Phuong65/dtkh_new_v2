import { Component, inject, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ElnKhoaHoc } from "@shared/models/elng-khoa-hoc";
import { CoursePlanActivities } from "@shared/models/course-plan-activities";
import { DonVi } from "@shared/models/don-vi";
import {
    objectFillter
} from "@modules/admin/features/thongke-solieu-tonghop/ketqua-test-sinhvien/ketqua-test-sinhvien.component";
import { ElngUserProfile } from "@shared/models/elng-user-profile";
import { AuthService } from "@core/services/auth.service";
import { DonViService } from "@shared/services/don-vi.service";
import { ElnKhoaHocService } from "@shared/services/elearning-khoa-hoc.service";
import { CoursePlanActivitiesService } from "@shared/services/course-plan-activities.service";
import { CourseQuestionsService } from "@shared/services/course-questions.service";
import { NotificationService } from "@core/services/notification.service";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { ClassesService } from "@shared/services/classes.service";
import { ElngUserProfileService } from "@shared/services/elearning-user-profile.service";
import { OvicQueryCondition } from "@core/models/dto";
import { forkJoin, Observable, of, switchMap } from "rxjs";
import { map } from "rxjs/operators";
import { ConditionOption } from "@shared/models/condition-option";
import { CourseQuestions } from "@shared/models/course-questions";
import { ROLES } from '@modules/shared/utils/syscat';
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';

@Component({
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        PaginatorModule,
        DialogModule,
        MatProgressBarModule
    ],
    selector: 'app-ketqua-nghiemthu-cauhoi-kthp',
    templateUrl: './ketqua-nghiemthu-cauhoi-kthp.component.html',
    styleUrls: ['./ketqua-nghiemthu-cauhoi-kthp.component.css']
})

export class KetquaNghiemthuCauhoiKthpComponent implements OnInit, OnChanges {
    private auth = inject(AuthService);
    private donViService = inject(DonViService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private courseQuestionsService = inject(CourseQuestionsService);
    private noitifi = inject(NotificationService);
    private httpHelper = inject(HttpParamsHeplerService);
    private classesService = inject(ClassesService);
    private elngUserProfileService = inject(ElngUserProfileService);
    ds_dotCapnhat: ElnKhoaHoc[];
    list_cdr: ElnKhoaHoc[];
    list_cdr_clone: ElnKhoaHoc[];
    limitCourse: number = 20;
    totalCourse: number = 0;
    donviId: number;
    isManager: boolean;
    list_donvi_chuyenmon: DonVi[] = [];
    listHocky = [];
    listNamhoc = [];
    check_number_questions =
        [
            { title: 'Có câu hỏi ', value: 0 },
            { title: 'Chưa có câu hỏi ', value: 1 }
        ];
    type_have_question: number = 0;

    objectFilter: objectFillter = {
        category_id: 0,
        hocky: 0,
        namhoc: '0',
        dot_capnhat: '',
    };
    user_profile: ElngUserProfile;
    userId: number;
    isLanhDaoKhoa: boolean = false;
    progressValue: number = 0;
    displayModal: boolean = false;
    waitting_title: string = 'Vui lòng không tắt trình duyệt';
    constructor() {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin);
        if (this.isManager) {
            this.donviId = 105;
        }
        else {
            this.donviId = this.auth.user.donvi_id;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['parent_Khoa']) {
            this.donviId = changes['parent_Khoa'].currentValue;
            this.loadData();
        }

    }

    ngOnInit() {
        this.userId = this.auth.user.id;
        this.donviId = this.auth.user.donvi_id;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin);
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        // this.noitifi.isProcessing(true);
        this.initData();
    }

    onChangeDonviCM(event) {
        if (event) {
            this.objectFilter.category_id = event['id'];
        } else {
            this.objectFilter.category_id = null;
        }
        this.loadData();
    }


    // onChangeFilter(event, keyName: string) {
    //     if (event) {
    //         this.objectFilter[keyName] = event['value'];
    //     } else {
    //         this.objectFilter[keyName] = null;
    //     }
    //
    // }


    initData() {
        const condition_group_namhoc = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'namhoc').set("groupby", "namhoc").set("limit", -1);

        const condition_group_hocky = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'hocky').set("groupby", "hocky").set("limit", -1);

        const condition_donvi = this.httpHelper.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            { conditionName: 'parent_id', condition: OvicQueryCondition.equal, value: this.auth.user.donvi_id.toString(), orWhere: 'and' },
        ]).set("limit", -1)


        const arr_condition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            { conditionName: 'donvi_id', condition: OvicQueryCondition.equal, value: this.donviId.toString(), orWhere: 'and' },
        ];

        const condition_courses: ConditionOption = {
            condition: [
                {
                    condition: OvicQueryCondition.notEqual, conditionName: 'dot_capnhat', value: ''
                }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'orderby', value: 'dot_capnhat' },
                { label: 'order', value: 'ASC' },
                { label: 'groupby', value: 'dot_capnhat' },
                { label: 'select', value: 'id,dot_capnhat' },
            ],
            page: null,
        };

        forkJoin([
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
            this.donViService.getDonViByCols(condition_donvi),
            this.elngUserProfileService.getElngUserProfileByItem(this.userId.toString(), "user_id"),
            this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_courses)
            // this.elnChuyenMucService.getElnChuyenMucByCols(condition_nganh)

        ]).subscribe({
            next: ([_resNamhoc, _resHocky, _resCategory, _userProfile, _dot_capnhat]) => {
                this.ds_dotCapnhat = _dot_capnhat.data;
                this.user_profile = _userProfile[0];
                this.list_donvi_chuyenmon = _resCategory;
                if (this.list_donvi_chuyenmon.length) {
                    if (this.user_profile.donvi_chuyenmon_id) {
                        this.objectFilter.category_id = this.user_profile.donvi_chuyenmon_id;
                    } else {
                        this.objectFilter.category_id = this.list_donvi_chuyenmon[0].id;
                    }
                }

                this.objectFilter.dot_capnhat = _dot_capnhat.data ? _dot_capnhat.data[_dot_capnhat.data.length - 1].dot_capnhat : null;

                this.loadData();
                // this.noitifi.isProcessing(false);


            },
            error: () => { this.noitifi.isProcessing(false); this.noitifi.toastError("Lỗi kết nối"); }
        })
    }

    loadData() {
        //Load khoá học
        // this.noitifi.isProcessing(true);
        this.displayModal = true;
        this.waitting_title = "Đang tải dữ liệu, vui lòng không tắt trình duyệt";

        if (this.donviId || this.donviId === 0) {
            const condition_courses: ConditionOption = {
                condition: [
                    // { conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.objectFilter.category_id.toString() }
                ],
                set: [
                    { label: 'category_ids', value: this.objectFilter.category_id.toString() },
                    { label: 'dot_capnhat', value: this.objectFilter.dot_capnhat },
                    { label: 'order', value: 'ASC' },
                    { label: 'orderby', value: 'title' },

                ],
                page: null,
            };

            this.elnKhoaHocService.getTotalnghiemthuCauhoi(condition_courses).subscribe({
                next: (data) => {
                    this.list_cdr = data.map(m => {
                        m['_total_question'] = m['total'];
                        m['_result'] = m['total_question_success'] + ' - ' + m['total_question_fail'] + ' | ' + m['total_question_warning'];
                        m['_question_approved'] = m['total_question_success'];
                        m['_question_await_approved'] = m['total_question_warning'];
                        m['_question_not_achieved'] = m['total_question_fail'];
                        // total:67
                        // total_question_fail:0
                        // total_question_success:0
                        // total_question_warning:6
                        return m;
                    });
                    // this.type_have_question = 0;
                    this.list_cdr_clone = this.list_cdr.filter(f => this.type_have_question === 0 ? f['_total_question'] !== 0 : f['_total_question'] === 0);

                    this.progressValue = 100;
                    this.displayModal = false;
                },
                error: () => {
                    this.list_cdr = [];
                    this.list_cdr_clone = [];
                    this.noitifi.isProcessing(false);
                    this.displayModal = false;
                }
            })


        }
    }


    changDrd(event) {
        this.type_have_question = event ? event.value : null;
        if (this.type_have_question === 0) {
            this.list_cdr_clone = this.list_cdr.filter(f => f['_total_question'] !== 0);
        } else if (this.type_have_question === 1) {
            this.list_cdr_clone = this.list_cdr.filter(f => f['_total_question'] === 0);
        }
        else {
            this.list_cdr_clone = this.list_cdr;
        }

    }

    onChangeFilter(event, keyName: string) {

        if (event) {
            this.objectFilter[keyName] = event['dot_capnhat'];
        } else {
            this.objectFilter[keyName] = null;
        }
        this.loadData();

    }
}
