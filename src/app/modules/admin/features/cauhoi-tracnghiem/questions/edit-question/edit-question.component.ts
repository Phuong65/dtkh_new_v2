import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-edit-question',
    templateUrl: './edit-question.component.html',
    styleUrls: [ './edit-question.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class EditQuestionComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



