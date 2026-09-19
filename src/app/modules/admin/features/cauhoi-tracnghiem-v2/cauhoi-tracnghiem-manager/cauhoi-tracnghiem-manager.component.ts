import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-cauhoi-tracnghiem-manager',
    templateUrl: './cauhoi-tracnghiem-manager.component.html',
    styleUrls: ['./cauhoi-tracnghiem-manager.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CauhoiTracnghiemManagerComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



