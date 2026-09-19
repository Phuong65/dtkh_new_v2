import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-gop-y-thong-ke',
    templateUrl: './gop-y-thong-ke.component.html',
    styleUrls: ['./gop-y-thong-ke.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class GopYThongKeComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



