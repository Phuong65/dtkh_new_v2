import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-xuat-baithi',
    templateUrl: './xuat-baithi.component.html',
    styleUrls: ['./xuat-baithi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class XuatBaithiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



