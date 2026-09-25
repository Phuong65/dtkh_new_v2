import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { NotificationService } from '@core/services/notification.service';
import { FileService } from '@core/services/file.service';
import { AuthService } from '@core/services/auth.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MediaService } from '@shared/services/media.service';
import { MediaFolderService } from '@shared/services/media-folder.service';
import { HelperService } from '@core/services/helper.service';
import { ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';

import { FilesManagementNewComponent } from './files-management-new.component';

describe('FilesManagementNewComponent', () => {
  let component: FilesManagementNewComponent;
  let fixture: ComponentFixture<FilesManagementNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilesManagementNewComponent],
      providers: [
        FormBuilder,
        { provide: NotificationService, useValue: { toastError: () => {} } },
        { provide: FileService, useValue: {} },
        { provide: AuthService, useValue: { user: { id: 1 }, currentFolder: { id: 0 } } },
        { provide: NgbModal, useValue: {} },
        { provide: NgbActiveModal, useValue: {} },
        { provide: MediaService, useValue: {} },
        { provide: MediaFolderService, useValue: { getMediaFolderByPageNew: () => of({ data: [] }) } },
        { provide: HelperService, useValue: {} },
        { provide: ConfirmationService, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilesManagementNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
