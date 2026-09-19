import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-nhanxet-question',
    templateUrl: './nhanxet-question.component.html',
    styleUrls: [ './nhanxet-question.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class NhanxetQuestionComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



