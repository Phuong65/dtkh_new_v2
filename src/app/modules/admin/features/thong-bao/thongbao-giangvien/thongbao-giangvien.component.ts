import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thongbao-giangvien',
    templateUrl: './thongbao-giangvien.component.html',
    styleUrls: ['./thongbao-giangvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongbaoGiangvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



