import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenFileManagerComponent } from './open-file-manager.component';

describe('OpenFileManagerComponent', () => {
  let component: OpenFileManagerComponent;
  let fixture: ComponentFixture<OpenFileManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenFileManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenFileManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
