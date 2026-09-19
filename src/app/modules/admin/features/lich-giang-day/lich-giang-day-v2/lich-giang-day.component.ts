import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-lich-giang-day',
    templateUrl: './lich-giang-day.component.html',
    styleUrls: ['./lich-giang-day.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class LichGiangDayComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



