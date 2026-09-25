import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-hoc-vien',
    templateUrl: './hoc-vien.component.html',
    styleUrls: ['./hoc-vien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HocVienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



