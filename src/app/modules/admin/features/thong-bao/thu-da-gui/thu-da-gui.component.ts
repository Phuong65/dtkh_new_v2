import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-thu-da-gui',
    templateUrl: './thu-da-gui.component.html',
    styleUrls: ['./thu-da-gui.component.css'],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class ThuDaGuiComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



