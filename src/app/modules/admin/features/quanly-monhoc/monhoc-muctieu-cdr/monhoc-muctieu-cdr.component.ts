import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-monhoc-muctieu-cdr',
    templateUrl: './monhoc-muctieu-cdr.component.html',
    styleUrls: ['./monhoc-muctieu-cdr.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class MonhocMuctieuCdrComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



