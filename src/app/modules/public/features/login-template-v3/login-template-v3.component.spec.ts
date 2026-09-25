import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@core/services/notification.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { of } from 'rxjs';

import { LoginTemplateV3Component } from './login-template-v3.component';

describe('LoginTemplateV3Component', () => {
  let component: LoginTemplateV3Component;
  let fixture: ComponentFixture<LoginTemplateV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateV3Component ], imports: [ ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule ],
      providers: [
        NgbModal,
        { provide: NotificationService, useValue: { toastError: () => {}, popup: () => Promise.resolve() } },
        { provide: Title, useValue: { setTitle: () => {} } },
        { provide: AuthService, useValue: { roles: [], useCases: [], isLoggedIn: () => false, login: () => of(true), googleLogin: () => of(true), forgetPassword: () => of(true) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginTemplateV3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


