import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-list-questions',
    templateUrl: './list-questions.component.html',
    styleUrls: [ './list-questions.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ListQuestionsComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



