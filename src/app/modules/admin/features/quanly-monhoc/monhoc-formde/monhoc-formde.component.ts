import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-monhoc-formde',
    templateUrl: './monhoc-formde.component.html',
    styleUrls: ['./monhoc-formde.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class MonhocFormdeComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



