import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { FileListChatComponent } from './file-list-chat.component';

describe('FileListChatComponent', () => {
  let component: FileListChatComponent;
  let fixture: ComponentFixture<FileListChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileListChatComponent],
      providers: [
        { provide: FileService, useValue: {} },
        { provide: HelperService, useValue: {} },
        { provide: NgbModal, useValue: {} },
        { provide: AuthService, useValue: { accessToken: '' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileListChatComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('file', { type: 'text', source: 'serverFile', path: 'sample.txt' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
