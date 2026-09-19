import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thong-bao',
    templateUrl: './thong-bao.component.html',
    styleUrls: ['./thong-bao.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThongBaoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



