import { Component, inject, OnInit, viewChild } from '@angular/core';
import { Paginator, PaginatorModule } from "primeng/paginator";
import { Classes } from "@shared/models/classes";
import { FormBuilder } from "@angular/forms";
import { ElnKhoaHoc, EXAMFORMAT } from "@shared/models/elng-khoa-hoc";
import { User } from "@core/models/user";
import { OvicFlexibleColumn } from "@shared/models/ovic-flexible-table";
import { ElngUserProfile } from "@shared/models/elng-user-profile";
import { DonVi } from "@shared/models/don-vi";
import { AuthService } from "@core/services/auth.service";
import { ElnKhoaHocService } from "@shared/services/elearning-khoa-hoc.service";
import { UserService } from "@core/services/user.service";
import { DomSanitizer } from "@angular/platform-browser";
import { ElngUserProfileService } from "@shared/services/elearning-user-profile.service";
import { NotificationService } from "@core/services/notification.service";
import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { DonViService } from "@shared/services/don-vi.service";
import { forkJoin, of } from "rxjs";
import { OvicQueryCondition } from "@core/models/dto";
import { ConditionOption } from "@shared/models/condition-option";
import { map } from "rxjs/operators";
import { CoursePlanActivities } from "@shared/models/course-plan-activities";
import { CoursePlanActivitiesService } from "@shared/services/course-plan-activities.service";
import { ExportDiemthuongxuyenService } from "@shared/services/export-diemthuongxuyen.service";
import { ExportNoidongDecuongByHtmlService } from "@shared/services/export-noidong-decuong-by-html.service";
import { Courses, CoursesService } from "@shared/services/courses.service";
import { CHUAN_DAU_RA, ROLES } from "@shared/utils/syscat";
import { ElnChuyenMucService } from "@shared/services/elearning-chuyen-muc.service";
import { ThiFormDetailsService } from "@shared/services/thi-form-details.service";
import { CourseFormCcService } from "@shared/services/course-form-cc.service";
import { CourseFormTx, CourseFormTxService } from "@shared/services/course-form-tx.service";
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { MatListModule } from '@angular/material/list';
import { Route, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

interface WeekOfRubickThiFOrm {
    week: number;
    cdr_biet: number | string;
    cdr_hieu: number | string;
    cdr_vandung: number | string;
    cdr_phantich: number | string;
    cdr_danhgia: number | string;
    cdr_sangtao: number | string;
    cdr_total: number | string;
}

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, MatListModule, PaginatorModule, ButtonModule],
    selector: 'app-quanly-noidung-decuong',
    templateUrl: './quanly-noidung-decuong.component.html',
    styleUrls: ['./quanly-noidung-decuong.component.css']
})
export class QuanlyNoidungDecuongComponent implements OnInit {

