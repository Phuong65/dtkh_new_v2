import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportSinhvienComponent as ImportSinhvienComponentHvu } from '../import-hvu/import-sinhvien/import-sinhvien.component';
import { ImportSinhvienComponent as ImportSinhvienComponentIctu } from '../import-ictu/import-sinhvien/import-sinhvien.component';
import { key_server } from '@env';

@Component({
    selector: 'app-import-sinhvien-main',
    standalone: true,
    imports: [
        CommonModule,
        ImportSinhvienComponentHvu,
        ImportSinhvienComponentIctu
    ],
    templateUrl: './import-sinhvien-main.component.html',
    styleUrls: ['./import-sinhvien-main.component.css']
})
export class ImportSinhvienMainComponent implements OnInit {

    key_server = key_server;

    constructor() { }

    ngOnInit(): void {
    }

}
