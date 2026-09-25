import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-monhoc',
    templateUrl: './import-monhoc.component.html',
    styleUrls: ['./import-monhoc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportMonhocComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



