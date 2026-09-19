import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-kt-vipham',
    templateUrl: './kt-vipham.component.html',
    styleUrls: ['./kt-vipham.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KtViphamComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



