import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-create-question',
    templateUrl: './create-question.component.html',
    styleUrls: ['./create-question.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CreateQuestionComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



