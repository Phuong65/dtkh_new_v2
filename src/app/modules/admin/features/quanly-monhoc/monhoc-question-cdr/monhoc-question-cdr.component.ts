import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-monhoc-question-cdr',
    templateUrl: './monhoc-question-cdr.component.html',
    styleUrls: ['./monhoc-question-cdr.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class MonhocQuestionCdrComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



