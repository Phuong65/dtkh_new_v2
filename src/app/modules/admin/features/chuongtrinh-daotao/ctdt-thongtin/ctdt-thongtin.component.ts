import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ctdt-thongtin',
    templateUrl: './ctdt-thongtin.component.html',
    styleUrls: ['./ctdt-thongtin.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CtdtThongtinComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



