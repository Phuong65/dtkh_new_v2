import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenFileManagerV2Component } from './open-file-manager-v2.component';

describe('OpenFileManagerV2Component', () => {
  let component: OpenFileManagerV2Component;
  let fixture: ComponentFixture<OpenFileManagerV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OpenFileManagerV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenFileManagerV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
