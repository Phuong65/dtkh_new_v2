import { HttpParamsHeplerService } from '@core/services/http-params-hepler.service';
import { NotificationService } from '@core/services/notification.service';
import { data } from 'autoprefixer';
import { HoidongThamdinhThanhvienService } from './../../../../shared/services/hoidong-thamhdinh-thanhvien.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@modules/shared/shared.module';
import { TableModule } from 'primeng/table';
import { HoidongThamdinh } from '@modules/shared/models/hoidong-thamdinh';
import { HoidongThamdinhThanhvien } from '@modules/shared/models/hoidong-thamdinh-thanhvien';
import { OvicQueryCondition } from '@core/models/dto';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { HoidongThamdinhService } from '@modules/shared/services/hoidong-thamdinh.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { User } from '@core/models/user';
import { UserService } from '@core/services/user.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { ElngUserProfile } from '@modules/shared/models/elng-user-profile';
import { Observable, forkJoin, mergeMap, of } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '@core/services/auth.service';
import { ROLES } from '@modules/shared/utils/syscat';

@Component({
    selector: 'app-hd-thamdinh-thanhvien',
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
        TableModule,
        ReactiveFormsModule,
        FormsModule,
        MatListModule,
        DialogModule,
        MatProgressBarModule
    ],
    templateUrl: './hd-thamdinh-thanhvien.component.html',
    styleUrls: ['./hd-thamdinh-thanhvien.component.css']
})
export class HdThamdinhThanhvienComponent implements OnInit {
    @ViewChild('templatePmsGiangvien') templatePmsCttdg: TemplateRef<any>;

    selectedHoidong: HoidongThamdinh;

    list_thanhvien: HoidongThamdinhThanhvien[];

    searchName: string;

    listGiangvien: ElngUserProfile[];

    searchUser: string;

    selectedThanhviens: ElngUserProfile[];

    progressValue: number = 0;

    displayModal: boolean = false;

    waitting_title: string;

    selectedlist: HoidongThamdinhThanhvien[];

    isManager: boolean = false;

    isLanhdaokhoa: boolean = false;

    constructor(
        private activatedRoute: ActivatedRoute,
        private hoidongThamdinhService: HoidongThamdinhService,
        private hoidongThamdinhThanhvienService: HoidongThamdinhThanhvienService,
        private notificationService: NotificationService,
        private httpHepler: HttpParamsHeplerService,
        private userService: UserService,
        private elngUserProfileService: ElngUserProfileService,
        private router: Router,
        private auth: AuthService
    ) {

        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.hoidongthi_lanhdao) || this.auth.userHasRole(ROLES.chuyenvien_pdt) ? true : false;

        this.isLanhdaokhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
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
                            if (!this.isManager && this.isLanhdaokhoa) {
                                if (!_user.data[0] || this.selectedHoidong.category_id !== _user.data[0].donvi_chuyenmon_id) {
                                    this.router.navigate(['/admin/content-none']);
                                }
                            }
                        }

                        this.loadThanhvien();
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

    loadThanhvien() {
        this.notificationService.isProcessing(true);
        const condition_thanhvien: ConditionOption = {
            condition: [
                { conditionName: "hoidong_thamdinh_id", condition: OvicQueryCondition.equal, value: this.selectedHoidong.id.toString() }
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null
        }

        this.hoidongThamdinhThanhvienService.getHoidongThamdinhThanhvienByPageNew(condition_thanhvien).subscribe({
            next: (_thanhvien) => {
                _thanhvien.data.forEach(f => {
                    if (f.user) {
                        f['display_name'] = f.user.display_name;
                        f['email'] = f.user.email;
                    }
                })
                this.list_thanhvien = _thanhvien.data;
                this.notificationService.isProcessing(false);
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    loadGiangVien() {
        this.notificationService.isProcessing(true);

        this.selectedThanhviens = null;

        const condition_user: ConditionOption = {
            condition: [
                { conditionName: 'teacher', condition: OvicQueryCondition.equal, value: '1', orWhere: 'and' },
            ],
            set: [
                { label: 'limit', value: '-1' },
                { label: 'with', value: 'user' }
            ],
            page: null
        }

        const ids = this.list_thanhvien.map(m => m.user_id);

        if (ids.length) {
            condition_user.set.push(
                { label: 'exclude', value: ids.toString() },
                { label: 'exclude_by', value: 'user_id' }
            )
        }

        this.elngUserProfileService.getUserProfileByPageNewV2(condition_user).subscribe({
            next: (_user) => {
                _user.data.forEach(f => {
                    if (f.user) {
                        f['display_name'] = f.user.display_name;
                        f['email'] = f.user.email;
                    }
                })
                this.listGiangvien = _user.data.filter(m => m.user);
                this.notificationService.isProcessing(false);
                this.notificationService.openSideNavigationMenu({ template: this.templatePmsCttdg, size: 600, offsetTop: '0px' })
            },
            error: () => {
                this.notificationService.isProcessing(false);
            }
        })
    }

    savePmsGiangVien() {
        this.waitting_title = "Đang thêm thành viên, vui lòng không tắt trình duyệt";
        const request: Observable<any>[] = [];

        this.selectedThanhviens.forEach(f => {
            const data = {
                user_id: f.user_id,
                hoidong_thamdinh_id: this.selectedHoidong.id,
            }

            request.push(this.hoidongThamdinhThanhvienService.addHoidongThamdinhThanhvien(data))
        })

        if (request.length) {
            this.progressValue = 0;
            this.displayModal = true;
            this.loopAddForm(request, 0).subscribe({
                next: () => {
                    this.displayModal = false;
                    this.notificationService.toastSuccess("Thêm thành công");
                    this.closeForm();
                    this.loadThanhvien();
                },
                error: () => {
                    this.displayModal = false;
                    this.notificationService.toastError("Thêm thất bại, vui lòng thử lại")
                }
            })
        }
    }

    closeForm() {
        this.notificationService.closeSideNavigationMenu();
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


    deleteItem(item: HoidongThamdinhThanhvien) {
        this.notificationService.confirmDelete().then(a => {
            if (a) {
                this.notificationService.isProcessing(true);
                this.hoidongThamdinhThanhvienService.deleteHoidongThamdinhThanhvien(item.id).subscribe({
                    next: () => {
                        this.loadThanhvien();
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

    deleteSelectItem() {
        if (this.selectedlist && this.selectedlist.length) {
            this.notificationService.confirmDelete().then(a => {
                if (a) {
                    this.notificationService.isProcessing(true);
                    const ids = this.selectedlist.map(m => m.id);
                    this.hoidongThamdinhThanhvienService.deleteHoidongThamdinhThanhvien(ids).subscribe({
                        next: () => {
                            this.loadThanhvien();

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
            this.notificationService.toastWarning("Vui lòng chọn thành viên");
        }
    }

    onSelectThanhVien(event: MatSelectionListChange) {
        this.selectedThanhviens = this.listGiangvien.filter(m => m['check']);
    }
}
