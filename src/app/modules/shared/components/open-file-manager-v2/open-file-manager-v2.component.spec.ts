import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationService } from '@core/services/notification.service';
import { FileService } from '@core/services/file.service';
import { AuthService } from '@core/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OpenFileManagerService } from '@modules/shared/services/open-file-manager.service';

import { OpenFileManagerV2Component } from './open-file-manager-v2.component';

describe('OpenFileManagerV2Component', () => {
  let component: OpenFileManagerV2Component;
  let fixture: ComponentFixture<OpenFileManagerV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenFileManagerV2Component],
      providers: [
        { provide: NotificationService, useValue: {} },
        { provide: FileService, useValue: {} },
        { provide: AuthService, useValue: { accessToken: '' } },
        { provide: NgbModal, useValue: {} },
        { provide: OpenFileManagerService, useValue: {} }
      ]
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
