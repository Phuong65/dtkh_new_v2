import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OvicZoomService } from './ovic-zoom.service';

describe('OvicZoomService', () => {
  let service: OvicZoomService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OvicZoomService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(OvicZoomService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('fails closed when attempting to sign tokens in the browser', () => {
    expect(() => service.getZoomToken('key', 'secret')).toThrowError(/Zoom client integration requires backend configuration/);
  });

  it('blocks external Zoom requests when the backend is not configured', (done) => {
    service.getUserByZoom('key', 'secret').subscribe({
      next: () => fail('expected getUserByZoom to fail closed'),
      error: (error: Error) => {
        expect(error.message).toContain('Zoom client integration requires backend configuration');
        done();
      }
    });
  });

  it('keeps internal class-zoom API requests functional', (done) => {
    service.getAllOvicZoom().subscribe((data) => {
      expect(data).toEqual([]);
      done();
    });

    const request = httpTesting.expectOne((req) => req.url.includes('class-zoom/'));
    expect(request.request.method).toBe('GET');
    request.flush({ data: [] });
  });
});
