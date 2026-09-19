import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-cauhoi-ketthuc-hocphan',
    templateUrl: './cauhoi-ketthuc-hocphan.component.html',
    styleUrls: ['./cauhoi-ketthuc-hocphan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CauhoiKetthucHocphanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



