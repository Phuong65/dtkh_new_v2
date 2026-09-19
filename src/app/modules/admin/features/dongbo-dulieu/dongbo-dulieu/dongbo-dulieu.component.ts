import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-dongbo-dulieu',
    templateUrl: './dongbo-dulieu.component.html',
    styleUrls: ['./dongbo-dulieu.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DongboDulieuComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



