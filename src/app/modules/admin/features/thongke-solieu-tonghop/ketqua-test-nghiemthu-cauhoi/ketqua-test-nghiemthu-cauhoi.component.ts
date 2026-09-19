import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ketqua-test-nghiemthu-cauhoi',
    templateUrl: './ketqua-test-nghiemthu-cauhoi.component.html',
    styleUrls: ['./ketqua-test-nghiemthu-cauhoi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KetquaTestNghiemthuCauhoiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



