import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@core/services/notification.service';
import { Title } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { FlickityModule } from '../ngx-flickity/flickity.module';
import { of } from 'rxjs';

import { LoginTemplateVhhcmComponent } from './login-template-vhhcm.component';

describe('LoginTemplateVhhcmComponent', () => {
  let component: LoginTemplateVhhcmComponent;
  let fixture: ComponentFixture<LoginTemplateVhhcmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoginTemplateVhhcmComponent ], imports: [ ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule, FlickityModule ],
      providers: [
        NgbModal,
        { provide: NotificationService, useValue: { toastError: () => {}, confirm: () => Promise.resolve() } },
        { provide: Title, useValue: { setTitle: () => {} } },
        { provide: AuthService, useValue: { roles: [], useCases: [], isLoggedIn: () => false, login: () => of(true), googleLogin: () => of(true), forgetPassword: () => of(true) } },
        { provide: FileService, useValue: { getFileLocalAsJson: (url: string) => of(url && url.includes('config') ? { help_url: '#' } : []) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginTemplateVhhcmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


