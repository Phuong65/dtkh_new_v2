import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ictu-faculty-reporter',
    templateUrl: './ictu-faculty-reporter.component.html',
    styleUrls: [ '../../styles/layout.scss' , './ictu-faculty-reporter.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class IctuFacultyReporterComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



