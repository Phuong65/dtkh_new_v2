import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ds-cauhoi-tracnghiem',
    templateUrl: './ds-cauhoi-tracnghiem.component.html',
    styleUrls: ['./ds-cauhoi-tracnghiem.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DsCauhoiTracnghiemComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



