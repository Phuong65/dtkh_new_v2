import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-duyet-baigiang',
    templateUrl: './duyet-baigiang.component.html',
    styleUrls: ['./duyet-baigiang.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DuyetBaigiangComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



