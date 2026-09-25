import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-danhsach-monhoc',
    templateUrl: './danhsach-monhoc.component.html',
    styleUrls: ['./danhsach-monhoc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DanhsachMonhocComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



