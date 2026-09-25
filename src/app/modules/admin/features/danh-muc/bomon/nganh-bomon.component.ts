import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-nganh-bomon',
    templateUrl: './nganh-bomon.component.html',
    styleUrls: ['./nganh-bomon.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class NganhBomonComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



