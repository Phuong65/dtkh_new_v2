import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-giang-vien-sinhvien',
    templateUrl: './home-giang-vien-sinhvien.component.html',
    styleUrls: ['./home-giang-vien-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeGiangVienSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



