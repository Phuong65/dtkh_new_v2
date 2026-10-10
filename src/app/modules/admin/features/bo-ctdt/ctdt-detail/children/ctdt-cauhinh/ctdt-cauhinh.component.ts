import { CtdtConfigService } from '@modules/shared/services/ctdt-config.service';
import { CtdtConfig } from '@modules/shared/models/ctdt-config';
import { HelperService } from '@core/services/helper.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, DestroyRef, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TooltipModule } from 'primeng/tooltip';
import { LoadingProgressComponent } from '@core-new/components/loading-progress/loading-progress.component';
import { AppState } from '@core-new/models/app-state';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, Observable } from 'rxjs';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ROLES } from '@modules/shared/utils/syscat';
import { MatButtonModule } from '@angular/material/button';
import { Configs } from '@modules/shared/models/configs';
import { TableModule } from 'primeng/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export interface CtdtConfiAll {
    group: 'KHUNG_TRINH_DO' | 'KHOI_KIEN_THUC' | 'TUONGTHICH_PEOs' | string;
    title: string;
    ctdt_config: CtdtConfig[];
}

@Component({
    selector: 'app-ctdt-cauhinh',
    standalone: true,
    imports: [
        CommonModule,
        TooltipModule,
        LoadingProgressComponent,
        MatButtonModule,
        TableModule,
        ReactiveFormsModule,
        FormsModule
    ],
    templateUrl: './ctdt-cauhinh.component.html',
    styleUrls: ['./ctdt-cauhinh.component.css']
})

export class CtdtCauhinhComponent implements OnInit {

    isLanhDaoKhoa: boolean = false;

    isManager: boolean = false;

    donvi_chuyenmon_id: number;

    selectedCtdt: Ctdt;

    userId: number;

    list_config: Configs[];

    list_ctdt_config: CtdtConfiAll[] = [];

