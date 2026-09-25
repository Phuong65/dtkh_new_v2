import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-room-test',
    templateUrl: './room-test.component.html',
    styleUrls: [ './room-test.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class RoomTestComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



