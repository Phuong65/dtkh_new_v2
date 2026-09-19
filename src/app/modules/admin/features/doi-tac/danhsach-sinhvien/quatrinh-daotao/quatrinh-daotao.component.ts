import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-quatrinh-daotao',
    templateUrl: './quatrinh-daotao.component.html',
    styleUrls: ['./quatrinh-daotao.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuatrinhDaotaoComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



