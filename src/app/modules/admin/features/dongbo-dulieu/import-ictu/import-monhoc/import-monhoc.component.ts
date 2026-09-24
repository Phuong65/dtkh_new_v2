import { readImportFile } from '../../read-import-file';
import { CourseQuestionsService } from '@shared/services/course-questions.service';
import { UserService } from '@core/services/user.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { FileService } from '@core/services/file.service';
import { DonVi } from '@modules/shared/models/don-vi';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { DonViService } from '@modules/shared/services/don-vi.service';
import { CHUAN_DAU_RA, ROLES } from '@modules/shared/utils/syscat';
import { NotificationService } from '@core/services/notification.service';
import { HelperService } from '@core/services/helper.service';
import * as XLSX from 'xlsx';
import { catchError, delay, forkJoin, isEmpty, mergeMap, Observable, of } from 'rxjs';
import { TreeModule } from 'primeng/tree';
import { saveAs } from 'file-saver';
import { RoleService } from '@core/services/role.service';
import { User } from '@core/models/user';
import { CourseQuestions } from '@modules/shared/models/course-questions';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';

@Component({
    standalone: true,
    imports: [CommonModule, SharedModule, CheckboxModule, TableModule, PaginatorModule, MatProgressBarModule, DialogModule],
    selector: 'app-import-monhoc',
    templateUrl: './import-monhoc.component.html',
    styleUrls: ['./import-monhoc.component.css']
})
export class ImportMonhocComponent implements OnInit {

    displayModal: boolean = false;

    progressValue: number = 0;

    waitting_title: string;

    list_monhoc: ElnKhoaHoc[] = [];

    search_monhoc: string;

    status_import_filter: number;

    pageImport: number = 0;

    status_object = {
        no_import: 0,
        import_done: 0,
        import_fail: 0
    }

    HINHTHUCTHI = {
        THUCHANH: 'Thực hành',
        TRACNGHIEM: 'Trắc nghiệm',
        DOAN: 'Báo cáo đồ án'
    }

    CAUTRUCDE = {
        0: 'Môn thường',
        1: 'Tiếng anh',
        2: 'Toán'
    }

    list_cdr = CHUAN_DAU_RA;

    list_donvi: DonVi[];

    list_teacher: User[];

    ghi_de: boolean = false;

    @ViewChild('inputImport') inputImport: ElementRef;

    constructor(
        private auth: AuthService,
        private donViService: DonViService,
        private notificationService: NotificationService,
        private helperService: HelperService,
        private fileService: FileService,
        private elnKhoaHocService: ElnKhoaHocService,
        private userService: UserService,
        private roleService: RoleService,
        private courseQuestionsService: CourseQuestionsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.auth.setFeatureSecondary("Đồng bộ dữ liệu - Môn học");
        this.initLoad();
    }

    getRolesPromise(): Promise<any> {
        return new Promise((resolve, reject) => {
            const objectRoles = {};

            const roles_ = [ROLES.lanhdaokhoa, ROLES.lanhdaobomon, ROLES.manager, ROLES.chuyenvien_pdt, ROLES.phong_hssv, ROLES.giangvien];
            const condition: ConditionOption = {
                condition: [],
                set: [
                    { label: 'limit', value: '-1' },
                    { label: 'include', value: roles_.toString() },
                    { label: 'include_by', value: 'name' },
                ],
                page: null,
            };

            this.roleService.getRolesByPageNew(condition).subscribe({
                next: (_role) => {
                    _role.data.forEach((f) => {
                        objectRoles[f.name] = f;
                    });

                    this.notificationService.isProcessing(false);
                    resolve(objectRoles);
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError(
                        'Lỗi kết nối, vui lòng thử lại, hoặc liên hệ với kỹ thuật viên nếu thử lại không thành công'
                    );
                    resolve(null);
                },
            });
        });
    }

