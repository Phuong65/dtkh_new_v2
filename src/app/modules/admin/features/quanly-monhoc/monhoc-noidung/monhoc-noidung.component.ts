import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-monhoc-noidung',
    templateUrl: './monhoc-noidung.component.html',
    styleUrls: ['./monhoc-noidung.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class MonhocNoidungComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



