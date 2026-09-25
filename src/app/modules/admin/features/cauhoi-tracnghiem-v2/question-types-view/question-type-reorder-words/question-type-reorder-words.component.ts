import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-type-reorder-words',
    templateUrl: './question-type-reorder-words.component.html',
    styleUrls: ['./question-type-reorder-words.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionTypeReorderWordsComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



