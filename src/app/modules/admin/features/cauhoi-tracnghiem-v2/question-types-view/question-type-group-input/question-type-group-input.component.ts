import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-type-group-input',
    templateUrl: './question-type-group-input.component.html',
    styleUrls: ['./question-type-group-input.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionTypeGroupInputComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



