import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from "@core/services/auth.service";
import { DonViService } from "@shared/services/don-vi.service";

import { NotificationService } from "@core/services/notification.service";
import { ClassesService } from "@shared/services/classes.service";
import { ClassStudentService } from "@shared/services/class-student.service";

import { HttpParamsHeplerService } from "@core/services/http-params-hepler.service";
import { DonVi } from "@shared/models/don-vi";
import { OvicQueryCondition } from "@core/models/dto";
import { forkJoin, map, mergeMap, Observable, of, switchMap } from "rxjs";
import { TREE, TreeCustomComponent } from "@shared/components/tree-custom/tree-custom.component";
import { ElnChuyenMuc } from "@shared/models/Elng";
import { ConditionOption } from "@shared/models/condition-option";
import { RptClassStudentTestCc, RptClassStudentTestCcService } from "@shared/services/rpt-class-student-test-cc.service";
import { ClassStudent } from "@shared/models/class-student";
import { CategoriesService, Category } from "@shared/services/categories.service";
import { Classes } from "@shared/models/classes";
import { ElnKhoaHoc } from "@shared/models/elng-khoa-hoc";
import { ElnKhoaHocService } from "@shared/services/elearning-khoa-hoc.service";
import {
    objectFillter
} from "@modules/admin/features/thongke-solieu-tonghop/ketqua-test-sinhvien/ketqua-test-sinhvien.component";
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ROLES } from '@modules/shared/utils/syscat';
import { SharedModule } from '@modules/shared/shared.module';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import {RptClassStudentTestDaugioService} from "@shared/services/rpt-class-student-test-daugio.service";


@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, TreeCustomComponent, TableModule, PaginatorModule, DialogModule, MatProgressBarModule],
    selector: 'app-ketqua-testtuan-sinhvien',
    templateUrl: './ketqua-testtuan-sinhvien.component.html',
    styleUrls: ['./ketqua-testtuan-sinhvien.component.css']
})
export class KetquaTesttuanSinhvienComponent implements OnInit {

    private auth = inject(AuthService);
    private noitifi = inject(NotificationService);
    private donViService = inject(DonViService);
    private classesService = inject(ClassesService);
    private elnKhoaHocService = inject(ElnKhoaHocService);
    private httpHelper = inject(HttpParamsHeplerService);
    private classStudentService = inject(ClassStudentService);
    private categoriesService = inject(CategoriesService);
    private rptClassStudentTestCcService = inject(RptClassStudentTestCcService);
    private elngUserProfileService = inject(ElngUserProfileService);

    loading: boolean = false;
    loadingTable: boolean = false;
    isAdmin = false;

    isManager = false;
    course: any;

    text_selected_tree: string;
    loadder: boolean = false;
    khoaId: string;
    selectedNodeTree: TREE;
    selectedKhoa: number;
    selectedDonvi: DonVi;
    selectedBoMon: ElnChuyenMuc;
    selectedMonHoc: ElnKhoaHoc;
    selectedLopHoc: Classes;

    treeCoures: TREE[];
    listKhoa: any[];
    listDonvi: DonVi[];
    listBoMon: Category[];

    objectFilter: objectFillter = {
        category_id: 0,
        hocky: 0,
        namhoc: '0',
    };

    list_donvi_chuyenmon: DonVi[] = [];
    listHocky = [];
    listNamhoc = [];
    list_khoa = [];

    totalClasses: Classes[];
    totalCourse: ElnKhoaHoc[];
    totalClassStudents: ClassStudent[];

    rptClassStudentTestCc: RptClassStudentTestCc[]

    progressValue = 0;
    displayModal = false;
    waitting_title = 'Vui lòng không tắt trình duyệt';

    closeLeft = false;
    searchTree: string;


    //------------------long custom------------------------
    typeViewTable: 'data' | 'student' = 'data';
    objectWeek: number[];
    dataStudentsByMenu: ClassStudent[];

