import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-diemdanh-lophoc-mer',
    templateUrl: './diemdanh-lophoc-mer.component.html',
    styleUrls: ['./diemdanh-lophoc-mer.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DiemdanhLophocMerComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



