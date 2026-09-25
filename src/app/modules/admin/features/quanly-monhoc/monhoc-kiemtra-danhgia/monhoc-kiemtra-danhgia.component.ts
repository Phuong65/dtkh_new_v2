import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-monhoc-kiemtra-danhgia',
    templateUrl: './monhoc-kiemtra-danhgia.component.html',
    styleUrls: ['./monhoc-kiemtra-danhgia.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class MonhocKiemtraDanhgiaComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



