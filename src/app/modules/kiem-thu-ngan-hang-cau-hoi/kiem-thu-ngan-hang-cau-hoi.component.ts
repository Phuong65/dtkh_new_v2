import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-kiem-thu-ngan-hang-cau-hoi',
    templateUrl: './kiem-thu-ngan-hang-cau-hoi.component.html',
    styleUrls: ['./kiem-thu-ngan-hang-cau-hoi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export default class KiemThuNganHangCauHoiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



