import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quan-ly-tai-khoan',
    templateUrl: './quan-ly-tai-khoan.component.html',
    styleUrls: ['./quan-ly-tai-khoan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuanLyTaiKhoanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



