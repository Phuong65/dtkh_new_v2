import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-giang-vien-sinhvien-vang',
    templateUrl: './home-giang-vien-sinhvien-vang.component.html',
    styleUrls: ['./home-giang-vien-sinhvien-vang.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeGiangVienSinhvienVangComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



