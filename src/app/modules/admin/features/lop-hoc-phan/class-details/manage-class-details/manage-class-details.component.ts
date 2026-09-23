import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { OvicQueryCondition } from '@core/models/dto';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { Classes } from '@modules/shared/models/classes';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { ElnKhoaHoc } from '@modules/shared/models/elng-khoa-hoc';
import { ClassesService } from '@modules/shared/services/classes.service';
import { ElnKhoaHocService } from '@modules/shared/services/elearning-khoa-hoc.service';
import { ElngUserProfileService } from '@modules/shared/services/elearning-user-profile.service';
import { SharedModule } from '@modules/shared/shared.module';
import { ROLES, settingOwnClass_1 } from '@modules/shared/utils/syscat';
import { forkJoin } from 'rxjs';
import { ThongTinCoBanComponent } from '../thong-tin-co-ban/thong-tin-co-ban.component';
import { ThongtinGiangvienkhacComponent } from '../thongtin-giangvienkhac/thongtin-giangvienkhac.component';
import { KiemtraKynangComponent } from '../kiemtra-kynang/kiemtra-kynang.component';
import { ClassNoidungGiangdayV2Component } from '../class-noidung-giangday-v2/class-noidung-giangday-v2.component';
import { TheodoiTiendoComponent } from '../theodoi-tiendo/theodoi-tiendo.component';
import { ThongKeDiemThuongXuyenComponent } from '../thong-ke-diem-thuong-xuyen/thong-ke-diem-thuong-xuyen.component';
import { DiemdanhLophocComponent } from '../diemdanh-lophoc/diemdanh-lophoc.component';
import { HoiDapComponent } from '../hoi-dap/hoi-dap.component';
import { ClassGroupComponent } from '../class-group/class-group.component';
import { KiemtraDaugioComponent } from '../kiemtra-daugio/kiemtra-daugio.component';
import { SinhvienHvuComponent } from '../sinh-vien/sinhvien-hvu/sinhvien-hvu.component';
import { SinhvienComponent } from '../sinh-vien/sinhvien/sinhvien.component';
import { key_server } from '@env';
import {
    DiemdanhLophocV2Component
} from "@modules/admin/features/lop-hoc-phan/class-details/diemdanh-lophoc-v2/diemdanh-lophoc-v2.component";
import { DiemdanhLophocMerComponent } from '../diemdanh-lophoc-mer/diemdanh-lophoc-mer.component';
import {
    ThongKeDiemthuongxuyenHvuComponent
} from "@modules/admin/features/lop-hoc-phan/class-details/thong-ke-diemthuongxuyen-hvu/thong-ke-diemthuongxuyen-hvu.component";
import { ThaoLuanComponent } from "../thao-luan/thao-luan.component";
import { ThongkeDiemthuongxuyenTuebaDttxComponent } from "../thongke-diemthuongxuyen-tueba-dttx/thongke-diemthuongxuyen-tueba-dttx.component";
import { ThongkeDiemthuongxuyenDttxIctuComponent } from "../thongke-diemthuongxuyen-dttx-ictu/thongke-diemthuongxuyen-dttx-ictu.component";

@Component({
    standalone: true,
    imports: [
    CommonModule,
    SharedModule,
    MatListModule,
    ThongTinCoBanComponent,
    ThongtinGiangvienkhacComponent,
    SinhvienHvuComponent,
    SinhvienComponent,
    KiemtraKynangComponent,
    ClassNoidungGiangdayV2Component,
    TheodoiTiendoComponent,
    ThongKeDiemThuongXuyenComponent,
    DiemdanhLophocComponent,
    HoiDapComponent,
    ClassGroupComponent,
    KiemtraDaugioComponent,
    DiemdanhLophocV2Component,
    DiemdanhLophocMerComponent,
    ThongKeDiemthuongxuyenHvuComponent,
    ThaoLuanComponent,
    ThongkeDiemthuongxuyenTuebaDttxComponent,
    ThongkeDiemthuongxuyenDttxIctuComponent
],
    selector: 'app-manage-class-details',
    templateUrl: './manage-class-details.component.html',
    styleUrls: ['./manage-class-details.component.css'],
})
export class ManageClassDetailsComponent implements OnInit {
    selectedClass: Classes;

    canEditGiangvien = false;

    selectedCourse: ElnKhoaHoc;

    class_id: number;

    userId: number;

    isManager: boolean = false;

    isLanhDaoKhoa: boolean = false;

    donviId: number;

    keyServer = key_server;

    settingOwnClass_1 = this.keyServer == 'hvu' ? settingOwnClass_1.filter(f => f.id !== 'kiemtra-daugio') : settingOwnClass_1;

    closeLeft: boolean = false;