    private auth = inject(AuthService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private userService = inject(UserService);
    protected sanitizer = inject(DomSanitizer);
    private elngUserProfileService = inject(ElngUserProfileService);
    private noitifi = inject(NotificationService);
    private donViService = inject(DonViService);
    private coursePlanActivitiesService = inject(CoursePlanActivitiesService);
    private exportWord = inject(ExportDiemthuongxuyenService);
    private exportNoidongDecuongByHtmlService = inject(ExportNoidongDecuongByHtmlService);
    private coursesService = inject(CoursesService);
    private httpHepler = inject(HttpParamsHeplerService);
    private elnChuyenMucService = inject(ElnChuyenMucService);
    private thiFormDetailsService = inject(ThiFormDetailsService);
    private courseFormCcService = inject(CourseFormCcService);
    private courseFormTxService = inject(CourseFormTxService);
    private router = inject(Router);
    public formBuilder = inject(FormBuilder);

    paginator = viewChild<Paginator>('paginator');

    closeLeft: boolean = false;
    courseSelect: Courses;
    isUpdated = false;
    isAdmin = false;
    slugIsValid = true;
    userId: number = 0;
    donviId: number = 0;
    isManager = false;
    classIdQuerryParam: number;
    formTitle: string;
    listClass: Classes[];
    listCourse: ElnKhoaHoc[] = [];
    listTeacher: User[] = [];
    profile: User;
    arrayYear = [];
    selectedYear: string;
    progressValue = 0;
    startProgress = false;
    countProgressValue = 0;
    listHocky = [];
    listNamhoc = [];
    objectFilter = {};
    isGrid = false;
    cols: OvicFlexibleColumn[];
    duplicateStudent = [];
    pageIndex = 0;
    limitList = 20;
    isLanhDaoKhoa = false;
    canAdd = false;
    user_profile: ElngUserProfile;
    list_donvi_chuyenmon: DonVi[];
    select_page: number = 0;
    objectRoles = {};
    donvi_chuyenmon_id: number;
    dmKhoahoc: ElnKhoaHoc[];
    totalCourse: number;
    htmlBySelectClass: string = '';
    bomon_id: number;
    isLanhDaoBomon: boolean = false;
    constructor(
    ) {

        // const url = this.router.url.substring(7).split('?')[0];
        // this.canAdd = this.auth.userCanAdd(url);
        this.profile = this.auth.user;
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
    }


    ngOnInit(): void {
        this.loadUserInfo();
    }

    loadUserInfo() {
        this.noitifi.isProcessing(true);
        const condition_donvi = this.httpHepler.paramsConditionBuilder([
            { conditionName: 'status', condition: OvicQueryCondition.greaterThan, value: '0', orWhere: 'and' },
            {
                conditionName: 'parent_id',
                condition: OvicQueryCondition.equal,
                value: this.auth.user.donvi_id.toString(),
                orWhere: 'and'
            },
        ]).set("limit", -1).set("order", "ASC").set("orderby", "title");

        forkJoin([
            this.elngUserProfileService.getElngUserProfileByCol('user_id', this.auth.user.id.toString()),
            this.donViService.getDonViByCols(condition_donvi)
        ]).subscribe(([_resUser, _resDonvi]) => {
            this.donvi_chuyenmon_id = _resUser[0] && _resUser[0].donvi_chuyenmon_id ? _resUser[0].donvi_chuyenmon_id : 0;
            this.bomon_id = _resUser[0] && _resUser[0].bomon_id ? _resUser[0].bomon_id : 0;
            this.list_donvi_chuyenmon = _resDonvi;
            this.loadPageData(1);
        })
    }

    loadPageData(start) { // start = page;
        //let category_id = this.auth.user.donvi_ids && this.auth.user.donvi_ids[0] ? this.auth.user.donvi_ids[0].toString() : null;
        const arrayCondition = [
            { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
        ];

        const likeSearch = ['title', 'creator_name', 'maso'];
        Object.keys(this.objectFilter).forEach(f => {
            if (likeSearch.findIndex(i => i === f) !== -1) {
                arrayCondition.push({
                    conditionName: f,
                    condition: OvicQueryCondition.like,
                    value: '%'.concat(this.objectFilter[f].toString(), '%'),
                    orWhere: 'and'
                },);
            } else {
                arrayCondition.push({
                    conditionName: f,
                    condition: OvicQueryCondition.equal,
                    value: this.objectFilter[f].toString(),
                    orWhere: 'and'
                },);
            }
        })

        if (!this.isManager && this.isLanhDaoKhoa) {
            arrayCondition.push({
                conditionName: 'category_ids',
                condition: OvicQueryCondition.equal,
                value: this.donvi_chuyenmon_id.toString(),
                orWhere: 'and'
            });
        }

        if (!this.isManager && !this.isLanhDaoKhoa && !this.isLanhDaoBomon) {
            arrayCondition.push({
                conditionName: 'creator_plan_id',
                condition: OvicQueryCondition.equal,
                value: this.auth.user.id.toString(),
                orWhere: 'and'
            });
        }

        let setCondition = [];
        setCondition.push({ label: 'orderby', value: 'title' });

        forkJoin([
            this.elnKhoaHocService.getKhoaHocByPageNew(arrayCondition, start, setCondition),
        ]).subscribe({
            next: ([_resCourse]) => {
                // this.dmChuyenmuc = this.sortData(_resChuyenmuc);
                const tmpData = [];
                let teacher_ids = [0];
                const courses_ids = [0];
                const chuyenmuc_ids = [];
                let bomon_ids = [0];
                _resCourse.data.forEach((f, key) => {
                    // const teacher_ids_re = f.teacher_ids ? f.teacher_ids.split("|").filter(m => m && m !== '') : [];
                    teacher_ids.push(f.creator_plan_id);
                    courses_ids.push(f.id);
                    chuyenmuc_ids.push(f.category_ids);
                    f['show_name'] = '['.concat(f.maso, '] - ', f.title);
                    bomon_ids.push(f.nganh_bomon_id);
                    if (f.params) {
                        if (f.params.sotinchi) {
                            f['sotinchi'] = f.params.sotinchi;
                        }

                        if (f.params.exam_format) {
                            const index = EXAMFORMAT.findIndex(m => m.key === f.params.exam_format);
                            if (index !== -1) {
                                f['hinhthucthi'] = EXAMFORMAT[index].label;
                            }
                        }

                        if (f.params.cdr) {
                            const index = CHUAN_DAU_RA.findIndex(m => m.id === f.params.cdr);
                            if (index !== -1) {
                                f['chuandaura'] = CHUAN_DAU_RA[index].label;
                            }
                        }


                    }
                })


                bomon_ids = [...new Set(bomon_ids)];

                const condition_bomon: ConditionOption = {
                    condition: [],
                    set: [
                        { label: 'include', value: bomon_ids.toString() },
                        { label: 'include_by', value: 'id' }
                    ],
                    page: null
                }

                teacher_ids = [...new Set(teacher_ids)];
                forkJoin([
                    // this.elnBaiHocService.getElnBaiHocByCols(conditionLesson),

                    this.userService.getUserByItem(teacher_ids.toString(), "id"),
                    this.elnChuyenMucService.getChuyemucByPageNew(condition_bomon)
                ]).subscribe({
                    next: ([_resTeacher, _bomon]) => {
                        const result = [];
                        const _index_start = (start - 1) * 20;
                        _resCourse.data.forEach((f, key) => {
                            f["index_"] = _index_start + key + 1;
                            if (!f.checkedVideo) {
                                if (f.video_introduce && f.video_introduce.length !== 0) {
                                    f['checkedVideo'] = 'có';
                                } else {
                                    f['checkedVideo'] = 'không';
                                }
                            }

                            const index_category = f.category_ids ? this.list_donvi_chuyenmon.findIndex(m => m.id.toString() === f.category_ids.toString()) : -1;

                            f['category_name'] = index_category !== -1 ? this.list_donvi_chuyenmon[index_category].title : '';

                            f['editor_name'] = '';
                            const index_teacher = _resTeacher.findIndex(m => m.id === f.creator_plan_id);
                            if (index_teacher !== -1) {
                                f['editor_name'] = _resTeacher[index_teacher].display_name;
                            }

                            const _index_bomon = _bomon.data.findIndex(m => m.id === f.nganh_bomon_id);
                            if (_index_bomon !== -1) {
                                f['bomon_name'] = _bomon.data[_index_bomon].title;
                            }
                            // f['_categories'] = this.list_donvi_chuyenmon && this.list_donvi_chuyenmon.find(a => a.id === f.category_ids) ? this.list_donvi_chuyenmon.find(a => a.id === f.category_id).title.toUpperCase() : '';

                            result.push(f);
                        });

                        this.listTeacher = _resTeacher.filter(m => m.status !== -1).map(m => {
                            m['newName'] = m.display_name.concat(" (", m.email, ")");
                            return m
                        });
                        this.dmKhoahoc = result;
                        this.noitifi.isProcessing(false);
                    },
                    error: () => {
                        this.noitifi.isProcessing(false);
                        this.noitifi.toastError("Lỗi kết nối");
                    }
                })
                this.totalCourse = _resCourse.recordsFiltered;
            },
            error: () => {
                this.noitifi.toastError("Lỗi kết nối");
            }
        })
    }

    changePage(event) {
        this.select_page = event.page;

        this.loadPageData(event.page + 1);

        // this.loadPageData(event.page + 1);
    }

    searchClass(event) {
        if (event) {
            this.objectFilter['title'] = event.target.value;
        }
        // this.loadPageData( this.select_page + 1 );
        this.loadPageData(1);
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onSelectCorse(event) {
        this.courseSelect = event.source['_value'][0];
        this.btnGetDataCourse(this.courseSelect);
    }

    selectCourse(course: any) {
        this.courseSelect = course;
        this.btnGetDataCourse(this.courseSelect);
    }

    btnGetDataCourse(data: Courses) {
        this.htmlBySelectClass = '';

        const condition_course_plan: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: data.id.toString(),
                    orWhere: 'and'
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' },
            ],
            page: '1'
        };

        const condition_course_plan_activities: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: data.id.toString(),
                    orWhere: 'and'
                },
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.notEqual,
                    value: '-3',
                    orWhere: 'and'
                },
                {
                    conditionName: 'week',
                    condition: OvicQueryCondition.lessThan,
                    value: '100',
                    orWhere: 'and'
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' },
            ],
            page: '1'
        };
        this.noitifi.isProcessing(true);

        const condition_thi_formDetails: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: data.id.toString(),
                    orWhere: 'and'
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' },
            ],
            page: '1'
        };
        const condition_course_thi_cc: ConditionOption = {
            condition: [
                {
                    conditionName: 'course_id',
                    condition: OvicQueryCondition.equal,
                    value: data.id.toString(),
                    orWhere: 'and'
                },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'week' },
            ],
            page: '1'
        };


        forkJoin([
            of(data),
            this.coursePlanActivitiesService.getCoursePlanActivitiesByPageNew(condition_course_plan_activities).pipe(map(m => m.data)),
            this.thiFormDetailsService.getThiFormDetailsByPageNew(condition_thi_formDetails).pipe(map(m => m.data)),
            this.courseFormCcService.getCoursePlansByPageNew(condition_course_thi_cc).pipe(map(m => m.data)),
            this.courseFormTxService.getCoursePlansByPageNew(condition_course_thi_cc).pipe(map(m => m.data))
        ]).subscribe({
            next: ([course, coursePlanAtivities, thiForm, courseFormCc, courseFormTx]) => {

                const courseFormCcConvert = courseFormCc.map(m => {
                    m['_child'] = courseFormCc.filter(f => f.child_question_take === m.id)
                    m['_total_child'] = m['child_question_take'] === 0 ? m['question_take'] : m['question_take'] * m['child_question_take'];
                    return m;
                }).filter(f => f.child_question_take === 0);

                const parent_plan = coursePlanAtivities.filter((m) => m.parent_id === 0);
                parent_plan.forEach((f, key) => {
                    f['children'] = coursePlanAtivities.filter((m) => m.parent_id === f.id && m.type !== 'ACTIVITY_CDR');
                    if (f.children.length) {
                        f.children.forEach((c) => {
                            c['week'] = f.week;
                            switch (c['type']) {
                                case 'MEET':
                                    c['icon'] = 'fa fa-video-camera';
                                    break;
                                case 'ACTIVITY_TEST':
                                    c['icon'] = 'fa fa-clock-o';
                                    // const index_class_plan = _class_plan.findIndex(m => m.course_plan_activity_id === f.id);
                                    // if (index_class_plan !== -1) {
                                    //     c['start_test'] = true;
                                    //     c['start_date'] = _class_plan[index_class_plan].teaching_day;
                                    //     f['class_plan'] = _class_plan[index_class_plan];
                                    // } else {
                                    //     c['start_test'] = false;
                                    //     c['start_date'] = null;
                                    // }


                                    break;
                                case 'THUONGXUYEN_TRACNGHIEM':
                                    c['icon'] = 'fa fa-clock-o';
                                    break;
                                case 'THUONGXUYEN_TULUAN':
                                    c['icon'] = 'fa fa-pencil-square-o';
                                    break;
                                case 'ACTIVITY':
                                    c['icon'] = c['video'] && Object.keys(c['video']).length ? 'fa fa-file-video-o' : 'fa fa-file-text-o';
                                    break;
                                case 'MUCTIEU':
                                    c['icon'] = c['video'] && Object.keys(c['video']).length ? 'fa fa-file-video-o' : 'fa fa-file-text-o';
                                    break;
                                case 'GIOITHIEU':
                                    c['icon'] = c['video'] && Object.keys(c['video']).length ? 'fa fa-file-video-o' : 'fa fa-file-text-o';
                                    break;
                                default:
                                    break;
                            }
                        });

                        if (f.week !== 0 && f.week !== 1000) {
                            const CDR: CoursePlanActivities = {
                                id: f.id - 0.5,
                                course_id: data.id,
                                parent_id: f.id,
                                type: 'CDR',
                                ordering: 0,
                                title: 'Nội dung',
                                desc: '',
                                params: null,
                                video: null,
                                files: [],
                                status: 1,
                                icon: 'fa fa-list-alt',
                                children: coursePlanAtivities.filter((m) => m.parent_id === f.id && m.type === 'ACTIVITY_CDR'),
                                week: f.week,
                                course_lesson_id: 0,
                                desc_title: '',
                                edit: 0,
                                slides: []
                            };


                            f['children'].splice(1, 0, CDR);
                        }
                    }

                });

                const arrWeekThiForm: WeekOfRubickThiFOrm[] = [];
                const arrCourseFormCC: WeekOfRubickThiFOrm[] = [];
                for (let i = 1; i <= parseInt(course['params']['sotinchi']) * 3; i++) {
                    const item: WeekOfRubickThiFOrm = {
                        week: i,
                        cdr_biet: thiForm.filter(a => a.week === i && a.cdr === 1).reduce((sum, item) => sum + item.total_question_take, 0),
                        cdr_hieu: thiForm.filter(a => a.week === i && a.cdr === 2).reduce((sum, item) => sum + item.total_question_take, 0),
                        cdr_vandung: thiForm.filter(a => a.week === i && a.cdr === 3).reduce((sum, item) => sum + item.total_question_take, 0),
                        cdr_phantich: thiForm.filter(a => a.week === i && a.cdr === 4).reduce((sum, item) => sum + item.total_question_take, 0),
                        cdr_danhgia: thiForm.filter(a => a.week === i && a.cdr === 5).reduce((sum, item) => sum + item.total_question_take, 0),
                        cdr_sangtao: thiForm.filter(a => a.week === i && a.cdr === 6).reduce((sum, item) => sum + item.total_question_take, 0),
                        cdr_total: thiForm.filter(a => a.week === i).reduce((sum, item) => sum + item.total_question_take, 0)
                    }
                    arrWeekThiForm.push(item)


                    const itemOfForm: WeekOfRubickThiFOrm = {
                        week: i,
                        cdr_biet: this.convenrtCouseFormCC(course['av'], courseFormCcConvert, i, 1),
                        // course['av']=== 1? 0: courseFormCcConvert.filter(a=>a.week === i && a.cdr === 1).length
                        cdr_hieu: this.convenrtCouseFormCC(course['av'], courseFormCcConvert, i, 2),
                        cdr_vandung: this.convenrtCouseFormCC(course['av'], courseFormCcConvert, i, 3),
                        cdr_phantich: this.convenrtCouseFormCC(course['av'], courseFormCcConvert, i, 4),
                        cdr_danhgia: this.convenrtCouseFormCC(course['av'], courseFormCcConvert, i, 5),
                        cdr_sangtao: this.convenrtCouseFormCC(course['av'], courseFormCcConvert, i, 6),
                        cdr_total: this.totalKeyInArr(courseFormCcConvert.filter(f => f.week === i), '_total_child')
                    }

                    arrCourseFormCC.push(itemOfForm);
                }


                if (course && parent_plan.length > 0) {
                    this.noitifi.isProcessing(false);

                    // this.exportWord.exportDataByWord(data,parent_plan,data.name);
                    if (this.htmlBySelectClass) {
                        this.htmlBySelectClass = '';
                    }

                    this.htmlBySelectClass = this.exportHtmlToWord(data, parent_plan, data.title, arrWeekThiForm, arrCourseFormCC, courseFormTx);


                    if (this.htmlBySelectClass) {
                        setTimeout(() => {
                            const iframe: HTMLIFrameElement = document.createElement('iframe');
                            iframe.srcdoc = this.htmlBySelectClass;
                            iframe.style.width = '100%';
                            iframe.style.height = '100%';
                            iframe.style.overflow = 'hidden';
                            iframe.style.overflowY = 'auto';
                            iframe.style.padding = '20px 20px 20px 30px';
                            iframe.style.border = '1px solid #ccc';
                            document.getElementById('show_content_html').append(iframe);
                        }, 1000);

                    }

                } else {
                    this.noitifi.isProcessing(false);
                    this.noitifi.toastWarning('Môn học chưa có dữ liệu ');
                }
            }, error: () => {
                this.noitifi.isProcessing(false);
                this.noitifi.toastWarning('Load dữ liệu không thành công');

            }
        })

    }

    exportHtmlToWord(cl: Courses, coursePlanActivity: CoursePlanActivities[], fileName?: string, dataRubickThiForm?: WeekOfRubickThiFOrm[], arrCourseFormCC?: WeekOfRubickThiFOrm[], arrCourseTx?: CourseFormTx[]) {

        const content_tailieu = coursePlanActivity[0].children.find(f => f.title === 'Tài liệu tham khảo') ? coursePlanActivity[0].children.find(f => f.title === 'Tài liệu tham khảo').desc : '';
        const content_part = []
        const dataCourseTx = arrCourseTx;

        const arrNotWeek0 = coursePlanActivity.filter(f => f.week !== 0);
        arrNotWeek0.forEach((f, index) => {
            content_part.push(f.desc ? f.desc : ((index + 1) + '. (Chủ đề chưa có tên)'));
        });

        let htmlContent = `<!DOCTYPE html>
        <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>Document</title>
               <style>

                *, * > p, div > p,* > span,span{
                    font-family: "Times New Roman", Times, serif !important;
                }
                table.have-border th,
                table.have-border td{
                    border: 1px solid black;
                    border-collapse: collapse;
                    border-spacing: 0;
               }
               td {
                    padding:5px;
               }
               .text-center{
                    text-align:center !important;
               }
               .m-0{
                    margin:0 !important;
               }
               .w-100{
                    width:100% !important;
               }
               .w-10{
                    width:10% !important;
               }
               .w-20{
                    width:20% !important;
               }

               </style>

            </head>
            <body>
                <table style="width:100%;border-collapse: collapse;;">
                    <tr>
                        <td >
                            <div style="width:100%; display: block; text-align: center;margin:0 auto auto;">
                                <p style="margin: 0;text-decoration: underline;"><strong>${cl['category_name']}</strong></p>
                            </div>
                        </td>
                        <td>
                            <div style="width:100%; display: block; text-align: center;margin:0 auto auto; ">
                                <p style="margin:0"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
                                <p style="margin:0;text-decoration: underline;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
                            </div>
                        </td>
                    </tr>
                </table>

                <p style="font-size:20px;margin:10px 0;text-align:center; "><strong>ĐỀ CƯƠNG CHI TIẾT HỌC PHẦN TRÌNH ĐỘ ĐẠI HỌC</strong></p>

                <p style="margin-left:20px;"><strong>Tên học phần : </strong> <span>${cl.title}</span></p>
                <p style="margin-left:20px;"><strong>Tên tiếng Anh: </strong> <span> </span></p>
                <p style="margin-left:20px;"><strong>Mã học phần  : </strong> <span>${cl.maso}</span></p>

                <p><strong>1. Thông tin về học phần</strong></p>
                <table class="have-border" style="width:100%;border-collapse: collapse;;">
                    <tr>
                        <td style="width:15%;margin:0"><p style="">Số tín chỉ</p></td>
                        <td> <p style="margin:0">${cl['params'] && cl['params']['sotinchi'] ? cl['params']['sotinchi'] : ''}</p></td>
                    </tr>
                    <tr>
                        <td><p>Học phần thuộc</p></td>
                        <td>
                            <div>
                                <p style="margin:0">- Khối kiến thức:</p>
                                <p style="margin:0">- Loại học phần:</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td><p>Điều kiện học phần</p></td>
                        <td>
                            <div>
                                <p style="margin:0">- Môn học trước:</p>
                                <p style="margin:0">- Môn học tiên quyết:</p>
                                <p style="margin:0">- Môn học song hành:</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td><p style="margin:0">Phân bổ thời gian</p></td>
                        <td>
                            <div>
                                <p style="margin:0">Tổng số:   (tiết), trong đó:</p>
                                <p style="margin:0">- Lý thuyết:    (tiết).</p>
                                <p style="margin:0">- Thảo luận/bài tập:    (tiết)</p>
                                <p style="margin:0">- Thực hành/thí nghiệm:    (tiết)</p>
                                <p style="margin:0">- Kiểm tra định kỳ:    (tiết)</p>
                                <p style="margin:0">- Tự học:    (tiết)</p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td><p>Khoa phụ trách</p></td>
                        <td>
                            <div>
                                <p style="margin:0">${cl["category_name"]}</p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td><p style="margin:0">Nôi dung chính của học phần </p></td>
                        <td>
                            <div>


            `;

        content_part.forEach(e => {
            htmlContent += `<p style="margin:0"> ${e}</p>`;
        })

        htmlContent += `
                    </div>
                </td>
            </tr>
            <tr>
                <td><p>Tài liệu học tập</p></td>
                <td >
                    ${content_tailieu ? content_tailieu : ''}
                </td>
            </tr>
            <tr>
                <td><p>Điều kiện dự thi kết thúc học phần</p></td>
                <td><div>
                   ${coursePlanActivity[0].children.find(f => f.title === 'Điều kiện dự thi kết thúc học phần') ? (coursePlanActivity[0].children.find(f => f.title === 'Điều kiện dự thi kết thúc học phần').desc ? coursePlanActivity[0].children.find(f => f.title === 'Điều kiện dự thi kết thúc học phần').desc : ' ') : ''}
                </div></td>
            </tr>
        </table>

        <p><strong>2. Mục tiêu và chuẩn đầu ra của học phần</strong></p>
        <p><strong>2.1 Mục tiêu của học phần</strong></p>
        <p style="margin:0;">
           ${coursePlanActivity[0].children.find(f => f.title === 'Mô tả học phần') ? coursePlanActivity[0].children.find(f => f.title === 'Mô tả học phần').desc : ''}
        </p>

         <p>- Mục tiêu của học phần</p>
         <table class="have-border" style="width:100%;border-collapse: collapse;;">
            <tr>
                <th style="width:10%">
                    <div style="text-align:center">
                        <p style="margin:0;">Thứ tự mục tiêu HP</p>
                        <p style="margin:0; color:red;">[1]</p>
                    </div>
                </th>
                <th style="width:80%">
                    <div style="text-align: center">
                     <p style="margin:0;">Nội dung mục tiêu HP</p>
                     <p style="margin:0; color:red;">[2]</p>
                    </div>
                </th>
            </tr>
            <tr>
                <td style="text-align:center;"><p>1</p></td>
                <td></td>
            </tr>


        `;


        // arrNotWeek0.forEach((f, index) => {
        //     htmlContent += `
        //         <tr>
        //             <td style="text-align:center">
        //
        //                     <p>${'CO' + (index + 1)}</p>
        //             </td>
        //             <td>
        //                 <div>
        //                     ${f.children.find(f => f.title === 'Mục tiêu') && f.children.find(f => f.title === 'Mục tiêu').desc ? f.children.find(f => f.title === 'Mục tiêu').desc : ''}
        //                 </div>
        //             </td>
        //         </tr>
        //     `;
        //
        //
        // })

        htmlContent += `</table>
        <p ><strong>2.2 Chuẩn đầu ra của học phần</strong></p>
        <table class="have-border" style="width:100%;border-collapse: collapse;;">
            <tr>
                <th style="text-align: center;width:10%;">
                    <div>
                        <p style="margin:0;">Mục tiêu của HP</p>
                        <p style="margin:0;color:red;">[1]</p>
                    </div>
                </th>
                <th style="text-align: center;width:15%;">
                    <div>
                        <p style="margin:0;">Thứ tự CĐR của HP</p>
                        <p style="margin:0;color:red;">[2]</p>
                    </div>
                </th>
                <th style="text-align: center;">
                    <div>
                        <p style="margin:0;">Nội dung CĐR của HP</p>
                        <p style="margin:0;color:red;">[3]</p>
                    </div>
                </th>
                <th style="text-align: center;width:15%;">
                    <div>
                        <p style="margin:0;">CĐR của CTĐT</p>
                        <p style="margin:0;color:red;">[4]</p>
                    </div>
                </th>
                <th style="text-align: center;width:15%;">
                    <div>
                        <p style="margin:0;">Mức độ đóng góp</p>
                        <p style="margin:0;color:red;">[5]</p>
                    </div>
                </th>
            </tr>
            <tr>
                <td style="text-align: center;"><p>1</p></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>

        `;

        // let number_of_clo = 0;
        // arrNotWeek0.forEach((f, index) => {
        //     const dataArrCDR = f.children.find(a => a.type === "CDR");
        //     const childrenByCDR = dataArrCDR.children.sort((a,b)=>b.ordering - a.ordering).filter(f=>f.status !== -3);
        //     console.log(childrenByCDR);
        //     const totalCDR = childrenByCDR.length;
        //     childrenByCDR.forEach((cdr, index2) => {
        //         number_of_clo += 1;
        //         if (index2 === 0) {
        //             htmlContent += `
        //             <tr>
        //                 <td style="text-align:center" rowspan=${totalCDR}> <div><p style="margin:0;">${'CO' + (index + 1)}</p></div></td>
        //                 <td style="text-align:center"> <div><p style="margin:0;">${'CLO' + number_of_clo}</p></div></td>
        //                 <td>${cdr.title}</td>
        //                 <td rowspan=${totalCDR}></td>
        //                 <td rowspan=${totalCDR}></td>
        //             </tr>
        //         `;
        //         } else {
        //             htmlContent += `<tr>
        //                 <td style="text-align:center"><div><p style="margin:0;">${'CLO' + number_of_clo}</p></div></td>
        //                 <td ><div><p style="margin:0;">${cdr.title}</p></div></td>
        //                 </tr>`
        //         }
        //
        //     })
        //
        //
        // })

        htmlContent += `</table>
          <p ><strong>2.3. Mục tiêu và chuẩn đầu ra của chủ đề</strong></p>
          <p ><strong>2.3.1. Mục tiêu và chuẩn đầu ra của chủ đề</strong></p>

        <table style="width:100%;border-collapse: collapse;" class="have-border">
            <tr>
                <th style="width:10%;"><div><p>STT</p></div></th>
                <th style="width:10%;"><div><p>Ký hiệu</p></div></th>
                <th><div><p>Nội dung</p></div></th>
                <th><div><p>Mục tiêu của chủ đề </p></div></th>
            </tr>

        `;


        arrNotWeek0.forEach((f, index) => {
            htmlContent += `
                <tr>
                    <td class="text-center"> <div><p>${(index + 1)}</p></div></td>
                    <td class="text-center"> <div><p>${'TO' + (index + 1)}</p></div></td>
                    <td class="">
                        <div>
                             ${f.children.find(f => f.title === 'Mục tiêu') && f.children.find(f => f.title === 'Mục tiêu').desc ? f.children.find(f => f.title === 'Mục tiêu').desc : ''}
                         </div>
                    </td>
                    <td class="text-center"></td>
                </tr>
            `;
        });


        htmlContent += `</table>`;
        htmlContent += `
            <p><strong>2.3.2. Chuẩn đầu ra của chủ đề</strong></p>
            <table class="have-border" style="width: 100%;border-collapse: collapse;">
                <tr>
                    <th style="width:10%;" class="text-center"><p>Ký hiệu</p> </th>
                    <th class="text-center"><p>Nội dung chuẩn đầu ra chủ đề</p> </th>
                    <th class="text-center"><p>Chuẩn đầu ra chủ đề </p></th>
                </tr>

        `;

        // arrNotWeek0.forEach((e, index) => {
        //     htmlContent += `
        //         <tr>
        //             <td class="text-center"> <div><p>${'TLO' + (index + 1)}</p></div></td>
        //             <td class="text-center"></td>
        //             <td class="text-center"></td>
        //         </tr>
        //     `;
        // });

        let number_of_clo = 0;
        arrNotWeek0.forEach((f, index) => {
            const dataArrCDR = f.children.find(a => a.type === "CDR");
            const childrenByCDR = dataArrCDR.children.sort((a, b) => b.ordering - a.ordering).filter(f => f.status !== -3);
            const totalCDR = childrenByCDR.length;
            childrenByCDR.forEach((cdr, index2) => {
                number_of_clo += 1;
                if (index2 === 0) {
                    htmlContent += `
                    <tr>
                        <td style="text-align:center"> <div><p style="margin:0;">${'TLO' + number_of_clo}</p></div></td>
                        <td>${cdr.title}</td>
                        <td style="text-align:center" rowspan=${totalCDR}> <div><p style="margin:0;">${'CLO' + (index + 1)}</p></div></td>
                    </tr>
                `;
                } else {
                    htmlContent += `<tr>
                        <td style="text-align:center"><div><p style="margin:0;">${'TLO' + number_of_clo}</p></div></td>
                        <td ><div><p style="margin:0;">${cdr.title}</p></div></td>
                        </tr>`
                }
            })


        })




        htmlContent += `</table>`;

        htmlContent += `
            <p><strong>3. Kiểm tra, đánh giá</strong></p>
            <p>- Thang điểm 10</p>
            <p><strong>- Kế hoạch kiểm tra như sau:</strong></p>
            <table class="have-border" style="width:100%;border-collapse: collapse;">
                <tr>
                    <th style="text-align:center;width:10%;"><div><p>TT</p></div></th>
                    <th style="text-align:center;"><div><p>Nội dung</p></div></th>
                    <th style="text-align:center;"><div><p style="margin:0">Thời điểm </p> <p>(Tiết thứ)</p></div></th>
                    <th style="text-align:center;"><div><p>CDR đánh giá</p></div></th>
                    <th style="text-align:center;"><div><p>Phương pháp đánh giá</p></div></th>
                    <th style="text-align:center;"><div><p>Công cụ đánh giá</p></div></th>
                    <th style="text-align:center;"><div><p>Tỷ lệ %</p></div></th>
                </tr>
                <tr>
                    <td colspan="5"><p><strong>Chuyên cần</strong></p></td>
                    <td style="text-align:center;"><p><strong>Rubric 1</strong></p></td>
                    <td style="text-align:center;"><p><strong>5</strong></p></td>
                </tr>
                <tr>
                    <td colspan="3"><p><strong>Tự học theo bài</strong></p></td>
                    <td style="text-align:center;"></td>
                    <td style="text-align:center;"><p>Trắc nghiệm</p></td>
                    <td style="text-align:center;"><p><strong>Rubric 2</strong></p></td>
                    <td style="text-align:center;"><p><strong>15</strong></p></td>
                </tr>
                <tr>
                    <td colspan="6"><p><strong>Kiểm tra thường xuyên</strong></p></td>
                    <td style="text-align:center;"><p><strong>30</strong></p></td>
                </tr>

        `;

        if (cl['params'] && parseInt(cl['params']['sotinchi']) === 2) {
            htmlContent += `
                <tr>

                    <td class="text-center">1</td>
                    <td class="text-center"><p>Bài 1 - Bài 3</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p><strong>Rubric 3</strong></p></td>
                    <td class="text-center"><p>15</p></td>
                </tr>
                <tr>

                    <td class="text-center">2</td>
                    <td class="text-center"><p>Bài 4 - Bài 6</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p><strong>Rubric 4</strong></p></td>
                    <td class="text-center"><p>15</p></td>
                </tr>
                <tr>
                    <td colspan="6"><p><strong>Thi cuối kỳ</strong></p></td>
                    <td class="text-center"><p><strong>50</strong></p></td>
                </tr>
                <tr>

                    <td class="text-center"></td>
                    <td class="text-center"><p>Bài 1 - Bài 6</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p><strong>Rubric 5</strong></p></td>
                    <td class="text-center"><p>50</p></td>
                </tr>
           `;

        } else if (cl['params'] && parseInt(cl['params']['sotinchi']) === 3) {

            htmlContent += `
                <tr>

                    <td class="text-center">1</td>
                    <td class="text-center"><p>Bài 1 - Bài 3</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 3</p></td>
                    <td class="text-center"><p>10</p></td>
                </tr>
                <tr>

                    <td class="text-center">2</td>
                    <td class="text-center"><p>Bài 4 - Bài 6</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 4</p></td>
                    <td class="text-center"><p>10</p></td>
                </tr>
                <tr>

                    <td class="text-center">3</td>
                    <td class="text-center"><p>Bài 7 - Bài 9</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 5</p></td>
                    <td class="text-center"><p>10</p></td>
                </tr>
                <tr>
                    <td colspan="6"><p><strong>Thi cuối kỳ</strong></p></td>
                    <td class="text-center"><p><strong>50</strong></p></td>
                </tr>
                <tr>

                    <td class="text-center"></td>
                    <td class="text-center"><p>Bài 1 - Bài 9</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 6</p></td>
                    <td class="text-center"><p>50</p></td>
                </tr>
           `;


        } else if (cl['params'] && parseInt(cl['params']['sotinchi']) === 4) {

            htmlContent += `
                <tr>

                    <td class="text-center">1</td>
                    <td class="text-center"><p>Bài 1 - Bài 3</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 3</p></td>
                    <td class="text-center"><p>7.5</p></td>
                </tr>
                <tr>

                    <td class="text-center">2</td>
                    <td class="text-center"><p>Bài 4 - Bài 6</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 4</p></td>
                    <td class="text-center"><p>7.5</p></td>
                </tr>
                <tr>

                    <td class="text-center">3</td>
                    <td class="text-center"><p>Bài 7 - Bài 9</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 5</p></td>
                    <td class="text-center"><p>7.5</p></td>
                </tr>
                <tr>

                    <td class="text-center">3</td>
                    <td class="text-center"><p>Bài 10 - Bài 12</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 6</p></td>
                    <td class="text-center"><p>7.5</p></td>
                </tr>
                <tr>
                    <td colspan="6"><p><strong>Thi cuối kỳ</strong></p></td>
                    <td class="text-center"><p><strong>50</strong></p></td>
                </tr>
                <tr>

                    <td class="text-center"></td>
                    <td class="text-center"><p>Bài 1 - Bài 12</p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p>Rubric 7</p></td>
                    <td class="text-center"><p>50</p></td>
                </tr>
           `;

        } else {

            htmlContent += `
                <tr>

                    <td class="text-center">1</td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                </tr>

                <tr>

                    <td class="text-center">2</td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                    <td class="text-center"><p></p></td>
                </tr>

           `;

        }

        htmlContent += `</table>
           <p><strong>4. Nội dung chi tiết</strong></p>
           <table class="have-border" style="width:100%;border-collapse: collapse;;">
               <tr>
                <th class="text-center" style="width:5%;"><div><p style="margin:0">Bài</p><p>[1]</p></div></th>
                <th class="text-center"><div><p style="margin:0">Nội dung</p><p>[2]</p></div></th>
                <th class="text-center" style="width:10%;"><div><p style="margin:0">Chuẩn đầu ra các học phần </p><p>[4]</p></div></th>
                <th class="text-center" style="width:10%;"><div><p style="margin:0">Phương pháp dạy học</p><p>[5]</p></div></th>
                <th class="text-center" style="width:10%;"><div><p style="margin:0">Phương pháp đánh giá </p><p>[6]</p></div></th>
                <th class="text-center" style="width:10%;"><div><p style="margin:0">Tài liệu tham khảo </p><p>[3]</p></div></th>
               </tr>
        `;

        let num_of_chitiet: number = 0;
        arrNotWeek0.forEach((a, index) => {

            const dataArrCDR = a.children.find(a => a.type === "CDR");
            const childrenByCDR = dataArrCDR.children.sort((e, f) => f.ordering - e.ordering).filter(c => c.status !== -3);

            const totalCDR = childrenByCDR.length;
            const cdrConvert = childrenByCDR.map(m => {
                return m.params.cdr.cdr_info.find(f => f.label === 'Phương pháp') ? m.params.cdr.cdr_info.find(f => f.label === 'Phương pháp').value : '';
            }).join(',');
            // console.log([...new Set(cdrConvert.split(",").map(item => item.trim()))].join(' ,'));
            const strCovert = [...new Set(cdrConvert.split(",").map(item => item.trim()))].join(', ')
            htmlContent += `
                <tr>
                    <td class="text-center" rowspan="3"><p>${index + 1}</p></td>
                    <td ><div><p><strong>${a.desc ? a.desc.replace('Chủ đề', 'Bài') : 'Bài ' + (index + 1) + ': '}</strong></p></div></td>
                    <td ></td>
                    <td > </td>
                    <td ></td>
                    <td ></td>
                </tr>
                <tr>

                    <td >
                        <div>
                            <p><strong>A/ Nội dung học tập và PPGD chính trên lớp: </strong></p>
                            <p><strong>- Nội dung GD lý thuyết: </strong></p>
                            `;

            let text_of_CLO = '';
            childrenByCDR.forEach((e, index) => {
                htmlContent += `<p style="margin-bottom:3px;">${e.title}</p>`;
                num_of_chitiet = num_of_chitiet + 1;
                if (index === 0) {
                    text_of_CLO = 'CLO' + (num_of_chitiet);
                } else {
                    text_of_CLO += ', CLO' + (num_of_chitiet);
                }
            })

            htmlContent += `

                            <p style="margin:0;"><br></p>
                        </div>
                    </td>
                    <td ><div><p>${text_of_CLO}</p></div></td>
                    <td ><div><p>${strCovert}</p></div></td>
                    <td ><div><p>Đánh giá bằng nhận xét, kết hợp đánh giá chuyên cần.</p></div></td>
                    <td ></td>
                </tr>
                <tr>

                    <td >
                        <div>
                            <p><strong>B/ Các nội dung cần tự học ở nhà:</strong></p>
                            <p style="margin:0;"><br></p>
                            <p style="margin:0;"><br></p>
                            <p style="margin:0;"><br></p>
                        </div>
                    </td>
                    <td ></td>
                    <td ></td>
                    <td ></td>
                    <td ></td>
                </tr>
            `;
        })


        htmlContent += `</table>`;

        htmlContent += `
            <p><strong>5. Rubric kiểm tra, đánh giá học phần</strong></p>
            <p><strong>a. Rubric 1: Đánh giá điểm chuyên cần</strong></p>
            <table class="have-border" style="width:100%;border-collapse: collapse;">
                <tr>
                    <th class="text-center"><p>Tiêu chí đánh giá </p></th>
                    <th class="text-center"><p>Chuẩn đầu ra đánh giá </p></th>
                    <th class="text-center"><div><p>Trọng số điểm </p> <p>(%)</p></div></th>
                    <th class="text-center"><div><p>Giỏi </p> <p>(8,5-10)</p></div></th>
                    <th class="text-center"><div><p>Khá </p> <p>(7,0-8,4)</p></div></th>
                    <th class="text-center"><div><p>Trung bình </p> <p>(5,5-6.9)</p></div></th>
                    <th class="text-center"><div><p>Trung bình yếu </p> <p>(4,0-5,4)</p></div></th>
                    <th class="text-center"><div><p>Kém </p> <p>(0-3.9)</p></div></th>
                </tr>
                <tr>
                    <td><p>Mức độ tham gia đầy đủ các tiết học</p></td>
                    <td rowspan="2"></td>
                    <td class="text-center"><p>50</p></td>
                    <td class="text-center"><p>Tham dự đầy đủ</p></td>
                    <td class="text-center"><p>Vắng từ 1-9% tiết</p></td>
                    <td class="text-center"><p>Vắng từ 10-15% tiết</p></td>
                    <td class="text-center"><p>Vắng từ 16-20% tiết</p></td>
                    <td class="text-center"><p>Vắng 20% tiết( Cấm thi?)</p></td>
                </tr>
                <tr>
                    <td><p>Tính chủ động trong các bài học, tự học</p></td>
                    <td class="text-center"><p>50</p></td>
                    <td class="text-center"><p>Rất chủ động tham gia đặt câu hỏi, thảo luận, Hoàn thành bài tập đầy đủ</p></td>
                    <td class="text-center"><p>Khá chủ động tham gia đặt câu hỏi, thảo luận, làm bài tập</p></td>
                    <td class="text-center"><p>Ít chủ động tham gia đặt câu hỏi, thảo luận, làm bài tập.</p></td>
                    <td class="text-center"><p>Cần có tác động của giảng viên mới tham gia đặt câu hỏi, thảo luận, làm bài tập.</p></td>
                    <td class="text-center"><p>Chỉ tham dự lớp học nhưng không chủ động tham gia đặt câu hỏi, thảo luận, làm bài tập</p></td>
                </tr>
            </table>

            <p><strong>b. Rubric 2: Kiểm tra đánh giá kết quả tự học theo ${cl['params'] ? parseInt(cl['params']['sotinchi']) * 3 : '  '} bài học</strong></p>
            <p style="margin:0"><i>(Mỗi bài có 1 bài kiểm tra; Thời gian làm bài: 30 phút; Hình thức: Trắc nghiệm; Tổng số câu hỏi: 15; Thang điểm: 10)</i></p>

            <table class="have-border" style="width:100%;border-collapse: collapse;">
                <tr>
                    <th rowspan="2" class="text-center"><p>STT</p></th>
                    <th rowspan="2" class="text-center"><p>Các nội dung cần đánh giá </p></th>
                    <th rowspan="2" class="text-center"><p>Chuẩn đầu ra đánh giá </p></th>
                    <th colspan="6" class="text-center"><p>Thang năng lực</p></th>
                    <th rowspan="2" class="text-center"><p>Tổng số câu hỏi</p></th>
                </tr>
                <tr>
                    <th class="text-center"><p>Biết</p></th>
                    <th class="text-center"><p>Hiểu</p></th>
                    <th class="text-center"><p>Vận dụng</p></th>
                    <th class="text-center"><p>Phân tích</p></th>
                    <th class="text-center"><p>Đánh giá</p></th>
                    <th class="text-center"><p>Sáng tạo</p></th>
                </tr>

        `;
        arrCourseFormCC.forEach(e => {
            htmlContent += `
                <tr>
                    <td class="text-center"><p>${e.week}</p></td>
                    <td class="text-center" style="width:10%;"><div><p>Bài ${e.week} </p></div></td>
                    <td class="text-center" style="width:10%;"><p></p></td>
                    <td class="text-center"><p>${e.cdr_biet}</p></td>
                    <td class="text-center"><p>${e.cdr_hieu}</p></td>
                    <td class="text-center"><p>${e.cdr_vandung}</p></td>
                    <td class="text-center"><p>${e.cdr_phantich}</p></td>
                    <td class="text-center"><p>${e.cdr_danhgia}</p></td>
                    <td class="text-center"><p>${e.cdr_sangtao}</p></td>
                    <td class="text-center" style="width:10%;"><p>${e.cdr_total}</p></td>
                </tr>
            `;
        })



        htmlContent += ` </table>`;

        for (let i = 1; i <= parseInt(cl['params']['sotinchi']); i++) {

            if (i === 1) {
                htmlContent += `<p><strong>c. Rubric 3: Bài kiểm tra thường xuyên số 1</strong></p>`;
            } else if (i === 2) {
                htmlContent += `<p><strong>d. Rubric 4: Bài kiểm tra thường xuyên số 2</strong></p>`;
            } else if (i === 3) {
                htmlContent += `<p><strong>e. Rubric 5: Bài kiểm tra thường xuyên số 3</strong></p>`;
            } else if (i === 4) {
                htmlContent += `<p><strong>f. Rubric 6: Bài kiểm tra thường xuyên số 4</strong></p>`;
            }

            htmlContent += `<table class="have-border" style="width:100%;border-collapse: collapse;">
                    <tr>
                    <th rowspan="2" class="text-center"><p>STT</p></th>
                    <th rowspan="2" class="text-center"><p>Các nội dung cần đánh giá </p></th>
                    <th rowspan="2" class="text-center"><p>Chuẩn đầu ra đánh giá </p></th>
                    <th colspan="6" class="text-center"><p>Thang năng lực</p></th>
                    <th rowspan="2" class="text-center"><p>Tổng số câu hỏi</p></th>
                </tr>
                <tr>
                    <th class="text-center"><p>Biết</p></th>
                    <th class="text-center"><p>Hiểu</p></th>
                    <th class="text-center"><p>Vận dụng</p></th>
                    <th class="text-center"><p>Phân tích</p></th>
                    <th class="text-center"><p>Đánh giá</p></th>
                    <th class="text-center"><p>Sáng tạo</p></th>
                </tr>
            `;

            const arrTxSelect = arrCourseTx.filter(f => f.ordering === i);

            const arrFor = Array.from(new Set(arrTxSelect.map(m => m.week)));

            arrFor.forEach((c, index) => {
                htmlContent += `
                    <tr>
                        <td class="text-center"><div><p>${index + 1}</p></div></td>
                        <td class="text-center"><div><p> ${'Bài ' + c}</p></div></td>
                        <td class="text-center"></td>
                        <td class="text-center"><div><p>${this.convertTotalFormTxByWith(arrTxSelect, c, 1)}</p></div></td>
                        <td class="text-center"><div><p>${this.convertTotalFormTxByWith(arrTxSelect, c, 2)}</p></div></td>
                        <td class="text-center"><div><p>${this.convertTotalFormTxByWith(arrTxSelect, c, 3)}</p></div></td>
                        <td class="text-center"><div><p>${this.convertTotalFormTxByWith(arrTxSelect, c, 4)}</p></div></td>
                        <td class="text-center"><div><p>${this.convertTotalFormTxByWith(arrTxSelect, c, 5)}</p></div></td>
                        <td class="text-center"><div><p>${this.convertTotalFormTxByWith(arrTxSelect, c, 6)}</p></div></td>
                        <td class="text-center">${this.convertCouseFormTx(arrTxSelect.filter(q => q.week === c))}</td>
                    </tr>


                `;

            })

            htmlContent += `
                     <tr>
                        <td colspan="2" class="text-center"> <p>Tổng</p> </td>
                        <td class="text-center"><div></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center">${this.convertCouseFormTx(arrTxSelect)}</td>
                    </tr>
            `;

            htmlContent += `
                     <tr>
                        <td colspan="2" class="text-center"> <p>Tỷ lệ</p> </td>
                        <td class="text-center"></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p></p></div></td>
                        <td class="text-center"><div><p>${this.getPecentKeyInArrForm(arrCourseTx, arrCourseTx) + '%'}</p></div></td>
                    </tr>
            `;

            htmlContent += `</table>`;

        }

        htmlContent += `
            <p><strong>${cl['params'] && parseInt(cl['params']['sotinchi']) === 2 ? 'e. Rubric 5' : (cl['params'] && parseInt(cl['params']['sotinchi']) === 3 ? 'f. Rubric 6' : (cl['params'] && parseInt(cl['params']['sotinchi']) === 4 ? 'g. Rubric 7' : 'e.   '))}: Bài thi cuối kỳ</strong></p>
            <table class="have-border" style="width:100%;border-collapse: collapse;">
               <tr>
                    <th rowspan="2" class="text-center"><p>STT</p></th>
                    <th rowspan="2" class="text-center w-10"><p>Các nội dung cần đánh giá </p></th>
                    <th rowspan="2" class="text-center"><p>Chuẩn đầu ra đánh giá </p></th>
                    <th colspan="6" class="text-center"><p>Thang năng lực</p></th>
                    <th rowspan="2" class="text-center w-10"><p>Tổng số câu hỏi</p></th>
                </tr>
                <tr>
                    <th class="text-center"><p>Biết</p></th>
                    <th class="text-center"><p>Hiểu</p></th>
                    <th class="text-center"><p>Vận dụng</p></th>
                    <th class="text-center"><p>Phân tích</p></th>
                    <th class="text-center"><p>Đánh giá</p></th>
                    <th class="text-center"><p>Sáng tạo</p></th>
                </tr>
        `;
        if (cl['params']) {
            // for (let i = 1; i <= parseInt(cl['params']['sotinchi']) * 3; i++) {
            //     htmlContent += `
            //     <tr>
            //         <td class="text-center"><div><p>${i}</p></div></td>
            //         <td class="text-center"><div><p>Bài ${i}</p></div></td>
            //         <td class="text-center"></td>
            //         <td class="text-center"></td>
            //         <td class="text-center"></td>
            //         <td class="text-center"></td>
            //         <td class="text-center"></td>
            //         <td class="text-center"></td>
            //         <td class="text-center"></td>
            //         <td class="text-center"></td>
            //     </tr>
            // `;
            // }
            dataRubickThiForm.forEach(a => {
                htmlContent += `
                    <tr>
                        <td class="text-center"><div><p>${a.week}</p></div></td>
                        <td class="text-center"><div><p>Bài ${a.week}</p></div></td>
                        <td class="text-center"></td>
                        <td class="text-center"><div><p style="margin:0">${a.cdr_biet}</p></div></td>
                        <td class="text-center"><div><p style="margin:0">${a.cdr_hieu}</p></div></td>
                        <td class="text-center"><div><p style="margin:0">${a.cdr_vandung}</p></div></td>
                        <td class="text-center"><div><p style="margin:0">${a.cdr_phantich}</p></div></td>
                        <td class="text-center"><div><p style="margin:0">${a.cdr_sangtao}</p></div></td>
                        <td class="text-center"><div><p style="margin:0">${a.cdr_danhgia}</p></div></td>
                        <td class="text-center"><div><p style="margin:0">${a.cdr_total}</p></div></td>
                    </tr>
                `;
            })
        }
        else {
            htmlContent += `
                <tr>
                    <td class="text-center"><div><p>1</p></div></td>
                    <td class="text-center"><div><p> </p></div></td>
                    <td class="text-center"></td>
                    <td class="text-center"></td>
                    <td class="text-center"></td>
                    <td class="text-center"></td>
                    <td class="text-center"></td>
                    <td class="text-center"></td>
                    <td class="text-center"></td>
                    <td class="text-center"></td>
                </tr>
            `;

        }

        htmlContent += `
            <tr>
                <td colspan="2" class="text-center"> <div><p>Tổng</p></div> </td>
                <td class="text-center"></td>
                <td class="text-center"><div><p style="margin:0">${this.totalKeyInArr(dataRubickThiForm, 'cdr_biet')}</p></div></td>
                <td class="text-center"><div><p style="margin:0">${this.totalKeyInArr(dataRubickThiForm, 'cdr_hieu')}</p></div></td>
                <td class="text-center"><div><p style="margin:0">${this.totalKeyInArr(dataRubickThiForm, 'cdr_vandung')}</p></div></td>
                <td class="text-center"><div><p style="margin:0">${this.totalKeyInArr(dataRubickThiForm, 'cdr_phantich')}</p></div></td>
                <td class="text-center"><div><p style="margin:0">${this.totalKeyInArr(dataRubickThiForm, 'cdr_sangtao')}</p></div></td>
                <td class="text-center"><div><p style="margin:0">${this.totalKeyInArr(dataRubickThiForm, 'cdr_danhgia')}</p></div></td>
                <td class="text-center"><div><p style="margin:0">${this.totalKeyInArr(dataRubickThiForm, 'cdr_total')}</p></div></td>
            </tr>
            <tr>
                <td colspan="2" class="text-center"> <div><p>Tỷ lệ</p></div> </td>
                <td class="text-center"></td>
                <td class="text-center"><div><p style="margin:0;">${this.getPecentKeyInArr(dataRubickThiForm, 'cdr_biet') + '%'}</p></div></td>
                <td class="text-center"><div><p style="margin:0;">${this.getPecentKeyInArr(dataRubickThiForm, 'cdr_hieu') + '%'}</p></div></td>
                <td class="text-center"><div><p style="margin:0;">${this.getPecentKeyInArr(dataRubickThiForm, 'cdr_vandung') + '%'}</p></div></td>
                <td class="text-center"><div><p style="margin:0;">${this.getPecentKeyInArr(dataRubickThiForm, 'cdr_phantich') + '%'}</p></div></td>
                <td class="text-center"><div><p style="margin:0;">${this.getPecentKeyInArr(dataRubickThiForm, 'cdr_sangtao') + '%'}</p></div></td>
                <td class="text-center"><div><p style="margin:0;">${this.getPecentKeyInArr(dataRubickThiForm, 'cdr_danhgia') + '%'}</p></div></td>
                <td class="text-center"><div><p style="margin:0;">${this.getPecentKeyInArr(dataRubickThiForm, 'cdr_total') + '%'}</p></div></td>
            </tr>
        `;

        htmlContent += `</table>`;

        htmlContent += `
            <p><strong>6. Thông tin giảng viên</strong></p>
            <table class="have-border" style="width:100%;border-collapse: collapse;">
                <tr>
                    <th class="text-cenrter" style="width:6%;"> <p>STT</p></th>
                    <th class="text-cenrter"> <p>Học hàm, học vị, họ và tên</p></th>
                    <th class="text-cenrter"> <p>Số điện thoại liên hệ</p></th>
                    <th class="text-cenrter"> <p>Địa chỉ E-mail</p></th>
                    <th class="text-cenrter" style="" > <p>Ghi chú</p></th>
                </tr>
        `;

        if (cl['_infoTeacher'] && cl['_infoTeacher'].length > 0) {
            cl['_infoTeacher'].forEach((e, index) => {
                htmlContent += `
                <tr>
                    <td><div><p>${index + 1}</p></div></td>
                    <td><div><p>${e['display_name']}</p></div></td>
                    <td><div><p>${e['phone']}</p></div></td>
                    <td><div><p>${e['email']}</p></div></td>
                    <td></td>
                </tr>
            `;
            })

        } else {
            htmlContent += `
                <tr>
                    <td class="text-center"><p>1</p></div></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        }


        htmlContent += `</table>`;

        htmlContent += `
            <p><strong>7. Ngày phê duyệt lần đầu: </strong></p>



            <p><strong>8. Cấp phê duyệt</strong></p>

            <table style="width:100%;border-collapse: collapse;">
                <tr>
                    <th class="text-center"><div><p>KT. Hiệu trưởng</p><p>PHÓ HIỆU TRƯỞNG</p></div></th>
                    <th class="text-center"><p>Trưởng Khoa</p></th>
                    <th class="text-center"><p>Trưởng bộ môn </p></th>
                    <th class="text-center"><p>TM. tập thể biên soạn</p></th>
                </tr>
                <tr>
                    <td class="text-center"><p><br></p></td>
                    <td class="text-center"><p><br></p></td>
                    <td class="text-center"><p><br></p></td>
                    <td class="text-center"><p><br></p></td>
                </tr>

            </table>


            <p><strong>9. Tiến trình cập nhật đề cương chi tiết</strong></p>
            <table class="have-border" style="width:100%;border-collapse: collapse;">
                <tr>
                    <td>
                        <div>
                            <p>Cập nhật đề cương chi tiết lần 1:</p>
                            <p> <strong><i>Ngày/tháng/năm.</i></strong></p>
                            <p style="color:red"><i>Nội dung cập nhật</i></p>
                            <p><br></p>
                        </div>
                    </td>
                    <td style="margin:auto">
                       <div>
                            <p class="text-center"><strong>Người cập nhật </strong></p>
                            <p><br> </p>
                            <p><br> </p>
                            <p><br> </p>

                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div>
                            <p>Cập nhật đề cương chi tiết lần 1:</p>
                            <p> <strong><i>Ngày/tháng/năm.</i></strong></p>
                            <p style="color:red"><i>Nội dung cập nhật</i></p>
                            <p><br></p>

                        </div>
                    </td>

                    <td style="">
                       <div>
                        <p class="text-center"><strong>Người cập nhật </strong></p>
                        <p><br> </p>
                        <p><br> </p>
                        <p><br> </p>
                       </div>
                    </td>
                </tr>
            </table>

        `;
        htmlContent += `</body></html>`;

        return htmlContent;
    }

    exportFileWord() {
        if (this.htmlBySelectClass) {
            this.exportNoidongDecuongByHtmlService.exportHtmlToWord(this.htmlBySelectClass, this.courseSelect.title);
        } else {
            this.noitifi.toastWarning('Chưa có dữ liệu để tải file');
        }
    }

    totalKeyInArr(arr: any[], key: string): number {
        return arr.reduce((sum, item) => sum + item[key], 0);
    }
    getPecentKeyInArr(arr: WeekOfRubickThiFOrm[], key: string) {
        const total = this.totalKeyInArr(arr, 'cdr_total');
        const total_cdr_select = this.totalKeyInArr(arr, key);
        const percentage = total !== 0 ? (total_cdr_select / total) * 100 : 0;
        return Number.isInteger(percentage) ? percentage : percentage.toFixed(2);
    }

    convenrtCouseFormCC(av_type: number, arr: any[], week: number, cdr_type: number) {

        if (av_type === 1) {
            return '';
        } else {
            const arrSelect = arr.filter(a => a.week === week && a.cdr === cdr_type);
            return arrSelect.length > 0 ? arrSelect.reduce((sum, item) => sum + (item['child_question_take'] === 0 ? item['question_take'] : item['question_take'] * item['child_question_take']), 0) : 0;
        }
    }
    convertCouseFormTx(arr: any[]) {
        // const arrSelect = arr.filter(a=>a.week === week && a.cdr === cdr_type);
        return arr.length > 0 ? arr.reduce((sum, item) => sum + (item['child_question_take'] === 0 ? item['question_take'] : item['question_take'] * item['child_question_take']), 0) : 0;
    }
    convertTotalFormTxByWith(arr: any[], week: number, cdr_type: number) {
        const arrSelect = arr.filter(a => a.week === week && a.cdr === cdr_type);
        return arrSelect.length = 0 ? 0 : arrSelect.reduce((sum, item) => sum + (item['child_question_take'] === 0 ? item['question_take'] : item['question_take'] * item['child_question_take']), 0)
    }

    conventPecentKeyInFormTxByWeek(arrParent: any[], arrChild: any[], week: number, cdr: number) {
        const total = arrParent.length > 0 ? arrParent.reduce((sum, item) => sum + (item['child_question_take'] === 0 ? item['question_take'] : item['question_take'] * item['child_question_take']), 0) : 0;
        const arrForChild = arrChild.filter(f => f.week === week && f.cdr === cdr);
        const Child = arrForChild.length > 0 ? arrForChild.reduce((sum, item) => sum + (item['child_question_take'] === 0 ? item['question_take'] : item['question_take'] * item['child_question_take']), 0) : 0;
        return total !== 0 ? Child * 100 / total : 0;
    }

    getPecentKeyInArrForm(arr: any[], arrChild: any[],) {
        // const total = this.totalKeyInArr(arr,'cdr_total');

        // const total_cdr_select = this.totalKeyInArr(arr,key);
        // const percentage = total !== 0 ? (total_cdr_select/total)*100 : 0;
        // return  Number.isInteger(percentage) ? percentage : percentage.toFixed(2);

        const total = arr.length > 0 ? arr.reduce((sum, item) => sum + (item['child_question_take'] === 0 ? item['question_take'] : item['question_take'] * item['child_question_take']), 0) : 0;
        const Child = arrChild.length > 0 ? arrChild.reduce((sum, item) => sum + (item['child_question_take'] === 0 ? item['question_take'] : item['question_take'] * item['child_question_take']), 0) : 0;
        return total !== 0 ? Child * 100 / total : 0;
    }


}
