import { OvicNavMenuFeService } from './ovic-nav-menu-fe.service';

describe('OvicNavMenuFeService', () => {
  let service: OvicNavMenuFeService;

  beforeEach(() => {
    service = new OvicNavMenuFeService();
  });

  it('returns empty navigation structures while the frontend menu stub is empty', () => {
    expect(service.mainMenu).toEqual([]);
    expect(service.mobileMenuPanel).toEqual([]);
  });
});
