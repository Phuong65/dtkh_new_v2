import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-diemdanh-sinhvien',
    templateUrl: './diemdanh-sinhvien.component.html',
    styleUrls: ['./diemdanh-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DiemdanhSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



