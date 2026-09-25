import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-diemdanh-lophoc',
    templateUrl: './diemdanh-lophoc.component.html',
    styleUrls: ['./diemdanh-lophoc.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DiemdanhLophocComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



