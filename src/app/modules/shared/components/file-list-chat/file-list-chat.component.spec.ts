import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileListChatComponent } from './file-list-chat.component';

describe('FileListChatComponent', () => {
  let component: FileListChatComponent;
  let fixture: ComponentFixture<FileListChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FileListChatComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileListChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
