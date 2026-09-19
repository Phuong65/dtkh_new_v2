import { Component, OnChanges , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-history',
    templateUrl: './question-history.component.html',
    styleUrls: ['./question-history.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionHistoryComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



