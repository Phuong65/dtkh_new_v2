import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thu-den',
    templateUrl: './thu-den.component.html',
    styleUrls: ['./thu-den.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThuDenComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



