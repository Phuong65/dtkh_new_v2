import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTemplateVhhcmComponent } from './login-template-vhhcm.component';

describe('LoginTemplateVhhcmComponent', () => {
  let component: LoginTemplateVhhcmComponent;
  let fixture: ComponentFixture<LoginTemplateVhhcmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateVhhcmComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginTemplateVhhcmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
