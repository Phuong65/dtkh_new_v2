import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { BankAudioViewerComponent } from './bank-audio-viewer.component';

describe('BankAudioViewerComponent', () => {
  let component: BankAudioViewerComponent;
  let fixture: ComponentFixture<BankAudioViewerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BankAudioViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BankAudioViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


