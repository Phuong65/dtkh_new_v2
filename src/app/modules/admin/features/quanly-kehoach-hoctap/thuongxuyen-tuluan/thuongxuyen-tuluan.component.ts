import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thuongxuyen-tuluan',
    templateUrl: './thuongxuyen-tuluan.component.html',
    styleUrls: ['./thuongxuyen-tuluan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThuongxuyenTuluanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



