import { CourseCloContributeService } from './../../../../shared/services/course-clo-contribute.service';
import { HelperService } from '@core/services/helper.service';
import { CtdtCdrService } from '@modules/shared/services/ctdt-cdr.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { CtdtHocphanService } from '@shared/services/ctdt-hocphan.service';
import { DropdownModule } from 'primeng/dropdown';
import { CourseMuctieuChitietService } from './../../../../shared/services/course-muctieu-chitiet.service';
import { CourseCloService } from './../../../../shared/services/course-clo.service';
import { AfterViewInit, Component, ElementRef, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { firstValueFrom, forkJoin, mergeMap, Observable, of } from 'rxjs';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { AuthService } from '@core/services/auth.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ROLES, ROUTERS } from '@modules/shared/utils/syscat';
import { DividerModule } from 'primeng/divider';
import { CourseMuctieuChitiet } from '@modules/shared/models/course-muctieu-chitiet';
import { CourseClo } from '@modules/shared/models/course-clo';
import { TableModule } from 'primeng/table';
import { Ctdt } from '@modules/shared/models/ctdt';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { CtdtCdr } from '@modules/shared/models/ctdt-cdr';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';


interface CtdtCdrExtend extends CtdtCdr {
    items?: CtdtCdr[];
}

@Component({
    selector: 'app-monhoc-muctieu-cdr',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        DividerModule,
        TableModule,
        DropdownModule,
        MultiSelectModule,
        OverlayPanelModule,
        DialogModule,
        MatProgressBarModule
    ],
    templateUrl: './monhoc-muctieu-cdr.component.html',
    styleUrls: ['./monhoc-muctieu-cdr.component.css']
})
export class MonhocMuctieuCdrComponent implements OnInit, AfterViewInit {
    @ViewChild('templateCourseCdr') templateCourseCdr: TemplateRef<any>;

    @ViewChild('templateCtdtCdr') templateCtdtCdr: TemplateRef<any>;

    selectedCourse: ElnKhoaHoc;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    routerAdmin: boolean = false;

    routerDaotao: boolean = false;

    routerLanhdaokhoa: boolean = false;

    routerGiangvien: boolean = false;

    routerLanhdaobomon: boolean = false;

    userId: number;

    list_course_muctieu: CourseMuctieuChitiet[];

    selectedCourseMuctieu: CourseMuctieuChitiet;

    list_course_clo: CourseClo[] = [];

    seletedCourseClo: CourseClo;

    formMuctieu: FormGroup;

    kyhieuMuctieu: string = "CO";

    formTitle: string;

    isUpdated: boolean = false;

    disabledButton: boolean = false;

    list_course_clo_add: CourseClo[] = [];

    list_ctdt: Ctdt[] = [];

    selectedClo: CourseClo;

    selectedCtdt: Ctdt;

    // selectedStates lưu trữ dạng { [id: number]: boolean }
    selectedStates: { [key: number]: boolean } = {};

    displayModal: boolean = false;

    progressValue: number = 0;

    list_ctdt_cdr: CtdtCdrExtend[] = [];
    constructor(
        private notificationService: NotificationService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private elngUserProfileService: ElngUserProfileService,
        private elnKhoaHocService: ElnKhoaHocService,
        private auth: AuthService,
        private courseCloService: CourseCloService,
        private courseMuctieuChitietService: CourseMuctieuChitietService,
        public formBuilder: FormBuilder,
        private ctdtHocphanService: CtdtHocphanService,
        private ctdtService: CtdtService,
        private ctdtCdrService: CtdtCdrService,
        private helperService: HelperService,
        private courseCloContributeService: CourseCloContributeService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);

        this.routerAdmin = this.auth.hasRouter(ROUTERS.admin, '/monhoc-muctieu');

        this.routerDaotao = this.auth.hasRouter(ROUTERS.daotao, '/monhoc-muctieu');

        this.routerLanhdaokhoa = this.auth.hasRouter(ROUTERS.lanhdao_khoa, '/monhoc-muctieu');

        this.routerGiangvien = this.auth.hasRouter(ROUTERS.giangvien, '/monhoc-muctieu');

