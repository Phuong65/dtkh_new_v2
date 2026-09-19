import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginTemplateNvhcmComponent } from './login-template-nvhcm.component';

describe('LoginTemplateNvhcmComponent', () => {
  let component: LoginTemplateNvhcmComponent;
  let fixture: ComponentFixture<LoginTemplateNvhcmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateNvhcmComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginTemplateNvhcmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
