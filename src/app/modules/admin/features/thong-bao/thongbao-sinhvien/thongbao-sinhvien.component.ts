import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thongbao-sinhvien',
    templateUrl: './thongbao-sinhvien.component.html',
    styleUrls: ['./thongbao-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongbaoSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



