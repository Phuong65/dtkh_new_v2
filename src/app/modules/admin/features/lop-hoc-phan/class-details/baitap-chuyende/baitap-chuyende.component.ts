import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-baitap-chuyende',
    templateUrl: './baitap-chuyende.component.html',
    styleUrls: ['./baitap-chuyende.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class BaitapChuyendeComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