    readonly state: WritableSignal<AppState> = signal<AppState>('loading');
    loadingHeading = 'Đang tải cấu hình chương trình...';
    get busy(): boolean {
        return this.state() !== 'success';
    }
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private configsService: ConfigsService,
        private helperService: HelperService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private ctdtService: CtdtService,
        private elngUserProfileService: ElngUserProfileService,
        private ctdtConfigService: CtdtConfigService,
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.userId = this.auth.user.id;
    }

    ngOnInit(): void {
        if (!this.isLanhDaoKhoa && !this.isManager) {
            this.router.navigate(['/admin/content-none']);
            return;
        }

        this.activatedRoute.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            const ctdtId = params['code'];
            if (!ctdtId) {
                this.router.navigate(['/admin/content-none']);
                return;
            }

            this.loadingHeading = 'Đang tải cấu hình chương trình...';
            this.state.set('loading');
            this.loadInitialData(String(ctdtId));
        });
    }

    autoResize(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    blockArrowKeys(event: KeyboardEvent) {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];

        if (arrowKeys.includes(event.key)) {
            event.stopPropagation();
        }
    }

    reloadData(): void {
        const code = this.activatedRoute.snapshot.queryParamMap.get('code');
        if (!code) return;

        this.loadingHeading = 'Đang tải cấu hình chương trình...';
        this.state.set('loading');
        this.loadInitialData(code);
    }

    private loadInitialData(ctdtId: string): void {
        const contition_ctdt: ConditionOption = {
            condition: [{ conditionName: 'id', condition: OvicQueryCondition.equal, value: ctdtId }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
        const condition_user: ConditionOption = {
            condition: [{ conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' }],
            set: [{ label: 'limit', value: '1' }],
            page: null
        };
        const condition_config: ConditionOption = {
            condition: [],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'include', value: 'KHUNG_TRINH_DO,KHOI_KIEN_THUC,TUONGTHICH_PEOs' },
                { label: 'include_by', value: 'config_key' }
            ],
            page: null
        };

        forkJoin([
            this.ctdtService.getCtdtByPageNew(contition_ctdt),
            this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
            this.configsService.getConfigsByPageNew(condition_config),
        ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: ([_ctdt, _user, _config]) => {
                this.selectedCtdt = _ctdt.data?.[0];
                if (!this.selectedCtdt) {
                    this.state.set('error');
                    return;
                }
                if (!this.isManager && _user.data[0]) {
                    this.donvi_chuyenmon_id = _user.data[0].donvi_chuyenmon_id;
                    if (this.donvi_chuyenmon_id !== this.selectedCtdt.category_id) {
                        this.router.navigate(['/admin/content-none']);
                        return;
                    }
                }
                this.list_config = _config.data || [];
                this.loadCtdtConfig();
            },
            error: () => {
                this.state.set('error');
                this.notificationService.toastWarning('Lỗi kết nối, vui lòng thử lại');
            }
        });
    }

    loadCtdtConfig() {
        this.loadingHeading = 'Đang tải danh mục cấu hình...';
        this.state.set('loading');

        const condition_config: ConditionOption = {
            condition: [
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString(), orWhere: 'and' }
            ],

            set: [
                { label: 'limit', value: '-1' },
                { label: 'order', value: 'ASC' },
                { label: 'orderby', value: 'ordering' }
            ],

            page: null
        }

        this.ctdtConfigService.getCtdtConfigByPageNew(condition_config).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (_config) => {
                const data: CtdtConfiAll[] = [];
                this.list_config.forEach(f => {
                    data.push({
                        group: f.config_key,
                        title: f.title,
                        ctdt_config: []
                    })
                })
                if (_config.recordsFiltered) {
                    data.forEach(f => {
                        f.ctdt_config = _config.data.filter(m => m.group === f.group);
                    })
                    // _config.data.forEach(f => {
                    //     const index = data.findIndex(m => m.group === f.group);
                    //     if (index !== -1) {
                    //         data[index].ctdt_config.push(f);
                    //     } else {
                    //         const index_ = this.list_config.findIndex(m => m.config_key === f.key);
                    //         data.push({
                    //             ctdt_config: [f],
                    //             group: f.group,
                    //             title: index_
                    //         })
                    //     }
                    //     console.log(data);
                    // })
                } else {
                    this.list_config.forEach(f => {
                        const child = [];
                        if (Array.isArray(f.params)) {
                            f.params.forEach((c, ckey) => {
                                child.push({
                                    ctdt_id: this.selectedCtdt.id,
                                    key: c.key,
                                    group: f.config_key,
                                    title: c.title,
                                    ordering: ckey + 1,
                                    noidung: c.noidung
                                })
                            })
                        }

                        const index = data.findIndex(m => m.group === f.config_key);

                        if (index !== -1) {
                            data[index].ctdt_config = child;
                        }
                    })
                }

                this.list_ctdt_config = this.helperService.sort(data, 'title');
                this.state.set('success');
            },
            error: () => {
                this.state.set('error');
            }
        })
    }

    addConfig(parent: CtdtConfiAll) {
        const data: CtdtConfig = {
            ctdt_id: this.selectedCtdt.id,
            group: parent.group,
            key: null,
            title: null,
            noidung: null,
        }

        parent.ctdt_config.push(data)

        parent.ctdt_config.forEach((f, key) => {
            f.ordering = key + 1;
        })
    }

    deleteConfig(parent: CtdtConfiAll, config: CtdtConfig, index: number) {
        if (config.id) {
            this.notificationService.confirmDelete().then(a => {
                if (a) {
                    this.loadingHeading = 'Đang xóa cấu hình...';
                    this.state.set('loading');
                    this.ctdtConfigService.deleteCtdtConfig(config.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                        next: () => {
                            this.loadCtdtConfig();
                            this.notificationService.toastSuccess("Xóa thành công");
                        },
                        error: () => {
                            this.state.set('success');
                            this.notificationService.toastError("Xóa thất bại");
                        }
                    })
                }
            })
        } else {
            parent.ctdt_config.splice(index, 1);
        }
    }

    saveConfig() {
        const request: Observable<any>[] = [];

        this.list_ctdt_config.forEach(f => {
            f.ctdt_config.forEach((c, ckey) => {
                c.ordering = ckey + 1;
                c.key = this.helperService.slugVietnamese(c.title);
                if (c.id) {
                    const data = { ...c };
                    delete data.id;
                    request.push(this.ctdtConfigService.updateCtdtConfig(c.id, c));
                } else {
                    request.push(this.ctdtConfigService.addCtdtConfig(c));
                }
            })
        })

        if (request.length) {
            this.loadingHeading = 'Đang lưu cấu hình...';
            this.state.set('loading');
            forkJoin(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: () => {
                    this.loadCtdtConfig();
                    this.notificationService.toastSuccess("Cập nhật thành công");
                },
                error: () => {
                    this.state.set('success');
                    this.notificationService.toastError("Cập nhật thất bại");
                }
            })
        }
    }
}
