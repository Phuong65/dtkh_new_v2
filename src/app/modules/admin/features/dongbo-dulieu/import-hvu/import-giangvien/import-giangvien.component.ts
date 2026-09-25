import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-giangvien',
    templateUrl: './import-giangvien.component.html',
    styleUrls: ['./import-giangvien.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportGiangvienComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



