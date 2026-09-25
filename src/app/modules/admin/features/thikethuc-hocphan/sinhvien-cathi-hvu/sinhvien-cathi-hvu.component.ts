import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-sinhvien-cathi-hvu',
    templateUrl: './sinhvien-cathi-hvu.component.html',
    styleUrls: ['./sinhvien-cathi-hvu.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SinhvienCathiHvuComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



