import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-sinhvien',
    templateUrl: './sinhvien.component.html',
    styleUrls: ['./sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



