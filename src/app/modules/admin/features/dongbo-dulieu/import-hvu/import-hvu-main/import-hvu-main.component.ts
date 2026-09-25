import { HvuApiDanhsachSinhvienTheoLopService } from './../../../../../shared/services/hvu-api-danhsach-sinhvien-theolop.service';
import { HvuApiDanhsachdiemdanhService } from './../../../../../shared/services/hvu-api-danhsachdiemdanh.service';
import { HvuApiDanhsachlichgiangdayService } from './../../../../../shared/services/hvu-api-danhsachlichgiangday.service';
import { HvuApiDanhsachlophocphanService } from './../../../../../shared/services/hvu-api-danhsachlophocphan.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ImportMonhocComponent } from '../import-monhoc/import-monhoc.component';
import { ImportSinhvienComponent } from '../import-sinhvien/import-sinhvien.component';
import { ImportGiangvienComponent } from '../import-giangvien/import-giangvien.component';
import { ImportLophocComponent } from '../import-lophoc/import-lophoc.component';
import { ImportLichhocComponent } from '../import-lichhoc/import-lichhoc.component';
import { ImportSinhvienLophocComponent } from '../import-sinhvien-lophoc/import-sinhvien-lophoc.component';

@Component({
    selector: 'app-import-hvu-main',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ImportMonhocComponent,
        ImportSinhvienComponent,
        ImportGiangvienComponent,
        ImportLophocComponent,
        ImportLichhocComponent,
        ImportSinhvienLophocComponent
    ],
    templateUrl: './import-hvu-main.component.html',
    styleUrls: ['./import-hvu-main.component.css']
})
export class ImportHvuMainComponent implements OnInit {

    list_import_function = [
        { label: "Sinh viên", icon: '<i class="fa-solid fa-graduation-cap"></i>', key: "sinh-vien" },
        { label: "Giảng viên", icon: '<i class="fa-solid fa-chalkboard-user"></i>', key: "giang-vien" },
        { label: "Môn học", icon: '<i class="fa-solid fa-book"></i>', key: "mon-hoc" },
        { label: "Lớp học", icon: '<i class="fa-solid fa-school"></i>', key: "lop-hoc" },
        { label: "Sinh viên vào lớp học phần", icon: '<i class="fa-solid fa-users-rectangle"></i>', key: "sinh-vien-lop-hoc" },
        { label: "Lịch học", icon: '<i class="fa-solid fa-calendar-days"></i>', key: "lich-hoc" }
    ]

    keyImport: string = null;

    constructor(
        private activatedRoute: ActivatedRoute,
        private hvuApiDanhsachlophocphanService: HvuApiDanhsachlophocphanService,
        private hvuApiDanhsachlichgiangdayService: HvuApiDanhsachlichgiangdayService,
        private hvuApiDanhsachdiemdanhService: HvuApiDanhsachdiemdanhService,
        private hvuApiDanhsachSinhvienTheoLopService: HvuApiDanhsachSinhvienTheoLopService
    ) { }

    ngOnInit(): void {
        // this.hvuApiDanhsachlophocphanService.getHvuApiDanhsachlophocphanBybody({ nhhk: 20251, nien_khoa: "2022-2026" }).subscribe({
        //     next: (_res) => {
        //         console.log(_res.filter(m=>m.lopth === "Thực hành"));
        //     },
        //     error: () => {

        //     }
        // })

        //-4692038092381457598

        // this.hvuApiDanhsachlichgiangdayService.getHvuApiDanhsachlichgiangdayBybody({ nhhk: 20251 }).subscribe({
        //     next: (_res) => {
        //         console.log(_res);
        //     },
        //     error: () => {

        //     }
        // })

        // this.hvuApiDanhsachdiemdanhService.getHvuApiDanhsachdiemdanhBybody({ nhhk: 20251, ma_mon_hoc: 'BAD258', nhom_to: '02' }).subscribe({
        //     next: (_res) => {
        //         console.log(_res);
        //     },
        //     error: () => {

        //     }
        // })

        // this.hvuApiDanhsachSinhvienTheoLopService.getHvuApiDanhsachSinhvienTheoLopBybody({ id_lop: -6572339608245100562 }).subscribe({
        //     next: (_res) => {
        //         console.log(_res);
        //     },
        //     error: () => {

        //     }
        // })


        this.activatedRoute.queryParams.subscribe((params) => {
            if (params && params['code']) {
                this.keyImport = params['code'];
            } else {
                this.keyImport = null;
            }
        })


    }

    iniData() {

    }

}