    async initLoad() {
        const condition_donvi: ConditionOption = {
            condition: [
                {
                    conditionName: 'parent_id',
                    condition: OvicQueryCondition.equal,
                    value: this.auth.user.donvi_id.toString(),
                },
                {
                    conditionName: 'status',
                    condition: OvicQueryCondition.notEqual,
                    value: '-1',
                    orWhere: 'and',
                },
            ],

            set: [{ label: 'limit', value: '-1' }],
            page: null,
        };

        this.notificationService.isProcessing(true);

        const objectRoles = await this.getRolesPromise();

        const ids_roles = [];

        Object.keys(objectRoles).forEach((f) => {
            ids_roles.push(objectRoles[f].id);
        });

        const roleATeacher = this.auth.roles.find((r) => r.name === ROLES.giangvien);

        const condition_teacher: ConditionOption = {
            condition: [
                { conditionName: 'status', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' }
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'role_ids', value: roleATeacher ? roleATeacher['id'].toString() : ids_roles.toString(), }
            ],

            page: null
        }

        forkJoin([
            this.donViService.getDonviByPageNew(condition_donvi),
            this.userService.getUserByPageNew(condition_teacher)
        ]).subscribe({
            next: ([_donvi, _teacher]) => {
                this.list_donvi = _donvi.data;
                this.list_teacher = _teacher.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    triggerImport() {
        this.inputImport.nativeElement.value = '';
        this.list_monhoc = [];
        this.inputImport.nativeElement.click();
    }

    changeInputImport(event) {
        if (event.target.files[0]) {
            const file = event.target.files[0];
            if (this.helperService.checkTypeFile(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'], file.type)) {
                readImportFile(file, this.notificationService, 'arrayBuffer', (localUrl) => {
                    const wb: XLSX.WorkBook = XLSX.read(localUrl, { type: 'binary' });
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    data.splice(0, 1)
                    const object_check_duplicate = {};

                    const data_course = [];
                    data.forEach(f => {
                        let checkEmpty = true;
                        for (let i = 0; i < 6; i++) {
                            if (f[i] !== 0) {
                                if (!f[i]) {
                                    checkEmpty = false;
                                }
                            }
                        }

                        if (checkEmpty === true) {
                            if (!object_check_duplicate[f[0]]) {
                                object_check_duplicate[f[0]] = true;
                                const index = this.list_donvi.findIndex(m => m.code === f[3].toString().trim());

                                const teacher_detail = {
                                    id: 0,
                                    email: null,
                                    name: null
                                }

                                if (f[8]) {
                                    const index_teacher = this.list_teacher.findIndex(m => m.email.toLocaleLowerCase() === f[8].toString().trim().toLocaleLowerCase());
                                    if (index_teacher !== -1) {
                                        teacher_detail.id = this.list_teacher[index_teacher].id;
                                        teacher_detail.email = this.list_teacher[index_teacher].email;
                                        teacher_detail.name = this.list_teacher[index_teacher].display_name;
                                    }
                                }

                                const course = {
                                    title: f[1].trim(),
                                    maso: f[0].trim().replace(/\s/gi, '').toUpperCase(),
                                    slug: this.helperService.slugVietnamese(f[1].trim()),
                                    category_ids: index !== -1 ? this.list_donvi[index].id : 0,
                                    params: {
                                        sotinchi: parseFloat(f[4].toString().trim()),
                                        exam_format: f[2].toString().trim(),
                                        cdr: f[6] ? parseFloat(f[6].toString().trim()) : null,
                                        sotinchi_th: parseFloat(f[5].toString().trim())
                                    },
                                    av: f[7] ? parseFloat(f[7].toString().trim()) : 0,
                                    status: 1,
                                    status_import: 0,
                                    creator_plan_id: teacher_detail.id,
                                    teacher_name: teacher_detail.name,
                                    teacher_email: teacher_detail.email,
                                    dot_capnhat: f[9] ? f[9].toString().trim() : null

                                }

                                data_course.push(course);
                            }
                        }
                    })

                    this.list_monhoc = data_course;
                    this.getStatusObject();
                });
            } else {
                this.notificationService.toastWarning("Sai định dạng file, yêu cầu file .xlsx. Vui lòng tải file mẫu danh sách import môn học");
            }
        }
    }

    onChangePageImport(event) {
        this.pageImport = event.page;
    }

    startImportMonhoc() {
        if (this.list_monhoc && this.list_monhoc.length) {
            const request: Observable<any>[][] = [];
            let i = 0;
            request[i] = [];
            this.list_monhoc.forEach(f => {
                const data_import = {
                    title: f.title,
                    maso: f.maso,
                    slug: f.slug,
                    category_ids: f.category_ids,
                    params: f.params,
                    av: f.av,
                    status: f.status,
                    creator_plan_id: f.creator_plan_id,
                    dot_capnhat: f.dot_capnhat
                }

                if (request[i].length < 3) {
                    request[i].push(this.elnKhoaHocService.getElnKhoaHocByCol('maso', data_import.maso).pipe(mergeMap(a => {
                        if (a[0]) {
                            if (this.ghi_de) {
                                return this.elnKhoaHocService.updateElnKhoaHoc(a[0].id, data_import).pipe(
                                    catchError(e => {
                                        f['status_import'] = -1;
                                        return of(e)
                                    }),
                                    mergeMap(() => {
                                        f['status_import'] = 1;
                                        return of(null)
                                    }))
                            }
                            f['status_import'] = 1;
                            return of(null);
                        } else {
                            return this.elnKhoaHocService.addElnKhoaHoc(data_import).pipe(
                                catchError(e => {
                                    f['status_import'] = -1;
                                    return of(e)
                                }),
                                mergeMap(() => {
                                    f['status_import'] = 1;
                                    return of(null)
                                }))
                        }
                    })))

                } else {
                    i = i + 1;
                    request[i] = [];
                    request[i].push(this.elnKhoaHocService.getElnKhoaHocByCol('maso', data_import.maso).pipe(mergeMap(a => {
                        if (a[0]) {
                            if (this.ghi_de) {
                                return this.elnKhoaHocService.updateElnKhoaHoc(a[0].id, data_import).pipe(
                                    catchError(e => {
                                        f['status_import'] = -1;
                                        return of(e)
                                    }),
                                    mergeMap(() => {
                                        f['status_import'] = 1;
                                        return of(null)
                                    }))
                            }
                            f['status_import'] = 1;
                            return of(null);
                        } else {
                            return this.elnKhoaHocService.addElnKhoaHoc(data_import).pipe(
                                catchError(e => {
                                    f['status_import'] = -1;
                                    return of(e)
                                }),
                                mergeMap(() => {
                                    f['status_import'] = 1;
                                    return of(null)
                                }))
                        }
                    })))
                }

            })

            this.progressValue = 0;
            this.displayModal = true;
            this.waitting_title = 'Đang đồng bộ dữ liệu, vui lòng không tắt trình duyệt.';
            if (request.length) {
                this.loopAddMonHoc(0, request).subscribe(() => {
                    this.displayModal = false;
                    this.getStatusObject();
                    this.notificationService.toastSuccess("Đã hoàn thành quá trình import, vui lòng kiểm tra lại danh sách môn học đã import");
                })
            } else {
                this.notificationService.toastWarning("Không có môn học chưa import");
            }
        }
    }

    loopAddMonHoc(key: number, group_obs: Observable<any>[][]) {
        this.progressValue = (key + 1) / group_obs.length * 100;
        return forkJoin(group_obs[key]).pipe(
            mergeMap(_res => {
                if (group_obs[key + 1] && group_obs[key + 1].length) {
                    return this.loopAddMonHoc(key + 1, group_obs);
                } else {
                    return of(null)
                }
            }))
    }

    getStatusObject() {
        this.status_object = {
            no_import: this.list_monhoc.filter(m => m['status_import'] === 0).length,
            import_done: this.list_monhoc.filter(m => m['status_import'] === 1).length,
            import_fail: this.list_monhoc.filter(m => m['status_import'] === -1).length
        }
    }

    downLoadExMonhoc() {
        this.fileService.getFileContent('..\\assets\\files\\mau_file_import_LMS-LCMS\\Mau 03 - 01 Import danh muc Hoc phan (mon hoc).xlsx').subscribe(res => {
            saveAs(res, 'Mau 03 - 01 Import danh muc Hoc phan (mon hoc).xlsx');
        });
        // this.startgetCourseQuestion();
    }

    /** Lấy ảnh từ google về  */

    startgetCourseQuestion() {
        this.getLoopCourseQuestion(1, []).subscribe(_course_question => {
            const images: { id: string, base64: string, file: File, httpLink: string, blob?: Blob, id_row: number }[] = [];
            let i = 0;
            const id_imgs = [];
            _course_question.forEach(f => {
                const directionNoAlt = f.question_direction.replace(/<img(.*?)>/gi, _findImg => {
                    const findAlt = _findImg.replace(/alt="(.*?)"/gi, _resAlt => {
                        const index = _resAlt.indexOf('serverAws');
                        if (index === -1) {
                            return ''
                        }
                        return _resAlt;
                    })
                    return findAlt;
                })

                const directionSrcId = directionNoAlt.replace(/src="(.*?)"/gi, _resSrc => {
                    const idImageServer = _resSrc.replace(/src="|"/g, '');

                    id_imgs.push(idImageServer)

                    return _resSrc;
                })

                if (Array.isArray(f.answer_option)) {
                    f.answer_option.forEach(a => {
                        const valueNoAlt = a.value.replace(/<img(.*?)>/gi, _findImg => {
                            const findAlt = _findImg.replace(/alt="(.*?)"/gi, _resAlt => {
                                const index = _resAlt.indexOf('serverAws');
                                if (index === -1) {
                                    return ''
                                }
                                return _resAlt;
                            })
                            return findAlt;
                        })

                        const valuenSrcId = valueNoAlt.replace(/src="(.*?)"/gi, _resSrc => {
                            const idImageServer = _resSrc.replace(/src="|"/g, '');
                            id_imgs.push(idImageServer)
                            return _resSrc;
                        })
                    })
                }


            })
            console.log(id_imgs.toString());
        })
    }


    getLoopImagehttp(count: number, resquest: Observable<any>[]): Observable<any> {
        console.log(count);
        if (resquest[count] && count < 3) {
            return resquest[count].pipe(
                delay(1000),
                mergeMap(_res => {
                    return this.getLoopImagehttp(count + 1, resquest)
                }))
        } else {
            return of(null);
        }
    }

    loopAddNewImage(count: number, resquest: Observable<any>[]): Observable<any> {
        if (resquest[count] && count < 3) {
            return resquest[count].pipe(
                delay(1000),
                mergeMap(_res => {
                    return this.loopAddNewImage(count + 1, resquest)
                }))
        } else {
            return of(null);
        }
    }



    getLoopCourseQuestion(page: number, _result_data: CourseQuestions[]): Observable<CourseQuestions[]> {
        const condition: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '500' },
                { label: 'select', value: 'id,question_direction,answer_option,' }
            ],
            page: page.toString()
        }

        return this.courseQuestionsService.getCourseQuestionsByPageNew(condition).pipe(mergeMap(_res => {
            if (_res.data.length) {
                _result_data = _result_data.concat(_res.data);
                return this.getLoopCourseQuestion(page + 1, _result_data)
            } else {
                return of(_result_data);
            }
        }))
    }

    backToDongbo() {
        const activeLink = this.router.url.substring(7).split('?')[0].replace('/admin/', '');
        const url = this.router.serializeUrl(
            this.router.createUrlTree(['admin/' + activeLink])
        );
        this.router.navigateByUrl(url);
    }
}
