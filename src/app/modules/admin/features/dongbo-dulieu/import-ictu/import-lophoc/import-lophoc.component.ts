import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-lophoc',
    templateUrl: './import-lophoc.component.html',
    styleUrls: ['./import-lophoc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportLophocComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



