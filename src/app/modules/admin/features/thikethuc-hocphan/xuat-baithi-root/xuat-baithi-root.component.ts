import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-xuat-baithi-root',
    templateUrl: './xuat-baithi-root.component.html',
    styleUrls: ['./xuat-baithi-root.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class XuatBaithiRootComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



