import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PainelList } from './painel-list';

describe('PainelList', () => {
  let component: PainelList;
  let fixture: ComponentFixture<PainelList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatProgressSpinnerModule, MatTableModule],
      declarations: [PainelList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelList);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    await fixture.whenStable();
    httpMock.expectOne((req) => req.url.endsWith('/painel')).flush({ paineis: [], page: 1, pageSize: 10 });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate an empty panel list once the request resolves', () => {
    expect(component.carregando).toBe(false);
    expect(component.paineis).toEqual([]);
  });
});
