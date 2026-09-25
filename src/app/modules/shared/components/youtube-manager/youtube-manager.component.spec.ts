import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HelperService } from '@core/services/helper.service';
import { NotificationService } from '@core/services/notification.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlaylistYoutubeService } from '@modules/shared/services/playlist-youtube.service';

import { YoutubeManagerComponent } from './youtube-manager.component';

describe('YoutubeManagerComponent', () => {
  let component: YoutubeManagerComponent;
  let fixture: ComponentFixture<YoutubeManagerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [YoutubeManagerComponent],
      providers: [
        { provide: HelperService, useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: NgbModal, useValue: {} },
        { provide: PlaylistYoutubeService, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YoutubeManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
