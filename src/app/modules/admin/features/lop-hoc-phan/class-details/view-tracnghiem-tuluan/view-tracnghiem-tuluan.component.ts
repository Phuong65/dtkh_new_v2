import { Component, OnChanges , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-view-tracnghiem-tuluan',
    templateUrl: './view-tracnghiem-tuluan.component.html',
    styleUrls: ['./view-tracnghiem-tuluan.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ViewTracnghiemTuluanComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



