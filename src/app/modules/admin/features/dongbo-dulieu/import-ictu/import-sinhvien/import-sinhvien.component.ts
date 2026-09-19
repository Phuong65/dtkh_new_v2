import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-sinhvien-ictu',
    templateUrl: './import-sinhvien.component.html',
    styleUrls: ['./import-sinhvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportSinhvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



