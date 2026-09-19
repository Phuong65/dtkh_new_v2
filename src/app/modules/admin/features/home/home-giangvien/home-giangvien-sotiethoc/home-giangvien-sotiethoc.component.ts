import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-giangvien-sotiethoc',
    templateUrl: './home-giangvien-sotiethoc.component.html',
    styleUrls: ['./home-giangvien-sotiethoc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeGiangvienSotiethocComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



