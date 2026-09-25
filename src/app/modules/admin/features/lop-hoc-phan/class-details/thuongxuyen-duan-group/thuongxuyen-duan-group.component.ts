import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thuongxuyen-duan-group',
    templateUrl: './thuongxuyen-duan-group.component.html',
    styleUrls: ['./thuongxuyen-duan-group.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThuongxuyenDuanGroupComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



