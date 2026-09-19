import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-donvi',
    templateUrl: './donvi.component.html',
    styleUrls: ['./donvi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class DonviComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



