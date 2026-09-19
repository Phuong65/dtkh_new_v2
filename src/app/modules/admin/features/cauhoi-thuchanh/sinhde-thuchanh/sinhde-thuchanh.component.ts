import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-sinhde-thuchanh',
    templateUrl: './sinhde-thuchanh.component.html',
    styleUrls: ['./sinhde-thuchanh.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SinhdeThuchanhComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



