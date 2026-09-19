import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-sinhvien-hvu',
    templateUrl: './sinhvien-hvu.component.html',
    styleUrls: ['./sinhvien-hvu.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SinhvienHvuComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



