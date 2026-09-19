import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-them-sinhvien',
    templateUrl: './them-sinhvien.component.html',
    styleUrls: ['./them-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThemSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



