import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-ictu-audio-player',
    templateUrl: './ictu-audio-player.component.html',
    styleUrls: [ './ictu-audio-player.component.css' ],
    standalone: true,
    imports: [CommonModule,RouterModule]
})
export class IctuAudioPlayerComponent implements OnInit {
    constructor() {}
    ngOnInit(): void {}
}



