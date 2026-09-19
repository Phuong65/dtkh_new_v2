import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-phan-sinhvien',
    templateUrl: './phan-sinhvien.component.html',
    styleUrls: ['./phan-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class PhanSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



