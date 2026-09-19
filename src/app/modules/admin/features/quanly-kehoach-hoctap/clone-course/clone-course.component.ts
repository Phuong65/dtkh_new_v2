import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-clone-course',
    templateUrl: './clone-course.component.html',
    styleUrls: ['./clone-course.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class CloneCourseComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



