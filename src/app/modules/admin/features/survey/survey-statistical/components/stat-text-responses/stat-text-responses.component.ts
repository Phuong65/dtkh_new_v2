import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-stat-text-responses',
    templateUrl: './stat-text-responses.component.html',
    styleUrls: ['./stat-text-responses.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class StatTextResponsesComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



