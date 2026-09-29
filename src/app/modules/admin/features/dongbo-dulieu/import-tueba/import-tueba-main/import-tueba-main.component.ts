import { NotificationService } from '@core/services/notification.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ImportMonhocComponent } from "../import-monhoc/import-monhoc.component";
import { ImportGiangvienComponent } from "../import-giangvien/import-giangvien.component";
import { ImportSinhvienComponent } from "../import-sinhvien/import-sinhvien.component";
import { ImportLophocComponent } from "../import-lophoc/import-lophoc.component";
import { ImportLichhocComponent } from "../import-lichhoc/import-lichhoc.component";

@Component({
    selector: 'app-import-tueba-main',
    standalone: true,
    imports: [CommonModule, CommonModule, RouterModule, ImportMonhocComponent, ImportGiangvienComponent, ImportSinhvienComponent, ImportLophocComponent, ImportLichhocComponent],
    templateUrl: './import-tueba-main.component.html',
    styleUrls: ['./import-tueba-main.component.css']
})
export class ImportTuebaMainComponent implements OnInit {

    list_import_function = [
        { label: "Sinh viên", icon: '<i class="fa-solid fa-graduation-cap"></i>', key: "sinh-vien" },
        { label: "Giảng viên", icon: '<i class="fa-solid fa-chalkboard-user"></i>', key: "giang-vien" },
        { label: "Môn học", icon: '<i class="fa-solid fa-book"></i>', key: "mon-hoc" },
        { label: "Lớp học", icon: '<i class="fa-solid fa-school"></i>', key: "lop-hoc" },
        { label: "Lịch học", icon: '<i class="fa-solid fa-calendar-days"></i>', key: "lich-hoc" }
    ]

    keyImport: string = null;
    constructor(
        private activatedRoute: ActivatedRoute,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
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
