import { HelperService } from '@core/services/helper.service';
import { request } from 'http';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { CtdtHocphanService } from './../../../../shared/services/ctdt-hocphan.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { SharedModule } from '@modules/shared/shared.module';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { CtdtCdrService } from '@modules/shared/services/ctdt-cdr.service';
import { CtdtMuctieuCutheService } from '@modules/shared/services/ctdt-muctieu-cuthe.service';
import { CtdtService } from '@modules/shared/services/ctdt.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { forkJoin, mergeMap, Observable, of } from 'rxjs';
import { Ctdt } from '@modules/shared/models/ctdt';
import { ROLES, TYPE_TEST } from '@modules/shared/utils/syscat';
import { ConfigsService } from '@modules/shared/services/configs.service';
import { CtdtHocphan } from '@modules/shared/models/ctdt_hocphan';
import { TableModule } from 'primeng/table';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { C } from '@angular/cdk/keycodes';
import { data } from 'autoprefixer';
import { CtdtConfig } from '@modules/shared/models/ctdt-config';
import { CtdtConfigService } from '@modules/shared/services/ctdt-config.service';

export interface typeCtdtHocphan {
    key: string;
    title: string;
    children: CtdtHocphan[];
}


@Component({
    selector: 'app-ctdt-noidung',
    standalone: true,
    imports: [
    SharedModule,
    TableModule,
    MatListModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    MatProgressBarModule,
    OverlayPanelModule
],
    templateUrl: './ctdt-noidung.component.html',
    styleUrls: ['./ctdt-noidung.component.css']
})
export class CtdtNoidungComponent implements OnInit {
    @ViewChild('templateChooseMonhoc') templateChooseMonhoc: TemplateRef<any>;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    userId: number = 0;

    selectedCtdt: Ctdt;

    donvi_chuyenmon_id: number;

    list_khoikienthuc: CtdtConfig[] = [];

    list_cdt_hocphan: typeCtdtHocphan[] = [];

    list_course: ElnKhoaHoc[];

    selectedKhoiKienthuc: typeCtdtHocphan;

    type_test = EXAMFORMAT;

    searchCourse: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    waitting_title: string = "Đang lưu dữ liệu, vui lòng chờ";

    list_selected_course: ElnKhoaHoc[];

    list_course_dk: ElnKhoaHoc[];

    searchCourse_hp: string;

    selectedCtdtHocphan: CtdtHocphan;

    keyHp: string;

