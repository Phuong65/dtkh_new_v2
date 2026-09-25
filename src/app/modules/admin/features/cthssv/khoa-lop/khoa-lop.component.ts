import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-khoa-lop',
    templateUrl: './khoa-lop.component.html',
    styleUrls: ['./khoa-lop.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KhoaLopComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



