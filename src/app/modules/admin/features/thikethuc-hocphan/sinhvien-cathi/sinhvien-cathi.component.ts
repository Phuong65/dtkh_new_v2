import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-sinhvien-cathi',
    templateUrl: './sinhvien-cathi.component.html',
    styleUrls: ['./sinhvien-cathi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SinhvienCathiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



