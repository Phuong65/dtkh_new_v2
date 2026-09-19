import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-giangvien',
    templateUrl: './home-giangvien.component.html',
    styleUrls: ['./home-giangvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeGiangvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



