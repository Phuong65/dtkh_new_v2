import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-sinhvien-main',
    templateUrl: './import-sinhvien-main.component.html',
    styleUrls: ['./import-sinhvien-main.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportSinhvienMainComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



