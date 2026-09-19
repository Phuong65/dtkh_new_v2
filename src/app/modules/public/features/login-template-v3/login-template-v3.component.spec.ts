import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTemplateV3Component } from './login-template-v3.component';

describe('LoginTemplateV3Component', () => {
  let component: LoginTemplateV3Component;
  let fixture: ComponentFixture<LoginTemplateV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateV3Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginTemplateV3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
