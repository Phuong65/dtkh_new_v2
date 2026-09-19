import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-formde-tracnghiem',
    templateUrl: './formde-tracnghiem.component.html',
    styleUrls: ['./formde-tracnghiem.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class FormdeTracnghiemComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



