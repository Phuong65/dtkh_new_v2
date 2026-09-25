import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ketqua-duyet-all',
    templateUrl: './ketqua-duyet-all.component.html',
    styleUrls: ['./ketqua-duyet-all.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KetquaDuyetAllComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