        this.routerLanhdaobomon = this.auth.hasRouter(ROUTERS.lanhdao_bomon, '/monhoc-muctieu');

        this.userId = this.auth.user.id;

        this.formMuctieu = this.formBuilder.group(
            {
                course_id: [''],
                ordering: ['', Validators.required],
                kyhieu: [''],
                noidung: ['', Validators.required]
            }
        );
    }

    get fMt() {
        return this.formMuctieu.controls;
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                this.notificationService.isProcessing(true);

                const course_id = params['code'];

                const contition_course: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                if (this.routerGiangvien) {
                    contition_course.condition.push({ conditionName: 'creator_plan_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' })
                }

                const condition_user: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                const condition_muctieu: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                const condition_course_cdr: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                const condition_ctdt_hocphan: ConditionOption = {
                    condition: [
                        { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: course_id.toString(), orWhere: 'and' },
                    ],
                    set: [
                        { label: 'limit', value: '-1' },
                        { label: 'order', value: 'ASC' },
                        { label: 'orderby', value: 'ordering' }
                    ],
                    page: null
                }

                forkJoin([
                    this.elnKhoaHocService.getKhoaHocByPageNew_2(contition_course),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                    this.courseMuctieuChitietService.getCourseMuctieuChitietByPageNew(condition_muctieu),
                    this.courseCloService.getCourseCloByPageNew(condition_course_cdr),
                    this.ctdtHocphanService.getCtdtHocphanByPageNew(condition_ctdt_hocphan).pipe(mergeMap(_ctdt_hocphan => {
                        const ctdt_ids = _ctdt_hocphan.data.map(m => m.ctdt_id);
                        if (ctdt_ids.length) {
                            const condition_ctdt: ConditionOption = {
                                condition: [],
                                set: [
                                    { label: 'limit', value: '-1' },
                                    { label: 'include', value: ctdt_ids.toString() },
                                    { label: 'include_by', value: 'id' },
                                ],
                                page: null
                            }

                            const condition_ctdt_cdr: ConditionOption = {
                                condition: [],
                                set: [
                                    { label: 'limit', value: '-1' },
                                    { label: 'include', value: ctdt_ids.toString() },
                                    { label: 'include_by', value: 'ctdt_id' },
                                    { label: 'order', value: 'ASC' },
                                    { label: 'orderby', value: 'ordering' }
                                ],
                                page: null
                            }

                            return forkJoin([
                                this.ctdtService.getCtdtByPageNew(condition_ctdt),
                                this.ctdtCdrService.getCtdtCdrByPageNew(condition_ctdt_cdr)
                            ]).pipe(mergeMap(([_ctdt, _ctdt_cdr]) => {
                                const parent_ctdt_cdr = _ctdt_cdr.data.filter(m => m.parent_id === 0);
                                parent_ctdt_cdr.forEach(f => {
                                    f['items'] = _ctdt_cdr.data.filter(m => m.parent_id === f.id);
                                })
                                _ctdt.data.forEach(f => {
                                    f['ctdt_cdr'] = parent_ctdt_cdr.filter(m => m.ctdt_id === f.id);
                                })

                                _ctdt_cdr.data.forEach(f => {
                                    f['kyhieu_number'] = f.kyhieu.replace(/\D/gi, '');
                                })

                                this.list_ctdt_cdr = _ctdt_cdr.data;


                                this.list_ctdt = _ctdt.data;

                                return of(null);
                            }))
                        }
                        return of(null);
                    }))
                ]).subscribe({
                    next: async ([_course, _user_profile, _muctieu, _course_clo]) => {
                        if (_course.recordsFiltered) {

                            this.selectedCourse = _course.data[0];

                            if (this.routerLanhdaokhoa) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.category_ids !== _user_profile.data[0].donvi_chuyenmon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            if (this.routerLanhdaobomon) {
                                if (_user_profile.recordsFiltered === 0 || this.selectedCourse.nganh_bomon_id !== _user_profile.data[0].bomon_id) {
                                    this.notificationService.toastError("Không tìm thấy môn học");
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            this.list_course_muctieu = _muctieu.data;
                            this.list_course_clo = _course_clo.data;
                            await this.loadCourseCloPi();
                            console.log("run");
                            this.notificationService.isProcessing(false);
                        } else {
                            this.notificationService.toastError("Không tìm thấy môn học");
                            this.router.navigate(['/admin/content-none']);
                        }
                    },
                    error: () => {
                        this.notificationService.toastError("Lỗi kết nối, vui lòng thử lại");
                    }
                })
            } else {
                this.router.navigate(['/admin/content-none']);
            }
        })
    }

    ngAfterViewInit() {

    }



    autoResize(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    resetFormMuctieu() {
        this.formMuctieu.reset();
        this.fMt['course_id'].setValue(this.selectedCourse.id);
        this.fMt['ordering'].setValue(1);
        if (this.list_course_muctieu && this.list_course_muctieu.length) {
            this.fMt['ordering'].setValue(this.list_course_muctieu.length + 1);
        }
        this.isUpdated = false;
    }

    loadMuctieu() {
        this.notificationService.isProcessing(true);

        const condition: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        this.courseMuctieuChitietService.getCourseMuctieuChitietByPageNew(condition).subscribe({
            next: (_muctieu) => {
                this.list_course_muctieu = _muctieu.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    loadCoureClo() {
        this.notificationService.isProcessing(true);
        const condition_course_cdr: ConditionOption = {
            condition: [
                { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],
            page: null
        }

        this.courseCloService.getCourseCloByPageNew(condition_course_cdr).subscribe({
            next: (_course_clo) => {
                this.list_course_clo = _course_clo.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    loadCourseCloPi(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const condition_clo_c: ConditionOption = {
                condition: [
                    { conditionName: 'course_id', condition: OvicQueryCondition.equal, value: this.selectedCourse.id.toString(), orWhere: 'and' }
                ],
                set: [
                    { label: 'limit', value: '-1' }
                ],
                page: null
            }

            const clo_co = await firstValueFrom(this.courseCloContributeService.getCourseCloContributeByPageNew(condition_clo_c));

            this.list_course_clo.forEach(clo => {
                const clo_tem = clo_co.data.filter(m => m.course_clo_id === clo.id);
                const pi = this.list_ctdt_cdr.filter(m => clo_tem.findIndex(i => i.ctdt_cdr_id === m.id) !== -1);
                console.log(pi);
                this.list_ctdt.forEach(ctdt => {
                    const pi_clo = pi.filter(m => m.ctdt_id === ctdt.id);
                    if (pi_clo.length)
                        clo['ctdt_cdr_'.concat(ctdt.id.toString())] = this.helperService.sort(pi.filter(m => m.ctdt_id === ctdt.id), 'kyhieu_number');
                })
            })
            resolve(clo_co)
        });
    }

    saveMucTieuChung(event) {
        this.notificationService.isProcessing(true);
        this.elnKhoaHocService.updateElnKhoaHoc(this.selectedCourse.id, { muctieu: event }).subscribe({
            next: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess("Lưu thành công");
                this.selectedCourse.muctieu = event;
            },
            error: () => {
                this.notificationService.isProcessing(false);
                this.notificationService.toastSuccess("Lưu thất bại");
            }
        })
    }

    pointQuestionKeyDown(event: KeyboardEvent) {
        if (!event) return;

        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'];

        if (/^[0-9]$/.test(event.key)) {
            return;
        }

        if (allowedKeys.includes(event.key)) {
            return;
        }

        event.preventDefault();
    }

    closeForm() {
        this.selectedClo = null;
        this.selectedCtdt = null;
        this.notificationService.isProcessing(true);
    }

    addMuctieu() {
        this.notificationService.isProcessing(true);
        this.disabledButton = true;
        const ordering = this.list_course_muctieu && this.list_course_muctieu.length ? this.list_course_muctieu.length + 1 : 1;
        const data = {
            ordering: ordering,
            kyhieu: "CO".concat(ordering.toString()),
            course_id: this.selectedCourse.id,
        }
        this.courseMuctieuChitietService.addCourseMuctieuChitiet(data).subscribe({
            next: () => {
                this.loadMuctieu();
                this.disabledButton = false;
                this.notificationService.toastSuccess("Thêm thành công");
            },
            error: () => {
                this.disabledButton = false;
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Thêm thất bại");
            }
        })
    }

    deleteCourseMuctieuchitiet(muctieu: CourseMuctieuChitiet) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                const request: Observable<any>[] = [];
                let i = muctieu.ordering;
                request.push(this.courseMuctieuChitietService.deleteCourseMuctieuChitiet(muctieu.id));
                this.list_course_muctieu.forEach(f => {
                    if (f.ordering > muctieu.ordering) {
                        const data = {
                            ordering: i,
                            kyhieu: 'CO'.concat(i.toString())
                        }
                        i = i + 1;
                        request.push(this.courseMuctieuChitietService.updateCourseMuctieuChitiet(f.id, data))
                    }
                })

                if (request.length) {
                    forkJoin(request).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess("Xóa thành công");
                            this.loadMuctieu();
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Xóa thất bại");
                        }
                    })
                }
            }
        })
    }

    saveMuctieuChitiet() {
        this.notificationService.isProcessing(true)
        const request: Observable<any>[] = [];
        this.list_course_muctieu.forEach((f, key) => {
            const data = {
                noidung: f.noidung,
                ordering: key + 1,
                kyhieu: 'CO'.concat((key + 1).toString())
            }
            request.push(this.courseMuctieuChitietService.updateCourseMuctieuChitiet(f.id, data))
        })

        if (request.length) {
            forkJoin(request).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Lưu thành công");
                    this.loadMuctieu();
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Lưu thất bại");
                }
            })
        }
    }
    /** clo */

    addClo() {
        this.notificationService.isProcessing(true);
        const ordering = this.list_course_clo && this.list_course_clo.length ? this.list_course_clo.length + 1 : 1;
        const data = {
            ordering: ordering,
            kyhieu: "CLO".concat(ordering.toString()),
            course_id: this.selectedCourse.id,
        }
        this.courseCloService.addCourseClo(data).subscribe({
            next: () => {
                this.loadCoureClo();
                this.disabledButton = false;
                this.notificationService.toastSuccess("Thêm thành công");
            },
            error: () => {
                this.disabledButton = false;
                this.notificationService.isProcessing(false);
                this.notificationService.toastError("Thêm thất bại");
            }
        })
    }

    saveClo() {
        this.notificationService.isProcessing(true)
        const request: Observable<any>[] = [];
        this.list_course_clo.forEach((f, key) => {
            const data = {
                noidung: f.noidung,
                ordering: key + 1,
                kyhieu: 'CLO'.concat((key + 1).toString()),
                course_muctieu_chitiet_id: f.course_muctieu_chitiet_id,
            }
            request.push(this.courseCloService.updateCourseClo(f.id, data))
        })

        if (request.length) {
            forkJoin(request).subscribe({
                next: () => {
                    this.notificationService.toastSuccess("Lưu thành công");
                    this.loadCoureClo();
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Lưu thất bại");
                }
            })
        }
    }

    deleteClo(Clo: CourseClo) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                const request: Observable<any>[] = [];
                let i = Clo.ordering;
                request.push(this.courseCloService.deleteCourseClo(Clo.id));
                this.list_course_clo.forEach(f => {
                    if (f.ordering > Clo.ordering) {
                        const data = {
                            ordering: i,
                            kyhieu: 'CLO'.concat(i.toString())
                        }
                        i = i + 1;
                        request.push(this.courseCloService.updateCourseClo(f.id, data))
                    }
                })

                if (request.length) {
                    forkJoin(request).subscribe({
                        next: () => {
                            this.notificationService.toastSuccess("Xóa thành công");
                            this.loadCoureClo();
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastError("Xóa thất bại");
                        }
                    })
                }
            }
        })
    }

    blockArrowKeys(event: KeyboardEvent) {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];

        if (arrowKeys.includes(event.key)) {
            event.stopPropagation();
        }
    }

    addCdrOfCourseMuctieu() {
        this.notificationService.openSideNavigationMenu({ template: this.templateCourseCdr, size: 800, offsetTop: "0px" });
    }

    chooseMuctieuForClo(clo: CourseClo, muctieu: CourseMuctieuChitiet) {
        clo.course_muctieu_chitiet_id = muctieu.id;
    }

    openLayoutCtdtCdr(clo: CourseClo, ctdt: Ctdt) {
        this.selectedClo = clo;
        this.selectedCtdt = ctdt;
        this.selectedStates = {};
        if (this.selectedClo['ctdt_cdr_'.concat(this.selectedCtdt.id.toString())])
            this.selectedClo['ctdt_cdr_'.concat(this.selectedCtdt.id.toString())].forEach(f => {
                this.selectedStates[f.id] = true;
            })
        this.notificationService.openSideNavigationMenu({ template: this.templateCtdtCdr, size: 700, offsetTop: '0px' });
    }

    toggleAllChildren(plo: any, event: any) {
        const isChecked = event.target.checked;
        if (plo.items && plo.items.length > 0) {
            plo.items.forEach((pi: any) => {
                this.selectedStates[pi.id] = isChecked;
            });
        }
        this.addToClo();
    }

    // Khi click chọn lẻ từng PI
    onItemSelect() {
        // Thu thập danh sách ID đã chọn
        const selectedIds = Object.keys(this.selectedStates).filter(id => this.selectedStates[+id]).map(id => Number(id));
        this.addToClo();
    }

    // Kiểm tra xem tất cả con đã được chọn chưa (để tick checkbox cha)
    isAllSelected(plo: CtdtCdrExtend): boolean {
        if (!plo.items || plo.items.length === 0) return false;
        return plo.items.every((pi: any) => this.selectedStates[pi.id]);
    }

    // Trạng thái gạch ngang (indeterminate) cho Bootstrap
    isIndeterminate(plo: CtdtCdrExtend): boolean {
        if (!plo.items || plo.items.length === 0) return false;
        const selectedCount = plo.items.filter((pi: any) => this.selectedStates[pi.id]).length;
        return selectedCount > 0 && selectedCount < plo.items.length;
    }

    addToClo() {
        let select_cdr = []
        this.selectedCtdt['ctdt_cdr'].forEach(f => {
            if (f.items)
                select_cdr = select_cdr.concat(f.items.filter(m => this.selectedStates[m.id]));
        })
        this.selectedClo['ctdt_cdr'.concat("_", this.selectedCtdt.id.toString())] = this.helperService.sort(select_cdr, 'kyhieu_number');
    }

    onHideOp() {
        this.selectedClo = null;
        this.selectedCtdt = null;
    }

    savePiOnClo() {
        const request: Observable<any>[] = [];
        request.push(this.courseCloContributeService.deleteCourseCloContributeByCol(this.selectedCourse.id.toString(), "course_id"))
        this.list_course_clo.forEach(clo => {
            this.list_ctdt.forEach(ctdt => {
                if (clo['ctdt_cdr_'.concat(ctdt.id.toString())]) {
                    clo['ctdt_cdr_'.concat(ctdt.id.toString())].forEach(pi => {
                        const data = {
                            course_id: this.selectedCourse.id,
                            course_clo_id: clo.id,
                            ctdt_id: ctdt.id,
                            ctdt_cdr_parent_id: pi.parent_id,
                            ctdt_cdr_id: pi.id
                        }
                        request.push(this.courseCloContributeService.addCourseCloContribute(data));
                    })
                }
            })
        })

        if (request.length > 1) {
            this.displayModal = true;
            this.progressValue = 0;
            this.loopAddPiClo(request, 0).subscribe({
                next: async () => {
                    this.selectedClo = null;
                    this.selectedCtdt = null;
                    await this.loadCourseCloPi();
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Lưu thành công")
                }, error: () => {
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Lưu thất bại")
                }
            })
        } else {
            this.notificationService.toastWarning("Không tìm thấy PI");
        }
    }

    loopAddPiClo(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopAddPiClo(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }
}
