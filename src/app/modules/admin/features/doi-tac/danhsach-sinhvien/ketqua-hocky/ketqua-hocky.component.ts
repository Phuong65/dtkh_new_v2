import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ketqua-hocky',
    templateUrl: './ketqua-hocky.component.html',
    styleUrls: ['./ketqua-hocky.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KetquaHockyComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



