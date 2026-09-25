import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-import-hvu-main',
    templateUrl: './import-hvu-main.component.html',
    styleUrls: ['./import-hvu-main.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ImportHvuMainComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



