import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesManagementNewComponent } from './files-management-new.component';

describe('FilesManagementNewComponent', () => {
  let component: FilesManagementNewComponent;
  let fixture: ComponentFixture<FilesManagementNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilesManagementNewComponent ]
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
