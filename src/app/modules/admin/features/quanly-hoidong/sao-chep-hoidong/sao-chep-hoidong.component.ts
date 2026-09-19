import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-sao-chep-hoidong',
    templateUrl: './sao-chep-hoidong.component.html',
    styleUrls: ['./sao-chep-hoidong.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class SaoChepHoidongComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