    constructor(
        // private rptClassStudentTestCcService: RptClassStudentTestDaugioService,
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin);
    }

    ngOnInit() {
        this.initData();
    }

    initData() {
        const condition_group_namhoc = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'namhoc').set("groupby", "namhoc").set("limit", -1);

        const condition_group_hocky = this.httpHelper.paramsConditionBuilder(
            [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1', orWhere: 'and' },
            ]).set('order', 'DESC').set('orderby', 'hocky').set("groupby", "hocky").set("limit", -1);

        const condition_donvi: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.notEqual, value: '-1' },
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.userDonViId.toString(),
                    orWhere: 'and'
                }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        };

        forkJoin([
            this.donViService.getDonviByPageNew(condition_donvi),
            this.categoriesService.getAllCategories(),
            this.classesService.getClassesByCols(condition_group_namhoc),
            this.classesService.getClassesByCols(condition_group_hocky),
        ]).subscribe({
            next: ([_donvi, _nganh_bomon, _resNamhoc, _resHocky]) => {
                this.listDonvi = _donvi.data;
                this.listBoMon = _nganh_bomon;

                const tmpNamHoc = [];
                const tmpHocky = [];
                _resNamhoc.forEach(f => {
                    if (f['namhoc'])
                        tmpNamHoc.push({ value: f['namhoc'], label: 'Năm học '.concat(f['namhoc']) });
                })
                _resHocky.forEach(f => {
                    if (f['hocky'])
                        tmpHocky.push({ value: f['hocky'], label: 'HK '.concat(f['hocky']) });
                })
                this.listNamhoc = tmpNamHoc;
                this.listHocky = tmpHocky;
                this.objectFilter.namhoc = this.listNamhoc[0]['value'];
                this.objectFilter.hocky = this.listHocky[0]['value'];
                this.loadData();
            },
            error: () => {
                this.noitifi.toastWarning('Lỗi kết nối!');
                this.displayModal = false;
            }
        })
    }

    loadData() {
        const conditon_khoa: ConditionOption = {
            condition: [
                {
                    conditionName: 'khoa', condition: OvicQueryCondition.notEqual, value: ''
                },
                { conditionName: 'namhoc', condition: OvicQueryCondition.equal, value: this.objectFilter.namhoc },
                {
                    conditionName: 'hocky',
                    condition: OvicQueryCondition.equal,
                    value: this.objectFilter.hocky.toString()
                },
            ],
            set: [

                { label: 'groupby', value: 'khoa' },
                { label: 'limit', value: '-1' },
            ],
            page: null,
        }

        this.classesService.getClassesByPageNew(conditon_khoa).subscribe({
            next: (_classes) => {
                this.listKhoa = _classes.data;
                if(_classes.data.length>0){
                    this.loadDataByKhoa(_classes.data[0].khoa.toString());
                }

            }
        })
    }

    loadDataByKhoa(khoaId: string, event?: TREE) {
        this.displayModal = true;
        this.progressValue = 0;
        this.khoaId = khoaId;
        const conditon_khoa: ConditionOption = {
            condition: [
                {
                    conditionName: 'khoa', condition: OvicQueryCondition.equal, value: khoaId.toString()
                }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,name,course_id,khoa,category_id,nganh_bomon_id,manager_info' },
            ],
            page: null,
        }

        this.classesService.getClassesByPageNew(conditon_khoa).pipe(
            switchMap((__classes): Observable<[Classes[], ElnKhoaHoc[]]> => {
                // Tăng progress từ 1 đến 33
                this.incrementProgress(1, 33, 1000); // 1 giây để tăng từ 1 lên 33

                const classes = __classes.data;
                if (classes.length > 0) {
                    const arrMap = Array.from(new Set(classes.map(cl => cl.course_id)));
                    return forkJoin<[Classes[], ElnKhoaHoc[]]>([
                        of(classes),
                        this.loopGetCourseByInclude(arrMap,50,[])
                    ])
                }
                return of([classes, []]);
            }),
            // lấy tổng số sinh viên từ danh sách lớp
            switchMap(([classes, courses]): Observable<[Classes[], ElnKhoaHoc[], ClassStudent[], RptClassStudentTestCc[]]> => {
                // Tăng progress từ 66 đến 100
                this.incrementProgress(66, 100, 1000); // 1 giây để tăng từ 66 lên 100
                return forkJoin<[Classes[], ElnKhoaHoc[], ClassStudent[], RptClassStudentTestCc[]]>([
                    of(classes),
                    of(courses),
                    // classes.length ? this.classStudentService.getClassStudentByPageNew(condition).pipe(map(res => res.data)) : of([]),
                    // classes.length ? this.rptClassStudentTestCcService.getClassStudentByPageNew(conditionRptCc).pipe(map(res => res.data)) : of([])
                    classes.length ? this.loopGetClassStudentByInclude(classes.map(cl => cl.id),50,[]) :of([]),
                    classes.length ? this.loopGetRptClassCcByInclude(classes.map(cl => cl.id),50,[]) :of([]),
                ])
            }),
        ).subscribe({
            next: ([classes, courses, classStudents, dataRptcc]) => {

                this.totalClasses = classes;
                this.totalCourse = courses;
                this.totalClassStudents = classStudents;
                this.rptClassStudentTestCc = dataRptcc;
                if (classes.length > 0) {
                    this.listDonvi.map((dv: DonVi) => {

                        const relatedCourses = courses.filter(c => c.category_ids === dv.id);
                        // Tính tổng số lớp học và sinh viên
                        const {
                            tong_so_lop_hoc, tong_so_sinh_vien, tong_so_rpt_StudentTestCc,
                            tong_so_rpt_A,
                            tong_so_rpt_B,
                            tong_so_rpt_C,
                            tong_so_rpt_D,
                            tong_so_rpt_E,
                            tong_so_sinhvien_dat
                        } = relatedCourses.reduce((acc, course) => {
                            const class_ids = classes.filter(_class => _class.course_id === course.id).map(_class => _class.id);
                            const class_students = classStudents.filter(_student => class_ids.includes(_student.class_id));
                            const class_student_ids = class_students.map(_student => _student.id);
                            const filteredStudentsTestTuan= Array.from(dataRptcc).filter(testCC => testCC.course_id === course.id &&  testCC.type == 'KT_TUAN');
                            const filteredStudentsTest15p = Array.from(dataRptcc).filter(testCC => testCC.course_id === course.id &&  testCC.type == 'KT_DAUGIO');
                            let checkThiSinhDat: number = 0;
                            class_ids.forEach(cl => {
                                const studentTest = filteredStudentsTestTuan.filter(f => f.class_id === cl);
                                class_students.filter(f => f.class_id === cl).forEach(stdTest => {
                                    const checkDataStudentTest = studentTest && studentTest.length > 0 ? studentTest.filter(f => f.student_id === stdTest.student_id) : [];
                                    if (checkDataStudentTest.length > 0 && checkDataStudentTest.filter(f => f.passing_point > f.maxpoint_at).length === 0) {
                                        checkThiSinhDat += 1;
                                    }
                                })
                            })
                            acc.tong_so_lop_hoc += class_ids.length;
                            // acc.tong_so_sinh_vien += Array.from(new Set(class_student_ids)).length;
                            acc.tong_so_sinh_vien += class_student_ids.length;
                            acc.tong_so_rpt_StudentTestCc += filteredStudentsTest15p.filter((item, index, self) => index === self.findIndex(t => t.student_id === item.student_id)).length;
                            acc.tong_so_rpt_A += filteredStudentsTest15p.filter(f => f.point_15 >= 85).length;
                            acc.tong_so_rpt_B += filteredStudentsTest15p.filter(f => f.point_15 >= 70 && f.point_15 <= 84).length;
                            acc.tong_so_rpt_C += filteredStudentsTest15p.filter(f => f.point_15 >= 55 && f.point_15 <= 69).length;
                            acc.tong_so_rpt_D += filteredStudentsTest15p.filter(f => f.point_15 >= 41 && f.point_15 <= 54).length;
                            acc.tong_so_rpt_E += filteredStudentsTest15p.filter(f => f.point_15 <= 40).length;
                            acc.tong_so_sinhvien_dat += checkThiSinhDat
                            return acc;
                        }, {
                            tong_so_lop_hoc: 0, tong_so_sinh_vien: 0, tong_so_rpt_StudentTestCc: 0, tong_so_rpt_A: 0,
                            tong_so_rpt_B: 0,
                            tong_so_rpt_C: 0,
                            tong_so_rpt_D: 0,
                            tong_so_rpt_E: 0,
                            tong_so_sinhvien_dat: 0,
                        });

                        // Tính tổng số môn học và tín chỉ
                        dv['__tong_so_lop_hoc'] = tong_so_lop_hoc;
                        dv['__tong_so_sinh_vien'] = tong_so_sinh_vien;
                        dv['__tong_so_monhoc'] = relatedCourses.length;
                        dv['__tong_so_tin_chi'] = relatedCourses.reduce((sum, course) => sum + Number(course.params?.sotinchi || 0), 0);
                        dv['__tong_so_rpt_student_havetest'] = tong_so_rpt_StudentTestCc;
                        dv['__tong_so_rpt_student_nottest'] = tong_so_sinh_vien - tong_so_rpt_StudentTestCc;
                        dv['__tong_so_rpt_A'] = tong_so_rpt_A;
                        dv['__tong_so_rpt_B'] = tong_so_rpt_B;
                        dv['__tong_so_rpt_C'] = tong_so_rpt_C;
                        dv['__tong_so_rpt_D'] = tong_so_rpt_D;
                        dv['__tong_so_rpt_E'] = tong_so_rpt_E;
                        dv['__tong_so_sinhvien_dat'] = tong_so_sinhvien_dat;
                        dv['__tong_so_test_cc'] = tong_so_rpt_A + tong_so_rpt_B + tong_so_rpt_C + tong_so_rpt_D + tong_so_rpt_E;

                        return dv;
                    });


                    const total = this.listDonvi.reduce((acc, dv: DonVi) => {
                        acc.tong_so_lop_hoc += dv['__tong_so_lop_hoc'];
                        acc.tong_so_sinh_vien += dv['__tong_so_sinh_vien'];
                        acc.tong_so_monhoc += dv['__tong_so_monhoc'];
                        acc.tong_so_tin_chi += dv['__tong_so_tin_chi'];
                        acc.tong_so_rpt_student_havetest += dv['__tong_so_rpt_student_havetest'];
                        acc.tong_so_rpt_student_nottest += dv['__tong_so_rpt_student_nottest'];
                        acc.tong_so_rpt_A += dv['__tong_so_rpt_A'];
                        acc.tong_so_rpt_B += dv['__tong_so_rpt_B'];
                        acc.tong_so_rpt_C += dv['__tong_so_rpt_C'];
                        acc.tong_so_rpt_D += dv['__tong_so_rpt_D'];
                        acc.tong_so_rpt_E += dv['__tong_so_rpt_E'];
                        acc.tong_so_sinhvien_dat += dv['__tong_so_sinhvien_dat'];
                        acc.tong_so_test_cc += dv['__tong_so_test_cc'];
                        return acc;
                    }, {
                        tong_so_lop_hoc: 0,
                        tong_so_sinh_vien: 0,
                        tong_so_monhoc: 0,
                        tong_so_tin_chi: 0,
                        tong_so_rpt_student_havetest: 0,
                        tong_so_rpt_student_nottest: 0,
                        tong_so_rpt_A: 0,
                        tong_so_rpt_B: 0,
                        tong_so_rpt_C: 0,
                        tong_so_rpt_D: 0,
                        tong_so_rpt_E: 0,
                        tong_so_sinhvien_dat: 0,
                        tong_so_test_cc: 0,
                    });

                    // Tính phần trăm cho mỗi đơn vị
                    this.list_khoa = this.listDonvi.map((dv: DonVi) => ({
                        ...dv,
                        __percent_lop_hoc: total.tong_so_lop_hoc > 0 ? (dv['__tong_so_lop_hoc'] / total.tong_so_lop_hoc) * 100 : 0,
                        __percent_sinh_vien: total.tong_so_sinh_vien > 0 ? (dv['__tong_so_sinh_vien'] / total.tong_so_sinh_vien) * 100 : 0,
                        __percent_mon_hoc: total.tong_so_monhoc > 0 ? (dv['__tong_so_monhoc'] / total.tong_so_monhoc) * 100 : 0,
                        __percent_tin_chi: total.tong_so_tin_chi > 0 ? (dv['__tong_so_tin_chi'] / total.tong_so_tin_chi) * 100 : 0,
                        __percent_rpt_student_havetest: total.tong_so_rpt_student_havetest > 0 ? (dv['__tong_so_rpt_student_havetest'] / dv['__tong_so_sinh_vien']) * 100 : 0,
                        __percent_rpt_student_nottest: total.tong_so_rpt_student_nottest > 0 ? (dv['__tong_so_rpt_student_nottest'] / dv['__tong_so_sinh_vien']) * 100 : 0,
                        __percent_rpt_A: total.tong_so_rpt_A > 0 ? (dv['__tong_so_rpt_A'] / total.tong_so_test_cc) * 100 : 0,
                        __percent_rpt_B: total.tong_so_rpt_B > 0 ? (dv['__tong_so_rpt_B'] / total.tong_so_test_cc) * 100 : 0,
                        __percent_rpt_C: total.tong_so_rpt_C > 0 ? (dv['__tong_so_rpt_C'] / total.tong_so_test_cc) * 100 : 0,
                        __percent_rpt_D: total.tong_so_rpt_D > 0 ? (dv['__tong_so_rpt_D'] / total.tong_so_test_cc) * 100 : 0,
                        __percent_rpt_E: total.tong_so_rpt_E > 0 ? (dv['__tong_so_rpt_E'] / total.tong_so_test_cc) * 100 : 0,
                        __percent_sinhvien_dat: total.tong_so_sinhvien_dat > 0 ? (dv['__tong_so_sinhvien_dat'] / dv['__tong_so_sinh_vien']) * 100 : 0,
                    }));

                } else {
                    this.list_khoa = [];
                }
                this.displayModal = false;
                this.treeCoures = this.setNewTreeKhoa(this.listKhoa, this.listDonvi, this.listBoMon, this.totalCourse);
                if (this.treeCoures[0] && this.loadder === false) {
                    this.loadder = true;
                    this.treeCoures[0].expanded = true;
                    this.nodeSelect(this.treeCoures[0]);
                }
            },
            error: () => {
                this.noitifi.toastWarning('Lỗi kết nối!');
                this.displayModal = false;
            }
        })
    }

    setNewTreeKhoa(classes: Classes[], listDonvi: DonVi[], listBoMon: Category[], totalCourse: ElnKhoaHoc[]): TREE[] {
        const data: TREE[] = [];
        // Tạo ra danh mục Khoá theo khoá đã lọc
        classes.forEach(khoaObj => {
            const khoaNode = {
                collapsedIcon: 'fa fa-folder icon-folder-media',
                data: 'khoa',
                expandedIcon: 'fa fa-folder-open icon-folder-media',
                id: khoaObj.id,
                key: khoaObj.id.toString().concat('khoa'),
                label: "K" + khoaObj.khoa,
                parent_id: 0,
                styleClass: 'tree-node-parent file_explorer_tree',
                expanded: false,
                children: [],
                parent_folder: '0',
                icon: '',
                raw_node: khoaObj
            };

            // Gán toàn bộ đơn vị vào Khoá
            const khoaChildren = listDonvi;

            khoaChildren.forEach(donvi => {
                const khoaChildNode = {
                    collapsedIcon: 'fa fa-folder icon-folder-media',
                    data: 'donvi',
                    expandedIcon: 'fa fa-folder-open icon-folder-media',
                    id: donvi.id,
                    key: donvi.id.toString().concat('donvi_child'),
                    label: donvi.title, // Tên hiển thị đơn vị
                    parent_id: khoaObj.id,
                    styleClass: 'tree-node-parent file_explorer_tree',
                    expanded: false,
                    children: [],
                    parent_folder: '0',
                    icon: '',
                    raw_node: donvi
                };

                const monHocChildren = totalCourse.filter(cr => cr.category_ids === donvi.id);

                monHocChildren.forEach(monhoc => {
                    const monHocNode = {
                        collapsedIcon: 'fa fa-folder icon-folder-media',
                        data: 'monhoc',
                        expandedIcon: 'fa fa-folder icon-folder-media',
                        id: monhoc.id,
                        key: monhoc.id.toString().concat('monhoc'),
                        label: monhoc.title, // Label for Môn học
                        parent_id: donvi.id,
                        styleClass: 'tree-node-child file_explorer_tree',
                        expanded: false,
                        children: [],
                        parent_folder: '0',
                        icon: 'fa fa-file',
                        raw_node: monhoc
                    };

                    const lopHocChildren = this.totalClasses.filter(cl => cl.course_id === monhoc.id);

                    lopHocChildren.forEach(lophoc => {
                        const lopHocNode = {
                            collapsedIcon: 'fa fa-file icon-file-media',
                            data: 'lophoc',
                            expandedIcon: 'fa fa-file icon-file-media',
                            id: lophoc.id,
                            key: lophoc.id.toString().concat('lophoc'),
                            label: lophoc.name, // Label for Môn học
                            parent_id: lophoc.id,
                            styleClass: 'tree-node-child file_explorer_tree',
                            expanded: false,
                            children: [],
                            parent_folder: '0',
                            icon: 'fa fa-file',
                            raw_node: lophoc
                        };
                        monHocNode.children.push(lopHocNode);
                    });

                    khoaChildNode.children.push(monHocNode);
                });

                khoaNode.children.push(khoaChildNode);
            });

            data.push(khoaNode);
        });


        return data;
    }

    nodeSelect(event: any) {

        if (event) {
            if (!this.selectedNodeTree || this.selectedNodeTree.key !== event.key) {
                this.selectedNodeTree = event;
                switch (event.data) {
                    case 'khoa':
                        this.typeViewTable = "data";
                        this.selectedKhoa = event.raw_node;
                        this.text_selected_tree = event.label.toUpperCase();
                        this.selectedBoMon = null;
                        this.selectedMonHoc = null;
                        if (event.expanded) {
                            this.loadDataByKhoa(event.label.slice(1), event);
                        }

                        break;
                    case 'donvi':
                        this.typeViewTable = "data";

                        this.selectedDonvi = event.raw_node;
                        this.text_selected_tree = event.label.toUpperCase();
                        this.selectedBoMon = null;
                        this.selectedMonHoc = null;
                        this.loadingTable = true;

                        const filteredMonHoc = this.totalCourse.filter(mh => mh.category_ids === this.selectedDonvi.id);
                        this.processData(filteredMonHoc, this.totalClasses, this.totalClassStudents, this.rptClassStudentTestCc, 'donvi');
                        break;

                    case 'monhoc':
                        this.typeViewTable = "data";

                        this.selectedMonHoc = event.raw_node;
                        this.text_selected_tree = 'MÔN ' + event.label.toUpperCase();
                        this.loadingTable = true;

                        const filteredLopHoc = this.totalClasses.filter(cl => cl.course_id === this.selectedMonHoc.id);
                        // this.processData(filteredLopHoc, this.totalClasses, this.totalClassStudents, this.rptClassStudentTestCc, 'monhoc');
                        this.processDataClassV1(filteredLopHoc, this.totalClasses, this.totalClassStudents, this.rptClassStudentTestCc, 'monhoc');
                        break;
                    case 'lophoc':
                        this.typeViewTable = "student";
                        this.selectedLopHoc = event.raw_node;
                        this.text_selected_tree = 'LỚP ' + event.label.toUpperCase();
                        this.loadingTable = true;
                        const filteredSinhVien = this.totalClassStudents.filter(st => st.class_id === this.selectedLopHoc.id);
                        const request_student = [];
                        request_student[0] = [];
                        let i = 0;

                        filteredSinhVien.map(sv => {
                            const condition_student: ConditionOption = {
                                condition: [
                                    {
                                        conditionName: 'user_id',
                                        condition: OvicQueryCondition.equal,
                                        value: sv.user_id.toString()
                                    },
                                ],
                                set: [],
                                page: null
                            }

                            if (request_student[i].length < 6) {
                                request_student[i].push(this.elngUserProfileService.getUserProfileByPageNewV2(condition_student).pipe(mergeMap(_passed => {
                                    sv['__thong_tin_ca_nhan'] = _passed.data;
                                    return of(null)
                                })))

                            } else {
                                i++;
                                request_student[i] = [];
                                request_student[i].push(this.elngUserProfileService.getUserProfileByPageNewV2(condition_student).pipe(mergeMap(_passed => {
                                    sv['__thong_tin_ca_nhan'] = _passed.data;
                                    return of(null)
                                })))

                            }
                        })

                        this.loopGetStudentInfor(0, request_student, filteredSinhVien);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    processData(dataList, classes: Classes[], classStudents: ClassStudent[], rptStudentTest: RptClassStudentTestCc[], filterType?: string) {

        // Tính toán và lưu kết quả cho từng bộ môn hoặc môn học tùy theo filterType

        dataList.forEach(item => {

            const class_ids = classes.filter(_class => _class.course_id === item.id).map(_class => _class.id);
            const class_students = classStudents.filter(_student => class_ids.includes(_student.class_id));
            const class_student_ids = class_students.map(_student => _student.student_id);
            const filteredStudentsTestTuan = rptStudentTest.filter(testCC => testCC.course_id === item.id && testCC.type =='KT_TUAN');
            const filteredStudentsTestDaugio = rptStudentTest.filter(testCC => testCC.course_id === item.id && testCC.type =='KT_DAUGIO');
            let checkThiSinhDat: number = 0;
            class_ids.forEach(cl => {
                const studentTest = filteredStudentsTestTuan.filter(f => f.class_id === cl);
                class_students.filter(f => f.class_id === cl).forEach(stdTest => {
                    const checkDataStudentTest = studentTest && studentTest.length > 0 ? studentTest.filter(f => f.student_id === stdTest.student_id) : [];
                    if (checkDataStudentTest.length > 0 && checkDataStudentTest.filter(f => f.passing_point > f.maxpoint_at).length === 0) {
                        checkThiSinhDat += 1;
                    }
                })
            })
            const tong_so_lop_hoc = class_ids.length;
            const tong_so_sinh_vien = class_students.length;
            const tong_so_sinhvien_daTest = rptStudentTest.filter(f => class_student_ids.includes(f.student_id)).filter((item, index, self) => index === self.findIndex(t => t.student_id === item.student_id)).length;
            const tong_so_sinhvient_chuaTest = tong_so_sinh_vien - tong_so_sinhvien_daTest;

            const tong_so_rpt_A = filteredStudentsTestDaugio.filter(f => f.point_15 >= 85).length;
            const tong_so_rpt_B = filteredStudentsTestDaugio.filter(f => f.point_15 >= 70 && f.point_15 <= 84).length;
            const tong_so_rpt_C = filteredStudentsTestDaugio.filter(f => f.point_15 >= 55 && f.point_15 <= 69).length;
            const tong_so_rpt_D = filteredStudentsTestDaugio.filter(f => f.point_15 >= 41 && f.point_15 <= 54).length;
            const tong_so_rpt_E = filteredStudentsTestDaugio.filter(f => f.point_15 <= 40).length;


            // Gán các giá trị vào item môn học
            item['__tong_so_lop_hoc'] = tong_so_lop_hoc;
            item['__tong_so_sinh_vien'] = tong_so_sinh_vien;
            item['__tong_so_rpt_student_havetest'] = tong_so_sinhvien_daTest;
            item['__tong_so_rpt_student_nottest'] = tong_so_sinhvient_chuaTest;
            item['__tong_so_rpt_A'] = tong_so_rpt_A;
            item['__tong_so_rpt_B'] = tong_so_rpt_B;
            item['__tong_so_rpt_C'] = tong_so_rpt_C;
            item['__tong_so_rpt_D'] = tong_so_rpt_D;
            item['__tong_so_rpt_E'] = tong_so_rpt_E;
            item['__tong_so_sinhvien_dat'] = checkThiSinhDat;
            item['__tong_so_test_cc'] = tong_so_rpt_A + tong_so_rpt_B + tong_so_rpt_C + tong_so_rpt_D + tong_so_rpt_E;

        });
        // Tính tổng số lớp học, sinh viên, môn học, tín chỉ cho tất cả các mục
        const total = dataList.reduce((acc, item) => {
            acc.tong_so_lop_hoc += item['__tong_so_lop_hoc'];
            acc.tong_so_sinh_vien += item['__tong_so_sinh_vien'];
            acc.tong_so_rpt_student_havetest += item['__tong_so_rpt_student_havetest'];
            acc.tong_so_rpt_student_nottest += item['__tong_so_rpt_student_nottest'];
            acc.tong_so_rpt_A += item['__tong_so_rpt_A'];
            acc.tong_so_rpt_B += item['__tong_so_rpt_B'];
            acc.tong_so_rpt_C += item['__tong_so_rpt_C'];
            acc.tong_so_rpt_D += item['__tong_so_rpt_D'];
            acc.tong_so_rpt_E += item['__tong_so_rpt_E'];
            acc.tong_so_sinhvien_dat += item['__tong_so_sinhvien_dat'];
            acc.tong_so_test_cc += item['__tong_so_test_cc'];
            return acc;
        }, {
            tong_so_lop_hoc: 0,
            tong_so_sinh_vien: 0,
            tong_so_rpt_student_havetest: 0,
            tong_so_rpt_student_nottest: 0,
            tong_so_rpt_A: 0,
            tong_so_rpt_B: 0,
            tong_so_rpt_C: 0,
            tong_so_rpt_D: 0,
            tong_so_rpt_E: 0,
            tong_so_sinhvien_dat: 0,
            tong_so_test_cc: 0,
        });

        // Tính phần trăm cho từng bộ môn hoặc môn học
        this.list_khoa = dataList.map(dv => {

            return {
                ...dv,
                __percent_lop_hoc: total.tong_so_lop_hoc > 0 ? (dv['__tong_so_lop_hoc'] / total.tong_so_lop_hoc) * 100 : 0,
                __percent_sinh_vien: total.tong_so_sinh_vien > 0 ? (dv['__tong_so_sinh_vien'] / total.tong_so_sinh_vien) * 100 : 0,
                __percent_mon_hoc: total.tong_so_monhoc > 0 ? (dv['__tong_so_monhoc'] / total.tong_so_monhoc) * 100 : 0,
                __percent_tin_chi: total.tong_so_tin_chi > 0 ? (dv['__tong_so_tin_chi'] / total.tong_so_tin_chi) * 100 : 0,
                __percent_rpt_student_havetest: total.tong_so_rpt_student_havetest > 0 ? (dv['__tong_so_rpt_student_havetest'] / dv['__tong_so_sinh_vien']) * 100 : 0,
                __percent_rpt_student_nottest: total.tong_so_rpt_student_nottest > 0 ? (dv['__tong_so_rpt_student_nottest'] / dv['__tong_so_sinh_vien']) * 100 : 0,
                __percent_rpt_A: total.tong_so_rpt_A > 0 ? (dv['__tong_so_rpt_A'] / total.tong_so_test_cc) * 100 : 0,
                __percent_rpt_B: total.tong_so_rpt_B > 0 ? (dv['__tong_so_rpt_B'] / total.tong_so_test_cc) * 100 : 0,
                __percent_rpt_C: total.tong_so_rpt_C > 0 ? (dv['__tong_so_rpt_C'] / total.tong_so_test_cc) * 100 : 0,
                __percent_rpt_D: total.tong_so_rpt_D > 0 ? (dv['__tong_so_rpt_D'] / total.tong_so_test_cc) * 100 : 0,
                __percent_rpt_E: total.tong_so_rpt_E > 0 ? (dv['__tong_so_rpt_E'] / total.tong_so_test_cc) * 100 : 0,
                __percent_sinhvien_dat: total.tong_so_sinhvien_dat > 0 ? (dv['__tong_so_sinhvien_dat'] / dv['__tong_so_sinh_vien']) * 100 : 0,

            };
        });

        this.loadingTable = false;

        // Hiển thị kết quả hoặc xử lý thêm

    }

    processDataClassV1(dataList, classes: Classes[], classStudents: ClassStudent[], rptStudentTest: RptClassStudentTestCc[], filterType?: string) {

        dataList.map(dl => {
            const totalStudentInClass = classStudents.filter(f => f.class_id === dl.id);
            const class_student_ids = totalStudentInClass.map(m => m.student_id);
            const filteredStudentsTestDaugio = Array.from(rptStudentTest).filter(test => test.type == 'KT_DAUGIO' && test.class_id == dl.id && class_student_ids.includes(test.student_id));
            const filteredStudentsTestTuan = Array.from(rptStudentTest).filter(test => test.type == 'KT_TUAN' && test.class_id == dl.id && class_student_ids.includes(test.student_id));
            const tong_so_sinhvien = totalStudentInClass.length;
            const tong_so_sinhvien_daTest = filteredStudentsTestDaugio.length > 0 ? filteredStudentsTestDaugio.filter((item, index, self) => index === self.findIndex(t => t.student_id === item.student_id)).length : 0;
            const tong_so_sinhvient_chuaTest = tong_so_sinhvien - tong_so_sinhvien_daTest;


            let checkThiSinhDat: number = 0;

            class_student_ids.forEach(stdTest => {
                if (filteredStudentsTestTuan.filter(st => st.student_id === stdTest && st.passing_point > st.maxpoint_3t).length > 0) {
                    checkThiSinhDat += 1;
                }
            })

            const tong_so_rpt_A = filteredStudentsTestDaugio.filter(f => f.point_15 >= 85).length;
            const tong_so_rpt_B = filteredStudentsTestDaugio.filter(f => f.point_15 >= 70 && f.point_15 <= 84).length;
            const tong_so_rpt_C = filteredStudentsTestDaugio.filter(f => f.point_15 >= 55 && f.point_15 <= 69).length;
            const tong_so_rpt_D = filteredStudentsTestDaugio.filter(f => f.point_15 >= 41 && f.point_15 <= 54).length;
            const tong_so_rpt_E = filteredStudentsTestDaugio.filter(f => f.point_15 <= 40).length;


            // Gán các giá trị vào item môn học
            dl['__tong_so_sinh_vien'] = tong_so_sinhvien;
            dl['__tong_so_rpt_student_havetest'] = tong_so_sinhvien_daTest;
            dl['__tong_so_rpt_student_nottest'] = tong_so_sinhvient_chuaTest;
            dl['__tong_so_rpt_A'] = tong_so_rpt_A;
            dl['__tong_so_rpt_B'] = tong_so_rpt_B;
            dl['__tong_so_rpt_C'] = tong_so_rpt_C;
            dl['__tong_so_rpt_D'] = tong_so_rpt_D;
            dl['__tong_so_rpt_E'] = tong_so_rpt_E;
            dl['__tong_so_sinhvien_dat'] = checkThiSinhDat;
            dl['__tong_so_test_cc'] = tong_so_rpt_A + tong_so_rpt_B + tong_so_rpt_C + tong_so_rpt_D + tong_so_rpt_E;

            return dl
        });

        const total = dataList.reduce((acc, item) => {

            acc.tong_so_sinh_vien += item['__tong_so_sinh_vien'];
            acc.tong_so_rpt_student_havetest += item['__tong_so_rpt_student_havetest'];
            acc.tong_so_rpt_student_nottest += item['__tong_so_rpt_student_nottest'];
            acc.tong_so_rpt_A += item['__tong_so_rpt_A'];
            acc.tong_so_rpt_B += item['__tong_so_rpt_B'];
            acc.tong_so_rpt_C += item['__tong_so_rpt_C'];
            acc.tong_so_rpt_D += item['__tong_so_rpt_D'];
            acc.tong_so_rpt_E += item['__tong_so_rpt_E'];
            acc.tong_so_sinhvien_dat += item['__tong_so_sinhvien_dat'];
            acc.tong_so_test_cc += item['__tong_so_test_cc'];
            return acc;
        }, {
            tong_so_sinh_vien: 0,
            tong_so_rpt_student_havetest: 0,
            tong_so_rpt_student_nottest: 0,
            tong_so_rpt_A: 0,
            tong_so_rpt_B: 0,
            tong_so_rpt_C: 0,
            tong_so_rpt_D: 0,
            tong_so_rpt_E: 0,
            tong_so_sinhvien_dat: 0,
            tong_so_test_cc: 0,
        });


        this.list_khoa = dataList.map(dv => ({
            ...dv,
            __percent_lop_hoc: total.tong_so_lop_hoc > 0 ? (dv['__tong_so_lop_hoc'] / total.tong_so_lop_hoc) * 100 : 0,
            __percent_sinh_vien: total.tong_so_sinh_vien > 0 ? (dv['__tong_so_sinh_vien'] / total.tong_so_sinh_vien) * 100 : 0,
            __percent_mon_hoc: total.tong_so_monhoc > 0 ? (dv['__tong_so_monhoc'] / total.tong_so_monhoc) * 100 : 0,
            __percent_tin_chi: total.tong_so_tin_chi > 0 ? (dv['__tong_so_tin_chi'] / total.tong_so_tin_chi) * 100 : 0,
            __percent_rpt_student_havetest: total.tong_so_rpt_student_havetest > 0 ? (dv['__tong_so_rpt_student_havetest'] / dv['__tong_so_sinh_vien']) * 100 : 0,
            __percent_rpt_student_nottest: total.tong_so_rpt_student_nottest > 0 ? (dv['__tong_so_rpt_student_nottest'] / dv['__tong_so_sinh_vien']) * 100 : 0,
            __percent_rpt_A: total.tong_so_rpt_A > 0 ? (dv['__tong_so_rpt_A'] / total.tong_so_test_cc) * 100 : 0,
            __percent_rpt_B: total.tong_so_rpt_B > 0 ? (dv['__tong_so_rpt_B'] / total.tong_so_test_cc) * 100 : 0,
            __percent_rpt_C: total.tong_so_rpt_C > 0 ? (dv['__tong_so_rpt_C'] / total.tong_so_test_cc) * 100 : 0,
            __percent_rpt_D: total.tong_so_rpt_D > 0 ? (dv['__tong_so_rpt_D'] / total.tong_so_test_cc) * 100 : 0,
            __percent_rpt_E: total.tong_so_rpt_E > 0 ? (dv['__tong_so_rpt_E'] / total.tong_so_test_cc) * 100 : 0,
            __percent_sinhvien_dat: total.tong_so_sinhvien_dat > 0 ? (dv['__tong_so_sinhvien_dat'] / dv['__tong_so_sinh_vien']) * 100 : 0,

        }));
        this.loadingTable = false;
    }

    loopGetStudentInfor(key, request, dataStudents) {
        if (key < request.length) {
            this.progressValue = key / request.length * 100;
            forkJoin(request[key]).subscribe({
                next: () => {
                    this.loopGetStudentInfor(key + 1, request, dataStudents);
                },
                error: () => {

                }
            })
        } else {
            console.log('else');
            const uniqueIds = Array.from(new Set(this.rptClassStudentTestCc.map(item => item.week))).sort((a, b) => a - b);
            this.objectWeek = uniqueIds;
            dataStudents.map(m => {
                const info = m['__thong_tin_ca_nhan'][0];
                m['__displayName'] = info ? info['full_name'] : '';
                m['__studentCode'] = info ? info['student_code'] : '';
                const datarpt = this.rptClassStudentTestCc.filter(f => f.student_id === m.student_id && f.class_id === m.class_id && f.course_id === f.course_id);
                const total_rpt_dat = datarpt.filter(f =>f.type == 'KT_DAUGIO' && f.maxpoint_at >= f.passing_point).length;
                const total_rpt = datarpt.filter(f =>f.type == 'KT_DAUGIO').length;
                m['__total_rpt_dat'] = total_rpt_dat;
                m['__total_rpt'] = total_rpt;

                if (uniqueIds) {
                    uniqueIds.forEach(week => {
                        const getWeekDaugio = datarpt.find(f =>f.type == 'KT_DAUGIO' && f.week === week);
                        const getWeekTuan = datarpt.find(f =>f.type == 'KT_TUAN' && f.week === week);
                        m['__score_week_' + week] = getWeekDaugio ? getWeekDaugio.point_15 / 10 : '-';
                        m['__condition_week_' + week] = getWeekTuan ? (getWeekTuan.maxpoint_at >= getWeekTuan.passing_point ? 'dat' : 'chuadat') : '-';
                    })
                }
                return m;
            })
            this.dataStudentsByMenu = dataStudents;
            // console.log(this.dataStudentsByMenu);
            this.noitifi.isProcessing(false);
            this.displayModal = false;
            this.loadingTable = false;


        }
    }


    // Hàm để lấy tổng giá trị cho các thuộc tính
    getTotal(type: string): number {
        return this.list_khoa.reduce((sum, khoa) => {
            switch (type) {
                case 'monhoc':
                    return sum + (khoa['__tong_so_monhoc'] || 0);
                case 'tinchi':
                    return sum + (khoa['__tong_so_tin_chi'] || 0);
                case 'lophoc':
                    return sum + (khoa['__tong_so_lop_hoc'] || 0);
                case 'sinhvien':
                    return sum + (khoa['__tong_so_sinh_vien'] || 0);
                case 'sinhvien-have-test-cc':
                    return sum + (khoa['__tong_so_rpt_student_havetest'] || 0);
                case 'sinhvien-not-test-cc':
                    return sum + (khoa['__tong_so_rpt_student_nottest'] || 0);
                case 'rpt_A':
                    return sum + (khoa['__tong_so_rpt_A'] || 0);
                case 'rpt_B':
                    return sum + (khoa['__tong_so_rpt_B'] || 0);
                case 'rpt_C':
                    return sum + (khoa['__tong_so_rpt_C'] || 0);
                case 'rpt_D':
                    return sum + (khoa['__tong_so_rpt_D'] || 0);
                case 'rpt_E':
                    return sum + (khoa['__tong_so_rpt_E'] || 0);
                case 'rpt_dat':
                    return sum + (khoa['__tong_so_sinhvien_dat'] || 0);
                case 'tong_so_test_cc':
                    return sum + (khoa['__tong_so_test_cc'] || 0);

                default:
                    return sum;
            }
        }, 0);
    }

    // Hàm để tính tổng phần trăm cho các thuộc tính
    getTotalPercent(type: string): number {
        return this.list_khoa.reduce((sum, khoa) => {
            switch (type) {
                case 'monhoc':
                    return sum + (khoa['__percent_mon_hoc'] || 0);
                case 'tinchi':
                    return sum + (khoa['__percent_tin_chi'] || 0);
                case 'lophoc':
                    return sum + (khoa['__percent_lop_hoc'] || 0);
                case 'sinhvien':
                    return sum + (khoa['__percent_sinh_vien'] || 0);
                case 'sinhvien-have-test-cc':
                    return sum + (khoa['__percent_rpt_student_havetest'] || 0);
                case 'sinhvien-not-test-cc':
                    return sum + (khoa['__percent_rpt_student_nottest'] || 0);

                case 'rpt_A':
                    return sum + (khoa['__percent_rpt_A'] || 0);
                case 'rpt_B':
                    return sum + (khoa['__percent_rpt_B'] || 0);
                case 'rpt_C':
                    return sum + (khoa['__percent_rpt_C'] || 0);
                case 'rpt_D':
                    return sum + (khoa['__percent_rpt_D'] || 0);
                case 'rpt_E':
                    return sum + (khoa['__percent_rpt_E'] || 0);
                case 'rpt_dat':
                    return sum + (khoa['__percent_dat'] || 0);


                default:
                    return sum;
            }
        }, 0);
    }

    incrementProgress(start: number, end: number, duration: number) {
        return new Promise<void>((resolve) => {
            const stepTime = (duration / (end - start));
            const interval = setInterval(() => {
                if (this.progressValue < end) {
                    this.progressValue += 1;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, stepTime);
        });
    }


    closeAndOpenNode(event) {
        this.nodeSelect(event);
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onChangeFilter(event, keyName: string) {
        if (event) {
            this.objectFilter[keyName] = event['value'];
        } else {
            this.objectFilter[keyName] = null;
        }
        this.loadData();

    }

    onSearchByTitle() {

    }

    // ------------------------- new update -------------------------

     private loopGetCourseByInclude(dataInclude:number[], limit:number,newData:ElnKhoaHoc[]):Observable<ElnKhoaHoc[]>{

        if(dataInclude.length == 0  ){
            return of(newData);
        }
        const arrGet = Array.from(dataInclude).slice(0,limit);
        const arrNotGet = Array.from(dataInclude).slice(limit);
        const conditon_khoahoc: ConditionOption = {
            condition: [],
            set: [
                { label: 'include', value: arrGet.toString() },
                { label: 'include_by', value: 'id' },
                { label: 'limit', value: '-1' },
                { label: 'select', value: 'id,title,category_ids,params,nganh_bomon_id' },
            ],
            page: null,
        }
        return this.elnKhoaHocService.getKhoaHocByPageNew_2(conditon_khoahoc).pipe(switchMap(
            m=>{
            return this.loopGetCourseByInclude(arrNotGet,limit,newData.concat(m.data))
        }))
    }

    private loopGetClassStudentByInclude(dataInclude:number[], limit:number,newData: ClassStudent[]):Observable<ClassStudent[]>{

        if(dataInclude.length == 0  ){
            return of(newData);
        }
        const arrGet = Array.from(dataInclude).slice(0,limit);
        const arrNotGet = Array.from(dataInclude).slice(limit);
        const condition: ConditionOption = {
            condition: [],
            set: [
                { label: 'include', value: arrGet.toString() },
                { label: 'include_by', value: 'class_id' },
                { label: 'limit', value: '-1' },
                // { label: 'select', value: 'id,class_id,' },
            ],
            page: null,
        }
        return this.classStudentService.getClassStudentByPageNew(condition).pipe(switchMap(
            m=>{
                return this.loopGetClassStudentByInclude(arrNotGet,limit,newData.concat(m.data))
            }))
    }
    private loopGetRptClassCcByInclude(dataInclude:number[], limit:number,newData: RptClassStudentTestCc[]):Observable<RptClassStudentTestCc[]>{

        if(dataInclude.length == 0  ){
            return of(newData);
        }
        const arrGet = Array.from(dataInclude).slice(0,limit);
        const arrNotGet = Array.from(dataInclude).slice(limit);
        const condition: ConditionOption = {
            condition: [],
            set: [
                { label: 'include', value: arrGet.toString() },
                { label: 'include_by', value: 'class_id' },
                { label: 'limit', value: '-1' },
                // { label: 'select', value: 'id,class_id,' },
            ],
            page: null,
        }
        return this.rptClassStudentTestCcService.getClassStudentByPageNew(condition).pipe(switchMap(
            m=>{
                return this.loopGetRptClassCcByInclude(arrNotGet,limit,newData.concat(m.data))
            }))
    }
}
