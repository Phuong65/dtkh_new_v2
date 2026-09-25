import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-sinhvien-theodoi',
    templateUrl: './sinhvien-theodoi.component.html',
    styleUrls: ['./sinhvien-theodoi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SinhvienTheodoiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



