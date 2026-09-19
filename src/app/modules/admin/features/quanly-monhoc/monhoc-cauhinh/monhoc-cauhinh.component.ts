import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-monhoc-cauhinh',
    templateUrl: './monhoc-cauhinh.component.html',
    styleUrls: ['./monhoc-cauhinh.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class MonhocCauhinhComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



