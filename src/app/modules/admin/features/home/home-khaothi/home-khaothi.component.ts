import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-home-khaothi',
    templateUrl: './home-khaothi.component.html',
    styleUrls: ['./home-khaothi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class HomeKhaothiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



