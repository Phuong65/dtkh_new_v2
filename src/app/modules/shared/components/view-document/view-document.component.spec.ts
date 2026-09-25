import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FileService } from '@core/services/file.service';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ViewDocumentComponent } from './view-document.component';

describe('ViewDocumentComponent', () => {
  let component: ViewDocumentComponent;
  let fixture: ComponentFixture<ViewDocumentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ViewDocumentComponent],
      providers: [
        { provide: FileService, useValue: {} },
        { provide: HelperService, useValue: {} },
        { provide: AuthService, useValue: { accessToken: '' } },
        { provide: NgbModal, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewDocumentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('file', { type: 'text', source: 'serverFile', path: 'sample.txt' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
