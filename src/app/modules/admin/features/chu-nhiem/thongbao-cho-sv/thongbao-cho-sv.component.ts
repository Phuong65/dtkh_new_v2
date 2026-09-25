import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thongbao-cho-sv',
    templateUrl: './thongbao-cho-sv.component.html',
    styleUrls: ['./thongbao-cho-sv.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongbaoChoSvComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



