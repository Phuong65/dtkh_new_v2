import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-danhsach-gvcn',
    templateUrl: './danhsach-gvcn.component.html',
    styleUrls: ['./danhsach-gvcn.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DanhsachGvcnComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



