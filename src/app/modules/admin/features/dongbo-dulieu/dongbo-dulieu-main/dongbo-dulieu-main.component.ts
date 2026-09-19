import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-dongbo-dulieu-main',
    templateUrl: './dongbo-dulieu-main.component.html',
    styleUrls: ['./dongbo-dulieu-main.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DongboDulieuMainComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



