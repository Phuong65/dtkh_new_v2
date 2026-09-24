import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-survey-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './survey-plan-detail.component.html',
  styleUrls: ['./survey-plan-detail.component.css']
})
export class SurveyPlanDetailComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
