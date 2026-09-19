import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-tueba-main',
    templateUrl: './import-tueba-main.component.html',
    styleUrls: ['./import-tueba-main.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportTuebaMainComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



