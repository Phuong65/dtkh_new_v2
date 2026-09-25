import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-sinhvien-cathi-duan',
    templateUrl: './sinhvien-cathi-duan.component.html',
    styleUrls: ['./sinhvien-cathi-duan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SinhvienCathiDuanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



