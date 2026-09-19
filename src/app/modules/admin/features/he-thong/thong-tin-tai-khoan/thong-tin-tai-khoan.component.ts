import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thong-tin-tai-khoan',
    templateUrl: './thong-tin-tai-khoan.component.html',
    styleUrls: ['./thong-tin-tai-khoan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongTinTaiKhoanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



