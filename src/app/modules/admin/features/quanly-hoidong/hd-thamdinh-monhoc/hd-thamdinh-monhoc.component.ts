import { ElnChuyenMucService } from '@shared/services/elearning-chuyen-muc.service';
import { HelperService } from '@core/services/helper.service';
import { request } from 'http';
import { data } from 'autoprefixer';
import { HoidongThamdinhMonhocThanhvienService } from './../../../../shared/services/hoidong-thamdinh-monhoc-thanhvien.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { HoidongThamdinhMonhocService } from './../../../../shared/services/hoidong-thamdinh-monhoc.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HoidongThamdinh } from '@modules/shared/models/hoidong-thamdinh';
import { ActivatedRoute, Router } from '@angular/router';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { OvicQueryCondition } from '@core/models/dto';
import { NotificationService } from '@core/services/notification.service';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { HoidongThamdinhMonhoc } from '@modules/shared/models/hoidong-thamdinh-monhoc';
import { TableModule } from 'primeng/table';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DialogModule } from 'primeng/dialog';
import { ElnKhoaHoc, EXAMFORMAT } from '@modules/shared/models/elng-khoa-hoc';
import { SharedModule } from '@modules/shared/shared.module';
import { Observable, forkJoin, mergeMap, of } from 'rxjs';
import { NgbTooltipModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LARGE_MODAL_OPTIONS, ROLES } from '@modules/shared/utils/syscat';
import { AuthService } from '@core/services/auth.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { ElnChuyenMuc } from '@modules/shared/models/Elng';
import { HoidongThamdinhThanhvienService } from '@modules/shared/services/hoidong-thamhdinh-thanhvien.service';

type ThanhvienMonhocOption = ElngUserProfile & {
    display_name?: string;
    email?: string;
    chutich?: boolean;
    display_chutich?: boolean;
};

@Component({
    selector: 'app-hd-thamdinh-monhoc',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        ReactiveFormsModule,
        FormsModule,
        MatListModule,
        DialogModule,
        MatProgressBarModule,
        NgbTooltipModule
    ],
    templateUrl: './hd-thamdinh-monhoc.component.html',
    styleUrls: ['./hd-thamdinh-monhoc.component.css']
})
export class HdThamdinhMonhocComponent implements OnInit {
    @ViewChild('templateMonhoc') templateMonhoc: TemplateRef<any>;

    @ViewChild('templatePmsGiangvien') templatePmsGiangvien: TemplateRef<any>;

    @ViewChild('templateThanhvien') templateThanhvien: TemplateRef<any>;

    selectedHoidong: HoidongThamdinh;

    list_hoidong_monhoc: HoidongThamdinhMonhoc[];

    selectedMonhoc: HoidongThamdinhMonhoc;

    selectedListMonhoc: HoidongThamdinhMonhoc[];

    searchName: string;

    list_monhoc: ElnKhoaHoc[];

    waitting_title: string;

    progressValue: number = 0;

    displayModal: boolean = false;

    searchMonhoc: string;

    selectedMonhocForHoidong: ElnKhoaHoc[];

    list_thanhvien: ThanhvienMonhocOption[];

    searchUser: string;

    selectedThanhviens: ThanhvienMonhocOption[];

    display_dialog_thanhvien: boolean = false;

    selectedListThanhvien: ThanhvienMonhocOption[];

    maxThanhvien: number = 0;

    isManager: boolean = false;

    isLanhdaokhoa: boolean = false;

    isLanhDaoBomon: boolean = false;

    user_bomon_id: number;

    list_bomon: ElnChuyenMuc[] = [];

    search_bomon_id: number;

    donvi_chuyenmon_id: number;
    constructor(
        private activatedRoute: ActivatedRoute,
        private notificationService: NotificationService,
        private hoidongThamdinhService: HoidongThamdinhService,
        private hoidongThamdinhMonhocService: HoidongThamdinhMonhocService,
        private elnKhoaHocService: ElnKhoaHocService,
        private router: Router,
        private hoidongThamdinhMonhocThanhvienService: HoidongThamdinhMonhocThanhvienService,
        private hoidongThamdinhThanhvienService: HoidongThamdinhThanhvienService,
        private modal: NgbModal,
        private helperService: HelperService,
        private auth: AuthService,
        private elngUserProfileService: ElngUserProfileService,
        private elnChuyenMucService: ElnChuyenMucService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhdaokhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);

