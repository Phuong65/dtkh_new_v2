import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-question-type-drag-drop',
    templateUrl: './question-type-drag-drop.component.html',
    styleUrls: ['./question-type-drag-drop.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class QuestionTypeDragDropComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



