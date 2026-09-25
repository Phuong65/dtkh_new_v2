import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-sinhvien-lophoc',
    templateUrl: './import-sinhvien-lophoc.component.html',
    styleUrls: ['./import-sinhvien-lophoc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportSinhvienLophocComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



