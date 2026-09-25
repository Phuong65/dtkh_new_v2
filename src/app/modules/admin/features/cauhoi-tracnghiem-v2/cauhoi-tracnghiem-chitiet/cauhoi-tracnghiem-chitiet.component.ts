import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-cauhoi-tracnghiem-chitiet',
    templateUrl: './cauhoi-tracnghiem-chitiet.component.html',
    styleUrls: ['./cauhoi-tracnghiem-chitiet.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CauhoiTracnghiemChitietComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



