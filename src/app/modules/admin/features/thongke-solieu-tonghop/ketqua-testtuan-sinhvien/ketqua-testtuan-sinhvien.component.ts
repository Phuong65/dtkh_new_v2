import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ketqua-testtuan-sinhvien',
    templateUrl: './ketqua-testtuan-sinhvien.component.html',
    styleUrls: ['./ketqua-testtuan-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KetquaTesttuanSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



