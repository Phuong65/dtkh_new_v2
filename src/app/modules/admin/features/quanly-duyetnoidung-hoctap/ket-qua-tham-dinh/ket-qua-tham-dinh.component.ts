import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'ket-qua-tham-dinh',
    templateUrl: './ket-qua-tham-dinh.component.html',
    styleUrls: ['./ket-qua-tham-dinh.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class KetQuaThamDinhComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



