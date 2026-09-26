import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-survey-detail',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './survey-detail.component.html',
  styleUrls: ['./survey-detail.component.css']
})
export class SurveyDetailComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
