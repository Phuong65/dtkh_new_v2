import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@core/services/notification.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { of } from 'rxjs';

import { LoginTemplateIctuComponent } from './login-template-ictu.component';

describe('LoginTemplateIctuComponent', () => {
  let component: LoginTemplateIctuComponent;
  let fixture: ComponentFixture<LoginTemplateIctuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateIctuComponent ], imports: [ ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule ],
      providers: [
        NgbModal,
        { provide: NotificationService, useValue: { toastError: () => {}, confirm: () => Promise.resolve() } },
        { provide: Title, useValue: { setTitle: () => {} } },
        { provide: AuthService, useValue: { roles: [], useCases: [], isLoggedIn: () => false, login: () => of(true), googleLogin: () => of(true), forgetPassword: () => of(true) } },
        { provide: FileService, useValue: { getFileLocalAsJson: () => of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginTemplateIctuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


