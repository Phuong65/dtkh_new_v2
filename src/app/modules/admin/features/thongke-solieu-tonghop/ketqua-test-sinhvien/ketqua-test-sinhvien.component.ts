import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ketqua-test-sinhvien',
    templateUrl: './ketqua-test-sinhvien.component.html',
    styleUrls: ['./ketqua-test-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KetquaTestSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



