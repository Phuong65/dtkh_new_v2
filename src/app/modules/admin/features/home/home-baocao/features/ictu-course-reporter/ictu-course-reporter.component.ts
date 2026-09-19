import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ictu-course-reporter',
    templateUrl: './ictu-course-reporter.component.html',
    styleUrls: [ '../../styles/layout.scss' , './ictu-course-reporter.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class IctuCourseReporterComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



