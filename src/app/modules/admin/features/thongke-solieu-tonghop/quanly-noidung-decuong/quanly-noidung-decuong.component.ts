import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quanly-noidung-decuong',
    templateUrl: './quanly-noidung-decuong.component.html',
    styleUrls: ['./quanly-noidung-decuong.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanlyNoidungDecuongComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



