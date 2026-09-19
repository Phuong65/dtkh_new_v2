import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-lop-quanly',
    templateUrl: './lop-quanly.component.html',
    styleUrls: ['./lop-quanly.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class LopQuanlyComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



