import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-gop-y-all',
    templateUrl: './gop-y-all.component.html',
    styleUrls: ['./gop-y-all.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class GopYAllComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



