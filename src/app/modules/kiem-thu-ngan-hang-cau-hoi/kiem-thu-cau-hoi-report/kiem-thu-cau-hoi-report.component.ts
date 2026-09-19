import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'kiem-thu-cau-hoi-report',
    templateUrl: './kiem-thu-cau-hoi-report.component.html',
    styleUrls: ['./kiem-thu-cau-hoi-report.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KiemThuCauHoiReportComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



