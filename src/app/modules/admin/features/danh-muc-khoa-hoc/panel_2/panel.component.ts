import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({standalone: false, 
    selector: 'app-panel',
    templateUrl: './panel.component.html',
    styleUrls: [ './panel.component.css' ],
})
export class PanelComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



