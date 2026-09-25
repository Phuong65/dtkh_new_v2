import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { OvicFileExplorerService } from '@modules/shared/services/ovic-file-explorer.service';
import { FileService } from '@core/services/file.service';

import { OpenFileManagerComponent } from './open-file-manager.component';

describe('OpenFileManagerComponent', () => {
  let component: OpenFileManagerComponent;
  let fixture: ComponentFixture<OpenFileManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [OpenFileManagerComponent],
      providers: [
        { provide: OvicFileExplorerService, useValue: {} },
        { provide: FileService, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenFileManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
