import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-ictu-main',
    templateUrl: './import-ictu-main.component.html',
    styleUrls: ['./import-ictu-main.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportIctuMainComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



