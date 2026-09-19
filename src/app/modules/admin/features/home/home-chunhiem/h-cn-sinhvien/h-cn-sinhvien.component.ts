import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-h-cn-sinhvien',
    templateUrl: './h-cn-sinhvien.component.html',
    styleUrls: ['./h-cn-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HCnSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