        this.isLanhDaoBomon = this.auth.userHasRole(ROLES.lanhdaobomon);
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                this.notificationService.isProcessing(true);

                const hoidong_id = params['code'];

                const contition: ConditionOption = {
                    condition: [
                        { conditionName: 'id', condition: OvicQueryCondition.equal, value: hoidong_id.toString() },
                    ],
                    set: [
                        { label: 'limit', value: '1' }
                    ],
                    page: null
                }

                const condition_user: ConditionOption = {
                    condition: [
                        { conditionName: 'user_id', condition: OvicQueryCondition.equal, value: this.auth.user.id.toString(), orWhere: 'and' }
                    ],
                    set: [
                        { label: 'limit', value: '-1' }
                    ],
                    page: null
                }

                forkJoin([
                    this.hoidongThamdinhService.getHoidongThamdinhByPageNew(contition),
                    this.elngUserProfileService.getUserProfileByPageNewV2(condition_user)
                ]).subscribe({
                    next: ([_hoidong, _user]) => {
                        if (_hoidong.recordsFiltered) {
                            this.selectedHoidong = _hoidong.data[0];
                            if (!this.isManager && (this.isLanhdaokhoa || this.isLanhDaoBomon)) {
                                if (!_user.data[0] || this.selectedHoidong.category_id !== _user.data[0].donvi_chuyenmon_id) {
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }
                        }

                        if (_user.data[0]) {
                            this.user_bomon_id = _user.data[0].bomon_id;
                            this.donvi_chuyenmon_id = _user.data[0].donvi_chuyenmon_id;
                            if (this.isLanhDaoBomon && !this.isLanhdaokhoa && !this.isManager) {
                                this.search_bomon_id = this.user_bomon_id;
                            }
                        }

                        this.loadThamdinhMonhoc();
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
    }

    loadThamdinhMonhoc() {
        this.notificationService.isProcessing(true);

        this.maxThanhvien = 0;

        const condition_monhoc: ConditionOption = {
            condition: [
                { conditionName: "hoidong_thamdinh_id", condition: OvicQueryCondition.equal, value: this.selectedHoidong.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'course' },
            ],
            page: null
        }


        const condition_thanhvien: ConditionOption = {
            condition: [
                { conditionName: "hoidong_thamdinh_id", condition: OvicQueryCondition.equal, value: this.selectedHoidong.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' },
            ],
            page: null
        }

        const condition_bomon: ConditionOption = {
            condition: [
                { conditionName: 'donvi_chuyenmon_id', condition: OvicQueryCondition.equal, value: this.selectedHoidong.category_id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' }
            ],
            page: null
        }

        forkJoin([
            this.hoidongThamdinhMonhocService.getHoidongThamdinhMonhocByPageNew(condition_monhoc),
            this.hoidongThamdinhMonhocThanhvienService.getHoidongThamdinhMonhocThanhvienByPageNew(condition_thanhvien),
            this.elnChuyenMucService.getChuyemucByPageNew(condition_bomon)
        ]).subscribe({
            next: ([_course, _thanhvien, _bomon]) => {

                this.list_bomon = _bomon.data;

                _course.data.forEach(f => {
                    if (f['course']) {
                        const params = f['course']['params'];
                        if (params) {
                            if (typeof params === 'string') {
                                f['course_params'] = JSON.parse(params);
                            } else if (typeof params === 'object') {
                                f['course_params'] = params;
                            } else {
                                f['course_params'] = null;
                            }
                        } else {
                            f['course_params'] = null;
                        }
                        f['nganh_bomon_id'] = f['course']['nganh_bomon_id'];
                        f['course_title'] = f['course']['title'];
                        f['course_maso'] = f['course']['maso'];
                        f['created_plan_name'] = f['course']['user_name'] ? f['course']['user_name'] : 'Chưa phân quyền';
                    }
                    if (f['course_params']) {
                        if (f['course_params']) {
                            if (!f['course_params'].exam_type) {
                                const index = EXAMFORMAT.findIndex((m) => m.key === f['course_params'].exam_format);
                                if (index !== -1) {
                                    f['hinhthucthi'] = EXAMFORMAT[index].label;
                                }
                            } else {
                                const index = EXAMFORMAT.findIndex((m) => m.id === f['course_params'].exam_type);
                                if (index !== -1) {
                                    f['hinhthucthi'] = EXAMFORMAT[index].label;
                                }
                            }

                            const sotinchi = f['course_params'].sotinchi ? f['course_params'].sotinchi : 0;
                            const sotinchi_th = f['course_params']['sotinchi_th'] ? f['course_params']['sotinchi_th'] : 0;
                            const index_m = EXAMFORMAT.findIndex((m) => m.key === f['course_params'].exam_format);
                            let exam = 'Chưa có thông tin';

                            if (index_m !== -1) {
                                exam = EXAMFORMAT[index_m].label;
                            }

                            f['info_'] = ' - TC: ' + sotinchi.toString().concat('-', sotinchi_th.toString(), ' - ', f['hinhthucthi']);
                        }
                    }

                    f['thanhvien'] = this.helperService.sort(_thanhvien.data.filter(m => m.hoidong_thamdinh_monhoc_id === f.id), 'chutich', -1);

                    if (f.thanhvien.length > this.maxThanhvien) {
                        this.maxThanhvien = f.thanhvien.length
                    }
                })

                this.list_hoidong_monhoc = _course.data;

                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    loadMonhoc() {
        this.notificationService.isProcessing(true);

        const condition_monhoc: ConditionOption = {
            condition: [
                { conditionName: 'category_ids', condition: OvicQueryCondition.equal, value: this.selectedHoidong.category_id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'creatorPlan' }
            ],
            page: null
        }

        if (!this.isManager && !this.isLanhdaokhoa && this.isLanhDaoBomon) {
            condition_monhoc.condition.push(
                { conditionName: 'nganh_bomon_id', condition: OvicQueryCondition.equal, value: this.user_bomon_id.toString(), orWhere: 'and' }
            )
        }


        if (this.list_hoidong_monhoc && this.list_hoidong_monhoc.length) {
            const ids = this.list_hoidong_monhoc.map(m => m.course_id);
            condition_monhoc.set.push(
                { label: 'exclude', value: ids.toString() },
                { label: 'exclude_by', value: 'id' }
            )
        }

        this.elnKhoaHocService.getKhoaHocByPageNew_2(condition_monhoc).subscribe({
            next: (_monhoc) => {
                this.notificationService.isProcessing(false);
                _monhoc.data.forEach(f => {
                    if (f.creatorPlan) {
                        f['created_plan_name'] = f.creatorPlan.display_name;
                    } else {
                        f['created_plan_name'] = "Chưa phân quyền";
                    }

                    if (f.params) {
                        if (!f.params.exam_type) {
                            const index = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                            if (index !== -1) {
                                f['hinhthucthi'] = EXAMFORMAT[index].label;
                            }
                        } else {
                            const index = EXAMFORMAT.findIndex((m) => m.id === f.params.exam_type);
                            if (index !== -1) {
                                f['hinhthucthi'] = EXAMFORMAT[index].label;
                            }
                        }

                        const sotinchi = f.params.sotinchi ? f.params.sotinchi : 0;
                        const sotinchi_th = f.params['sotinchi_th'] ? f.params['sotinchi_th'] : 0;
                        const index_m = EXAMFORMAT.findIndex((m) => m.key === f.params.exam_format);
                        let exam = 'Chưa có thông tin';

                        if (index_m !== -1) {
                            exam = EXAMFORMAT[index_m].label;
                        }

                        f['info_'] = ' - TC: ' + sotinchi.toString().concat('-', sotinchi_th.toString(), ' - ', f['hinhthucthi']);
                    }
                })
                this.list_monhoc = _monhoc.data;
                this.notificationService.openSideNavigationMenu({ template: this.templateMonhoc, size: 600, offsetTop: '0px' })
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    deleteSelectItem() {
        if (this.selectedListMonhoc && this.selectedListMonhoc.length) {
            this.notificationService.confirmDelete().then(a => {
                if (a) {
                    this.notificationService.isProcessing(true);
                    const ids = this.selectedListMonhoc.map(m => m.id);
                    const request: Observable<any>[] = [];
                    let ids_thanhvien = [];
                    this.selectedListMonhoc.forEach(f => {
                        if (f.thanhvien && f.thanhvien.length) {
                            ids_thanhvien = ids_thanhvien.concat(f.thanhvien.map(m => m.id));
                        }
                    })

                    if (ids_thanhvien.length) {
                        request.push(this.hoidongThamdinhMonhocThanhvienService.deleteHoidongThamdinhMonhocThanhvien(ids_thanhvien))
                    }

                    request.push(this.hoidongThamdinhMonhocService.deleteHoidongThamdinhMonhoc(ids));

                    forkJoin(request).subscribe({
                        next: () => {
                            this.loadThamdinhMonhoc();
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
            this.notificationService.toastWarning("Vui lòng chọn môn học");
        }
    }

    deleteItem(item: HoidongThamdinhMonhoc) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);

                const request: Observable<any>[] = [];
                if (item.thanhvien && item.thanhvien.length) {
                    const ids_delete = item.thanhvien.map(m => m.id);
                    request.push(this.hoidongThamdinhMonhocThanhvienService.deleteHoidongThamdinhMonhocThanhvien(ids_delete));
                }

                request.push(this.hoidongThamdinhMonhocService.deleteHoidongThamdinhMonhoc(item.id));

                forkJoin(request).subscribe({
                    next: () => {
                        this.loadThamdinhMonhoc();
                        this.notificationService.toastSuccess("Xóa thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Xóa thất bại");
                    }
                })
            }
        })
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
    }


    saveMonhoc() {
        this.waitting_title = "Đang thêm môn học, vui lòng không tắt trình duyệt";
        const request: Observable<any>[] = [];

        this.selectedMonhocForHoidong.forEach(f => {
            const data = {
                course_id: f.id,
                hoidong_thamdinh_id: this.selectedHoidong.id,
            }

            request.push(this.hoidongThamdinhMonhocService.addHoidongThamdinhMonhoc(data))
        })

        if (request.length) {
            this.progressValue = 0;
            this.displayModal = true;
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.closeForm();
                    this.notificationService.toastSuccess("Thêm thành công");
                    this.loadThamdinhMonhoc();
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Thêm thất bại, vui lòng thử lại")
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

    openLoadThanhVien(item: HoidongThamdinhMonhoc) {
        this.notificationService.isProcessing(true);
        this.selectedMonhoc = item;
        this.selectedThanhviens = null;
        const condition_thanhvien: ConditionOption = {
            condition: [
                { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
                { conditionName: 'donvi_chuyenmon_id', condition: OvicQueryCondition.equal, value: this.selectedHoidong.category_id.toString(), orWhere: 'and' }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null
        }

        this.elngUserProfileService.getUserProfileByPageNewV2(condition_thanhvien).subscribe({
            next: (_thanhvien) => {
                const data: ThanhvienMonhocOption[] = [];
                const listThanhvien = _thanhvien.data.filter(f => f.user).map(f => {
                    const thanhvien: ThanhvienMonhocOption = {
                        ...f,
                        display_name: f.user.display_name,
                        email: f.user.email
                    };
                    const index = this.selectedMonhoc.thanhvien.findIndex(m => m.user_id === thanhvien.user_id);
                    if (index !== -1) {
                        thanhvien.chutich = this.selectedMonhoc.thanhvien[index].chutich === 1;
                        thanhvien.display_chutich = true;
                        data.push(thanhvien);
                    }
                    return thanhvien;
                });

                this.list_thanhvien = listThanhvien;
                this.selectedListThanhvien = data;
                this.modal.open(this.templateThanhvien, LARGE_MODAL_OPTIONS);
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    chooseChutich(item: ThanhvienMonhocOption) {
        this.selectedListThanhvien.forEach(f => {
            f['chutich'] = false;
        })
        item['chutich'] = true;
    }

    onRowSelect(event: any) {
        event.data['display_chutich'] = true;
    }

    onRowUnselect(event: any) {
        event.data['display_chutich'] = false;
        event.data['chutich'] = false;
    }

    saveThanhvienHoidongMonhoc(d) {
        if (this.selectedListThanhvien) {
            const index = this.selectedListThanhvien.findIndex(m => m['chutich']);
            if (index === -1) {
                return this.notificationService.toastWarning("Vui lòng chọn chủ tịch");
            }


            this.notificationService.isProcessing(true);

            const request: Observable<any>[] = [];

            const id_delete = this.selectedMonhoc.thanhvien.map(m => m.id);

            this.selectedListThanhvien.forEach(f => {
                const index = this.selectedMonhoc.thanhvien.findIndex(m => m.user_id === f.user_id);
                if (index === -1) {
                    const data = {
                        hoidong_thamdinh_id: this.selectedHoidong.id,
                        hoidong_thamdinh_monhoc_id: this.selectedMonhoc.id,
                        course_id: this.selectedMonhoc.course_id,
                        user_id: f.user_id,
                        chutich: f.chutich ? 1 : 0
                    }
                    request.push(
                        this.hoidongThamdinhMonhocThanhvienService.addHoidongThamdinhMonhocThanhvien(data).pipe(
                            mergeMap(() => this.hoidongThamdinhThanhvienService.addHoidongThamdinhThanhvien({
                                hoidong_thamdinh_id: this.selectedHoidong.id,
                                user_id: f.user_id
                            }))
                        )
                    );
                } else {
                    const index_id = id_delete.findIndex(m => m === this.selectedMonhoc.thanhvien[index].id);
                    if (index_id !== -1) {
                        id_delete.splice(index_id, 1);
                    }
                    const data = {
                        hoidong_thamdinh_id: this.selectedHoidong.id,
                        hoidong_thamdinh_monhoc_id: this.selectedMonhoc.id,
                        course_id: this.selectedMonhoc.course_id,
                        user_id: f.user_id,
                        chutich: f.chutich ? 1 : 0
                    }
                    request.push(this.hoidongThamdinhMonhocThanhvienService.updateHoidongThamdinhMonhocThanhvien(this.selectedMonhoc.thanhvien[index].id, data));
                }
            })

            if (id_delete.length)
                request.push(this.hoidongThamdinhMonhocThanhvienService.deleteHoidongThamdinhMonhocThanhvien(id_delete.toString()))

            if (request.length) {
                forkJoin(request).subscribe({
                    next: () => {
                        this.loadThamdinhMonhoc();
                        d(true);
                        this.notificationService.toastSuccess("Cập nhật thành công");
                    },
                    error: () => {
                        this.notificationService.isProcessing(false);
                        this.notificationService.toastError("Cập nhật thất bại");
                    }
                })
            } else {
                this.notificationService.isProcessing(false);
            }
        } else {
            this.notificationService.toastWarning("Vui lòng chọn ít nhất 1 thành viên");
        }
    }

    onHeaderCheckboxToggle(event: any) {
        this.list_thanhvien.forEach(f => {
            f.display_chutich = event.checked;
            if (!event.checked) {
                f.chutich = event.checked;
            }
        })
    }

    onSelectMonhocForHd(event: MatSelectionListChange) {
        this.selectedMonhocForHoidong = this.list_monhoc.filter(m => m['check'])
    }

    onBomonChange(event: ElnChuyenMuc) {
        if (event) {
            this.search_bomon_id = event.id;
        } else {
            this.search_bomon_id = null;
        }
    }
}
