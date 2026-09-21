import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({standalone: false, 
    selector: 'app-content-none',
    templateUrl: './content-none.component.html',
    styleUrls: [ './content-none.component.css' ],
})
export class ContentNoneComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



