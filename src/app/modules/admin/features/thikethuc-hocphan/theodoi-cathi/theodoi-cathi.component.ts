import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-theodoi-cathi',
    templateUrl: './theodoi-cathi.component.html',
    styleUrls: ['./theodoi-cathi.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class TheodoiCathiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



