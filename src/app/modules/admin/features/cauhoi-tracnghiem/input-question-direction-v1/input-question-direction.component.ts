import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-input-question-direction',
    templateUrl: './input-question-direction.component.html',
    styleUrls: ['./input-question-direction.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class InputQuestionDirectionComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



