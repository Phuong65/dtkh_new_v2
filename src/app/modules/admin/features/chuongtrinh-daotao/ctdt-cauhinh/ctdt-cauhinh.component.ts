import { CtdtConfigService } from './../../../../shared/services/ctdt-config.service';
import { CtdtConfig } from './../../../../shared/models/ctdt-config';
import { HelperService } from '@core/services/helper.service';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { NotificationService } from '@core/services/notification.service';
import { Component, OnInit } from '@angular/core';

import { AuthService } from '@core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { forkJoin, Observable } from 'rxjs';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ROLES } from '@modules/shared/utils/syscat';
import { SharedModule } from '@modules/shared/shared.module';
import { PanelModule } from 'primeng/panel';
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
    SharedModule,
    PanelModule,
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

    list_ctdt_config: CtdtConfiAll[];

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
        if (this.isLanhDaoKhoa || this.isManager) {
            this.activatedRoute.queryParams.subscribe(async (params) => {
                if (params && params['code']) {

                    this.notificationService.isProcessing(true);

                    const ctdtId = params['code'];

                    const contition_ctdt: ConditionOption = {
                        condition: [
                            { conditionName: 'id', condition: OvicQueryCondition.equal, value: ctdtId.toString() },
                        ],
                        set: [
                            { label: 'limit', value: '1' }
                        ],
                        page: null
                    }

                    const condition_user: ConditionOption = {
                        condition: [
                            { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.userId.toString(), orWhere: 'and' },
                        ],
                        set: [
                            { label: 'limit', value: '1' },
                        ],
                        page: null
                    }

                    const condition_config: ConditionOption = {
                        condition: [
                        ],

                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: 'KHUNG_TRINH_DO,KHOI_KIEN_THUC,TUONGTHICH_PEOs' },
                            { label: 'include_by', value: 'config_key' }
                        ],

                        page: null
                    }
                    forkJoin([
                        this.ctdtService.getCtdtByPageNew(contition_ctdt),
                        this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                        this.configsService.getConfigsByPageNew(condition_config),
                    ]).subscribe({
                        next: ([_ctdt, _user, _config]) => {

                            this.selectedCtdt = _ctdt.data[0];

                            if (!this.isManager && _user.data[0]) {
                                this.donvi_chuyenmon_id = _user.data[0].donvi_chuyenmon_id;
                                if (this.donvi_chuyenmon_id !== this.selectedCtdt.category_id) {
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }

                            this.list_config = _config.data;

                            this.loadCtdtConfig();
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
                            this.notificationService.toastWarning("Lỗi kết nối, vui lòng thử lại");
                        }
                    })
                } else {
                    this.router.navigate(['/admin/content-none']);
                }
            })
        } else {
            this.router.navigate(['/admin/content-none']);
        }
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

    loadCtdtConfig() {

        this.notificationService.isProcessing(true);

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

        console.log(this.list_config);

        this.ctdtConfigService.getCtdtConfigByPageNew(condition_config).subscribe({
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

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false)
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
                    this.notificationService.isProcessing(true);
                    this.ctdtConfigService.deleteCtdtConfig(config.id).subscribe({
                        next: () => {
                            this.loadCtdtConfig();
                            this.notificationService.toastSuccess("Xóa thành công");
                        },
                        error: () => {
                            this.notificationService.isProcessing(false);
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
            this.notificationService.isProcessing(true);
            forkJoin(request).subscribe({
                next: () => {
                    this.loadCtdtConfig();
                    this.notificationService.toastSuccess("Cập nhật thành công");
                },
                error: () => {
                    this.notificationService.isProcessing(false);
                    this.notificationService.toastError("Cập nhật thất bại");
                }
            })
        }
    }
}
