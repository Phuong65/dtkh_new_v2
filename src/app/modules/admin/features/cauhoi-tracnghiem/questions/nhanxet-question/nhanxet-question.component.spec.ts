import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NhanxetQuestionComponent } from './nhanxet-question.component';

describe('NhanxetQuestionComponent', () => {
  let component: NhanxetQuestionComponent;
  let fixture: ComponentFixture<NhanxetQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NhanxetQuestionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NhanxetQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
