import { Component, OnChanges , OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-test-preview',
    templateUrl: './question-test-preview.component.html',
    styleUrls: ['./question-test-preview.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionTestPreviewComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