    constructor(
        private auth: AuthService,
        private notificationService: NotificationService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private ctdtService: CtdtService,
        public formBuilder: FormBuilder,
        private elngUserProfileService: ElngUserProfileService,
        private configsService: ConfigsService,
        private ctdtCdrService: CtdtCdrService,
        private ctdtMuctieuCutheService: CtdtMuctieuCutheService,
        private ctdtHocphanService: CtdtHocphanService,
        private elnKhoaHocService: ElnKhoaHocService,
        private helperService: HelperService,
        private ctdtConfigService: CtdtConfigService
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

                    const condition_khoi_kienthuc: ConditionOption = {
                        condition: [
                            { conditionName: 'config_key', condition: OvicQueryCondition.equal, value: 'KHOI_KIEN_THUC' },
                        ],
                        set: [
                            { label: 'limit', value: '1' },
                        ],
                        page: null
                    }

                    const condition_ctdt_config: ConditionOption = {
                        condition: [
                            { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: ctdtId.toString() },
                        ],
                        set: [
                            { label: 'limit', value: '-1' },
                            { label: 'include', value: 'KHOI_KIEN_THUC' },
                            { label: 'include_by', value: 'group' },
                            { label: 'orderby', value: 'ordering' },
                            { label: 'order', value: 'ASC' }
                        ],
                        page: null
                    }

                    forkJoin([
                        this.ctdtService.getCtdtByPageNew(contition_ctdt).pipe(mergeMap(ctdt => {
                            if (ctdt.recordsFiltered) {
                                const condition_monhoc: ConditionOption = {
                                    condition: [
                                        { conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: ctdt.data[0].category_id.toString() },
                                    ],
                                    set: [
                                        { label: 'limit', value: '-1' },
                                    ],
                                    page: null
                                }
                                return this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc).pipe(mergeMap(_course => {
                                    this.list_course = _course.data;
                                    return of(ctdt)
                                }))
                            }
                            return of(ctdt)
                        })),
                        this.elngUserProfileService.getUserProfileByPageNewV2(condition_user),
                        this.configsService.getConfigsByPageNew(condition_khoi_kienthuc),
                        this.ctdtConfigService.getCtdtConfigByPageNew(condition_ctdt_config)
                    ]).subscribe({
                        next: ([_ctdt, _user, _khoi_kienthuc, _ctdt_config]) => {

                            this.selectedCtdt = _ctdt.data[0];


                            if (_ctdt_config.recordsFiltered) {
                                this.list_khoikienthuc = _ctdt_config.data;
                            } else {
                                if (Array.isArray(_khoi_kienthuc.data[0].params))
                                    this.list_khoikienthuc = _khoi_kienthuc.data[0].params;
                            }

                            if (!this.isManager && _user.data[0]) {
                                this.donvi_chuyenmon_id = _user.data[0].donvi_chuyenmon_id;
                                if (this.donvi_chuyenmon_id !== this.selectedCtdt.category_id) {
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }



                            this.loadCtdthocPhan();
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


    loadCtdthocPhan() {
        this.notificationService.isProcessing(false);

        const condition_ctdt_hocphan: ConditionOption = {
            condition: [
                { conditionName: 'ctdt_id', condition: OvicQueryCondition.equal, value: this.selectedCtdt.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        this.ctdtHocphanService.getCtdtHocphanByPageNew(condition_ctdt_hocphan).subscribe({
            next: (_ctdt_hocphan) => {
                _ctdt_hocphan.data.forEach(f => {
                    const index = this.list_course.findIndex(m => m.id === f.course_id);
                    if (index !== -1) {
                        f['maso'] = this.list_course[index].maso;
                    }
                })
                const data: typeCtdtHocphan[] = [];
                this.list_khoikienthuc.forEach(f => {
                    const data_hocphan: typeCtdtHocphan = {
                        key: f.key,
                        title: f.title,
                        children: _ctdt_hocphan.data.filter(m => m.khoikienthuc === f.key)
                    }
                    data.push(data_hocphan);
                })
                this.list_cdt_hocphan = data;
                this.notificationService.isProcessing(false);
            },
            error: () => {

            }
        })
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }

    openSelectedMonhoc(_khoi_kienthuc: typeCtdtHocphan) {
        this.selectedKhoiKienthuc = _khoi_kienthuc;

        let course_checked = [];

        this.list_cdt_hocphan.forEach(f => {
            if (f.key !== _khoi_kienthuc.key)
                course_checked = course_checked.concat(f.children);
        })

        this.list_course.forEach(f => {
            f['disabled'] = 0;

            const index_other = course_checked.findIndex(m => m.course_id === f.id);

            if (index_other !== -1) {
                f['disabled'] = 1
            }

            f['checked'] = false;

            const index = _khoi_kienthuc.children.findIndex(m => m.course_id === f.id);

            if (index !== -1) {
                f['checked'] = true;
            }
        })

        this.list_selected_course = this.list_course.filter(m => m['disabled'] === 0);

        this.notificationService.openSideNavigationMenu({ template: this.templateChooseMonhoc, size: 700, offsetTop: '0px' });
    }

    changeSelecCourse(event: MatSelectionListChange) {
        if (event) {
            const index = this.list_selected_course.findIndex(m => m.id === event.options[0].value['id']);
            if (index !== -1) {
                this.list_selected_course[index]['checked'] = event.options[0].selected;
            }
        }
    }

    saveCtdtHocPhan() {
        const request: Observable<any>[] = [];
        const data_course_checked = this.list_selected_course.filter(m => m['checked']);
        const id_delete = [];
        this.selectedKhoiKienthuc.children.forEach(f => {
            const index_ = data_course_checked.findIndex(m => m.id === f.course_id);
            if (index_ === -1) {
                id_delete.push(f.id);
            }
        })

        if (id_delete.length) {
            request.push(this.ctdtHocphanService.deleteCtdtHocphan(id_delete.toString()))
        }


        data_course_checked.forEach(f => {
            const index_ = this.selectedKhoiKienthuc.children.findIndex(m => m.course_id === f.id);
            if (index_ === -1) {
                const data = {
                    ctdt_id: this.selectedCtdt.id,
                    course_id: f.id,
                    course_name: f.title,
                    khoikienthuc: this.selectedKhoiKienthuc.key,
                    sotinchi: f.params.sotinchi,
                    sotinchi_thuchanh: f.params.sotinchi_th,
                    category_id: f.category_ids,
                }
                request.push(this.ctdtHocphanService.addCtdtHocphan(data))
            }
        })

        if (request.length) {
            this.displayModal = true;
            this.progressValue = 0;
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Cập nhật thành công");
                    this.closeForm();
                    this.loadCtdthocPhan();
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Cập nhật thất bại, vui lòng thử lại");
                }
            })
        }
    }

    loopAddForm(request: Observable<any>[], key: number): Observable<any> {
        return request[key].pipe(mergeMap(a => {
            this.progressValue = (key + 1) / request.length * 100;
            if (request[key + 1]) {
                return this.loopAddForm(request, key + 1);
            } else {
                return of(null);
            }
        }))
    }

    pointQuestionKeyDown(event: KeyboardEvent) {
        if (!event) return;

        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'];

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

    saveUpdateCtdtHocPhan() {
        const request: Observable<any>[] = [];
        this.list_cdt_hocphan.forEach(f => {
            f.children.forEach(c => {
                const data = {
                    hocky: c.hocky,
                    hp_hoctruoc: c.hp_hoctruoc,
                    hp_tienquyet: c.hp_tienquyet,
                    hp_songhanh: c.hp_songhanh,
                }
                request.push(this.ctdtHocphanService.updateCtdtHocphan(c.id, data))
            })

        })

        if (request.length) {
            this.displayModal = true;
            this.progressValue = 0;
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.loadCtdthocPhan()
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Cập nhật thất bại, vui lòng thử lại");
                }
            })
        }
    }

    togglePanel(child: CtdtHocphan, opCtdtHp, event, key: string) {
        this.selectedCtdtHocphan = child;

        this.keyHp = key;

        const data = [];

        this.list_cdt_hocphan.forEach(f => {
            f.children.forEach(c => {
                let index = this.list_course.findIndex(m => m.id === c.course_id && c.hocky < child.hocky && c.id !== child.id);
                switch (key) {
                    case 'hp_songhanh':
                        index = this.list_course.findIndex(m => m.id === c.course_id && c.hocky === child.hocky && c.id !== child.id);
                        break;
                    default:
                        break;
                }

                if (index !== -1) {
                    this.list_course[index]['selected_hp'] = Array.isArray(this.selectedCtdtHocphan[this.keyHp]) ? this.selectedCtdtHocphan[this.keyHp].includes(this.list_course[index].id) : false;
                    data.push(this.list_course[index]);
                }
            })
        })

        this.list_course_dk = this.helperService.sort(data, "selected_hp", -1);

        opCtdtHp.toggle(event)
    }

    onSelectedHp(event: MatSelectionListChange) {
        if (event) {
            this.selectedCtdtHocphan[this.keyHp] = event.source._value.map(m => m['id']);
            console.log(this.selectedCtdtHocphan);
        }
    }
}
