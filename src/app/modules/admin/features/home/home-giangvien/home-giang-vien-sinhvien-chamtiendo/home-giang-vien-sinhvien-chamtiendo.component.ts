import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-giang-vien-sinhvien-chamtiendo',
    templateUrl: './home-giang-vien-sinhvien-chamtiendo.component.html',
    styleUrls: ['./home-giang-vien-sinhvien-chamtiendo.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeGiangVienSinhvienChamtiendoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



