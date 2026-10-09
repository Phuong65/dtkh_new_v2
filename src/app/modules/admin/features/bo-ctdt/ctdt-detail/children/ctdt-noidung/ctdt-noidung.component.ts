import { HelperService } from '@core/services/helper.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { CtdtHocphanService } from '@modules/shared/services/ctdt-hocphan.service';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { forkJoin, mergeMap, Observable, of, Subject, takeUntil } from 'rxjs';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ROLES } from '@modules/shared/utils/syscat';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { CtdtHocphan } from '@modules/shared/models/ctdt_hocphan';
import { TableModule } from 'primeng/table';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { PopoverModule } from 'primeng/popover';
import { CtdtConfig } from '@modules/shared/models/ctdt-config';
import { CtdtConfigService } from '@modules/shared/services/ctdt-config.service';
import { Drawer } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MatButtonModule } from '@angular/material/button';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';

export interface typeCtdtHocphan {
    key: string;
    title: string;
    children: CtdtHocphan[];
}

@Component({
    selector: 'app-ctdt-noidung',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ReactiveFormsModule,
        FormsModule,
        PopoverModule,
        Drawer,
        InputTextModule,
        MatButtonModule,
        NgbTooltipModule,
        LoadingProgressComponent
    ],
    templateUrl: './ctdt-noidung.component.html',
    styleUrls: ['./ctdt-noidung.component.css']
})
export class CtdtNoidungComponent implements OnInit, OnChanges, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private loadedCtdtId: number | null = null;
    private readonly auth = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly ctdtService = inject(CtdtService);
    public readonly formBuilder = inject(FormBuilder);
    private readonly elngUserProfileService = inject(ElngUserProfileService);
    private readonly configsService = inject(ConfigsService);
    private readonly ctdtHocphanService = inject(CtdtHocphanService);
    private readonly elnKhoaHocService = inject(ElnKhoaHocService);
    private readonly helperService = inject(HelperService);
    private readonly ctdtConfigService = inject(CtdtConfigService);

    @Input() selectedCtdt: Ctdt | null = null;

    isManager: boolean = false;
    isLanhDaoKhoa: boolean = false;
    userId: number = 0;
    donvi_chuyenmon_id: number;

    list_khoikienthuc: CtdtConfig[] = [];
    list_cdt_hocphan: typeCtdtHocphan[] = [];
    list_course: ElnKhoaHoc[] = [];
    selectedKhoiKienthuc: typeCtdtHocphan | null = null;

    type_test = EXAMFORMAT;
    searchCourse: string = '';
    searchCourse_hp: string = '';

    progressValue: number = 0;
    savingHp: boolean = false;
    savingTitle: string = 'Đang lưu dữ liệu, vui lòng chờ...';

    drawerChooseMonhocVisible: boolean = false;
    list_selected_course: ElnKhoaHoc[] = [];
    list_course_dk: ElnKhoaHoc[] = [];
    selectedCtdtHocphan: CtdtHocphan | null = null;
    keyHp: string = '';
    isLoadingData: boolean = false;

    constructor() {
        this.isManager = [ROLES.manager, ROLES.admin, ROLES.troly_pdt, ROLES.chuyenvien_pdt]
            .some(role => this.auth.userHasRole(role));
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.userId = this.auth.user?.id ?? 0;
    }

    ngOnInit(): void {
        if (!this.isLanhDaoKhoa && !this.isManager) {
            this.router.navigate(['/admin/content-none']);
            return;
        }

        if (this.selectedCtdt?.id) {
            this.initCtdtData(this.selectedCtdt.id.toString());
        } else {
            this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
                if (params && params['code']) {
                    this.initCtdtData(params['code']);
                } else if (!this.selectedCtdt) {
                    this.router.navigate(['/admin/content-none']);
                }
            });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selectedCtdt'] && this.selectedCtdt?.id && !changes['selectedCtdt'].firstChange) {
            this.initCtdtData(this.selectedCtdt.id.toString());
        }
    }

    initCtdtData(ctdtId: string): void {
        this.isLoadingData = true;
        this.notificationService.isProcessing(true);

        const condition_ctdt: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: ctdtId }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };

        const condition_user: ConditionOption = {
            condition: [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };

        const condition_khoi_kienthuc: ConditionOption = {
            condition: [{ conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'KHOI_KIEN_THUC' }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };

        const condition_ctdt_config: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: ctdtId }],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'KHOI_KIEN_THUC' },
                { label: 'include_by', value: 'group' },
                { label: 'orderby', value: 'ordering' },
                { label: 'order', value: 'ASC' }
            ],
            page: null
        };

        forkJoin([
            this.ctdtService.getCtdtByPageNew(condition_ctdt).pipe(
                mergeMap(ctdt => {
                    if (ctdt.recordsFiltered && ctdt.data?.[0]) {
                        this.selectedCtdt = this.selectedCtdt ?? ctdt.data[0];
                        const condition_monhoc: ConditionOption = {
                            condition: [{ conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: ctdt.data[0].category_id.toString() }],
                            set: [{ label: 'limit', value: '-1' }],
                            page: null
                        };
                        return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc).pipe(
                            mergeMap(_course => {
                                this.list_course = _course.data || [];
                                return of(ctdt);
                            })
                        );
                    }
                    return of(ctdt);
                })
            ),
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
            this.configsService.getConfigsByPageNew(condition_khoi_kienthuc),
            this.ctdtConfigService.getCtdtConfigByPageNew(condition_ctdt_config)
        ]).subscribe({
            next: ([_ctdt, _user, _khoi_kienthuc, _ctdt_config]) => {
                this.selectedCtdt = _ctdt.data?.[0] || null;

                if (!this.selectedCtdt) {
                    this.isLoadingData = false;
                    this.notificationService.isProcessing(false);
                    return;
                }

                if (_ctdt_config.recordsFiltered) {
                    this.list_khoikienthuc = _ctdt_config.data;
                } else if (_khoi_kienthuc.data?.[0]?.params && Array.isArray(_khoi_kienthuc.data[0].params)) {
                    this.list_khoikienthuc = _khoi_kienthuc.data[0].params;
                } else {
                    this.list_khoikienthuc = [];
                }

                if (!this.isManager && _user.data?.[0]) {
                    this.donvi_chuyenmon_id = _user.data[0].donvi_chuyenmon_id;
                    if (this.donvi_chuyenmon_id !== this.selectedCtdt.category_id) {
                        this.isLoadingData = false;
                        this.notificationService.isProcessing(false);
                        this.router.navigate(['/admin/content-none']);
                        return;
                    }
                }

                this.loadCtdthocPhan();
            },
            error: () => {
                this.isLoadingData = false;
                this.notificationService.isProcessing(false);
                this.notificationService.toastWarning('Lỗi kết nối, vui lòng thử lại.');
            }
        });
    }

    loadCtdthocPhan(): void {
        if (!this.selectedCtdt?.id) return;

        const condition_ctdt_hocphan: ConditionOption = {
            condition: [{ conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString() }],
            set: [{ label: 'limit', value: '-1' }],
            page: null
        };

        this.ctdtHocphanService.getCtdtHocphanByPageNew(condition_ctdt_hocphan).subscribe({
            next: _ctdt_hocphan => {
                const hocphanList = _ctdt_hocphan.data || [];
                hocphanList.forEach(f => {
                    const found = this.list_course.find(m => m.id === f.course_id);
                    if (found) {
                        f['maso'] = found.maso;
                    }
                });

                const data: typeCtdtHocphan[] = [];
                this.list_khoikienthuc.forEach(f => {
                    data.push({
                        key: f.key,
                        title: f.title,
                        children: hocphanList.filter(m => m.khoikienthuc === f.key)
                    });
                });
                this.list_cdt_hocphan = data;
                this.isLoadingData = false;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.isLoadingData = false;
                this.notificationService.isProcessing(false);
            }
        });
    }

    // Helper calculations
    getTotalHocphanCount(): number {
        return this.list_cdt_hocphan.reduce((sum, k) => sum + (k.children?.length || 0), 0);
    }

    filterCourses(courses: ElnKhoaHoc[], query: string): ElnKhoaHoc[] {
        const keyword = query?.trim().toLocaleLowerCase('vi') ?? '';
        if (!keyword) return courses;
        return courses.filter(course => `${course.title || ''} ${course.maso || ''}`.toLocaleLowerCase('vi').includes(keyword));
    }

    getTotalCredits(): number {
        return this.list_cdt_hocphan.reduce((sum, k) => sum + this.getBlockCredits(k), 0);
    }

    getTotalPracticeCredits(): number {
        return this.list_cdt_hocphan.reduce((sum, k) => sum + this.getBlockPracticeCredits(k), 0);
    }

    getBlockCredits(khoi: typeCtdtHocphan): number {
        return (khoi.children || []).reduce((sum, c) => sum + Number(c.sotinchi || 0), 0);
    }

    getBlockPracticeCredits(khoi: typeCtdtHocphan): number {
        return (khoi.children || []).reduce((sum, c) => sum + Number(c.sotinchi_thuchanh || 0), 0);
    }

    // Drawer management
    openSelectedMonhoc(_khoi_kienthuc: typeCtdtHocphan): void {
        this.selectedKhoiKienthuc = _khoi_kienthuc;
        this.searchCourse = '';

        let course_checked: CtdtHocphan[] = [];
        this.list_cdt_hocphan.forEach(f => {
            if (f.key !== _khoi_kienthuc.key) {
                course_checked = course_checked.concat(f.children || []);
            }
        });

        this.list_course.forEach(f => {
            f['disabled'] = course_checked.some(m => m.course_id === f.id) ? 1 : 0;
            f['checked'] = _khoi_kienthuc.children.some(m => m.course_id === f.id);
        });

        this.list_selected_course = this.list_course.filter(m => m['disabled'] === 0);
        this.drawerChooseMonhocVisible = true;
    }

    closeDrawerChooseMonhoc(): void {
        this.drawerChooseMonhocVisible = false;
        this.selectedKhoiKienthuc = null;
    }

    toggleCourseCheck(course: ElnKhoaHoc): void {
        course['checked'] = !course['checked'];
    }

    saveCtdtHocPhan(): void {
        if (!this.selectedKhoiKienthuc || !this.selectedCtdt) return;

        const request: Observable<any>[] = [];
        const data_course_checked = this.list_selected_course.filter(m => m['checked']);
        const id_delete: number[] = [];

        this.selectedKhoiKienthuc.children.forEach(f => {
            const exists = data_course_checked.some(m => m.id === f.course_id);
            if (!exists && f.id) {
                id_delete.push(f.id);
            }
        });

        if (id_delete.length) {
            request.push(this.ctdtHocphanService.deleteCtdtHocphan(id_delete.toString()));
        }

        data_course_checked.forEach(f => {
            const alreadyExists = this.selectedKhoiKienthuc!.children.some(m => m.course_id === f.id);
            if (!alreadyExists) {
                const data = {
                    ctdt_id: this.selectedCtdt!.id,
                    course_id: f.id,
                    course_name: f.title,
                    khoikienthuc: this.selectedKhoiKienthuc!.key,
                    sotinchi: f.params?.sotinchi || 0,
                    sotinchi_thuchanh: f.params?.sotinchi_th || 0,
                    category_id: f.category_ids,
                };
                request.push(this.ctdtHocphanService.addCtdtHocphan(data));
            }
        });

        if (request.length) {
            this.savingHp = true;
            this.savingTitle = 'Đang lưu học phần vào khối kiến thức...';
            this.progressValue = 0;
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.savingHp = false;
                    this.notificationService.toastSuccess('Cập nhật học phần thành công');
                    this.closeDrawerChooseMonhoc();
                    this.loadCtdthocPhan();
                },
                error: () => {
                    this.savingHp = false;
                    this.notificationService.toastError('Cập nhật thất bại, vui lòng thử lại');
                }
            });
        } else {
            this.closeDrawerChooseMonhoc();
        }
    }

    loopAddForm(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(
            mergeMap(() => {
                this.progressValue = Math.round(((key + 1) / request.length) * 100);
                if (request[key + 1]) {
                    return this.loopAddForm(request, key + 1);
                } else {
                    return of(null);
                }
            })
        );
    }

    saveUpdateCtdtHocPhan(): void {
        const request: Observable<any>[] = [];
        this.list_cdt_hocphan.forEach(f => {
            f.children.forEach(c => {
                if (c.id) {
                    const data = {
                        hocky: c.hocky,
                        hp_hoctruoc: c.hp_hoctruoc,
                        hp_tienquyet: c.hp_tienquyet,
                        hp_songhanh: c.hp_songhanh,
                    };
                    request.push(this.ctdtHocphanService.updateCtdtHocphan(c.id, data));
                }
            });
        });

        if (request.length) {
            this.savingHp = true;
            this.savingTitle = 'Đang lưu thông tin học kỳ và điều kiện học phần...';
            this.progressValue = 0;
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.savingHp = false;
                    this.notificationService.toastSuccess('Lưu thay đổi thành công');
                    this.loadCtdthocPhan();
                },
                error: () => {
                    this.savingHp = false;
                    this.notificationService.toastError('Cập nhật thất bại, vui lòng thử lại');
                }
            });
        }
    }

    pointQuestionKeyDown(event: KeyboardEvent): void {
        if (!event) return;
        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
        if (event.ctrlKey && ['a', 'c', 'v', 'x', 'A', 'C', 'V', 'X'].includes(event.key)) {
            return;
        }
        if (/^[0-9]$/.test(event.key)) {
            return;
        }
        if (allowedKeys.includes(event.key)) {
            return;
        }
        event.preventDefault();
    }

    togglePanel(child: CtdtHocphan, opCtdtHp: any, event: any, key: string): void {
        this.selectedCtdtHocphan = child;
        this.keyHp = key;
        this.searchCourse_hp = '';

        const data: any[] = [];
        this.list_cdt_hocphan.forEach(f => {
            f.children.forEach(c => {
                let isMatch = false;
                if (key === 'hp_songhanh') {
                    isMatch = c.hocky === child.hocky && c.id !== child.id;
                } else {
                    isMatch = c.hocky < child.hocky && c.id !== child.id;
                }

                if (isMatch) {
                    const courseItem = this.list_course.find(m => m.id === c.course_id);
                    if (courseItem) {
                        const copy = { ...courseItem };
                        const currentSelections = (child[key] as number[]) || [];
                        copy['selected_hp'] = currentSelections.includes(copy.id as number);
                        data.push(copy);
                    }
                }
            });
        });

        this.list_course_dk = this.helperService.sort(data, 'selected_hp', -1);
        opCtdtHp.toggle(event);
    }

    toggleCourseCondition(course: any): void {
        if (!this.selectedCtdtHocphan || !this.keyHp) return;

        course.selected_hp = !course.selected_hp;
        const currentList = Array.isArray(this.selectedCtdtHocphan[this.keyHp])
            ? [...this.selectedCtdtHocphan[this.keyHp]]
            : [];

        const id = course.id as number;
        if (course.selected_hp) {
            if (!currentList.includes(id)) currentList.push(id);
        } else {
            const idx = currentList.indexOf(id);
            if (idx > -1) currentList.splice(idx, 1);
        }
        this.selectedCtdtHocphan[this.keyHp] = currentList;
    }

    getSelectedConditionCount(child: CtdtHocphan, key: string): number {
        return Array.isArray(child[key]) ? child[key].length : 0;
    }
}
