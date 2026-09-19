import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-type-grouping',
    templateUrl: './question-type-grouping.component.html',
    styleUrls: ['./question-type-grouping.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionTypeGroupingComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



