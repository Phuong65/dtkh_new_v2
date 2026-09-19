import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YoutubeManagerComponent } from './youtube-manager.component';

describe('YoutubeManagerComponent', () => {
  let component: YoutubeManagerComponent;
  let fixture: ComponentFixture<YoutubeManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YoutubeManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YoutubeManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
