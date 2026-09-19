import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-diemdanh-lophoc-v2',
    templateUrl: './diemdanh-lophoc-v2.component.html',
    styleUrls: ['./diemdanh-lophoc-v2.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DiemdanhLophocV2Component implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



