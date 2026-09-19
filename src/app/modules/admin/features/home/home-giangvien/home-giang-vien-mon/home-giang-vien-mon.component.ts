import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-giang-vien-mon',
    templateUrl: './home-giang-vien-mon.component.html',
    styleUrls: ['./home-giang-vien-mon.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeGiangVienMonComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



