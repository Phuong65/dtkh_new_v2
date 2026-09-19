import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ketqua-thi',
    templateUrl: './ketqua-thi.component.html',
    styleUrls: ['./ketqua-thi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KetquaThiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



