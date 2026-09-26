import {Component, OnInit,} from '@angular/core';

import { CommonModule } from '@angular/common';

import {key_server} from "@env";
import {
    KetquaNghiemthuCauhoiHvuComponent
} from "@modules/admin/features/thongke-solieu-tonghop/ketqua-test-nghiemthu-cauhoi/ketqua-nghiemthu-cauhoi-hvu/ketqua-nghiemthu-cauhoi-hvu.component";
import {
    KetquaNghiemthuCauhoiLmsComponent
} from "@modules/admin/features/thongke-solieu-tonghop/ketqua-test-nghiemthu-cauhoi/ketqua-nghiemthu-cauhoi-lms/ketqua-nghiemthu-cauhoi-lms.component";

@Component({
    standalone: true,
    imports: [CommonModule, KetquaNghiemthuCauhoiHvuComponent, KetquaNghiemthuCauhoiLmsComponent],
    selector: 'app-ketqua-test-nghiemthu-cauhoi',
    templateUrl: './ketqua-test-nghiemthu-cauhoi.component.html',
    styleUrls: ['./ketqua-test-nghiemthu-cauhoi.component.css']
})
export class KetquaTestNghiemthuCauhoiComponent implements OnInit {


    keyServer= key_server;


    ngOnInit() {
    }


}