    selectedMenu = {
        label: 'Thông tin lớp học',
        icon: 'fa fa-angle-right',
        id: 'thong-tin-lop-hoc',
        buttonAddLabel: '',
        buttonIcon: 'pi pi-plus-circle',
    };

    key_server = key_server;
    constructor(
        private noitifi: NotificationService,
        private activatedRoute: ActivatedRoute,
        private classesService: ClassesService,
        private auth: AuthService,
        private router: Router,
        private elnKhoaHocService: ElnKhoaHocService,
        private elngUserProfileService: ElngUserProfileService
    ) {
        this.isManager = this.auth.userHasRole(ROLES.manager) || this.auth.userHasRole(ROLES.admin) || this.auth.userHasRole(ROLES.troly_pdt) || this.auth.userHasRole(ROLES.chuyenvien_pdt) || this.auth.userHasRole(ROLES.daotao_cv_1) ? true : false;
        this.isLanhDaoKhoa = this.auth.userHasRole(ROLES.lanhdaokhoa);
        this.donviId = this.auth.user.donvi_id;
        this.userId = this.auth.user.id;
    }

    ngOnInit(): void {
        this.initMyClass();
    }

    initMyClass() {
        this.noitifi.isProcessing(true);
        this.noitifi.setCloseLeftMenu(true);
        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                const class_id = params['code'];
                this.class_id = class_id;
                const condition_class: ConditionOption = {
                    condition: [
                        {
                            conditionName: 'id',
                            condition: OvicQueryCondition.equal,
                            value: class_id.toString(),
                        },
                    ],
                    set: [],
                    page: null,
                };

                if (!this.isManager && !this.isLanhDaoKhoa) {
                    condition_class.condition.push({
                        conditionName: 'manager_ids',
                        condition: OvicQueryCondition.like,
                        value: '%|' + this.userId.toString() + '|%',
                        orWhere: 'and',
                    });
                } else {
                    this.canEditGiangvien = true;
                }

                this.classesService.getClassesByPageNew(condition_class).subscribe({
                    next: (cl) => {
                        this.noitifi.isProcessing(false);
                        if (cl.data.length) {
                            this.selectedClass = cl.data[0];
                            this.auth.setFeatureSecondary(this.selectedClass.name);
                            if (this.selectedClass.manager_info) {
                                const giangvien_ar = this.selectedClass.manager_info.split('*');
                                this.selectedClass['giangvien'] = giangvien_ar[0].trim();
                                this.selectedClass['trogiang'] = giangvien_ar[1] ? giangvien_ar[1].trim().replace(',', '').replace(/,/g, ', ') : '--';
                            } else {
                                this.selectedClass['giangvien'] = '--';
                                this.selectedClass['trogiang'] = '--';
                            }

                            if (this.selectedClass.manager_ids) {
                                const manager = this.selectedClass.manager_ids.split('|').filter((m) => m && m !== '');
                                if (manager[0].toString() === this.userId.toString()) {
                                    this.canEditGiangvien = true;
                                }

                                if (manager.length > 0) {
                                    this.selectedClass['manager_id'] = manager[0];
                                    manager.splice(0, 1);
                                    this.selectedClass['supporter_ids'] = manager;
                                }
                            }
                            if (this.selectedClass.course_id) {
                                forkJoin([
                                    this.elnKhoaHocService.getElnKhoaHocByItem(this.selectedClass.course_id.toString(), 'id'),
                                    // this.elngUserProfileService.getElngUserProfileByCol('user_id', this.userId.toString())
                                ]).subscribe({
                                    next: ([_course]) => {
                                        this.noitifi.isProcessing(false);
                                        if (_course.length) {
                                            this.selectedClass['course_detail'] = _course[0];
                                            this.selectedClass['show_mon'] = _course[0].title;
                                        }
                                    },
                                    error: () => {
                                        this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                                        this.noitifi.isProcessing(false);
                                    },
                                });
                            }
                        } else {
                            this.noitifi.toastError('Không tìm thấy lớp học phần này');
                            this.noitifi.isProcessing(false);
                            this.router.navigate(['/admin/lop-hoc-phan']);
                        }
                    },
                    error: (er) => {
                        this.noitifi.toastError('Lỗi kết nối, vui lòng thử lại');
                        this.noitifi.isProcessing(false);
                        this.router.navigate(['/admin/lop-hoc-phan']);
                    },
                });
            } else {
                this.noitifi.isProcessing(false);
                this.router.navigate(['/admin/lop-hoc-phan']);
            }
        });
    }

    closeLeftBody() {
        this.closeLeft = !this.closeLeft;
    }

    onSelectedMenu(event: MatSelectionListChange) {
        this.selectedMenu = event.options[0].value;
    }


}
